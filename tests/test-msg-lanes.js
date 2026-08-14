/**
 *
 * Reldens - test-msg-lanes
 *
 * Standalone tests for lib/rooms/server/msg-lanes.js (no DB, no framework).
 * Run: node tests/test-msg-lanes.js
 *
 */

const assert = require('assert');
const {
    MSG_LANE_MOVEMENT_REFILL_PER_SECOND,
    MSG_LANE_MOVEMENT_BURST,
    MSG_LANE_COMMAND_REFILL_PER_SECOND,
    MSG_LANE_COMMAND_BURST,
    MSG_LANE_CHAT_REFILL_PER_SECOND,
    MSG_LANE_CHAT_BURST,
    classifyMsgLane,
    consumeLaneToken,
    createMsgLanes,
} = require('../lib/rooms/server/msg-lanes');

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

// lane constants pin the R5 budget literals
eq(MSG_LANE_MOVEMENT_REFILL_PER_SECOND, 90, 'movement refill');
eq(MSG_LANE_MOVEMENT_BURST, 120, 'movement burst');
eq(MSG_LANE_COMMAND_REFILL_PER_SECOND, 30, 'command refill');
eq(MSG_LANE_COMMAND_BURST, 60, 'command burst');
eq(MSG_LANE_CHAT_REFILL_PER_SECOND, 4, 'chat refill');
eq(MSG_LANE_CHAT_BURST, 8, 'chat burst');

// classifyMsgLane mirrors the dispatch switch
eq(classifyMsgLane({t: 'input'}), 'movement', 'input is movement');
eq(classifyMsgLane({t: 'input', seq: 5, mi: {f: 1}}), 'movement', 'input with payload is movement');
eq(classifyMsgLane({t: 'input', cmd: 'chat'}), 'movement', 't wins over a stray cmd field');
eq(classifyMsgLane({t: 'cmd', cmd: 'chat', text: 'hello'}), 'chat', 'chat cmd is chat lane');
eq(classifyMsgLane({t: 'logout'}), 'exempt', 'logout is exempt');
eq(classifyMsgLane({t: 'cmd', cmd: 'telemetry'}), 'exempt', 'telemetry is exempt');
eq(classifyMsgLane({t: 'cmd', cmd: 'challengeResponse'}), 'exempt', 'challengeResponse is exempt');
eq(classifyMsgLane({t: 'telemetry'}), 'command', 'telemetry as type is command garbage');
eq(classifyMsgLane({t: 'challengeResponse'}), 'command', 'challengeResponse as type is command garbage');
eq(classifyMsgLane({t: 'cmd', cmd: 'castSlot'}), 'command', 'other commands are command lane');
eq(classifyMsgLane({t: 'cmd', cmd: 'definitely_not_a_command'}), 'command', 'unknown cmd is command lane');
eq(classifyMsgLane({t: 'cmd'}), 'command', 'cmd without cmd field is command lane');
eq(classifyMsgLane({t: 'bogus'}), 'command', 'unknown type is command lane');
eq(classifyMsgLane({}), 'command', 'empty object is command lane');
eq(classifyMsgLane(null), 'command', 'null JSON is command lane');
eq(classifyMsgLane(42), 'command', 'number JSON is command lane');
eq(classifyMsgLane('a string'), 'command', 'string JSON is command lane');
eq(classifyMsgLane([1, 2, 3]), 'command', 'array JSON is command lane');
eq(classifyMsgLane(true), 'command', 'boolean JSON is command lane');

// per-lane budget arithmetic
{
    for(const [lane, burst] of [
        ['movement', MSG_LANE_MOVEMENT_BURST],
        ['command', MSG_LANE_COMMAND_BURST],
        ['chat', MSG_LANE_CHAT_BURST],
    ]){
        const state = createMsgLanes(1000);
        for(let i = 0; i < burst; i++){
            eq(consumeLaneToken(state, lane, 1000), 'allow', 'burst allow '+lane);
        }
        eq(consumeLaneToken(state, lane, 1000), 'drop', 'burst next frame drops '+lane);
    }
}

// refills exactly the per-second rate after a full drain
{
    for(const [lane, burst, refill] of [
        ['movement', MSG_LANE_MOVEMENT_BURST, MSG_LANE_MOVEMENT_REFILL_PER_SECOND],
        ['command', MSG_LANE_COMMAND_BURST, MSG_LANE_COMMAND_REFILL_PER_SECOND],
        ['chat', MSG_LANE_CHAT_BURST, MSG_LANE_CHAT_REFILL_PER_SECOND],
    ]){
        const state = createMsgLanes(1000);
        for(let i = 0; i < burst; i++){
            consumeLaneToken(state, lane, 1000);
        }
        eq(consumeLaneToken(state, lane, 1000), 'drop', 'drained drops '+lane);
        for(let i = 0; i < refill; i++){
            eq(consumeLaneToken(state, lane, 1001), 'allow', 'refill allow '+lane);
        }
        eq(consumeLaneToken(state, lane, 1001), 'drop', 'refill exhausted '+lane);
    }
}

// drops on half a refilled token, allows on a whole one
{
    const state = createMsgLanes(1000);
    for(let i = 0; i < MSG_LANE_CHAT_BURST; i++){
        consumeLaneToken(state, 'chat', 1000);
    }
    eq(consumeLaneToken(state, 'chat', 1000.125), 'drop', 'half token drops');
    eq(consumeLaneToken(state, 'chat', 1000.25), 'allow', 'whole token allows');
    eq(consumeLaneToken(state, 'chat', 1000.25), 'drop', 'second whole token drops');
}

// caps a long idle refill at the burst
{
    const state = createMsgLanes(1000);
    for(let i = 0; i < MSG_LANE_COMMAND_BURST; i++){
        consumeLaneToken(state, 'command', 1000);
    }
    for(let i = 0; i < MSG_LANE_COMMAND_BURST; i++){
        eq(consumeLaneToken(state, 'command', 2000), 'allow', 'idle refill capped allow');
    }
    eq(consumeLaneToken(state, 'command', 2000), 'drop', 'idle refill capped drop');
}

// spends nothing on a drop
{
    const state = createMsgLanes(1000);
    for(let i = 0; i < MSG_LANE_CHAT_BURST; i++){
        consumeLaneToken(state, 'chat', 1000);
    }
    for(let i = 0; i < 50; i++){
        eq(consumeLaneToken(state, 'chat', 1000), 'drop', 'drop pileup stays drop');
    }
    for(let i = 0; i < MSG_LANE_CHAT_REFILL_PER_SECOND; i++){
        eq(consumeLaneToken(state, 'chat', 1001), 'allow', 'full next-second refill available');
    }
    eq(consumeLaneToken(state, 'chat', 1001), 'drop', 'refill exhausted again');
}

// clamps a backwards clock step to a zero refill
{
    const state = createMsgLanes(1000);
    for(let i = 0; i < MSG_LANE_CHAT_BURST; i++){
        consumeLaneToken(state, 'chat', 1000);
    }
    eq(consumeLaneToken(state, 'chat', 990), 'drop', 'backwards clock mints nothing');
}

// reserved-lane properties hold in both directions
{
    const state = createMsgLanes(1000);
    for(let i = 0; i < MSG_LANE_MOVEMENT_BURST; i++){
        eq(consumeLaneToken(state, 'movement', 1000), 'allow', 'movement burst');
    }
    for(let i = 0; i < 200; i++){
        eq(consumeLaneToken(state, 'movement', 1000), 'drop', 'movement flood drop');
    }
    eq(state.commandTokens, MSG_LANE_COMMAND_BURST, 'movement flood leaves command tokens');
    eq(state.chatTokens, MSG_LANE_CHAT_BURST, 'movement flood leaves chat tokens');
    eq(consumeLaneToken(state, 'command', 1000), 'allow', 'command lane untouched');
    eq(consumeLaneToken(state, 'chat', 1000), 'allow', 'chat lane untouched');
}

{
    const state = createMsgLanes(1000);
    for(let i = 0; i < 300; i++){
        consumeLaneToken(state, 'command', 1000);
    }
    eq(state.movementTokens, MSG_LANE_MOVEMENT_BURST, 'command flood leaves movement tokens');
    eq(consumeLaneToken(state, 'movement', 1000), 'allow', 'movement lane untouched by command flood');
}

{
    const state = createMsgLanes(1000);
    for(let i = 0; i < 100; i++){
        consumeLaneToken(state, 'chat', 1000);
    }
    eq(state.movementTokens, MSG_LANE_MOVEMENT_BURST, 'chat flood leaves movement tokens');
    eq(state.commandTokens, MSG_LANE_COMMAND_BURST, 'chat flood leaves command tokens');
    eq(consumeLaneToken(state, 'movement', 1000), 'allow', 'movement lane untouched by chat flood');
    eq(consumeLaneToken(state, 'command', 1000), 'allow', 'command lane untouched by chat flood');
}

console.log('test-msg-lanes OK ('+passed+' assertions).');
