/**
 *
 * Reldens - Holder Tier
 *
 * Shared holder-tier thresholds. The ladder is cosmetic (a balance qualifies
 * for the highest rung it reaches) and lives here so server code and
 * presentation code can agree on the tier index without importing across
 * server/client boundaries.
 *
 * The 18 rung KEYS are brandable via RELDENS_HOLDER_TIER_KEYS (comma-separated,
 * exactly 18 entries, positionally mapped onto the fixed threshold ladder).
 * The thresholds themselves are fixed. The resolved keys are exposed as
 * HOLDER_TIER_KEYS so client-side branding can reuse them.
 *
 */

const { sc } = require('@reldens/utils');

const DEFAULT_TIER_KEYS = Object.freeze([
    'ember',
    'coinbearer',
    'coppercrest',
    'silverbound',
    'gilded',
    'vaultwarden',
    'whale',
    'leviathan',
    'tidelord',
    'stormcaller',
    'krakencrown',
    'titanforged',
    'starhoard',
    'voidwarden',
    'realmshaper',
    'worldforger',
    'worldbearer',
    'sovereign'
]);

// Lazily read from the environment: the dotenv config is applied by the server
// manager at boot, which happens AFTER this module is required by the features
// config, so env values must be resolved on first use, not at module load.
let ladder = null;

/**
 * Resolve the 18 tier keys from RELDENS_HOLDER_TIER_KEYS, or fall back to the
 * default ladder when the env var is unset or does not hold exactly 18 entries.
 *
 * @returns {Array<string>}
 */
function resolveTierKeys()
{
    let raw = sc.get(process.env, 'RELDENS_HOLDER_TIER_KEYS', '');
    if('string' !== typeof raw){
        return [...DEFAULT_TIER_KEYS];
    }
    let keys = raw.split(',').map((key) => key.trim()).filter((key) => '' !== key);
    if(keys.length !== DEFAULT_TIER_KEYS.length){
        return [...DEFAULT_TIER_KEYS];
    }
    return keys;
}

function buildLadder()
{
    let tokenMaxSupply = Number(sc.get(process.env, 'RELDENS_TOKEN_MAX_SUPPLY', 1000000000));
    let keys = resolveTierKeys();
    // Rungs 1-8 climb 10x (1 token up to 1% of supply); rungs 9-16 then step
    // linearly by whole percents of supply (2%-9%); the top two are the 10%
    // and 100%-of-supply marks. Thresholds are fixed; only the keys are
    // brandable via RELDENS_HOLDER_TIER_KEYS.
    let rungThresholds = [
        1,
        10,
        100,
        1000,
        10000,
        100000,
        1000000,
        10000000, // 1% of supply
        20000000, // 2%
        30000000, // 3%
        40000000, // 4%
        50000000, // 5%
        60000000, // 6%
        70000000, // 7%
        80000000, // 8%
        90000000, // 9%
        100000000, // 10%
        tokenMaxSupply // 100%
    ];
    return {
        tokenMaxSupply: tokenMaxSupply,
        tierDefs: rungThresholds.map((threshold, index) => {
            return {index: index + 1, key: keys[index], threshold: threshold};
        })
    };
}

function tierDefs()
{
    if(!ladder){
        ladder = buildLadder();
    }
    return ladder.tierDefs;
}

function tokenMaxSupply()
{
    if(!ladder){
        ladder = buildLadder();
    }
    return ladder.tokenMaxSupply;
}

/**
 * The highest rung a balance qualifies for, or null when there is no connected
 * wallet (balance === null) or the balance is below the first rung (< 1 token).
 *
 * @param {number|null} balance
 * @returns {Object|null}
 */
function holderTierForBalance(balance)
{
    let defs = tierDefs();
    if(null === balance || !Number.isFinite(balance) || balance < defs[0].threshold){
        return null;
    }
    let tier = null;
    for(let i of Object.keys(defs)){
        let currentTier = defs[i];
        if(balance >= currentTier.threshold){
            tier = currentTier;
        } else {
            break;
        }
    }
    return tier;
}

/**
 * The 1-based rung index for a balance, or 0 when the balance qualifies for no rung.
 *
 * @param {number|null} balance
 * @returns {number}
 */
function holderTierIndexForBalance(balance)
{
    let tier = holderTierForBalance(balance);
    return tier ? tier.index : 0;
}

/**
 * The rung at a 1-based index (1-18), or undefined for 0/out-of-range.
 *
 * @param {number} index
 * @returns {Object|undefined}
 */
function holderTierByIndex(index)
{
    let defs = tierDefs();
    return Number.isInteger(index) && 1 <= index && index <= defs.length
        ? defs[index - 1]
        : undefined;
}

/**
 * This rung's share of max supply, as a fraction in [0, 1].
 *
 * @param {Object} tier
 * @param {number} tier.threshold
 * @returns {number}
 */
function tierSupplyShare(tier)
{
    return tier.threshold / tokenMaxSupply();
}

/**
 * The resolved 18 tier keys (from RELDENS_HOLDER_TIER_KEYS, or the defaults).
 * Exposed for client-side branding reuse.
 *
 * @returns {Array<string>}
 */
function holderTierKeys()
{
    return resolveTierKeys();
}

Object.defineProperty(module.exports, 'TOKEN_MAX_SUPPLY', {get: tokenMaxSupply});
Object.defineProperty(module.exports, 'HOLDER_TIER_DEFS', {get: tierDefs});
Object.defineProperty(module.exports, 'HOLDER_TIER_KEYS', {get: holderTierKeys});
module.exports.holderTierForBalance = holderTierForBalance;
module.exports.holderTierIndexForBalance = holderTierIndexForBalance;
module.exports.holderTierByIndex = holderTierByIndex;
module.exports.tierSupplyShare = tierSupplyShare;
