/**
 *
 * Reldens - Economy Telemetry
 *
 * Bounded-label classifier for economy flow: which economic surface a client
 * command's currency move is attributed to. Pure classification only - it
 * books nothing and never touches a registry. Wire these into a metrics
 * exporter (e.g. prom-client) later; no prom-client import lives here so the
 * module unit-tests with no registry and no running world.
 *
 * CARDINALITY IS BOUNDED BY CONSTRUCTION. A client command outside the
 * allowlist classifies as 'other' rather than becoming its own series, so the
 * label set can never grow with the message vocabulary, and nothing per-player
 * (account id, character id, name, ip) is ever a label.
 *
 */

/**
 * The fixed sources economy flow is attributed to. One label per economic
 * surface, NOT one per client command: the map below is many-to-one on purpose.
 */
const ECO_FLOW_SOURCES = Object.freeze([
    'quest',
    'vendor',
    'loot',
    'market',
    'mail',
    'bank',
    'craft',
    'trade',
    'faucet',
    'reward',
    'other'
]);

/**
 * Client command to economic surface. Every command that can move the acting
 * player's currency belongs here; anything else falls through to 'other',
 * which is also where a genuinely uncategorized move shows up rather than
 * vanishing.
 *
 * A Map, NOT an object literal: the key is a CLIENT-SUPPLIED string, and a
 * plain-object lookup resolves 'toString' or 'constructor' to an inherited
 * function, which would then be handed to a metrics exporter as a label value.
 */
const SOURCE_BY_COMMAND = new Map(Object.entries({
    turnin: 'quest',
    quest_turnin: 'quest',
    quest_claim: 'quest',
    buy: 'vendor',
    sell: 'vendor',
    sell_all_junk: 'vendor',
    buyback: 'vendor',
    loot: 'loot',
    autoloot: 'loot',
    pickup: 'loot',
    harvest: 'loot',
    harvest_node: 'loot',
    market_buy: 'market',
    market_list: 'market',
    market_collect: 'market',
    market_cancel: 'market',
    mail_send: 'mail',
    mail_take: 'mail',
    mail_claim: 'mail',
    bank_buy_slots: 'bank',
    bank_deposit: 'bank',
    bank_withdraw: 'bank',
    craft_item: 'craft',
    train_recipe: 'craft',
    respec: 'craft',
    salvage_item: 'craft',
    disenchant_item: 'craft',
    trade_accept: 'trade',
    trade_confirm: 'trade',
    faucet: 'faucet',
    claim_faucet: 'faucet',
    reward_claim: 'reward',
    claim_reward: 'reward',
    daily_reward: 'reward'
}));

/**
 * Every command the map classifies, exposed so a test can pin the WHOLE
 * mapping and check the keys are commands the dispatcher actually routes. A
 * key that stops matching a real command downgrades its surface to 'other'
 * silently. Frozen so the label set cannot grow at runtime.
 */
const ECO_FLOW_COMMANDS = Object.freeze([...SOURCE_BY_COMMAND.keys()]);

/**
 * The economic surface a client command's currency move is attributed to.
 *
 * @param {string} command
 * @returns {string} one of ECO_FLOW_SOURCES
 */
function economyFlowSourceForCommand(command)
{
    return SOURCE_BY_COMMAND.get(command) ?? 'other';
}

module.exports.ECO_FLOW_SOURCES = ECO_FLOW_SOURCES;
module.exports.ECO_FLOW_COMMANDS = ECO_FLOW_COMMANDS;
module.exports.economyFlowSourceForCommand = economyFlowSourceForCommand;
