# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Module Overview

`lib/status-effects/` implements timed stat-delta effects: damage over time,
heal over time, and simple per-tick buffs/debuffs. It is a thin, self-contained
server module. It does NOT reimplement `@reldens/modifiers`; it is the temporal
companion to that package (see "Relationship with @reldens/modifiers" below).

Files:
- `constants.js`: action keys (`status.apply`, `status.remove`, `status.result`) and event names.
- `server/status-effects-manager.js`: the effect engine (interval loop, clamping, lifecycle).
- `server/plugin.js`: wires the manager to events and to global room message actions.
- `server/message-actions.js`: client-facing dev/test apply/remove handlers.

Wiring: `theme/plugins/server-plugin.js` instantiates `StatusEffectsPlugin` in the
`reldens.serverBeforeListen` event. The plugin listens for the gameplay events
`reldens.statusEffects.apply` and `reldens.statusEffects.remove`, and registers a
`statusEffects` entry on the global room message actions.

## Invariants

- A target must expose `target.stats` (current values) and `target.statsBase`
  (base/max values), both keyed by stat key. The player schema in
  `lib/users/server/player.js` satisfies this. A target without `stats` is rejected.
- One active effect per `(target, key)`. Re-applying the same key on the same
  target removes the previous effect first. Key identity uses `target.uid`,
  then `target.player_id`, then `target.sessionId`.
- Every tick adds `perTick` to `target.stats[propertyKey]` and clamps the result
  to `[0, statsBase[propertyKey]]` (or `[0, Infinity)` when no base exists). The
  clamp runs on every tick, so healing never overheals above the base.
- An effect runs for `ticks` ticks at `intervalMs` spacing, then auto-finishes:
  the timer is cleared, the effect is removed from `activeEffects`, and `onEnd`
  fires (if provided). `onTick` fires after each stat write.
- Persistence is the CALLER's responsibility. The `message-actions` apply path
  injects `onTick` -> `room.savePlayerStats(target, client)` automatically. The
  plugin event path (`reldens.statusEffects.apply`) does NOT; gameplay code that
  uses the event must supply its own `onTick` to persist/sync.
- The manager owns real `setInterval` timers. Call `manager.dispose()` on room
  shutdown to clear every active timer.

## Relationship with @reldens/modifiers

`@reldens/modifiers` (`node_modules/@reldens/modifiers`, lib: `condition.js`,
`modifier.js`, `calculator.js`, `property-manager.js`, `constants.js`) provides
one-shot, revertible stat operations (INC, DEC, MUL, DIV, INC_P, DEC_P, SET,
METHOD), gated by `Condition` comparisons, with min/max limits and deep property
paths. It has NO concept of time, ticks, intervals, or duration. It is used by
`@reldens/skills` (the Effect skill type applies target modifiers), the items
system (`lib/inventory/server/items-factory.js` builds `Modifier` instances for
equipment bonuses), levels, and teams.

What this module should borrow from `@reldens/modifiers` instead of duplicating:

- Revertible buffs/debuffs. The manager only accumulates `perTick` deltas and
  never restores the pre-effect value on expiry (correct for poison/burn where
  the damage is permanent). For a timed buff that must return to its base value
  (e.g. +20 attack for 10s), apply `new Modifier({...}).apply(target)` on effect
  start and `.revert(target)` in `onEnd` (or on remove). Do NOT hand-roll the
  inverse math; `Modifier` and its `Calculator` already do this.
- Conditions/requirements. To gate whether an effect applies at all (e.g. "only
  if target level >= X"), reuse `Condition` instances as a gate in the apply
  path instead of writing comparison logic inline.
- Loading effects from the database. `lib/actions/server/storage/modifiers-generator.js`
  and `conditions-generator.js` show the established pattern for mapping DB rows
  to `Modifier`/`Condition` instances; follow it if status effects ever become
  data-driven.

Do NOT use `@reldens/modifiers` for the tick loop itself: it has no duration
primitive. The interval loop in `status-effects-manager.js` is the right tool for
DoT/HoT.

## Known Limitations

- `tick` is async and awaits `onTick`. `applyEffect` uses `setInterval`, so if an
  `onTick` callback (e.g. a slow DB save) takes longer than `intervalMs`, ticks
  overlap and can race on the stat value. No current caller uses fast intervals
  with a slow `onTick`; a future caller should keep `intervalMs` generous or
  switch the loop to a `setTimeout` chain.
- Removing an effect does not undo deltas already applied. This is intentional
  for DoT/HoT; use `Modifier.revert` for revertible buffs (see above).
- The client-facing `status.apply` message action trusts effect data sent by the
  client and is a dev/test path only. Real gameplay should apply effects
  server-side through the `reldens.statusEffects.apply` event with validated props.

## Tests

Standalone pure test, no live server or database:

```bash
node tests/test-status-effects.js
```
