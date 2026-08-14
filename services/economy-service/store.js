/**
 *
 * Reldens - Economy Store
 *
 * Append-only JSON ledger for the economy service. The ledger is persisted to
 * a single data/ledger.json file: balances per account, an append-only history
 * of deltas, owned items per account, and an idempotency map keyed by the
 * client-supplied idempotency key. All state lives in memory and is flushed
 * asynchronously after each mutation, so this is safe for a single process
 * only (see README v1 caveats).
 *
 */

const fs = require('fs');
const path = require('path');

class EconomyStore
{

    /**
     * @param {string} [ledgerPath] Path to the ledger JSON file.
     */
    constructor(ledgerPath)
    {
        this.ledgerPath = ledgerPath || path.join(__dirname, 'data', 'ledger.json');
        this.ledger = {
            balances: {},
            history: [],
            owned: {}
        };
        this.idempotency = {};
        this.sequence = 0;
        this.load();
    }

    load()
    {
        try {
            let raw = fs.readFileSync(this.ledgerPath, 'utf8');
            let data = JSON.parse(raw);
            this.ledger = {
                balances: data.balances || {},
                history: data.history || [],
                owned: data.owned || {}
            };
            this.idempotency = data.idempotency || {};
            this.sequence = Number(data.sequence) || 0;
        } catch (error) {
            this.ledger = {balances: {}, history: [], owned: {}};
            this.idempotency = {};
            this.sequence = 0;
        }
    }

    /**
     * Flush the ledger and idempotency map to disk. Writes to a temp file and
     * renames it so a crash mid-write never corrupts the ledger.
     *
     * @returns {Promise<void>}
     */
    async persist()
    {
        let dir = path.dirname(this.ledgerPath);
        fs.mkdirSync(dir, {recursive: true});
        let payload = JSON.stringify({
            balances: this.ledger.balances,
            history: this.ledger.history,
            owned: this.ledger.owned,
            idempotency: this.idempotency,
            sequence: this.sequence
        });
        let tempPath = this.ledgerPath+'.tmp';
        await fs.promises.writeFile(tempPath, payload, 'utf8');
        await fs.promises.rename(tempPath, this.ledgerPath);
    }

    _nextEntryId()
    {
        this.sequence = this.sequence + 1;
        return 'e'+this.sequence;
    }

    /**
     * @param {number} accountId
     * @returns {number} Current integer balance.
     */
    getBalance(accountId)
    {
        return this.ledger.balances[String(accountId)] || 0;
    }

    /**
     * Apply a delta (positive for credits, negative for debits) to an account
     * and append a history entry. Returns false when the debit would drive the
     * balance below zero.
     *
     * @param {number} accountId
     * @param {number} delta
     * @param {string} reason
     * @param {string} [ref]
     * @returns {Promise<number|false>} New balance, or false on insufficient funds.
     */
    async addDelta(accountId, delta, reason, ref)
    {
        let key = String(accountId);
        let current = this.ledger.balances[key] || 0;
        let next = current + delta;
        if(next < 0){
            return false;
        }
        this.ledger.balances[key] = next;
        this.ledger.history.push({
            entryId: this._nextEntryId(),
            accountId: accountId,
            delta: delta,
            reason: reason,
            ref: ref || null,
            atMs: Date.now()
        });
        await this.persist();
        return next;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    hasIdempotency(key)
    {
        return Boolean(key) && Object.prototype.hasOwnProperty.call(this.idempotency, key);
    }

    /**
     * @param {string} key
     * @returns {Object|null}
     */
    getIdempotency(key)
    {
        return this.hasIdempotency(key) ? this.idempotency[key] : null;
    }

    /**
     * @param {string} key
     * @param {Object} result
     * @returns {Promise<void>}
     */
    async recordIdempotency(key, result)
    {
        if(!key){
            return;
        }
        this.idempotency[key] = result;
        await this.persist();
    }

    /**
     * @param {number} accountId
     * @returns {Array<Object>} History entries for the account, oldest first.
     */
    getHistory(accountId)
    {
        return this.ledger.history.filter((entry) => entry.accountId === accountId);
    }

    /**
     * @param {number} accountId
     * @returns {Object<string, number>} Map of itemId to owned count.
     */
    ownedItems(accountId)
    {
        return this.ledger.owned[String(accountId)] || {};
    }

    /**
     * Grant one unit of an item to an account.
     *
     * @param {number} accountId
     * @param {string} itemId
     * @returns {Promise<number>} New owned count.
     */
    async grantItem(accountId, itemId)
    {
        let key = String(accountId);
        if(!this.ledger.owned[key]){
            this.ledger.owned[key] = {};
        }
        let current = this.ledger.owned[key][itemId] || 0;
        this.ledger.owned[key][itemId] = current + 1;
        await this.persist();
        return this.ledger.owned[key][itemId];
    }

}

module.exports.EconomyStore = EconomyStore;
