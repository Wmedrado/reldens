/**
 *
 * Reldens - IpBlock
 *
 * In-memory IP blocklist cache.
 * Consulted on every register/login/WS-connect, so the blocklist lives in memory
 * (filled from ip-block-db) rather than hitting the DB per connection. `nowMs`
 * is passed in rather than read so the class stays pure and unit-testable.
 *
 */

const net = require('node:net');

/**
 * Canonicalize an IP string: lowercase, trim, strip the IPv4-mapped IPv6
 * prefix (::ffff:1.2.3.4 -> 1.2.3.4) so both forms share one blocklist entry.
 * Returns the empty string for non-strings or empty input.
 * @param {string} ip
 * @returns {string}
 */
function normalizeIp(ip)
{
    if(typeof ip !== 'string'){
        return '';
    }
    let value = ip.trim().toLowerCase();
    if(value.startsWith('::ffff:') && -1 !== value.indexOf('.')){
        value = value.slice(7);
    }
    return value;
}

// normalizeIp canonicalizes (shared with the connect side); cleanIp adds the
// validation, returning '' for anything net.isIP rejects: 'unknown', partial
// IPs, garbage; so an invalid block can't be stored.
/**
 * @param {*} value
 * @returns {string}
 */
function cleanIp(value)
{
    const s = normalizeIp(typeof value === 'string' ? value.trim() : '');
    return net.isIP(s) ? s : '';
}

// '' / null / undefined => null (permanent). A present value must parse to a
// future date or it throws.
/**
 * @param {*} value
 * @returns {Date|null}
 */
function parseBlockExpiry(value)
{
    if(value === undefined || value === null || value === ''){
        return null;
    }
    const d = new Date(String(value));
    if(!Number.isFinite(d.getTime()) || d.getTime() <= Date.now()){
        throw new Error('block expiry must be in the future');
    }
    return d;
}

/**
 * @typedef {Object} IpBlockEntry
 * @property {string} ip
 * @property {number|null} expiresAtMs
 */

class IpBlockList
{

    constructor()
    {
        /** @type {Map<string, number|null>} */
        this.entries = new Map();
    }

    /**
     * @param {IpBlockEntry[]} entries
     * @returns {void}
     */
    setEntries(entries)
    {
        const next = new Map();
        for(const e of entries){
            if(e.ip){
                next.set(e.ip, e.expiresAtMs);
            }
        }
        this.entries = next;
    }

    /**
     * @param {string} ip
     * @param {number} nowMs
     * @returns {boolean}
     */
    isBlocked(ip, nowMs)
    {
        if(!this.entries.has(ip)){
            return false;
        }
        const expiresAtMs = this.entries.get(ip) ?? null;
        return expiresAtMs === null || expiresAtMs > nowMs;
    }

    /**
     * @returns {number}
     */
    get size()
    {
        return this.entries.size;
    }

}

/**
 * @param {{blocked: boolean, isAdmin: boolean, ipSessions: number, hardLimit: number}} input
 * @returns {boolean}
 */
function isConnectionRefused(input)
{
    if(input.isAdmin){
        return false;
    }
    return input.blocked || input.ipSessions >= input.hardLimit;
}

module.exports.IpBlock = {
    normalizeIp,
    cleanIp,
    parseBlockExpiry,
    IpBlockList,
    isConnectionRefused
};
