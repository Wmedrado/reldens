/**
 *
 * Reldens - test-general-chat-quota
 *
 * Standalone tests for lib/chat/server/general-chat-quota.js with an
 * in-memory fake dataServer (no DB, no framework).
 * Run: node tests/test-general-chat-quota.js
 *
 */

const assert = require('assert');
const {
    ChatGeneralQuotaCoordinator,
    classifyOnlineGeneralChat,
    generalChatQuotaRefusalEvent,
    GENERAL_CHAT_QUOTA_CACHE_MAX_ACCOUNTS,
    GENERAL_CHAT_QUOTA_MAX_IN_FLIGHT,
} = require('../lib/chat/server/general-chat-quota');

let passed = 0;

function eq(actual, expected, label)
{
    assert.deepStrictEqual(actual, expected, label);
    passed++;
}

function ok(condition, label)
{
    assert.ok(condition, label);
    passed++;
}

/**
 * In-memory repository mirroring the BaseDriver surface the coordinator uses.
 */
class FakeRepo
{

    constructor()
    {
        this.rows = new Map();
        this.nextId = 1;
        this.fail = false;
    }

    async loadOneBy(field, value)
    {
        if(this.fail){
            throw new Error('database unavailable');
        }
        return this.rows.get(value) || null;
    }

    async create(params)
    {
        if(this.fail){
            throw new Error('database unavailable');
        }
        const row = Object.assign({id: this.nextId++}, params);
        this.rows.set(row.account_id, row);
        return row;
    }

    async updateById(id, params)
    {
        if(this.fail){
            throw new Error('database unavailable');
        }
        for(const [key, row] of this.rows){
            if(row.id === id){
                Object.assign(row, params);
                return row;
            }
        }
        return false;
    }

    async deleteById(id)
    {
        if(this.fail){
            throw new Error('database unavailable');
        }
        for(const [key, row] of this.rows){
            if(row.id === id){
                this.rows.delete(key);
                return true;
            }
        }
        return false;
    }

    async loadAll()
    {
        if(this.fail){
            throw new Error('database unavailable');
        }
        return [...this.rows.values()];
    }
}

function makeDataServer(repo)
{
    return {
        getEntity(name){
            return 'chatQuotas' === name ? repo : null;
        }
    };
}

// classifyOnlineGeneralChat: Reldens global forms
{
    eq(classifyOnlineGeneralChat('/general hello', 'say'), {canonicalText: '/general hello'}, '/general explicit');
    eq(classifyOnlineGeneralChat('/GENERAL   hello there ', 'guild'), {canonicalText: '/general hello there'}, '/general case/space');
    eq(classifyOnlineGeneralChat('#global hello', 'say'), {canonicalText: '#global hello'}, '#global explicit');
    eq(classifyOnlineGeneralChat('sticky hello', 'global'), {canonicalText: '#global sticky hello'}, 'default global');
    eq(classifyOnlineGeneralChat('', 'global'), null, 'empty text');
    eq(classifyOnlineGeneralChat('/general', 'global'), null, '/general without body');
    eq(classifyOnlineGeneralChat('#global', 'global'), null, '#global without body');
    eq(classifyOnlineGeneralChat('/g guild', 'global'), null, '/g is not global');
    eq(classifyOnlineGeneralChat('/w Name whisper', 'global'), null, '/w is not global');
    eq(classifyOnlineGeneralChat('!lfg relay', 'global'), null, '! prefix is not global');
    eq(classifyOnlineGeneralChat('#room hello', 'global'), null, 'other # prefix is not global');
    eq(classifyOnlineGeneralChat('plain say', 'say'), null, 'non-global remembered channel');
}

// generalChatQuotaRefusalEvent
{
    eq(generalChatQuotaRefusalEvent({status: 'denied', retryAfterSeconds: 41.2, notify: true}), {
        type: 'error',
        text: 'Global chat limit reached. Try again in 42 seconds.',
        code: 'general_chat_quota',
        channel: 'global',
        retryAfterSeconds: 42,
    }, 'denied maps to limit reached');
    eq(generalChatQuotaRefusalEvent({status: 'pending', notify: true}), {
        type: 'error',
        text: 'Your previous Global chat message is still sending. Try again in a moment.',
        code: 'general_chat_quota_pending',
        channel: 'global',
        retryAfterSeconds: 1,
    }, 'pending maps to still sending');
    eq(generalChatQuotaRefusalEvent({status: 'busy', notify: true}), {
        type: 'error',
        text: 'Global chat is temporarily unavailable. Try again shortly.',
        code: 'general_chat_quota_unavailable',
        channel: 'global',
        retryAfterSeconds: 1,
    }, 'busy maps to unavailable');
    eq(generalChatQuotaRefusalEvent({status: 'error', notify: true}).code, 'general_chat_quota_unavailable', 'error maps to unavailable');
}

// allowed under max, denied over max with retry, cached denial + notice throttle
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 2,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        const r1 = await coord.admit(1);
        eq(r1, {status: 'allowed', notify: false}, 'first admit allowed');
        const r2 = await coord.admit(1);
        eq(r2, {status: 'allowed', notify: false}, 'second admit allowed');
        const r3 = await coord.admit(1);
        eq(r3.status, 'denied', 'third admit denied');
        ok(r3.retryAfterSeconds >= 1, 'denied carries a retry');
        eq(r3.notify, true, 'first denial notifies');
        eq(repo.rows.get(1).count, 2, 'row count stops at the budget');
        nowMs += 100;
        const r4 = await coord.admit(1);
        eq(r4.status, 'denied', 'cached denial still denied');
        eq(r4.notify, false, 'denial notice is throttled');
        const before = repo.rows.get(1).count;
        await coord.admit(1);
        eq(repo.rows.get(1).count, before, 'cached denial never re-reads the row');
    })().then(runWindowReset, fail);
}

// window reset after expiry on a pinned clock
function runWindowReset()
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 2,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        eq((await coord.admit(1)).status, 'allowed', 'window reset first admit allowed');
        eq((await coord.admit(1)).status, 'allowed', 'window reset second admit allowed');
        eq((await coord.admit(1)).status, 'denied', 'window reset third admit denied');
        nowMs += 61 * 1000;
        const reset = await coord.admit(1);
        eq(reset.status, 'allowed', 'expired window resets to allowed');
        eq(repo.rows.get(1).count, 1, 'expired window resets the count');
    })().then(runPending, fail);
}

// pending on same-account in-flight
function runPending()
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 2,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        let resolveFirst;
        const originalLoadOneBy = repo.loadOneBy.bind(repo);
        let deferred = true;
        repo.loadOneBy = async (field, value) => {
            if(deferred){
                deferred = false;
                return new Promise((resolve) => {
                    resolveFirst = resolve;
                });
            }
            return originalLoadOneBy(field, value);
        };
        const first = coord.admit(1);
        const second = coord.admit(1);
        const s2 = await second;
        eq(s2.status, 'pending', 'same-account overlap refused as pending');
        eq(s2.notify, true, 'pending overlap notifies');
        resolveFirst(null);
        const s1 = await first;
        eq(s1, {status: 'allowed', notify: false}, 'active call resolves allowed after pending');
        eq(coord.inFlight, 0, 'in-flight returns to zero');
        const third = await coord.admit(1);
        eq(third.status, 'allowed', 'next send reaches the database after the pending window');
    })().then(runBusy, fail);
}

// busy when the global in-flight cap is saturated
function runBusy()
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 2,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        const releases = [];
        repo.loadOneBy = async () => new Promise((resolve) => releases.push(resolve));
        const active = [];
        for(let i = 0; i < GENERAL_CHAT_QUOTA_MAX_IN_FLIGHT; i++){
            active.push(coord.admit(10 + i));
        }
        const busy = await coord.admit(999);
        eq(busy.status, 'busy', 'cap saturation refuses as busy');
        eq(busy.notify, true, 'busy refusal notifies');
        for(const release of releases){
            release(null);
        }
        await Promise.all(active);
    })().then(runFailClosed, fail);
}

// fail-closed on database error, busy cache arms, recovers after expiry
function runFailClosed()
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 2,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        repo.fail = true;
        const r1 = await coord.admit(1);
        eq(r1.status, 'error', 'database error refuses as error');
        eq(r1.notify, true, 'error refusal notifies');
        const r2 = await coord.admit(1);
        eq(r2.status, 'busy', 'unavailable cache arms after error');
        eq(r2.notify, false, 'unavailable notice is throttled');
        nowMs += 2000;
        repo.fail = false;
        const r3 = await coord.admit(1);
        eq(r3, {status: 'allowed', notify: false}, 'recovered database allows again');
    })().then(runLruTrim, fail);
}

// LRU trim bounds refusal and notice state
function runLruTrim()
{
    let nowMs = 0;
    const repo = new FakeRepo();
    const coord = new ChatGeneralQuotaCoordinator({
        dataServer: makeDataServer(repo),
        maxPerWindow: 1,
        windowSeconds: 60,
        now: () => nowMs,
    });
    (async() => {
        for(let accountId = 1; accountId <= GENERAL_CHAT_QUOTA_CACHE_MAX_ACCOUNTS + 1; accountId++){
            await coord.admit(accountId);
            await coord.admit(accountId);
        }
        eq(coord.cachedAccounts, GENERAL_CHAT_QUOTA_CACHE_MAX_ACCOUNTS, 'cache trims to the cap');
    })().then(finish, fail);
}

function fail(error)
{
    console.error(error);
    process.exit(1);
}

function finish()
{
    console.log('test-general-chat-quota OK ('+passed+' assertions).');
}
