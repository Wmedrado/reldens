/**
 *
 * Reldens - Economy Service
 *
 * Minimal reference implementation of the external soft-currency economy
 * service the game's economy proxy talks to. Zero dependencies (node http
 * only), single process, file-backed ledger. The game server is the only
 * client: every request must carry the internal secret in the
 * x-reldens-economy-secret header.
 *
 * The peg is fixed: 1 claudium = 0.01 usd. Real Stripe intents, WOC oracle
 * prices and on-chain settlement are stubbed in v1 (see README caveats).
 *
 * Endpoints (matched 1:1 by lib/blockchain/server/economy-proxy.js):
 *   GET  /balance/:accountId
 *   GET  /price/:rail
 *   GET  /skus
 *   GET  /store/:accountId
 *   GET  /history/:accountId
 *   POST /purchase
 *   POST /spend
 *   GET  /health
 *
 */

const http = require('http');
const { EconomyStore } = require('./store');

const PORT = Number(process.env.PORT) || 8301;
const SECRET = process.env.ECONOMY_INTERNAL_SECRET || '';
const USD_PER_CLAUDIUM = 0.01;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const WOC_ORACLE = process.env.WOC_ORACLE || null;
const RAILS = ['stripe', 'sol', 'usdc', 'token'];
const MAX_BODY_BYTES = 1024 * 1024;

const SKUS = [
    {sku: 'starter', usd: 1.0, claudium: 100},
    {sku: 'standard', usd: 5.0, claudium: 500},
    {sku: 'premium', usd: 10.0, claudium: 1000}
];

const CATALOG = [
    {itemId: 'potion', name: 'Health Potion', kind: 'consumable', costClaudium: 10},
    {itemId: 'elixir', name: 'Mana Elixir', kind: 'consumable', costClaudium: 25},
    {itemId: 'key', name: 'Dungeon Key', kind: 'key', costClaudium: 100},
    {itemId: 'skin-flame', name: 'Flame Guardian Skin', kind: 'skin', costClaudium: 500}
];

const store = new EconomyStore();

function sendJson(res, status, payload)
{
    let body = JSON.stringify(payload);
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(body);
}

function parseBody(req)
{
    return new Promise((resolve, reject) => {
        let chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if(size > MAX_BODY_BYTES){
                reject(new Error('payload too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            try {
                let raw = Buffer.concat(chunks).toString('utf8');
                resolve('' === raw.trim() ? {} : JSON.parse(raw));
            } catch (error) {
                reject(new Error('invalid json'));
            }
        });
        req.on('error', reject);
    });
}

function isAuthed(req)
{
    return SECRET !== '' && req.headers['x-reldens-economy-secret'] === SECRET;
}

function readPath(pathname)
{
    let segments = pathname.split('/').filter((segment) => '' !== segment);
    let route = segments[0] || '';
    return {route: route, params: segments.slice(1)};
}

function skuFor(sku)
{
    return SKUS.find((item) => item.sku === sku) || null;
}

function fakeStripeIntent()
{
    let pi = 'pi_'+Math.random().toString(36).slice(2);
    return {
        clientSecret: pi+'_secret_'+Math.random().toString(36).slice(2),
        publishableKey: STRIPE_PUBLISHABLE_KEY
    };
}

function railInfo(rail)
{
    return {
        rail: rail,
        usdPerClaudium: USD_PER_CLAUDIUM,
        wocBaseUnitsPerClaudium: WOC_ORACLE ? 1 : null
    };
}

async function handleRequest(req, res)
{
    if(!isAuthed(req)){
        sendJson(res, 403, {error: 'forbidden'});
        return;
    }
    let url = new URL(req.url, 'http://localhost');
    let {route, params} = readPath(url.pathname);

    if('GET' === req.method && 'health' === route){
        sendJson(res, 200, {ok: true, pid: process.pid});
        return;
    }

    if('GET' === req.method && 'balance' === route){
        let accountId = Number(params[0]);
        if(!Number.isInteger(accountId)){
            sendJson(res, 400, {error: 'invalid accountId'});
            return;
        }
        sendJson(res, 200, {balance: store.getBalance(accountId)});
        return;
    }

    if('GET' === req.method && 'price' === route){
        let rail = params[0];
        if(!RAILS.includes(rail)){
            sendJson(res, 404, {error: 'unknown rail'});
            return;
        }
        sendJson(res, 200, railInfo(rail));
        return;
    }

    if('GET' === req.method && 'skus' === route){
        sendJson(res, 200, SKUS);
        return;
    }

    if('GET' === req.method && 'store' === route){
        let accountId = Number(params[0]);
        if(!Number.isInteger(accountId)){
            sendJson(res, 400, {error: 'invalid accountId'});
            return;
        }
        let owned = store.ownedItems(accountId);
        let rows = CATALOG.map((item) => Object.assign({}, item, {owned: owned[item.itemId] || 0}));
        sendJson(res, 200, rows);
        return;
    }

    if('GET' === req.method && 'history' === route){
        let accountId = Number(params[0]);
        if(!Number.isInteger(accountId)){
            sendJson(res, 400, {error: 'invalid accountId'});
            return;
        }
        sendJson(res, 200, store.getHistory(accountId));
        return;
    }

    if('POST' === req.method && 'purchase' === route){
        let body;
        try {
            body = await parseBody(req);
        } catch (error) {
            sendJson(res, 400, {error: error.message});
            return;
        }
        await handlePurchase(body, res);
        return;
    }

    if('POST' === req.method && 'spend' === route){
        let body;
        try {
            body = await parseBody(req);
        } catch (error) {
            sendJson(res, 400, {error: error.message});
            return;
        }
        await handleSpend(body, res);
        return;
    }

    sendJson(res, 404, {error: 'not found'});
}

/**
 * POST /purchase {accountId, rail, sku, idempotencyKey}.
 *
 * Simulates a Stripe PaymentIntent (fake client secret) when the rail is
 * 'stripe' and STRIPE_PUBLISHABLE_KEY is set. Any other rail returns ok:false
 * with a reason; no claudium is credited until settlement, so a purchase only
 * records the intent, never a balance change.
 *
 * @param {Object} body
 * @param {Object} res
 * @returns {Promise<void>}
 */
async function handlePurchase(body, res)
{
    let accountId = Number(body.accountId);
    let rail = body.rail;
    let sku = skuFor(body.sku);
    let idempotencyKey = body.idempotencyKey;
    if(!Number.isInteger(accountId) || !RAILS.includes(rail) || !sku){
        sendJson(res, 400, {error: 'invalid purchase input'});
        return;
    }
    if(store.hasIdempotency(idempotencyKey)){
        sendJson(res, 200, store.getIdempotency(idempotencyKey));
        return;
    }
    let result;
    if('stripe' === rail && STRIPE_PUBLISHABLE_KEY !== ''){
        result = {
            ok: true,
            purchaseId: 'pu_'+Math.random().toString(36).slice(2),
            rail: rail,
            claudium: sku.claudium,
            stripe: fakeStripeIntent(),
            woc: null,
            reason: null
        };
    } else {
        result = {
            ok: false,
            purchaseId: null,
            rail: rail,
            claudium: 0,
            stripe: null,
            woc: null,
            reason: 'rail_unavailable'
        };
    }
    await store.recordIdempotency(idempotencyKey, result);
    sendJson(res, 200, result);
}

/**
 * POST /spend {accountId, itemId, kind, expectedCostClaudium, idempotencyKey}.
 *
 * Debits the account by the expected cost and grants one unit of the item.
 * Fails closed (granted:false) when the balance cannot cover the cost. The
 * cost is caller-asserted; the service trusts it as the price set by the game.
 *
 * @param {Object} body
 * @param {Object} res
 * @returns {Promise<void>}
 */
async function handleSpend(body, res)
{
    let accountId = Number(body.accountId);
    let cost = Number(body.expectedCostClaudium);
    let idempotencyKey = body.idempotencyKey;
    if(!Number.isInteger(accountId) || !Number.isFinite(cost) || cost < 0){
        sendJson(res, 400, {error: 'invalid spend input'});
        return;
    }
    if(store.hasIdempotency(idempotencyKey)){
        sendJson(res, 200, store.getIdempotency(idempotencyKey));
        return;
    }
    let balance = store.getBalance(accountId);
    if(balance < cost){
        let result = {
            granted: false,
            balance: balance,
            costClaudium: cost,
            reason: 'insufficient_funds'
        };
        await store.recordIdempotency(idempotencyKey, result);
        sendJson(res, 200, result);
        return;
    }
    let newBalance = await store.addDelta(accountId, -cost, 'spend:'+body.itemId, body.idempotencyKey);
    if(false === newBalance){
        let result = {
            granted: false,
            balance: store.getBalance(accountId),
            costClaudium: cost,
            reason: 'insufficient_funds'
        };
        await store.recordIdempotency(idempotencyKey, result);
        sendJson(res, 200, result);
        return;
    }
    await store.grantItem(accountId, body.itemId);
    let result = {
        granted: true,
        balance: newBalance,
        costClaudium: cost,
        reason: null
    };
    await store.recordIdempotency(idempotencyKey, result);
    sendJson(res, 200, result);
}

const server = http.createServer(handleRequest);

server.on('error', (error) => {
    console.error('economy service fatal:', error.message);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log('reldens-economy-service listening on port '+PORT);
    if('' === SECRET){
        console.warn('WARNING: ECONOMY_INTERNAL_SECRET is not set; all requests will be rejected with 403.');
    }
});
