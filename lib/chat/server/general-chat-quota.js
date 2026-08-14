/**
 *
 * Reldens - ChatGeneralQuotaCoordinator
 *
 * Per-account rate limit for global chat, persisted in the `chat_quotas`
 * storage entity (window_start + count). Simplified port of the World of
 * Claudecraft GeneralChatQuotaCoordinator: no Postgres advisory locks, no
 * cross-process notifications, no dedicated pool. The storage driver is the
 * single source of truth, so a server restart never resets the window.
 *
 * The coordinator keeps the same bounded, account-serialized shape:
 * - At most MAX_PENDING_PER_ACCOUNT in-flight consume per account; a
 *   same-account overlap is refused as 'pending' (never cached, never a DB
 *   waiter), so back-to-back sends cannot overtake each other.
 * - A process-wide in-flight cap (GENERAL_CHAT_QUOTA_MAX_IN_FLIGHT) sheds
 *   bursts as 'busy' and arms the short unavailable cache.
 * - A failed consume fails CLOSED: the send is refused as 'error' and the
 *   short unavailable cache arms, so a database outage silences configured
 *   accounts rather than lifting their quota. That is the intended tradeoff
 *   for an anti-spam control.
 * - Denials and notices are LRU-bounded (CACHE_MAX_ACCOUNTS); denial notices
 *   are throttled so a flood does not spam the sender.
 *
 */

const { Logger, sc } = require('@reldens/utils');

// The active call is the one account slot. Later sends are refused locally,
// never queued as promises or database waiters.
const MAX_PENDING_PER_ACCOUNT = 1;
// Process-wide ceiling shared by every configured account; once this many
// consumes are in flight every other account is refused as busy.
const MAX_IN_FLIGHT = 2;
const CACHE_MAX_ACCOUNTS = 4096;
const NOTICE_THROTTLE_MS = 5000;
const BUSY_CACHE_MS = 1000;

const DEFAULT_MAX_PER_WINDOW = 10;
const DEFAULT_WINDOW_SECONDS = 60;

/**
 * Pure classification of the online global-chat spellings. Reldens global
 * messages are prefixed with '#', so the explicit forms are '/general' and
 * '#global'; a bare message is global only while the remembered channel is
 * 'global' and the text does not start with another command prefix.
 *
 * @param {string} rawText
 * @param {string} rememberedChannel
 * @returns {Object|null} {canonicalText} or null when not a global send.
 */
function classifyOnlineGeneralChat(rawText, rememberedChannel)
{
    const text = rawText.trim();
    if(!text){
        return null;
    }
    const explicit = /^\/general\s+([\s\S]+)$/i.exec(text);
    if(explicit){
        const body = explicit[1].trim();
        return body ? {canonicalText: '/general '+body} : null;
    }
    const hashGlobal = /^#global\s+([\s\S]+)$/i.exec(text);
    if(hashGlobal){
        const body = hashGlobal[1].trim();
        return body ? {canonicalText: '#global '+body} : null;
    }
    if(text.startsWith('/') || text.startsWith('!') || text.startsWith('#')){
        return null;
    }
    if(rememberedChannel !== 'global'){
        return null;
    }
    return {canonicalText: '#global '+text};
}

/**
 * Map a refused admission to its sender-only structured error event. Callers
 * build the final MessageFactory.create from this object.
 *
 * @param {Object} admission
 * @returns {Object} {type, text, code, channel, retryAfterSeconds}
 */
function generalChatQuotaRefusalEvent(admission)
{
    if('denied' === admission.status){
        const retryAfterSeconds = Math.max(1, Math.ceil(admission.retryAfterSeconds));
        return {
            type: 'error',
            text: 'Global chat limit reached. Try again in '+retryAfterSeconds+' seconds.',
            code: 'general_chat_quota',
            channel: 'global',
            retryAfterSeconds,
        };
    }
    if('pending' === admission.status){
        return {
            type: 'error',
            text: 'Your previous Global chat message is still sending. Try again in a moment.',
            code: 'general_chat_quota_pending',
            channel: 'global',
            retryAfterSeconds: 1,
        };
    }
    return {
        type: 'error',
        text: 'Global chat is temporarily unavailable. Try again shortly.',
        code: 'general_chat_quota_unavailable',
        channel: 'global',
        retryAfterSeconds: 1,
    };
}

/**
 * @param {Object} props
 * @param {Object} props.dataServer Storage data server exposing getEntity().
 * @param {number} [props.maxPerWindow] Messages allowed per window.
 * @param {number} [props.windowSeconds] Window length in seconds.
 * @param {Function} [props.now] Clock in milliseconds (tests pin this).
 */
class ChatGeneralQuotaCoordinator
{

    constructor(props)
    {
        this.dataServer = sc.get(props, 'dataServer', false);
        this.maxPerWindow = sc.get(props, 'maxPerWindow', DEFAULT_MAX_PER_WINDOW);
        this.windowSeconds = sc.get(props, 'windowSeconds', DEFAULT_WINDOW_SECONDS);
        this.now = sc.get(props, 'now', false) || (() => Date.now());
        this.repo = this.dataServer ? this.dataServer.getEntity('chatQuotas') : false;
        /** @type {Map<number, number>} */
        this.pendingByAccount = new Map();
        /** @type {Map<number, {kind: string, untilMs: number}>} */
        this.localRefusals = new Map();
        /** @type {Map<number, number>} */
        this.lastNoticeAt = new Map();
        this.inFlight = 0;
    }

    get cachedAccounts()
    {
        const union = new Set(this.localRefusals.keys());
        for(let accountId of this.lastNoticeAt.keys()){
            union.add(accountId);
        }
        return union.size;
    }

    /**
     * @param {number} accountId
     * @returns {Promise<Object>} {status, retryAfterSeconds?, notify}
     */
    async admit(accountId)
    {
        if(!this.repo){
            Logger.warning('Chat quotas repository unavailable, refusing global chat.', accountId);
            return this.unavailable(accountId, 'error');
        }
        const cached = this.cachedRefusal(accountId);
        if(cached){
            return cached;
        }
        const accountPending = this.pendingByAccount.get(accountId) || 0;
        if(accountPending >= MAX_PENDING_PER_ACCOUNT){
            // A healthy same-account consume is already in flight. Refuse only
            // this send and never arm the unavailable cache: the database is
            // fine, so the next attempt reaches it as soon as the active call
            // resolves.
            return {
                status: 'pending',
                notify: this.shouldNotify(accountId),
            };
        }
        if(this.inFlight >= MAX_IN_FLIGHT){
            return this.unavailable(accountId, 'busy');
        }
        this.pendingByAccount.set(accountId, accountPending + 1);
        this.inFlight++;
        try {
            const consumed = await this.consume(accountId);
            if('denied' === consumed.status){
                const retryAfterSeconds = Math.max(1, Math.ceil(consumed.retryAfterSeconds));
                this.rememberRefusal(accountId, {
                    kind: 'denied',
                    untilMs: this.now() + retryAfterSeconds * 1000,
                });
                return {
                    status: 'denied',
                    retryAfterSeconds,
                    notify: this.shouldNotify(accountId),
                };
            }
            return {status: 'allowed', notify: false};
        } catch (error) {
            Logger.warning('Global chat quota consume error.', accountId, error.message);
            return this.unavailable(accountId, 'error');
        } finally {
            this.inFlight--;
            const left = (this.pendingByAccount.get(accountId) || 1) - 1;
            if(left > 0){
                this.pendingByAccount.set(accountId, left);
            } else {
                this.pendingByAccount.delete(accountId);
            }
        }
    }

    /**
     * Persist one consume against the `chat_quotas` entity. The row is the
     * source of truth: load by account_id, reset the window when expired,
     * bump the count, refuse when the count exceeds the window budget.
     *
     * @param {number} accountId
     * @returns {Promise<Object>} {status, retryAfterSeconds?}
     */
    async consume(accountId)
    {
        const nowMs = this.now();
        let quota = await this.repo.loadOneBy('account_id', accountId);
        if(!quota){
            await this.repo.create({
                account_id: accountId,
                window_start: new Date(nowMs),
                count: 1,
                max_per_window: this.maxPerWindow,
                updated_at: new Date(nowMs),
            });
            return {status: 'allowed'};
        }
        const windowStartMs = this.readWindowStart(quota.window_start, nowMs);
        const windowEndMs = windowStartMs + this.windowSeconds * 1000;
        if(nowMs >= windowEndMs){
            // Window expired: reset the row and spend this message fresh.
            await this.repo.updateById(quota.id, {
                window_start: new Date(nowMs),
                count: 1,
                max_per_window: this.maxPerWindow,
                updated_at: new Date(nowMs),
            });
            return {status: 'allowed'};
        }
        const currentCount = Number(sc.get(quota, 'count', 0)) || 0;
        if(currentCount >= this.maxPerWindow){
            const retryAfterSeconds = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
            return {status: 'denied', retryAfterSeconds};
        }
        await this.repo.updateById(quota.id, {
            count: currentCount + 1,
            updated_at: new Date(nowMs),
        });
        return {status: 'allowed'};
    }

    /**
     * @param {*} windowStartValue
     * @param {number} fallbackMs
     * @returns {number} Window start in milliseconds.
     */
    readWindowStart(windowStartValue, fallbackMs)
    {
        if(windowStartValue === null || windowStartValue === undefined){
            return fallbackMs;
        }
        const ms = new Date(windowStartValue).getTime();
        return Number.isFinite(ms) ? ms : fallbackMs;
    }

    /**
     * @param {number} accountId
     * @returns {Object|null} Cached admission for a live refusal.
     */
    cachedRefusal(accountId)
    {
        const cached = this.localRefusals.get(accountId);
        if(!cached){
            return null;
        }
        const remainingMs = cached.untilMs - this.now();
        if(remainingMs <= 0){
            this.localRefusals.delete(accountId);
            return null;
        }
        if('denied' === cached.kind){
            return {
                status: 'denied',
                retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
                notify: this.shouldNotify(accountId),
            };
        }
        return {status: 'busy', notify: this.shouldNotify(accountId)};
    }

    /**
     * @param {number} accountId
     * @param {string} status
     * @returns {Object}
     */
    unavailable(accountId, status)
    {
        this.rememberRefusal(accountId, {
            kind: 'unavailable',
            untilMs: this.now() + BUSY_CACHE_MS,
        });
        return {status, notify: this.shouldNotify(accountId)};
    }

    /**
     * @param {number} accountId
     * @returns {boolean} Whether a refusal notice should reach the sender now.
     */
    shouldNotify(accountId)
    {
        const now = this.now();
        const last = this.lastNoticeAt.get(accountId);
        if(last !== undefined && now - last < NOTICE_THROTTLE_MS){
            return false;
        }
        this.lastNoticeAt.delete(accountId);
        this.lastNoticeAt.set(accountId, now);
        this.trim(this.lastNoticeAt);
        return true;
    }

    /**
     * @param {number} accountId
     * @param {Object} refusal
     * @returns {void}
     */
    rememberRefusal(accountId, refusal)
    {
        this.localRefusals.delete(accountId);
        this.localRefusals.set(accountId, refusal);
        this.trim(this.localRefusals);
    }

    /**
     * @param {Map} map
     * @returns {void}
     */
    trim(map)
    {
        while(map.size > CACHE_MAX_ACCOUNTS){
            const oldest = map.keys().next().value;
            if(oldest === undefined){
                return;
            }
            map.delete(oldest);
        }
    }
}

module.exports = {
    ChatGeneralQuotaCoordinator,
    classifyOnlineGeneralChat,
    generalChatQuotaRefusalEvent,
    GENERAL_CHAT_QUOTA_MAX_PENDING_PER_ACCOUNT: MAX_PENDING_PER_ACCOUNT,
    GENERAL_CHAT_QUOTA_MAX_IN_FLIGHT: MAX_IN_FLIGHT,
    GENERAL_CHAT_QUOTA_CACHE_MAX_ACCOUNTS: CACHE_MAX_ACCOUNTS,
};
