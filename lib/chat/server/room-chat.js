/**
 *
 * Reldens - RoomChat
 *
 * Handles the global chat room for private and global messages.
 *
 */

const { RoomLogin } = require('../../rooms/server/login');
const { ChatManager } = require('./manager');
const { MessageFactory } = require('../message-factory');
const { Cleaner } = require('../cleaner');
const { ChatConst } = require('../constants');
const { GameConst } = require('../../game/constants');
const { ChatFilter, DEFAULT_ESCALATION, DEFAULT_SOFT_WORDS, parseWordList } = require('./profanity-filter');
const { ChatModerationService } = require('./moderation-service');
const { ChatGeneralQuotaCoordinator } = require('./general-chat-quota');
const { parseModerationChatCommand } = require('./moderation-commands');
const { FileHandler } = require('@reldens/server-utils');
const { Logger, sc } = require('@reldens/utils');

/**
 * @typedef {import('@colyseus/core').Client} ColyseusClient
 */
class RoomChat extends RoomLogin
{

    /**
     * @param {Object} props
     */
    onCreate(props)
    {
        super.onCreate(props);
        Logger.info('Created RoomChat: '+this.roomName+' ('+this.roomId+').');
        this.roomType = ChatConst.ROOM_TYPE_CHAT;
        let dataServer = sc.get(this, 'dataServer', false);
        if(!dataServer){
            Logger.error('DataServer undefined in RoomChat.');
        }
        this.chatManager = new ChatManager({dataServer: this.dataServer});
        this.setupChatFilter();
        this.moderationService = new ChatModerationService({
            roomChat: this,
            filter: this.chatFilter,
            dataServer: this.dataServer,
            config: this.config
        });
        this.generalChatQuota = new ChatGeneralQuotaCoordinator({
            dataServer: this.dataServer,
            maxPerWindow: this.config.getWithoutLogs('server/chat/messages/globalMaxPerWindow', 10),
            windowSeconds: this.config.getWithoutLogs('server/chat/messages/globalWindowSeconds', 60)
        });
        this.moderationService.hydrateMutes();
        delete props.roomsManager.creatingInstances[this.roomName];
    }

    /**
     * Seed the profanity filter: soft list from the built-in defaults, hard
     * list from the RELDENS_CHAT_HARD_LIST / RELDENS_CHAT_HARD_FILE env vars
     * (never committed), escalation config from the DB config with defaults.
     */
    setupChatFilter()
    {
        this.chatFilter = new ChatFilter();
        let hardWords = [];
        if(process.env.RELDENS_CHAT_HARD_LIST){
            hardWords = hardWords.concat(parseWordList(process.env.RELDENS_CHAT_HARD_LIST));
        }
        if(process.env.RELDENS_CHAT_HARD_FILE){
            let fileContent = FileHandler.exists(process.env.RELDENS_CHAT_HARD_FILE)
                ? FileHandler.readFile(process.env.RELDENS_CHAT_HARD_FILE)
                : '';
            if(fileContent){
                hardWords = hardWords.concat(parseWordList(fileContent));
            }
        }
        let warningsBeforeMute = this.config.getWithoutLogs(
            'server/chat/moderation/escalation/warningsBeforeMute',
            DEFAULT_ESCALATION.warningsBeforeMute
        );
        let muteLadderSeconds = this.config.getWithoutLogs(
            'server/chat/moderation/escalation/muteLadderSeconds',
            DEFAULT_ESCALATION.muteLadderSeconds
        );
        this.chatFilter.load({
            soft: DEFAULT_SOFT_WORDS,
            hard: hardWords,
            config: {warningsBeforeMute, muteLadderSeconds}
        });
    }

    /**
     * @param {ColyseusClient} client
     * @param {Object} props
     * @param {Object} userModel
     */
    onJoin(client, props, userModel)
    {
        this.loginManager.activePlayers.add(userModel, client, this);
    }

    /**
     * @param {ColyseusClient} client
     * @param {Object} data
     * @returns {Promise<void>}
     */
    async handleReceivedMessage(client, data)
    {
        if(data[GameConst.ACTION_KEY] !== ChatConst.CHAT_ACTION){
            return;
        }
        let text = Cleaner.cleanMessage(
            data[ChatConst.MESSAGE.KEY],
            this.config.get('client/chat/messages/characterLimit')
        );
        if(
            0 === text.replace('#', '').trim().length
            // do not count the player name on private messages:
            || (-1 !== text.indexOf('@') && 0 === text.substring(text.indexOf(' ')).trim().length)
        ){
            // do nothing if text is shorter than 3 characters (including @ and #):
            return;
        }
        let activePlayer = this.activePlayerBySessionId(client.sessionId, this.roomId);
        if(!activePlayer){
            Logger.warning('Current Active Player not found: '+client.sessionId);
            return;
        }
        let accountId = activePlayer.userId;
        if(await this.moderationService.isMuted(accountId)){
            return this.sendError(client, ChatConst.SNIPPETS.YOU_ARE_MUTED, {
                minutes: Math.ceil(this.moderationService.muteRemainingSeconds(accountId) / 60)
            });
        }
        if(0 === text.indexOf('/')){
            const command = parseModerationChatCommand(text);
            if(command){
                // moderation commands are never broadcast nor saved:
                return await this.moderationService.handleCommand(client, activePlayer, text);
            }
        }
        const checkResult = this.moderationService.checkMessage(accountId, text);
        if(!checkResult.allowed){
            await this.moderationService.handleViolation(accountId, checkResult.term);
            return this.sendError(client, ChatConst.SNIPPETS.MESSAGE_BLOCKED, {term: checkResult.term});
        }
        if(0 === text.indexOf('@')){
            return await this.sendPrivateMessage(client, data[ChatConst.CHAT_TO], text, activePlayer);
        }
        if(0 === text.indexOf('#')){
            return await this.sendGlobalMessage(client, text, activePlayer);
        }
    }

    /**
     * @param {ColyseusClient} client
     * @param {string} toPlayer
     * @param {string} text
     * @param {Object} activePlayer
     * @returns {Promise<void|boolean>}
     */
    async sendPrivateMessage(client, toPlayer, text, activePlayer)
    {
        if(!toPlayer){
            Logger.info('Missing player recipient.');
            return false;
        }
        let activePlayerTo = this.activePlayerByPlayerName(toPlayer, this.roomId);
        if(!activePlayerTo){
            let message = ChatConst.SNIPPETS.PRIVATE_MESSAGE_PLAYER_NOT_FOUND;
            let messageData = {
                [ChatConst.MESSAGE.DATA.PLAYER_NAME]: toPlayer
            };
            let messageObject = MessageFactory.create(
                ChatConst.TYPES.ERROR,
                message,
                messageData
            );
            client.send('*', messageObject);
            let saveResult = await this.chatManager.saveMessage(
                MessageFactory.withDataToJson(message, messageData),
                activePlayer.playerId,
                activePlayer?.playerData?.state?.room_id,
                activePlayerTo?.playerData,
                ChatConst.TYPES.ERROR
            );
            if(!saveResult){
                Logger.critical('Private failed chat save error.', messageObject);
            }
            return;
        }
        let messageObject = MessageFactory.create(
            ChatConst.TYPES.PRIVATE,
            text.substring(text.indexOf(' ')),
            {},
            activePlayer.playerName
        );
        client.send('*', messageObject);
        activePlayerTo?.client.send('*', messageObject);
        let saveResult = await this.chatManager.saveMessage(
            messageObject[ChatConst.MESSAGE.KEY],
            activePlayer.playerId,
            activePlayer?.playerData?.state?.room_id,
            activePlayerTo?.playerData,
            ChatConst.TYPES.PRIVATE
        );
        if(!saveResult){
            Logger.critical('Private chat save error.', messageObject);
        }
    }

    /**
     * @param {ColyseusClient} client
     * @param {string} text
     * @param {Object} activePlayer
     * @returns {Promise<void>}
     */
    async sendGlobalMessage(client, text, activePlayer)
    {
        if(!this.config.get('server/chat/messages/global_enabled')){
            return client.send('*', MessageFactory.create(
                ChatConst.TYPES.ERROR,
                ChatConst.SNIPPETS.GLOBAL_MESSAGE_NOT_ALLOWED
            ));
        }
        let globalAllowedRoles = this.config.get('server/chat/messages/global_allowed_roles').split(',').map(Number);
        if(-1 === globalAllowedRoles.indexOf(activePlayer.roleId)){
            return client.send('*', MessageFactory.create(
                ChatConst.TYPES.ERROR,
                ChatConst.SNIPPETS.GLOBAL_MESSAGE_PERMISSION_DENIED,
            ));
        }
        const admission = await this.generalChatQuota.admit(activePlayer.userId);
        if('allowed' !== admission.status){
            let snippet = ChatConst.SNIPPETS.GLOBAL_MESSAGE_LIMIT_REACHED;
            let messageData = {seconds: admission.retryAfterSeconds || 1};
            if('pending' === admission.status){
                snippet = ChatConst.SNIPPETS.GLOBAL_MESSAGE_PENDING;
                messageData = {};
            } else if('busy' === admission.status || 'error' === admission.status){
                snippet = ChatConst.SNIPPETS.GLOBAL_MESSAGE_UNAVAILABLE;
                messageData = {};
            }
            return client.send('*', MessageFactory.create(
                ChatConst.TYPES.ERROR,
                snippet,
                messageData
            ));
        }
        let messageObject = MessageFactory.create(
            ChatConst.TYPES.GLOBAL,
            text.substring(1),
            {},
            activePlayer.playerName
        );
        this.broadcast('*', messageObject);
        let saveResult = await this.chatManager.saveMessage(
            messageObject[ChatConst.MESSAGE.KEY],
            activePlayer.playerId,
            activePlayer?.playerData?.state?.room_id,
            false,
            ChatConst.TYPES.GLOBAL
        );
        if(!saveResult){
            Logger.critical('Global chat save error.', messageObject);
        }
    }

    /**
     * @param {ColyseusClient} client
     * @param {string} snippetKey
     * @param {Object} [messageData]
     * @returns {void}
     */
    sendError(client, snippetKey, messageData = {})
    {
        return client.send('*', MessageFactory.create(ChatConst.TYPES.ERROR, snippetKey, messageData));
    }

    /**
     * @param {ColyseusClient} client
     * @param {boolean} consented
     * @returns {Promise<void>}
     */
    async onLeave(client, consented)
    {
        this.broadcastLeaveMessage(client.sessionId);
        this.loginManager.activePlayers.removeByRoomAndSessionId(client.sessionId, this.roomId);
    }

    /**
     * @param {string} sessionId
     * @returns {boolean}
     */
    broadcastLeaveMessage(sessionId)
    {
        let activePlayer = this.activePlayerBySessionId(sessionId, this.roomId);
        if(!activePlayer){
            return false;
        }
        if(!this.config.getWithoutLogs('server/chat/messages/broadcast_leave', false)){
            return false;
        }
        let message = ChatConst.SNIPPETS.LEFT_ROOM;
        let messageData = {
            [ChatConst.MESSAGE.DATA.PLAYER_NAME]: activePlayer.playerName
        };
        let messageObject = MessageFactory.create(
            ChatConst.TYPES.SYSTEM,
            message,
            messageData
        );
        this.broadcast('*', messageObject);
    }
}

module.exports.RoomChat = RoomChat;
