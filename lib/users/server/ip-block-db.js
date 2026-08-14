/**
 *
 * Reldens - IpBlockDb
 *
 * Persistence for the IP blocklist behind the IpBlock in-memory cache. Uses the
 * `blocked_ips` storage entity (id, ip varchar(45) unique, reason varchar(500),
 * created_by_user_id FK users(id), created_at, expires_at datetime null) through
 * the BaseDriver interface, so it works across every storage driver. loadAll()
 * + in-JS filtering is used for the expiry filter because BaseDriver does not
 * expose a generic WHERE-clause across drivers.
 *
 */

const { Logger } = require('@reldens/utils');
const { IpBlock } = require('./ip-block');

const REASON_MAX = 500;

/** @typedef {import('@reldens/storage').BaseDataServer} BaseDataServer */

class IpBlockDb
{

    /**
     * @param {BaseDataServer} dataServer
     */
    constructor(dataServer)
    {
        /** @type {BaseDataServer} */
        this.dataServer = dataServer;
        /** @type {import('@reldens/storage').BaseDriver|false} */
        this.repository = false;
    }

    /**
     * @returns {import('@reldens/storage').BaseDriver|false}
     */
    getRepository()
    {
        if(!this.dataServer){
            Logger.error('IpBlockDb: DataServer undefined.');
            return false;
        }
        if(!this.repository){
            this.repository = this.dataServer.getEntity('blocked_ips');
        }
        return this.repository;
    }

    /**
     * @returns {Promise<Array<{ip: string, expiresAtMs: number|null}>>}
     */
    async loadActiveBlockedIps()
    {
        const repository = this.getRepository();
        if(!repository){
            return [];
        }
        const rows = await repository.loadAll();
        const nowMs = Date.now();
        const active = [];
        for(const row of rows){
            const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : null;
            if(expiresAtMs !== null && expiresAtMs <= nowMs){
                continue;
            }
            active.push({ip: row.ip, expiresAtMs});
        }
        return active;
    }

    /**
     * @param {{ip: *, reason: *, createdByUserId: number, expiresAt?: *}} input
     * @returns {Promise<string|null>} the clean stored IP, or null when the IP was invalid
     */
    async addBlockedIp(input)
    {
        const repository = this.getRepository();
        if(!repository){
            return null;
        }
        const ip = IpBlock.cleanIp(input.ip);
        if(!ip){
            return null;
        }
        const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, REASON_MAX) : '';
        const expiresAt = IpBlock.parseBlockExpiry(input.expiresAt);
        const record = {
            ip,
            reason,
            created_by_user_id: input.createdByUserId,
            expires_at: expiresAt ? expiresAt.toISOString() : null
        };
        try {
            await repository.create(record);
        } catch (error) {
            // Unique(ip): refresh the existing block instead of failing.
            Logger.debug('IpBlockDb upsert path.', error.message);
            await repository.updateBy('ip', ip, record);
        }
        return ip;
    }

    /**
     * @param {*} ipInput
     * @returns {Promise<boolean>}
     */
    async removeBlockedIp(ipInput)
    {
        const repository = this.getRepository();
        if(!repository){
            return false;
        }
        const ip = IpBlock.cleanIp(ipInput);
        if(!ip){
            return false;
        }
        return Boolean(await repository.delete({ip}));
    }

    /**
     * @returns {Promise<number>} count of expired blocks removed
     */
    async pruneExpiredBlockedIps()
    {
        const repository = this.getRepository();
        if(!repository){
            return 0;
        }
        const rows = await repository.loadAll();
        const nowMs = Date.now();
        let removed = 0;
        for(const row of rows){
            const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : null;
            if(expiresAtMs === null || expiresAtMs > nowMs){
                continue;
            }
            await repository.deleteById(row.id);
            removed++;
        }
        return removed;
    }

}

module.exports.IpBlockDb = IpBlockDb;
