/**
 *
 * Reldens - Token Balance
 *
 * Server-side token balance reads: the ONLY place the Solana RPC endpoint is
 * used. Balances are read with a raw fetch, so the RPC URL, and any API key
 * embedded in it, never ship in the client bundle. Cached per wallet, since
 * balances move slowly and public RPCs are rate-limited.
 *
 * Reads RELDENS_SOLANA_RPC_URL + RELDENS_TOKEN_MINT from the SERVER
 * environment. Server-only secrets are never VITE_ prefixed.
 *
 */

const { Logger, sc } = require('@reldens/utils');
const { BlockchainConst } = require('../constants');
const { isSolanaAddress } = require('./wallet-verify');
const { holderTierIndexForBalance } = require('./holder-tier');

// Lazily read from the environment: the dotenv config is applied by the server
// manager at boot, which happens AFTER this module is required by the features
// config, so env values must be resolved on first use, not at module load.
let envConfig = null;

function readEnvConfig()
{
    if(!envConfig){
        envConfig = {
            tokenMint: sc.get(process.env, 'RELDENS_TOKEN_MINT', '').trim(),
            rpcUrl: (process.env.RELDENS_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com').trim()
        };
    }
    return envConfig;
}

function tokenMint()
{
    return readEnvConfig().tokenMint;
}

function solanaRpcUrl()
{
    return readEnvConfig().rpcUrl;
}

let missingMintLogged = false;

const cache = new Map();

function rememberCacheEntry(pubkey, entry)
{
    cache.delete(pubkey);
    cache.set(pubkey, entry);
    evictOldestCacheEntries();
}

function evictOldestCacheEntries()
{
    while(cache.size > BlockchainConst.TOKEN_BALANCE_CACHE_MAX_ENTRIES){
        let oldest = cache.keys().next();
        if(oldest.done){
            return;
        }
        cache.delete(oldest.value);
    }
}

/**
 * Reset the per-wallet balance cache. Test-only.
 */
function resetTokenBalanceCacheForTests()
{
    cache.clear();
}

function asRecord(value)
{
    return value && 'object' === typeof value ? value : null;
}

function parseDecimalAmount(value)
{
    let trimmed = value.trim();
    if(!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)){
        return null;
    }
    let parsed = Number(trimmed);
    return Number.isFinite(parsed) && 0 <= parsed ? parsed : null;
}

/**
 * Convert a raw token amount + decimals into the human-readable decimal
 * string, keeping the math on strings so large balances never lose precision
 * to float rounding.
 *
 * @param {string} rawAmount
 * @param {number} decimals
 * @returns {string|null}
 */
function decimalStringFromRawAmount(rawAmount, decimals)
{
    let raw = rawAmount.trim();
    if(!/^\d+$/.test(raw) || !Number.isInteger(decimals) || 0 > decimals || 255 < decimals){
        return null;
    }
    let digits = raw.replace(/^0+/, '') || '0';
    if(0 === decimals){
        return digits;
    }
    let integerDigits = digits.length > decimals ? digits.slice(0, -decimals) : '0';
    let fractionalDigits = digits.length > decimals
        ? digits.slice(-decimals)
        : digits.padStart(decimals, '0');
    let trimmedFraction = fractionalDigits.replace(/0+$/, '');
    return trimmedFraction ? integerDigits+'.'+trimmedFraction : integerDigits;
}

function parseRawAmount(rawAmount, decimals)
{
    if('string' !== typeof rawAmount || 'number' !== typeof decimals){
        return null;
    }
    let decimal = decimalStringFromRawAmount(rawAmount, decimals);
    return null === decimal ? null : parseDecimalAmount(decimal);
}

/**
 * Parse an RPC tokenAmount into a human-readable balance, or null. Uses
 * uiAmount when finite, uiAmountString as fallback, then the raw amount with
 * decimals.
 *
 * @param {*} tokenAmount
 * @returns {number|null}
 */
function parseTokenBalance(tokenAmount)
{
    let record = asRecord(tokenAmount);
    if(!record){
        return null;
    }
    if('number' === typeof record.uiAmount && Number.isFinite(record.uiAmount) && 0 <= record.uiAmount){
        return record.uiAmount;
    }
    if('string' === typeof record.uiAmountString){
        let parsed = parseDecimalAmount(record.uiAmountString);
        if(null !== parsed){
            return parsed;
        }
    }
    return parseRawAmount(record.amount, record.decimals);
}

/**
 * The owner's total token balance across all their token accounts for the
 * mint, in human-readable units. Returns null on any RPC/parse failure so
 * callers can keep the last known value.
 *
 * @param {string} pubkey
 * @returns {Promise<number|null>}
 */
async function fetchTokenBalance(pubkey)
{
    if(!tokenMint()){
        if(!missingMintLogged){
            missingMintLogged = true;
            Logger.error('RELDENS_TOKEN_MINT environment variable is not set, token balance reads disabled.');
        }
        return null;
    }
    try {
        let res = await fetch(solanaRpcUrl(), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [pubkey, {mint: tokenMint()}, {encoding: 'jsonParsed'}]
            }),
            signal: AbortSignal.timeout(8000)
        });
        if(!res.ok){
            return null;
        }
        let data = await res.json();
        let accounts = data?.result?.value;
        if(!Array.isArray(accounts)){
            return null;
        }
        let total = 0;
        for(let account of accounts){
            let info = asRecord(account?.account?.data?.parsed?.info);
            let balance = parseTokenBalance(info?.tokenAmount);
            if(null !== balance){
                total += balance;
            }
        }
        return total;
    } catch (error) {
        Logger.error('Token balance read failed.', {pubkey, error: error.message});
        return null;
    }
}

/**
 * Cached token balance for a wallet. Re-fetches at most once per TTL; on a
 * failed refresh keeps the last known balance, or null when the wallet has
 * never been read successfully.
 *
 * @param {string} pubkey
 * @param {boolean} [fresh]
 * @returns {Promise<number|null>}
 */
async function cachedTokenBalance(pubkey, fresh = false)
{
    let now = Date.now();
    let hit = cache.get(pubkey);
    if(!fresh && hit && now - hit.at < BlockchainConst.CACHE_TTL_MS){
        rememberCacheEntry(pubkey, hit);
        return hit.balance;
    }
    let balance = await fetchTokenBalance(pubkey);
    if(null === balance){
        if(!hit){
            return null;
        }
        rememberCacheEntry(pubkey, hit);
        return hit.balance;
    }
    rememberCacheEntry(pubkey, {balance: balance, at: now});
    return balance;
}

/**
 * Cached holder tier + exact balance for a wallet. The tier is derived from
 * the (cached) balance; {0, 0} when the wallet has never been read
 * successfully.
 *
 * @param {string} pubkey
 * @returns {Promise<Object>}
 */
async function holderInfoForPubkey(pubkey)
{
    let balance = await cachedTokenBalance(pubkey);
    if(null === balance){
        return {tier: 0, balance: 0};
    }
    return {tier: holderTierIndexForBalance(balance), balance: balance};
}

module.exports.CACHE_TTL_MS = BlockchainConst.CACHE_TTL_MS;
module.exports.TOKEN_BALANCE_CACHE_MAX_ENTRIES = BlockchainConst.TOKEN_BALANCE_CACHE_MAX_ENTRIES;
module.exports.tokenMint = tokenMint;
module.exports.solanaRpcUrl = solanaRpcUrl;
Object.defineProperty(module.exports, 'TOKEN_MINT', {get: tokenMint});
Object.defineProperty(module.exports, 'SOLANA_RPC_URL', {get: solanaRpcUrl});
module.exports.resetTokenBalanceCacheForTests = resetTokenBalanceCacheForTests;
module.exports.decimalStringFromRawAmount = decimalStringFromRawAmount;
module.exports.parseTokenBalance = parseTokenBalance;
module.exports.parseDecimalAmount = parseDecimalAmount;
module.exports.parseRawAmount = parseRawAmount;
module.exports.fetchTokenBalance = fetchTokenBalance;
module.exports.cachedTokenBalance = cachedTokenBalance;
module.exports.holderInfoForPubkey = holderInfoForPubkey;
module.exports.isSolanaAddress = isSolanaAddress;
