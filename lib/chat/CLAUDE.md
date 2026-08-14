# lib/chat

Reldens chat module: room chat with client UI (Phaser), server-side message
authoring/broadcast, and a two-tier moderation pipeline (soft cosmetic masking vs
hard server-enforced slurs) with strikes, timed mutes, and moderation commands.

## Key files

| Path | What |
|---|---|
| `constants.js` | `ChatConst` shared constants: snippets, message types, escalation defaults, moderation snippets. |
| `message-factory.js` | Builds the standardized message objects broadcast to the room. |
| `cleaner.js` | `Cleaner` singleton; message cleaning/validation (currently delegates to `sc.cleanMessage`). |
| `server/manager.js` | `ChatManager`; wires rooms to `RoomChat`, distributes messages, registers UI. |
| `server/room-chat.js` | `RoomChat`; per-room message handling, mute check, moderation command dispatch, broadcast. |
| `server/moderation-service.js` | `ChatModerationService`; runtime state: per-account strikes and timed mutes, `checkMessage`, `handleViolation`, command execution. |
| `server/moderation-commands.js` | Pure parser for `/mute`, `/ban` etc.; commands parsed BEFORE broadcast. |
| `server/profanity-filter.js` | `ChatFilter`; pure two-tier filter, normalization + whole-token hard matching, `escalate` ladder. |
| `server/messages-guard.js` | Message validation before persistence/broadcast. |
| `server/messages/*.js` | Damage/dodge/modifier message callbacks and mapper. |
| `server/entities/` | Entity overrides for `chat` and `chat-message-types`. |
| `server/event-listener/` | Guest/player/NPC message event listeners. |
| `client/` | Phaser UI: chat tabs, input, templates, messages listener. |

## Invariants

- **Two-tier filter.** Soft words are cosmetic only (client masks iff player's
  filter is on; server never alters). Hard words are enforced server-side: a
  message is blocked and escalates to strikes and timed mutes. The tiers never
  interact - a soft word is never punitive, a hard word is never merely masked.
- **Hard tier seeded via env.** `DEFAULT_HARD_WORDS` is empty on purpose (no
  plaintext slur list in an open-source repo). Operators seed via
  `RELDENS_CHAT_HARD_LIST` / `RELDENS_CHAT_HARD_FILE` at first boot, then manage
  via the admin dashboard. With an empty list nothing is enforced.
- **Whole-token matching.** Hard hits require a normalized token to EQUAL a
  listed word (plus trailing-`s` plural) - never substring, so innocent words
  (`snigger`, `assassin`) never match. Obfuscation (leet, confusables,
  diacritics) folds before matching.
- **Mute before send.** `RoomChat` checks `moderationService.isMuted(accountId)`
  before anything else; a muted account cannot send, even via direct API calls.
- **Moderation commands parsed before broadcast.** `/mute` etc. are handled by
  `ChatModerationService.handleCommand` and never broadcast as chat text.

## Persistence

- `chat` entity (message log) and `chat-message-types` entity, via
  `dataServer.getEntity()`. Runtime moderation state (strikes, mutes) is
  IN-MEMORY only: it resets on server restart.

## Tests

- `node tests/test-chat-filter.js` - normalization, tiers, whole-token matching.
- `node tests/test-moderation-commands.js` - command parsing/execution.
- `node tests/test-msg-rate-limit.js` - message rate limiting.
- Full suite: `npm test` (needs live server).
