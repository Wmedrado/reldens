/**
 *
 * Reldens - Faucet
 *
 * Token faucet for the blockchain feature. Grants a fixed amount of tokens to
 * an account with a per-account cooldown. The actual credit hooks into the
 * token balance/ledger via an injected grant callback (the plugin wires it to
 * a ledger/economy stub); this class only tracks claims and enforces limits.
 *
 */

const { Logger, sc } = require('@reldens/utils');
const { BlockchainConst } = require('../constants');

/**
 * @typedef {import('@reldens/storage').BaseDataServer} BaseDataServer
 * @typedef {import('@reldens/storage').BaseDriver} BaseDriver
 */
class Faucet
{

    /**
     * @param {Object} props
     * @param {BaseDataServer} [props.dataServer]
     * @param {Object} [props.config]
     * @param {Function} [props.onGrant]
     * @param {Function} [props.now]
     */
    constructor(props)
    {
        /** @type {BaseDataServer|boolean} */
        this.dataServer = sc.get(props, 'dataServer', false);
        /** @type {Object|boolean} */
        this.config = sc.get(props, 'config', false);
        /** @type {boolean} */
        this.isEnabled = Boolean(this.config?.getWithoutLogs?.('server/blockchain/faucet/enabled', BlockchainConst.FAUCET_DEFAULT_ENABLED));
        /** @type {number} */
        this.cooldownSeconds = Number(this.config?.getWithoutLogs?.(
            'server/blockchain/faucet/cooldownSeconds',
            BlockchainConst.FAUCET_DEFAULT_COOLDOWN_SECONDS
        ));
        /** @type {number} */
        this.amount = Number(this.config?.getWithoutLogs?.('server/blockchain/faucet/amount', BlockchainConst.FAUCET_DEFAULT_AMOUNT));
        /** @type {BaseDriver|boolean} */
        this.claimsRepository = this.dataServer?.getEntity('blockchain_faucet_claims') || false;
        /** @type {Function} */
        this.onGrant = sc.get(props, 'onGrant', false);
        if('function' !== typeof this.onGrant){
            this.onGrant = (userId, amount) => {
                Logger.info('Faucet grant:', {userId, amount});
            };
        }
        /** @type {Function} */
        this.now = sc.get(props, 'now', Date.now);
    }

    /**
     * Replace the grant callback (called after a successful claim).
     *
     * @param {Function} onGrant
     */
    setGrantCallback(onGrant)
    {
        if('function' === typeof onGrant){
            this.onGrant = onGrant;
        }
    }

    /**
     * Non-mutating status check: ok/reason/retryAfterSeconds for an account.
     *
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    async statusForUser(userId)
    {
        if(!this.isEnabled || !this.claimsRepository){
            return {enabled: this.isEnabled, ok: false, reason: 'disabled'};
        }
        let claim = await this.claimsRepository.loadOneBy('user_id', userId);
        if(!claim){
            return {enabled: true, ok: true, reason: null, retryAfterSeconds: 0};
        }
        let elapsedMs = this.now() - new Date(claim.last_claim_at).getTime();
        let cooldownMs = this.cooldownSeconds * 1000;
        if(elapsedMs < cooldownMs){
            return {
                enabled: true,
                ok: false,
                reason: 'cooldown',
                retryAfterSeconds: Math.ceil((cooldownMs - elapsedMs) / 1000)
            };
        }
        return {enabled: true, ok: true, reason: null, retryAfterSeconds: 0};
    }

    /**
     * Claim the faucet amount for an account. Returns {ok:false, reason:
     * 'disabled'|'cooldown'} or {ok:true, amount} and invokes onGrant on
     * success.
     *
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    async claimForUser(userId)
    {
        if(!this.isEnabled || !this.claimsRepository){
            return {ok: false, reason: 'disabled'};
        }
        let nowMs = this.now();
        let claim = await this.claimsRepository.loadOneBy('user_id', userId);
        if(claim){
            let elapsedMs = nowMs - new Date(claim.last_claim_at).getTime();
            let cooldownMs = this.cooldownSeconds * 1000;
            if(elapsedMs < cooldownMs){
                return {
                    ok: false,
                    reason: 'cooldown',
                    retryAfterSeconds: Math.ceil((cooldownMs - elapsedMs) / 1000)
                };
            }
        }
        if(claim){
            await this.claimsRepository.updateById(claim.id, {last_claim_at: new Date(nowMs)});
        } else {
            await this.claimsRepository.create({
                user_id: userId,
                last_claim_at: new Date(nowMs),
                created_at: new Date(nowMs)
            });
        }
        await this.onGrant(userId, this.amount);
        return {ok: true, amount: this.amount};
    }

    /**
     * No global events needed: claims are explicit HTTP/plugin calls.
     *
     * @returns {boolean}
     */
    listenEvents()
    {
        return true;
    }

}

module.exports.Faucet = Faucet;
