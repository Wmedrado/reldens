/**
 *
 * Reldens - Economy Proxy
 *
 * Typed game-server client for the external soft-currency economy service. ALL
 * peg/price/balance logic and verification live in the economy service (a
 * separate process); the game NEVER computes any of it. The browser hits the
 * game server, the game server hits the service over a secret-gated internal
 * API.
 *
 * GRACEFUL DEGRADATION IS THE CONTRACT. If RELDENS_ECONOMY_SERVICE_URL or
 * RELDENS_ECONOMY_INTERNAL_SECRET is unset, OR the service is unreachable /
 * errors / times out, EVERY function here returns a typed "unavailable" result
 * and NEVER throws up into request handling. The game must boot and play with
 * the service OFF.
 *
 * The functions mirror the service API surface; they do NOT recompute any
 * value, they only pass through what the service returns.
 *
 */

const { Logger } = require('@reldens/utils');

const SERVICE_TIMEOUT_MS = 5000;

/** Rails the economy service can price and settle purchases on. */
const RAILS = Object.freeze(['stripe', 'sol', 'usdc', 'token']);

function serviceUrl()
{
    return (process.env.RELDENS_ECONOMY_SERVICE_URL ?? '').trim();
}

function serviceSecret()
{
    return process.env.RELDENS_ECONOMY_INTERNAL_SECRET ?? '';
}

/**
 * The service is reachable only when BOTH the URL and the secret are set.
 *
 * @returns {boolean}
 */
function economyServiceConfigured()
{
    return serviceUrl() !== '' && serviceSecret() !== '';
}

let loggedOnce = false;
/**
 * Dev-channel only; the request path never sees this. Log once so a
 * persistently down service does not flood the server log every request.
 *
 * @param {unknown} err
 */
function logFailure(err)
{
    if(loggedOnce){
        return;
    }
    loggedOnce = true;
    let message = err instanceof Error ? err.message : String(err);
    Logger.warning('[economy] economy service unavailable: '+message);
}

function buildUrl(path, base)
{
    let cleanBase = base.endsWith('/') ? base : base+'/';
    return new URL(path.replace(/^\//, ''), cleanBase);
}

/**
 * The one fetch wrapper. Returns the parsed JSON on a 2xx, or null on any
 * failure (unconfigured, non-2xx, network error, timeout, bad JSON). It NEVER
 * throws: every caller maps a null into its own typed unavailable result.
 *
 * @param {Object} req
 * @param {string} req.method
 * @param {string} req.path
 * @param {Object} [req.body]
 * @param {number} [req.timeoutMs]
 * @param {Function} [fetchImpl] injectable fetch for tests
 * @returns {Promise<Object|null>}
 */
async function callService(req, fetchImpl)
{
    let base = serviceUrl();
    let secret = serviceSecret();
    if(base === '' || secret === ''){
        return null;
    }
    let fetchFn = fetchImpl || globalThis.fetch;
    try {
        let headers = {'x-reldens-economy-secret': secret};
        let body;
        if(req.body !== undefined){
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(req.body);
        }
        let res = await fetchFn(buildUrl(req.path, base), {
            method: req.method,
            headers: headers,
            body: body,
            signal: AbortSignal.timeout(req.timeoutMs ?? SERVICE_TIMEOUT_MS)
        });
        if(!res.ok){
            throw new Error(req.method+' '+req.path+' -> '+res.status);
        }
        return await res.json();
    } catch (err) {
        logFailure(err);
        return null;
    }
}

/**
 * GET balance/:accountId.
 *
 * @typedef {Object} EconomyBalanceResult
 * @property {boolean} available true when the service answered
 * @property {number|null} balance integer balance, null when unavailable
 */
/**
 * @param {number} accountId
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomyBalanceResult>}
 */
async function economyBalance(accountId, fetchImpl)
{
    let data = await callService({
        method: 'GET',
        path: 'balance/'+encodeURIComponent(String(accountId))
    }, fetchImpl);
    let balance = typeof data?.balance === 'number' ? data.balance : null;
    return {available: null !== balance, balance: balance};
}

/**
 * GET price/:rail.
 *
 * @typedef {Object} EconomyPriceResult
 * @property {string} rail
 * @property {number|null} price per unit in the rail's base currency
 * @property {boolean} available true when the service answered
 */
/**
 * @param {string} rail one of 'stripe'|'sol'|'usdc'|'token'
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomyPriceResult>}
 */
async function economyPrice(rail, fetchImpl)
{
    let data = await callService({
        method: 'GET',
        path: 'price/'+encodeURIComponent(String(rail))
    }, fetchImpl);
    return {
        rail: rail,
        price: typeof data?.price === 'number' ? data.price : null,
        available: typeof data?.price === 'number'
    };
}

/**
 * POST purchase.
 *
 * @typedef {Object} EconomyPurchaseResult
 * @property {boolean} ok
 * @property {string|null} purchaseId
 * @property {string|null} rail
 * @property {string|null} reason null when ok
 */
/**
 * @param {Object} input
 * @param {number} input.accountId
 * @param {string} input.rail
 * @param {string} input.sku
 * @param {string} input.idempotencyKey
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomyPurchaseResult>}
 */
async function economyPurchase(input, fetchImpl)
{
    let data = await callService({method: 'POST', path: 'purchase', body: input}, fetchImpl);
    if(!data){
        return {ok: false, purchaseId: null, rail: null, reason: 'unavailable'};
    }
    let reason = typeof data.reason === 'string' ? data.reason : null;
    let purchaseId = typeof data.purchaseId === 'string' && data.purchaseId !== '' ? data.purchaseId : null;
    let rail = RAILS.includes(data.rail) ? data.rail : null;
    let ok = reason === null && null !== purchaseId && rail === input.rail;
    return {ok: ok, purchaseId: ok ? purchaseId : null, rail: ok ? rail : null, reason: ok ? null : (reason ?? 'unavailable')};
}

/**
 * POST spend.
 *
 * @typedef {Object} EconomySpendResult
 * @property {boolean} granted
 * @property {number|null} balance post-spend balance
 * @property {number|null} cost charged cost
 * @property {string|null} reason null when granted
 */
/**
 * @param {Object} input
 * @param {number} input.accountId
 * @param {string} input.itemId
 * @param {string} input.kind
 * @param {number} input.expectedCost
 * @param {string} input.idempotencyKey
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomySpendResult>}
 */
async function economySpend(input, fetchImpl)
{
    let data = await callService({method: 'POST', path: 'spend', body: input}, fetchImpl);
    if(!data){
        return {granted: false, balance: null, cost: null, reason: 'unavailable'};
    }
    return {
        granted: data.granted === true,
        balance: typeof data.balance === 'number' ? data.balance : null,
        cost: typeof data.cost === 'number' ? data.cost : null,
        reason: typeof data.reason === 'string' ? data.reason : null
    };
}

/**
 * GET store/:accountId. Empty catalog when the service is off.
 *
 * @typedef {Object} EconomyStoreResult
 * @property {boolean} available
 * @property {Array<Object>} items rows {itemId, name, cost, owned} from the service
 */
/**
 * @param {number} accountId
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomyStoreResult>}
 */
async function economyStore(accountId, fetchImpl)
{
    let data = await callService({
        method: 'GET',
        path: 'store/'+encodeURIComponent(String(accountId))
    }, fetchImpl);
    if(!Array.isArray(data)){
        return {available: false, items: []};
    }
    let items = data.filter(
        (item) => item && typeof item.itemId === 'string' && typeof item.name === 'string' && typeof item.cost === 'number'
    );
    return {available: true, items: items};
}

/**
 * GET history/:accountId. Empty when the service is off.
 *
 * @typedef {Object} EconomyHistoryResult
 * @property {Array<Object>} entries rows {entryId, accountId, delta, reason, ref, atMs} from the service
 */
/**
 * @param {number} accountId
 * @param {Function} [fetchImpl]
 * @returns {Promise<EconomyHistoryResult>}
 */
async function economyHistory(accountId, fetchImpl)
{
    let data = await callService({
        method: 'GET',
        path: 'history/'+encodeURIComponent(String(accountId))
    }, fetchImpl);
    if(!Array.isArray(data)){
        return {entries: []};
    }
    let entries = data.filter(
        (entry) => entry && typeof entry.entryId === 'string' && entry.accountId === accountId && typeof entry.delta === 'number'
    );
    return {entries: entries};
}

module.exports.SERVICE_TIMEOUT_MS = SERVICE_TIMEOUT_MS;
module.exports.RAILS = RAILS;
module.exports.economyServiceConfigured = economyServiceConfigured;
module.exports.economyBalance = economyBalance;
module.exports.economyPrice = economyPrice;
module.exports.economyPurchase = economyPurchase;
module.exports.economySpend = economySpend;
module.exports.economyStore = economyStore;
module.exports.economyHistory = economyHistory;
