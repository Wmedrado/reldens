/**
 *
 * Reldens - test-msg-rate-limit
 *
 * Standalone tests for lib/rooms/server/msg-rate-limit.js (no DB, no framework).
 * Run: node tests/test-msg-rate-limit.js
 *
 */

const assert = require('assert');
const {
    MSG_ABUSE_SECOND_DROP_FLOOR,
    MSG_BYTE_BURST,
    MSG_RATE_BURST,
    MSG_RATE_KICK_REASON,
    MSG_RATE_REFILL_PER_SECOND,
    consumeInboundFrame,
    createMsgRateBucket,
} = require('../lib/rooms/server/msg-rate-limit');

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

function lt(actual, expected, label)
{
    assert.ok(actual < expected, label);
    passed++;
}

/**
 * Apply the refill at `now` with a first call, then spend every whole frame
 * token as allows so further calls at `now` drop. Callers always arrive with
 * at least one token available post-refill, so the drain itself never drops
 * and contributes nothing to the abuse tally.
 */
function drainFrameTokens(state, now)
{
    do {
        eq(consumeInboundFrame(state, now, 1).verdict, 'allow', 'drain is always allow');
    } while(state.tokens >= 1);
}

/**
 * Drive one receive-time second to exactly the abuse drop floor and assert the
 * verdict of the floor-crossing drop: kick when the window fills, drop before.
 */
function makeAbusiveSecond(state, sec, kickOnFloor)
{
    drainFrameTokens(state, sec);
    for(let i = 0; i < MSG_ABUSE_SECOND_DROP_FLOOR - 1; i++){
        eq(consumeInboundFrame(state, sec, 1).verdict, 'drop', 'pre-floor drop');
    }
    const atFloor = consumeInboundFrame(state, sec, 1);
    if(kickOnFloor){
        eq(atFloor, {verdict: 'kick', cause: 'rate'}, 'floor-crossing drop kicks');
    } else {
        eq(atFloor.verdict, 'drop', 'floor-crossing drop before window fills');
    }
}

// fresh bucket spends full burst then drops with cause rate
{
    const state = createMsgRateBucket(0);
    for(let i = 0; i < MSG_RATE_BURST; i++){
        eq(consumeInboundFrame(state, 0, 1).verdict, 'allow', 'burst spend');
    }
    const bytesBefore = state.byteTokens;
    eq(consumeInboundFrame(state, 0, 1), {verdict: 'drop', cause: 'rate'}, 'exhausted burst drops rate');
    eq(state.byteTokens, bytesBefore, 'rate drop spends nothing from byte bucket');
}

// 80 per second mixed stream stays drop-free indefinitely
{
    const state = createMsgRateBucket(0);
    let now = 0;
    drainFrameTokens(state, now);
    for(let i = 0; i < 80 * 120; i++){
        now += 1 / 80;
        const slot = i % 80;
        const bytes = slot === 0 ? 200 : slot === 40 ? 120 : 74 + (i % 33);
        eq(consumeInboundFrame(state, now, bytes).verdict, 'allow', '80/s mixed stream allow');
    }
}

// sustained 20 Hz stream, trivial lower bound
{
    const state = createMsgRateBucket(0);
    let now = 0;
    drainFrameTokens(state, now);
    for(let i = 0; i < 20 * 5; i++){
        now += 1 / 20;
        eq(consumeInboundFrame(state, now, 106).verdict, 'allow', '20/s stream allow');
    }
}

// refill math
{
    const state = createMsgRateBucket(0);
    drainFrameTokens(state, 0);
    eq(consumeInboundFrame(state, 0, 1).verdict, 'drop', 'empty bucket drops');
    eq(consumeInboundFrame(state, 1 / 240, 1).verdict, 'drop', 'half a refilled token still drops');
    eq(consumeInboundFrame(state, 1 / 60, 1).verdict, 'allow', 'two refilled tokens allow');
    const later = MSG_RATE_BURST / MSG_RATE_REFILL_PER_SECOND;
    eq(consumeInboundFrame(state, later, 1).verdict, 'allow', 'full refill allows');
    consumeInboundFrame(state, later + 3600, 1);
    ok(state.tokens <= MSG_RATE_BURST, 'long idle never overfills');
}

// byte spend
{
    const state = createMsgRateBucket(0);
    const before = state.byteTokens;
    eq(consumeInboundFrame(state, 0, 16 * 1024).verdict, 'allow', 'max-payload frame allows');
    eq(before - state.byteTokens, 16 * 1024, 'byte tokens spend equals frame length');
}

// byte exhaustion while frame tokens remain
{
    const state = createMsgRateBucket(0);
    for(let i = 0; i < 8; i++){
        eq(consumeInboundFrame(state, 0, 16 * 1024).verdict, 'allow', 'byte burst drain');
    }
    eq(state.byteTokens, 0, 'byte bucket empty');
    const framesLeft = state.tokens;
    ok(framesLeft >= 1, 'frame tokens remain');
    eq(consumeInboundFrame(state, 0, 16 * 1024), {verdict: 'drop', cause: 'bytes'}, 'byte exhaustion drops bytes');
    eq(state.tokens, framesLeft, 'byte drop spends no frame token');
    eq(state.byteTokens, 0, 'byte drop spends no byte tokens');
}

// byte bucket refill
{
    const state = createMsgRateBucket(0);
    for(let i = 0; i < 8; i++){
        consumeInboundFrame(state, 0, 16 * 1024);
    }
    eq(consumeInboundFrame(state, 0, 16 * 1024).verdict, 'drop', 'empty byte bucket drops');
    eq(consumeInboundFrame(state, 0.25, 16 * 1024).verdict, 'allow', 'quarter second refills 16 KiB');
    consumeInboundFrame(state, 3600, 1);
    ok(state.byteTokens <= MSG_BYTE_BURST, 'long idle never overfills byte bucket');
}

// never kicks under the floor
{
    const state = createMsgRateBucket(0);
    for(let sec = 0; sec < 12; sec++){
        drainFrameTokens(state, sec);
        for(let i = 0; i < MSG_ABUSE_SECOND_DROP_FLOOR - 1; i++){
            eq(consumeInboundFrame(state, sec, 1), {verdict: 'drop', cause: 'rate'}, 'sub-floor drop');
        }
    }
}

// kicks on fifth abusive second, not fourth
{
    const state = createMsgRateBucket(0);
    for(let sec = 0; sec < 4; sec++){
        makeAbusiveSecond(state, sec, false);
    }
    makeAbusiveSecond(state, 4, true);
}

// allowed frames never reset the abuse window
{
    const state = createMsgRateBucket(0);
    const verdicts = [];
    for(let sec = 0; sec < 5; sec++){
        drainFrameTokens(state, sec);
        for(let i = 0; i < 15; i++){
            verdicts.push(consumeInboundFrame(state, sec, 1).verdict);
        }
        drainFrameTokens(state, sec + 0.5);
        for(let i = 0; i < 15; i++){
            verdicts.push(consumeInboundFrame(state, sec + 0.5, 1).verdict);
        }
    }
    ok(verdicts.slice(0, -1).every((v) => v === 'drop'), 'all but last are drops');
    eq(verdicts[verdicts.length - 1], 'kick', 'last verdict kicks');
}

// single-second thousand-drop burst never kicks
{
    const state = createMsgRateBucket(0);
    drainFrameTokens(state, 0.4);
    for(let i = 0; i < 1000; i++){
        eq(consumeInboundFrame(state, 0.4, 1).verdict, 'drop', 'burst drop');
    }
    eq(consumeInboundFrame(state, 2, 106).verdict, 'allow', 'traffic resumes after burst');
}

// abusive seconds age out
{
    const state = createMsgRateBucket(0);
    for(let sec = 0; sec < 4; sec++){
        makeAbusiveSecond(state, sec, false);
    }
    makeAbusiveSecond(state, 14, false);
}

// sustained byte flood kicks with cause bytes
{
    const state = createMsgRateBucket(0);
    for(let sec = 0; sec < 5; sec++){
        const drains = sec === 0 ? 8 : 4;
        for(let i = 0; i < drains; i++){
            eq(consumeInboundFrame(state, sec, 16 * 1024).verdict, 'allow', 'byte flood drain');
        }
        eq(state.byteTokens, 0, 'byte bucket zeroed');
        for(let i = 0; i < MSG_ABUSE_SECOND_DROP_FLOOR - 1; i++){
            eq(consumeInboundFrame(state, sec, 16 * 1024), {
                verdict: 'drop',
                cause: 'bytes',
            }, 'byte flood pre-floor drop');
        }
        const atFloor = consumeInboundFrame(state, sec, 16 * 1024);
        if(sec === 4){
            eq(atFloor, {verdict: 'kick', cause: 'bytes'}, 'byte flood kicks');
        } else {
            eq(atFloor, {verdict: 'drop', cause: 'bytes'}, 'byte flood floor drop');
        }
    }
}

// monotonic abuse accounting on backwards clock
{
    const state = createMsgRateBucket(0);
    for(let sec = 0; sec < 4; sec++){
        makeAbusiveSecond(state, sec, false);
    }
    for(let i = 0; i < MSG_ABUSE_SECOND_DROP_FLOOR * 2; i++){
        eq(consumeInboundFrame(state, 2.5, 1).verdict, 'drop', 'backwards drops stay in latest second');
    }
    makeAbusiveSecond(state, 4, true);
}

// window edges: exactly ten back ages out, nine stays in
{
    const outside = createMsgRateBucket(0);
    for(const sec of [4, 11, 12, 13]){
        makeAbusiveSecond(outside, sec, false);
    }
    makeAbusiveSecond(outside, 14, false);
    const inside = createMsgRateBucket(0);
    for(const sec of [5, 11, 12, 13]){
        makeAbusiveSecond(inside, sec, false);
    }
    makeAbusiveSecond(inside, 14, true);
}

eq(MSG_RATE_KICK_REASON, 'message rate exceeded', 'kick reason wire contract');

console.log('test-msg-rate-limit OK ('+passed+' assertions).');
