/**
 *
 * Reldens - ChatModerationService
 *
 * Runtime moderation state and policy for the chat room. Owns the per-account
 * strike counts and timed mutes; the pure parsing/filtering lives in
 * moderation-commands.js and profanity-filter.js.
 *
 * Strikes and mutes persist in the `chat_mutes` storage entity (one row per
 * account), hydrated into memory at boot and refreshed lazily on mute checks.
 * Persistence is fail-open: a database error logs a warning and the service
 * falls back to in-memory only, so a broken database must never wedge chat.
 *
 * The mute/ban commands are real; the rest of the command surface
 * (spectate, jail, kill, forcerename) reports as not implemented for now.
 *
 */

const { ChatConst } = require('../constants');
const { MessageFactory } = require('../message-factory');
const { parseModerationChatCommand, MODERATION_COMMAND_MINUTES_MAX } = require('./moderation-commands');
const { Logger } = require('@reldens/utils');

class ChatModerationService
{

    /**
     * @param {Object} props
     * @param {Object} props.roomChat
     * @param {Object} props.filter
     * @param {Object} [props.dataServer]
     * @param {Object} [props.config]
     */
    constructor(props)
    {
        this.roomChat = props.roomChat;
        this.filter = props.filter;
        this.dataServer = props.dataServer || false;
        this.config = props.config || props.roomChat?.config || false;
        /** @type {import('@reldens/storage').BaseDriver|boolean} */
        this.muteRepository = this.dataServer ? this.dataServer.getEntity('chatMutes') : false;
        /** @type {Map<number, number>} */
        this.strikesByAccount = new Map();
        /** @type {Map<number, {untilMs: number, reason: string}>} */
        this.mutesByAccount = new Map();
    }

    /**
     * Load the persisted mutes/strikes into memory. Fail-open: a database
     * error only logs and leaves the in-memory maps empty.
     *
     * @returns {Promise<void>}
     */
    async hydrateMutes()
    {
        if(!this.muteRepository){
            return;
        }
        try {
            let mutes = await this.muteRepository.loadAll();
            if(!mutes){
                return;
            }
            for(let mute of mutes){
                let untilMs = new Date(mute.mute_until).getTime();
                if(!Number.isFinite(untilMs)){
                    continue;
                }
                this.strikesByAccount.set(mute.account_id, Number(mute.strikes) || 0);
                if(untilMs > Date.now()){
                    this.mutesByAccount.set(mute.account_id, {
                        untilMs,
                        reason: mute.mute_reason || '',
                    });
                }
            }
        } catch (error) {
            Logger.warning('Chat moderation hydrate error, in-memory only.', error.message);
        }
    }

    /**
     * Persist the current strikes and mute window for an account. Fail-open:
     * never throw into the moderation flow.
     *
     * @param {number} accountId
     * @param {number} strikes
     * @param {number} [muteUntilMs]
     * @returns {Promise<void>}
     */
    async persistAccountState(accountId, strikes, muteUntilMs)
    {
        if(!this.muteRepository){
            return;
        }
        try {
            let mute = await this.muteRepository.loadOneBy('account_id', accountId);
            let patch = {
                strikes: strikes,
                mute_reason: muteUntilMs ? (this.mutesByAccount.get(accountId)?.reason || '') : null,
                mute_until: muteUntilMs ? new Date(muteUntilMs) : null,
                updated_at: new Date(),
            };
            if(mute){
                await this.muteRepository.updateById(mute.id, patch);
            } else {
                await this.muteRepository.create(Object.assign({account_id: accountId}, patch));
            }
        } catch (error) {
            Logger.warning('Chat moderation persist error, in-memory only.', accountId, error.message);
        }
    }

    /**
     * @param {number} accountId
     * @param {string} text
     * @returns {{allowed: boolean, kind?: string, term?: string}}
     */
    checkMessage(accountId, text)
    {
        const term = this.filter.findHardHit(text);
        if(term){
            return {allowed: false, kind: 'blocked', term};
        }
        return {allowed: true};
    }

    /**
     * @param {number} accountId
     * @param {string} term
     * @returns {Promise<Object>} {kind, muteSeconds, strikes}
     */
    async handleViolation(accountId, term)
    {
        const previousStrikes = this.strikesByAccount.get(accountId) || 0;
        const outcome = this.filter.escalate(previousStrikes);
        this.strikesByAccount.set(accountId, outcome.strikes);
        let muteUntilMs = undefined;
        if(outcome.kind === 'mute'){
            muteUntilMs = Date.now() + outcome.muteSeconds * 1000;
            this.mutesByAccount.set(accountId, {
                untilMs: muteUntilMs,
                reason: term,
            });
        }
        Logger.warning('Chat violation.', {accountId, term, outcome});
        await this.persistAccountState(accountId, outcome.strikes, muteUntilMs);
        return outcome;
    }

    /**
     * @param {number} accountId
     * @returns {Promise<boolean>}
     */
    async isMuted(accountId)
    {
        const mute = this.mutesByAccount.get(accountId);
        if(mute){
            if(mute.untilMs <= Date.now()){
                this.mutesByAccount.delete(accountId);
                return false;
            }
            return true;
        }
        // Memory miss: refresh from the database (fail-open, in-memory only on
        // error). A clean DB row carries the strikes into memory too.
        if(!this.muteRepository){
            return false;
        }
        try {
            const persisted = await this.muteRepository.loadOneBy('account_id', accountId);
            if(!persisted){
                return false;
            }
            const untilMs = new Date(persisted.mute_until).getTime();
            this.strikesByAccount.set(accountId, Number(persisted.strikes) || 0);
            if(Number.isFinite(untilMs) && untilMs > Date.now()){
                this.mutesByAccount.set(accountId, {
                    untilMs,
                    reason: persisted.mute_reason || '',
                });
                return true;
            }
            return false;
        } catch (error) {
            Logger.warning('Chat moderation mute check error, in-memory only.', accountId, error.message);
            return false;
        }
    }

    /**
     * @param {number} accountId
     * @returns {number}
     */
    muteRemainingSeconds(accountId)
    {
        const mute = this.mutesByAccount.get(accountId);
        if(!mute || mute.untilMs <= Date.now()){
            return 0;
        }
        return Math.ceil((mute.untilMs - Date.now()) / 1000);
    }

    /**
     * @param {number} accountId
     * @param {number} minutes
     * @param {string} reason
     * @returns {void}
     */
    muteAccount(accountId, minutes, reason)
    {
        const untilMs = Date.now() + minutes * 60 * 1000;
        this.mutesByAccount.set(accountId, {
            untilMs,
            reason,
        });
        this.persistAccountState(
            accountId,
            this.strikesByAccount.get(accountId) || 0,
            untilMs
        );
    }

    /**
     * Lift a chat mute: clear memory and delete the persisted row.
     *
     * @param {number} accountId
     * @returns {Promise<void>}
     */
    async liftChatMute(accountId)
    {
        this.mutesByAccount.delete(accountId);
        if(!this.muteRepository){
            return;
        }
        try {
            const mute = await this.muteRepository.loadOneBy('account_id', accountId);
            if(mute){
                await this.muteRepository.deleteById(mute.id);
            }
        } catch (error) {
            Logger.warning('Chat moderation unmute error, in-memory only.', accountId, error.message);
        }
    }

    /**
     * @param {ColyseusClient} client
     * @param {Object} activePlayer
     * @param {string} text
     * @returns {Promise<boolean>} true when the text was consumed as a command.
     */
    async handleCommand(client, activePlayer, text)
    {
        const command = parseModerationChatCommand(text);
        if(!command){
            return false;
        }
        if(!this.isModerator(activePlayer)){
            this.sendError(client, ChatConst.SNIPPETS.MODERATION_PERMISSION_DENIED);
            return true;
        }
        switch(command.kind){
            case 'mute': {
                const target = this.findTargetPlayer(command.name);
                if(!target || command.minutes === null){
                    this.sendError(client, ChatConst.SNIPPETS.MODERATION_COMMAND_USAGE, {
                        usage: '/mute "Player Name" 10 reason',
                    });
                    return true;
                }
                this.muteAccount(target.userId, command.minutes, command.reason);
                client.send('*', MessageFactory.create(
                    ChatConst.TYPES.SYSTEM,
                    ChatConst.SNIPPETS.MODERATION_MUTED,
                    {[ChatConst.MESSAGE.DATA.PLAYER_NAME]: target.playerName, minutes: command.minutes}
                ));
                return true;
            }
            case 'suspend': {
                const target = this.findTargetPlayer(command.name);
                if(!target || command.minutes === null){
                    this.sendError(client, ChatConst.SNIPPETS.MODERATION_COMMAND_USAGE, {
                        usage: '/suspend "Player Name" 60 reason',
                    });
                    return true;
                }
                this.muteAccount(target.userId, command.minutes, command.reason);
                client.send('*', MessageFactory.create(
                    ChatConst.TYPES.SYSTEM,
                    ChatConst.SNIPPETS.MODERATION_SUSPENDED,
                    {[ChatConst.MESSAGE.DATA.PLAYER_NAME]: target.playerName, minutes: command.minutes}
                ));
                return true;
            }
            case 'ban': {
                const target = this.findTargetPlayer(command.name);
                if(!target){
                    this.sendError(client, ChatConst.SNIPPETS.MODERATION_COMMAND_USAGE, {
                        usage: '/ban "Player Name" reason',
                    });
                    return true;
                }
                // Longest practical mute (capped); real account bans live elsewhere.
                this.muteAccount(target.userId, MODERATION_COMMAND_MINUTES_MAX, command.reason);
                client.send('*', MessageFactory.create(
                    ChatConst.TYPES.SYSTEM,
                    ChatConst.SNIPPETS.MODERATION_BANNED,
                    {[ChatConst.MESSAGE.DATA.PLAYER_NAME]: target.playerName}
                ));
                return true;
            }
            case 'kick': {
                const target = this.findTargetPlayer(command.name);
                if(!target){
                    this.sendError(client, ChatConst.SNIPPETS.MODERATION_COMMAND_USAGE, {
                        usage: '/kick "Player Name" reason',
                    });
                    return true;
                }
                target.client?.leave(1008, command.reason);
                client.send('*', MessageFactory.create(
                    ChatConst.TYPES.SYSTEM,
                    ChatConst.SNIPPETS.MODERATION_KICKED,
                    {[ChatConst.MESSAGE.DATA.PLAYER_NAME]: target.playerName}
                ));
                return true;
            }
            default:
                this.sendError(client, ChatConst.SNIPPETS.MODERATION_NOT_IMPLEMENTED, {
                    command: '/'+command.kind,
                });
                return true;
        }
    }

    /**
     * @param {Object} activePlayer
     * @returns {boolean}
     */
    isModerator(activePlayer)
    {
        if(!activePlayer){
            return false;
        }
        const raw = this.config ? this.config.getWithoutLogs('server/chat/moderation/adminRoleIds', '1,2') : '1,2';
        const adminRoleIds = String(raw).split(',').map(Number);
        return -1 !== adminRoleIds.indexOf(Number(activePlayer.roleId));
    }

    /**
     * @param {string|null} playerName
     * @returns {Object|boolean}
     */
    findTargetPlayer(playerName)
    {
        if(!playerName){
            return false;
        }
        return this.roomChat.activePlayerByPlayerName(playerName, this.roomChat.roomId);
    }

    /**
     * @param {ColyseusClient} client
     * @param {string} snippetKey
     * @param {Object} [messageData]
     * @returns {void}
     */
    sendError(client, snippetKey, messageData = {})
    {
        client.send('*', MessageFactory.create(ChatConst.TYPES.ERROR, snippetKey, messageData));
    }
}

module.exports.ChatModerationService = ChatModerationService;
