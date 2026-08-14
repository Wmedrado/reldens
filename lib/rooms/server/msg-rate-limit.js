/**
 *
 * Reldens - MsgRateLimit
 *
 * Pre-parse per-connection inbound message gate: a frame-rate ceiling, a
 * per-window byte budget, and a windowed abuse score.
 *
 * Every verdict lands BEFORE the message is dispatched to the room handler: a
 * flooder burns token math, never handler CPU. And every verdict is
 * allow-or-drop, never defer: queueing a frame and releasing it later would
 * shift its receive time, which bot detectors are calibrated against.
 *
 * Sizing follows a measured client send cadence: input can arrive at up to
 * roughly 82 messages per second, and commands, chat, and telemetry ride the
 * same socket on top of that input stream.
 *
 * The abuse score is shaped by the stall-then-flush constraint: a network
 * stall leaves the client buffering sends, and the transport delivers the
 * whole backlog in one burst on recovery, thousands of frames inside about one
 * receive-time second. Any score that integrates total drops would kick that
 * legitimate client, so abuse is counted in whole receive-time seconds
 * instead: a burst can make at most one or two seconds abusive, far under the
 * kick requirement, while a sustained flood accumulates abusive seconds until
 * it is kicked. Allowed frames never reset anything; only time slides the
 * window.
 *
 * Pure state + functions (no transport imports, injected nowSec) so the gate
 * math is unit-testable without a live server.
 *
 */

// Frame ceiling: the refill sits about 1.45x above the 82.5/s input-stream
// hard cap, leaving standing headroom for command mashing plus chat plus
// telemetry on top of a maxed input stream. Burst preserves the
// 1.5-seconds-of-refill shape for the reconnect catch-up spike (session
// resume deliberately keeps the existing bucket, benign at this refill).
const MSG_RATE_REFILL_PER_SECOND = 120; // sustained refill, frames (tokens) per second
const MSG_RATE_BURST = 180; // bucket capacity, in frames (tokens)

// Byte budget: bounds SUSTAINED parse exposure per connection, measured on the
// serialized frame length (the UTF-16 code-unit proxy for bytes). Legitimate
// steady traffic is about 10 KB/s worst case (input frames serialize to 74 to
// 106 bytes, so 80/s costs about 8.5 KB/s, plus chat), roughly 6x headroom.
const MSG_BYTE_REFILL_PER_SECOND = 64 * 1024; // sustained refill, bytes per second
const MSG_BYTE_BURST = 128 * 1024; // byte bucket capacity, in bytes

// Abuse window: a second is abusive when its drop tally reaches the floor
// (offered rate at least 25 percent over the refill for a full second); the
// verdict is kick when enough seconds of the sliding window were abusive. A
// slightly over-limit sender throttles forever without kicking; a
// stall-then-flush burst concentrates in one or two seconds and never kicks.
const MSG_ABUSE_WINDOW_SECONDS = 10; // sliding window the kick verdict looks across
const MSG_ABUSE_KICK_SECONDS = 5; // abusive seconds within the window that kick
const MSG_ABUSE_SECOND_DROP_FLOOR = 30; // drops within one second that mark it abusive

// Kick reason: the exact text sent before closing the socket. Deliberately
// session-fatal on the client (no transient-rejection arm: an immediately
// reconnecting flooder re-floods).
const MSG_RATE_KICK_REASON = 'message rate exceeded';

// Seq-gap sanity cap: a parsed input frame whose seq jumps past the last
// processed one by more than this is clamped to it, so a client/server seq
// reset mismatch can never book a giant fictitious gap.
const MSG_SEQ_GAP_SANITY = 1000; // max missed frames booked per observation

function createMsgRateBucket(nowSec)
{
    return {
        tokens: MSG_RATE_BURST,
        byteTokens: MSG_BYTE_BURST,
        lastRefillSec: nowSec,
        dropSecond: Math.floor(nowSec),
        dropsThisSecond: 0,
        abusiveSeconds: [],
    };
}

/**
 * Mutates `state` in place and returns whether this frame should be processed,
 * with the drop cause when it should not. A dropped frame spends nothing: the
 * frame token and the byte tokens are only consumed on allow.
 */
function consumeInboundFrame(state, nowSec, approxBytes)
{
    const elapsed = Math.max(0, nowSec - state.lastRefillSec);
    state.tokens = Math.min(MSG_RATE_BURST, state.tokens + elapsed * MSG_RATE_REFILL_PER_SECOND);
    state.byteTokens = Math.min(
        MSG_BYTE_BURST,
        state.byteTokens + elapsed * MSG_BYTE_REFILL_PER_SECOND,
    );
    state.lastRefillSec = nowSec;
    if(state.tokens < 1){
        return {verdict: tallyDrop(state, nowSec), cause: 'rate'};
    }
    if(state.byteTokens < approxBytes){
        return {verdict: tallyDrop(state, nowSec), cause: 'bytes'};
    }
    state.tokens -= 1;
    state.byteTokens -= approxBytes;
    return {verdict: 'allow'};
}

// Per-second drop accounting: drops of every cause tally into the current
// one-second bucket, and the allow path never touches this state. Exported
// for the post-handler lanes: drops of EVERY cause share this one window, so a
// lane flood accumulates abusive seconds through the identical verdict path.
function tallyDrop(state, nowSec)
{
    // Clamp the accounting second monotonic, mirroring the refill's
    // negative-elapsed clamp: a backwards clock step must not re-open an older
    // second, which could push a duplicate ring entry.
    const sec = Math.max(Math.floor(nowSec), state.dropSecond);
    if(sec !== state.dropSecond){
        state.dropSecond = sec;
        state.dropsThisSecond = 0;
    }
    state.dropsThisSecond++;
    // Exactly-once per second: the tally only ever passes the floor going up.
    if(state.dropsThisSecond === MSG_ABUSE_SECOND_DROP_FLOOR){
        state.abusiveSeconds.push(sec);
    }
    const cutoff = sec - MSG_ABUSE_WINDOW_SECONDS;
    while(state.abusiveSeconds.length > 0 && state.abusiveSeconds[0] <= cutoff){
        state.abusiveSeconds.shift();
    }
    return state.abusiveSeconds.length >= MSG_ABUSE_KICK_SECONDS ? 'kick' : 'drop';
}

module.exports = {
    MSG_RATE_REFILL_PER_SECOND,
    MSG_RATE_BURST,
    MSG_BYTE_REFILL_PER_SECOND,
    MSG_BYTE_BURST,
    MSG_ABUSE_WINDOW_SECONDS,
    MSG_ABUSE_KICK_SECONDS,
    MSG_ABUSE_SECOND_DROP_FLOOR,
    MSG_RATE_KICK_REASON,
    MSG_SEQ_GAP_SANITY,
    createMsgRateBucket,
    consumeInboundFrame,
    tallyDrop,
};
