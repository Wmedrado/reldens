/**
 *
 * Reldens - MsgLanes
 *
 * Post-parse per-class inbound lanes: movement, commands, and chat stop
 * sharing one budget, so a saturated movement stream structurally cannot
 * starve casts and a cast flood cannot starve movement (the reserved-lane
 * requirement of the input cadence contract).
 *
 * The lanes are deliberately POST-parse: classification needs the parsed
 * message type, and the pre-parse gate (lib/rooms/server/msg-rate-limit.js)
 * has already bounded the frame and byte budget these checks run inside.
 * Like the gate, every verdict is allow-or-drop, never defer: queueing a
 * frame would shift its receive time, which bot detection timing is
 * calibrated against. Lane drops tally into the gate's shared per-second
 * abuse window (tallyDrop) at the consumer, and take no protocol-anomaly
 * observation of their own: protocol_conformance means "not our client",
 * not "server shed load".
 *
 * Classification mirrors the dispatch switch used by the room message
 * handlers:
 * - movement: t 'input'. The refill clears the measured input-stream hard
 *   cap, so a legitimate held turn at any refresh rate never drops.
 * - chat: cmd 'chat'. A pre-guard only, deliberately more generous than the
 *   in-handler chat throttle, which stays the authoritative player-facing
 *   throttle and messaging.
 * - exempt, never lane-checked: t 'logout' (a clean leave always processes),
 *   cmd 'telemetry', and cmd 'challengeResponse'. Defense-in-depth token
 *   accounting: beats and challenge replies never compete for command-lane
 *   tokens, and never spend or refill lane state at all.
 * - command: every OTHER parsed shape. All remaining commands, plus the
 *   garbage shapes (non-object JSON, unknown t, unknown cmd), so sub-ceiling
 *   garbage is bounded to the lane rate and anything above it becomes
 *   score-visible through the abuse window.
 *
 * Pure state + functions (no transport imports, injected nowSec) so the lane
 * math is unit-testable without a live server.
 *
 */

// Movement lane: sized above the analytic hard cap of the client's input
// send scheme, so a legitimate held turn at any refresh rate never drops.
// Burst absorbs the reconnect catch-up spike, same shape as the gate.
const MSG_LANE_MOVEMENT_REFILL_PER_SECOND = 90;
const MSG_LANE_MOVEMENT_BURST = 120;

// Command lane: OS key repeat is filtered client-side, so the worst
// legitimate rate is human mashing across keybinds and clicks, realistically
// under 20/s; 30/s with a 60 burst is comfortable headroom for casts,
// targeting, loot, vendor, trade, and the hotbar save.
const MSG_LANE_COMMAND_REFILL_PER_SECOND = 30;
const MSG_LANE_COMMAND_BURST = 60;

// Chat lane: a pre-guard bounding what a chat flood can burn; strictly more
// generous than the in-handler throttle, so the ladder stays the
// player-facing throttle.
const MSG_LANE_CHAT_REFILL_PER_SECOND = 4;
const MSG_LANE_CHAT_BURST = 8;

/**
 * @param {number} nowSec
 * @returns {Object} A fresh metered lane state.
 */
function createMsgLanes(nowSec)
{
    return {
        movementTokens: MSG_LANE_MOVEMENT_BURST,
        commandTokens: MSG_LANE_COMMAND_BURST,
        chatTokens: MSG_LANE_CHAT_BURST,
        lastRefillSec: nowSec,
    };
}

/**
 * Classify a parsed inbound message into its lane, mirroring the dispatch
 * switch. Takes the raw JSON.parse result: valid non-object JSON (null,
 * numbers, strings, arrays) is command-lane garbage, exactly like an unknown
 * t or an unknown cmd.
 *
 * @param {*} msg
 * @returns {string} 'movement' | 'command' | 'chat' | 'exempt'
 */
function classifyMsgLane(msg)
{
    if(typeof msg !== 'object' || null === msg || Array.isArray(msg)){
        return 'command';
    }
    if(msg.t === 'logout'){
        return 'exempt';
    }
    if(msg.t === 'input'){
        return 'movement';
    }
    if(msg.t !== 'cmd'){
        return 'command';
    }
    if(msg.cmd === 'chat'){
        return 'chat';
    }
    if(msg.cmd === 'telemetry' || msg.cmd === 'challengeResponse'){
        return 'exempt';
    }
    return 'command';
}

/**
 * Mutates `state` in place and returns whether this frame may proceed down
 * its lane. A dropped frame spends nothing, mirroring the pre-parse gate. All
 * three lanes refill off one shared clock on every call, which is equivalent
 * to lazy per-lane refill because the refill math composes over time splits.
 *
 * @param {Object} state
 * @param {string} lane
 * @param {number} nowSec
 * @returns {string} 'allow' | 'drop'
 */
function consumeLaneToken(state, lane, nowSec)
{
    const elapsed = Math.max(0, nowSec - state.lastRefillSec);
    state.movementTokens = Math.min(
        MSG_LANE_MOVEMENT_BURST,
        state.movementTokens + elapsed * MSG_LANE_MOVEMENT_REFILL_PER_SECOND
    );
    state.commandTokens = Math.min(
        MSG_LANE_COMMAND_BURST,
        state.commandTokens + elapsed * MSG_LANE_COMMAND_REFILL_PER_SECOND
    );
    state.chatTokens = Math.min(
        MSG_LANE_CHAT_BURST,
        state.chatTokens + elapsed * MSG_LANE_CHAT_REFILL_PER_SECOND
    );
    state.lastRefillSec = nowSec;
    if('movement' === lane){
        if(state.movementTokens < 1){
            return 'drop';
        }
        state.movementTokens -= 1;
    } else if('command' === lane){
        if(state.commandTokens < 1){
            return 'drop';
        }
        state.commandTokens -= 1;
    } else {
        if(state.chatTokens < 1){
            return 'drop';
        }
        state.chatTokens -= 1;
    }
    return 'allow';
}

module.exports = {
    MSG_LANE_MOVEMENT_REFILL_PER_SECOND,
    MSG_LANE_MOVEMENT_BURST,
    MSG_LANE_COMMAND_REFILL_PER_SECOND,
    MSG_LANE_COMMAND_BURST,
    MSG_LANE_CHAT_REFILL_PER_SECOND,
    MSG_LANE_CHAT_BURST,
    createMsgLanes,
    classifyMsgLane,
    consumeLaneToken,
};
