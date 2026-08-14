/**
 *
 * Reldens - LandPlugin
 *
 * NFT-gated lands: rooms listed on the "server/land/gatedRooms" configuration
 * can only be entered by accounts whose linked wallet owns the required NFT
 * (verified through the blockchain module, read-only). Denied players receive
 * a message and are disconnected from the gated room.
 *
 * Configuration (server scope, config table):
 *   gatedRooms   -> {"roomName": {"mint": "..."}}
 *   deniedMessage -> text shown to denied players.
 *
 * Environment:
 *   RELDENS_LAND_GATED_ROOMS -> JSON fallback for gatedRooms.
 *   RELDENS_SOLANA_RPC_URL   -> RPC used to verify the NFT.
 *
 */

const { WalletLinkManager } = require('../../blockchain/server/wallet-link-manager');
const { findSeekerGenesisToken } = require('../../blockchain/server/nft-verify');
const { GameConst } = require('../../game/constants');
const { CONFIG_GATED_ROOMS, CONFIG_DENIED_MESSAGE, SNIPPETS } = require('../constants');
const { Logger, sc } = require('@reldens/utils');

class LandPlugin
{

    /**
     * @param {Object} props
     * @param {Object} props.events
     * @param {Object} props.dataServer
     * @param {Function} [props.findTokenFn]
     */
    constructor(props)
    {
        /** @type {Object|boolean} */
        this.events = sc.get(props, 'events', false);
        /** @type {Object|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {WalletLinkManager} */
        this.walletLinkManager = new WalletLinkManager({dataServer: this.dataServer});
        /** @type {Function} */
        this.findTokenFn = sc.get(props, 'findTokenFn', findSeekerGenesisToken);
    }

    /**
     * @returns {boolean}
     */
    setup()
    {
        if(!this.events){
            Logger.error('LandPlugin: EventsManager undefined.');
            return false;
        }
        this.events.on('reldens.joinRoomStart', (room, client, options, userModel) => {
            this.gateRoomJoin(room, client, userModel);
        });
        return true;
    }

    /**
     * @param {Object} room
     * @param {Object} client
     * @param {Object} userModel
     * @returns {Promise<boolean>}
     */
    async gateRoomJoin(room, client, userModel)
    {
        let gatedRooms = this.gatedRooms(room);
        let required = sc.get(gatedRooms, room.roomName, false);
        if(!required){
            return true;
        }
        let mint = sc.get(required, 'mint', false);
        if(!mint){
            Logger.error('LandPlugin: gated room "'+room.roomName+'" without mint.');
            return this.deny(client, room);
        }
        let wallet = await this.walletLinkManager.walletForAccount(userModel.id);
        if(!wallet){
            return this.deny(client, room);
        }
        let rpcUrl = process.env.RELDENS_SOLANA_RPC_URL || '';
        let controller = new AbortController();
        let token = await this.findTokenFn(wallet.pubkey, rpcUrl, controller.signal, mint);
        if(!token){
            return this.deny(client, room);
        }
        Logger.info('LandPlugin: NFT verified for land "'+room.roomName+'".', {mint});
        return true;
    }

    /**
     * @param {Object} room
     * @returns {Object}
     */
    gatedRooms(room)
    {
        let fromConfig = room?.config?.getWithoutLogs?.(CONFIG_GATED_ROOMS, {}) || {};
        let fromEnv = {};
        if(process.env.RELDENS_LAND_GATED_ROOMS){
            try {
                fromEnv = JSON.parse(process.env.RELDENS_LAND_GATED_ROOMS);
            } catch (error) {
                Logger.error('LandPlugin: invalid RELDENS_LAND_GATED_ROOMS JSON.', error.message);
            }
        }
        return Object.assign({}, fromEnv, fromConfig);
    }

    /**
     * @param {Object} client
     * @param {Object} room
     * @returns {boolean}
     */
    deny(client, room)
    {
        let message = room?.config?.getWithoutLogs?.(CONFIG_DENIED_MESSAGE, SNIPPETS.DENIED) || SNIPPETS.DENIED;
        client.send('*', {act: GameConst.UI, id: 'land-denied', content: message});
        if(sc.isFunction(client.leave)){
            client.leave();
        }
        return false;
    }

}

module.exports.LandPlugin = LandPlugin;
