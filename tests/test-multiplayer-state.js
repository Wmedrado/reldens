/**
 *
 * VibeCraft - test-multiplayer-state
 *
 * T2.6 verification: two players coexist in the same room state and survive the
 * real Colyseus binary sync. Uses the REAL room State schema (lib/rooms) with
 * real Player and BodyState schemas; encodes the state and decodes it back to
 * prove the wire format carries both players. Also asserts movement isolation
 * (positioning player A does not move player B) and that disconnecting one
 * player leaves the other untouched. No live server or database.
 *
 */

const assert = require('assert');
const { Encoder, Reflection } = require('@colyseus/schema');
const { State } = require('../lib/rooms/server/state');

function makePlayerData(id, playerId, name, x, y)
{
    return {
        id,
        player: {
            id: playerId,
            name,
            state: {room_id: 101, scene: 'capital', x, y, dir: 'down'},
            stats: {hp: 100, mp: 50},
            statsBase: {hp: 100, mp: 50}
        },
        role_id: 1,
        status: 'active',
        username: 'user'+id,
        played_time: 0
    };
}

function makeState()
{
    let state = new State({}, false);
    let ana = state.createPlayerSchema(makePlayerData(1, 7, 'Ana', 100, 100), 'session-a');
    let bia = state.createPlayerSchema(makePlayerData(2, 8, 'Bia', 200, 200), 'session-b');
    state.addPlayerToState(ana, 'session-a');
    state.addPlayerToState(bia, 'session-b');
    return {state, ana, bia};
}

async function main()
{
    // --- two players coexist in the same room state --------------------------
    let {state, ana, bia} = makeState();
    assert.strictEqual(state.players.size, 2, 'both players present in state');
    assert.ok(state.players.has('session-a'), 'player A keyed by its session');
    assert.ok(state.players.has('session-b'), 'player B keyed by its session');
    assert.notStrictEqual(ana.player_id, bia.player_id, 'distinct player ids');
    assert.notStrictEqual(ana.eventsPrefix, bia.eventsPrefix, 'distinct event prefixes');

    // --- the real wire path carries both players -----------------------------
    // The client does NOT reuse the data-taking Player constructor: the server
    // sends a schema reflection in the handshake, the client builds no-arg
    // schema instances from it, then applies the encoded state. This mirrors
    // colyseus.js Room JOIN_ROOM handshake + ROOM_STATE exactly.
    let encoder = new Encoder(state);
    let stateBytes = encoder.encodeAll();
    let reflectionBytes = Reflection.encode(encoder);
    let handshake = Reflection.decode(reflectionBytes, {offset: 0});
    handshake.decode(stateBytes, {offset: 0});
    let decoded = handshake.state;
    assert.strictEqual(decoded.players.size, 2, 'decoded state carries both players');
    assert.strictEqual(decoded.players.get('session-a').playerName, 'Ana', 'player A synced');
    assert.strictEqual(decoded.players.get('session-a').state.x, 100, 'player A position synced');
    assert.strictEqual(decoded.players.get('session-b').playerName, 'Bia', 'player B synced');
    assert.strictEqual(decoded.players.get('session-b').state.y, 200, 'player B position synced');

    // --- movement is isolated per player -------------------------------------
    state.positionPlayer('session-a', {x: 50, y: 60});
    assert.strictEqual(ana.state.x, 50, 'player A moved');
    assert.strictEqual(ana.state.y, 60, 'player A moved');
    assert.strictEqual(bia.state.x, 200, 'moving A does not move B (x)');
    assert.strictEqual(bia.state.y, 200, 'moving A does not move B (y)');

    // --- disconnect removes only the leaving player --------------------------
    state.removePlayer('session-a');
    assert.strictEqual(state.players.size, 1, 'only one player left');
    assert.ok(state.players.has('session-b'), 'player B remains');
    assert.ok(!state.players.has('session-a'), 'player A removed');

    console.log('test-multiplayer-state: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
