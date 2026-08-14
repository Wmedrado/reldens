/**
 *
 * Reldens - Holder Tier
 *
 * Shared holder-tier thresholds. The ladder is cosmetic (a balance qualifies
 * for the highest rung it reaches) and lives here so server code and
 * presentation code can agree on the tier index without importing across
 * server/client boundaries.
 *
 */

const { sc } = require('@reldens/utils');

// Lazily read from the environment: the dotenv config is applied by the server
// manager at boot, which happens AFTER this module is required by the features
// config, so env values must be resolved on first use, not at module load.
let ladder = null;

function buildLadder()
{
    let tokenMaxSupply = Number(sc.get(process.env, 'RELDENS_TOKEN_MAX_SUPPLY', 1000000000));
    // Rungs 1-8 climb 10x (1 token up to 1% of supply); rungs 9-16 then step
    // linearly by whole percents of supply (2%-9%); the top two are the 10%
    // and 100%-of-supply marks.
    return {
        tokenMaxSupply: tokenMaxSupply,
        tierDefs: [
            {index: 1, key: 'ember', threshold: 1},
            {index: 2, key: 'coinbearer', threshold: 10},
            {index: 3, key: 'coppercrest', threshold: 100},
            {index: 4, key: 'silverbound', threshold: 1000},
            {index: 5, key: 'gilded', threshold: 10000},
            {index: 6, key: 'vaultwarden', threshold: 100000},
            {index: 7, key: 'whale', threshold: 1000000},
            {index: 8, key: 'leviathan', threshold: 10000000}, // 1% of supply
            {index: 9, key: 'tidelord', threshold: 20000000}, // 2%
            {index: 10, key: 'stormcaller', threshold: 30000000}, // 3%
            {index: 11, key: 'krakencrown', threshold: 40000000}, // 4%
            {index: 12, key: 'titanforged', threshold: 50000000}, // 5%
            {index: 13, key: 'starhoard', threshold: 60000000}, // 6%
            {index: 14, key: 'voidwarden', threshold: 70000000}, // 7%
            {index: 15, key: 'realmshaper', threshold: 80000000}, // 8%
            {index: 16, key: 'worldforger', threshold: 90000000}, // 9%
            {index: 17, key: 'worldbearer', threshold: 100000000}, // 10%
            {index: 18, key: 'sovereign', threshold: tokenMaxSupply} // 100%
        ]
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

Object.defineProperty(module.exports, 'TOKEN_MAX_SUPPLY', {get: tokenMaxSupply});
Object.defineProperty(module.exports, 'HOLDER_TIER_DEFS', {get: tierDefs});
module.exports.holderTierForBalance = holderTierForBalance;
module.exports.holderTierIndexForBalance = holderTierIndexForBalance;
module.exports.holderTierByIndex = holderTierByIndex;
module.exports.tierSupplyShare = tierSupplyShare;
