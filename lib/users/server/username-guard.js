/**
 *
 * Reldens - UsernameGuard
 *
 * Optional username validation guard for register hardening. Reldens username rules may
 * differ (the platform allows spaces and other shapes), so this module is NOT wired into
 * the default register flow: import it explicitly when a game wants the stricter
 * [A-Za-z0-9_] shape and a banlist check.
 *
 * Ported from a leet-normalized banlist matcher. The obscenity/profanity matcher part was
 * intentionally dropped: it would drag in an npm dependency this package does not carry.
 * Use the banlist (env USERNAME_BANLIST / USERNAME_BANLIST_FILE) for explicit terms.
 *
 */

const { FileHandler } = require('@reldens/server-utils');
const { Logger } = require('@reldens/utils');

const CONFUSABLE_CHARS = {
    '0': 'o',
    '1': 'i',
    '!': 'i',
    '|': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
    '+': 't',
    '8': 'b'
};

const BUILT_IN_BANNED_NAME_TERMS = parseBanlist(['hitler'].join('\n'));

/**
 * @param {string} username
 * @returns {string}
 */
function normalizedUsernameForCensorship(username)
{
    return username
        .toLowerCase()
        .replace(/[0134578!|@$+]/g, (ch) => CONFUSABLE_CHARS[ch] ?? ch)
        .replace(/[^a-z]/g, '');
}

/**
 * @param {string|undefined} raw
 * @returns {string[]}
 */
function parseBanlist(raw)
{
    return (raw ?? '')
        .split(/[\s,]+/)
        .map((term) => normalizedUsernameForCensorship(term))
        .filter((term) => term.length > 0);
}

let banlistCacheKey = null;
let banlistCacheTerms = [];

/**
 * Built-in terms plus the env-configured banlist (raw string and/or file), cached per
 * env snapshot so it re-reads when the env changes (hot-plug friendly).
 * @returns {string[]}
 */
function bannedUsernameTerms()
{
    const rawList = process.env.USERNAME_BANLIST ?? '';
    const file = process.env.USERNAME_BANLIST_FILE ?? '';
    const cacheKey = `${rawList}\0${file}`;
    if(cacheKey === banlistCacheKey){
        return banlistCacheTerms;
    }

    const terms = BUILT_IN_BANNED_NAME_TERMS.concat(parseBanlist(rawList));
    if(!file){
        banlistCacheTerms = terms;
        banlistCacheKey = cacheKey;
        return banlistCacheTerms;
    }
    try {
        banlistCacheTerms = terms.concat(parseBanlist(FileHandler.readFile(file)));
    } catch (err) {
        Logger.warning(`UsernameGuard: could not read USERNAME_BANLIST_FILE (${file}):`, err);
        return terms;
    }
    banlistCacheKey = cacheKey;
    return banlistCacheTerms;
}

/**
 * @param {unknown} u
 * @returns {boolean}
 */
function offensiveName(u)
{
    if(typeof u !== 'string'){
        return false;
    }
    const normalized = normalizedUsernameForCensorship(u);
    return bannedUsernameTerms().some((term) => normalized.includes(term));
}

/**
 * @param {unknown} u
 * @returns {boolean}
 */
function validUsernameShape(u)
{
    return typeof u === 'string' && /^[A-Za-z0-9_]{3,24}$/.test(u);
}

/**
 * Shape check plus banlist check.
 * @param {unknown} u
 * @returns {boolean}
 */
function validUsername(u)
{
    return validUsernameShape(u) && !offensiveName(u);
}

module.exports.UsernameGuard = {
    normalizedUsernameForCensorship,
    bannedUsernameTerms,
    offensiveName,
    validUsernameShape,
    validUsername
};
