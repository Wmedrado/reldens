/**
 *
 * Reldens - test-economy-telemetry
 *
 * Standalone tests for the economy flow classifier: every mapped command
 * classifies to its source, unknown commands fall back to 'other', and
 * client-supplied keys that collide with Object.prototype members ('toString',
 * 'constructor') must NOT resolve to inherited functions - they classify as
 * 'other' without throwing. The command allowlist is frozen.
 *
 */

const assert = require('assert');
const {
    ECO_FLOW_SOURCES,
    ECO_FLOW_COMMANDS,
    economyFlowSourceForCommand
} = require('../lib/blockchain/server/economy-telemetry');

const EXPECTED_MAPPING = {
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
};

try {
    // 1. Every mapped command classifies to its source.
    let classified = 0;
    for(let command of Object.keys(EXPECTED_MAPPING)){
        assert.strictEqual(economyFlowSourceForCommand(command), EXPECTED_MAPPING[command], command);
        classified++;
    }
    assert.strictEqual(ECO_FLOW_COMMANDS.length, Object.keys(EXPECTED_MAPPING).length);

    // 2. Unknown commands fall back to 'other'.
    assert.strictEqual(economyFlowSourceForCommand('attack'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('move'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('anything_unknown_xyz'), 'other');

    // 3. Object.prototype member keys do NOT throw and classify 'other'. A
    // plain-object lookup would resolve 'toString' to a function and hand it
    // to a metrics exporter as a label value; the Map must never do that.
    assert.strictEqual(economyFlowSourceForCommand('toString'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('constructor'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('hasOwnProperty'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('valueOf'), 'other');
    assert.strictEqual(economyFlowSourceForCommand('__proto__'), 'other');
    assert.strictEqual(economyFlowSourceForCommand(''), 'other');
    assert.strictEqual(economyFlowSourceForCommand(null), 'other');
    assert.strictEqual(economyFlowSourceForCommand(undefined), 'other');

    // 4. Every classified source is a member of the bounded label set.
    for(let command of ECO_FLOW_COMMANDS){
        assert.ok(ECO_FLOW_SOURCES.includes(economyFlowSourceForCommand(command)), command);
    }

    // 5. The label set is frozen and bounded.
    assert.ok(Object.isFrozen(ECO_FLOW_SOURCES));
    assert.ok(Object.isFrozen(ECO_FLOW_COMMANDS));
    assert.strictEqual(ECO_FLOW_SOURCES.length, 11);
    assert.ok(ECO_FLOW_SOURCES.includes('quest'));
    assert.ok(ECO_FLOW_SOURCES.includes('vendor'));
    assert.ok(ECO_FLOW_SOURCES.includes('loot'));
    assert.ok(ECO_FLOW_SOURCES.includes('market'));
    assert.ok(ECO_FLOW_SOURCES.includes('mail'));
    assert.ok(ECO_FLOW_SOURCES.includes('bank'));
    assert.ok(ECO_FLOW_SOURCES.includes('craft'));
    assert.ok(ECO_FLOW_SOURCES.includes('trade'));
    assert.ok(ECO_FLOW_SOURCES.includes('faucet'));
    assert.ok(ECO_FLOW_SOURCES.includes('reward'));
    assert.ok(ECO_FLOW_SOURCES.includes('other'));

    console.log('test-economy-telemetry: all tests passed');
} catch (err) {
    throw err;
}
