/**
 *
 * Reldens - BotDetector contract
 *
 * The anti-bot detector's shared shape, ported from the TypeScript contract.
 * Pure declarations: this module only defines the runtime constants and JSDoc
 * types so the stub and any future real implementation agree on one surface.
 *
 */

/** @type {string[]} */
const ENFORCEMENT_ACTIONS = ['none', 'kick'];

/** @type {string[]} */
const PROTOCOL_ANOMALIES = ['invalid_json', 'non_object', 'unknown_type', 'unknown_command'];

/**
 * @typedef {string} EnforcementAction 'none' | 'kick'
 * @typedef {string} ProtocolAnomaly 'invalid_json' | 'non_object' | 'unknown_type' | 'unknown_command'
 *
 * @typedef {Object} PlayerSessionRef
 * @property {number} accountId
 * @property {number} characterId
 * @property {string} name
 * @property {string} ip
 *
 * @typedef {Object} SessionRuntimeSnapshot
 * @property {number} capturedAt
 * @property {number} simTime
 * @property {number} x
 * @property {number} z
 * @property {number} facing
 * @property {boolean} dead
 * @property {boolean} inCombat
 * @property {number|null} targetId
 * @property {number|null} instanceSlot
 * @property {string|null} instanceDungeonId
 * @property {number} level
 * @property {string} classId
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} resource
 * @property {number} maxResource
 * @property {string|null} resourceType
 * @property {boolean} autoAttack
 * @property {number|null} followTargetId
 * @property {number} moveSpeed
 * @property {boolean} onGround
 */

// A bounded in-memory value histogram published by the detector for operator-facing
// calibration dashboards. Which quantities are measured, and their ids, are decided
// entirely by the implementation at runtime; this shape is deliberately generic.
/**
 * @typedef {Object} CalibrationHistogramBucket
 * @property {number} le // inclusive upper bound of the bucket
 * @property {number} count
 *
 * @typedef {Object} CalibrationHistogram
 * @property {string} id
 * @property {number} count
 * @property {number} min // 0 when count is 0
 * @property {number} max
 * @property {number} sum
 * @property {CalibrationHistogramBucket[]} buckets
 * @property {number} overflowCount // observations above the last bucket bound
 */

// The detector's operator-tunable runtime configuration, published for the admin
// dashboard. Which fields exist, and their ids, groups, and labels, are decided
// entirely by the implementation at runtime; this shape is deliberately generic
// (the CalibrationHistogram precedent). The host persists an override document
// ({ [fieldId]: value }), audits before/after values, and replays it through
// applyConfig at boot. Config fields are operator-visible and MUST NOT expose secrets.
/**
 * @typedef {string} ConfigFieldType 'string' | 'number' | 'boolean' | 'select' | 'multi_select'
 * @typedef {string|number|boolean|string[]} ConfigValue
 *
 * @typedef {Object} ConfigFieldOption
 * @property {string} value
 * @property {string} label
 *
 * @typedef {Object} ConfigField
 * @property {string} id
 * @property {string} group // section heading the dashboard renders fields under
 * @property {string} label
 * @property {ConfigFieldType} type
 * @property {ConfigValue} defaultValue
 * @property {ConfigValue} value // currently applied (the default unless overridden)
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {string} [unit] // e.g. 'ms'
 * @property {ConfigFieldOption[]} [options] // select / multi_select choices
 * @property {string} [help]
 *
 * @typedef {Object} ConfigApplyResult
 * @property {string[]} errors
 *
 * @typedef {Object} SuspiciousEvidence
 * @property {string} kind
 * @property {number} weight
 * @property {string} detail
 * @property {number} expiresAt
 * @property {number} [occurrences]
 * @property {number} [firstAt]
 * @property {number} [lastAt]
 * @property {number[]} [episodesAt]
 *   Recurrence history, present only on kinds where re-triggering carries
 *   information (decided entirely by the implementation): distinct episodes
 *   observed this session, when the first and latest happened (epoch ms), and
 *   the opening timestamps of the most recent episodes (bounded ring; the count
 *   and firstAt keep the totals the ring loses when it overflows).
 *
 * @typedef {string} SuspiciousPlayerState 'SUSPICIOUS' | 'CONFIRMED'
 *
 * @typedef {Object} SuspiciousPlayer
 * @property {PlayerSessionRef} ref
 * @property {SessionRuntimeSnapshot|null} snapshot
 * @property {SuspiciousPlayerState} state
 * @property {number} score
 * @property {SuspiciousEvidence[]} evidence
 */

// The brand makes this handle impossible to construct or read outside this module.
// JS has no structural brands, so the type is documented here and the stub shares
// one opaque handle for every context.
/**
 * @typedef {Object} BotTrackingContext
 * @property {symbol} __botTrackingBrand
 */

/**
 * @typedef {Object} BotDetector
 * @property {function(PlayerSessionRef, *): BotTrackingContext} createTrackingContext
 * @property {function(BotTrackingContext, boolean, *): void} setTrackingConnection
 *   Contexts start connected; linkdead drop marks false, same-session resume marks true with fresh meta.
 * @property {function(BotTrackingContext): void} releaseTrackingContext
 * @property {function(BotTrackingContext, string, number, *): void} observeCommand
 * @property {function(BotTrackingContext, Object, number): void} observeEvent
 * @property {function(BotTrackingContext, Object, number): void} observeInput
 * @property {function(BotTrackingContext, ProtocolAnomaly, string, number): void} observeProtocolAnomaly
 * @property {function(BotTrackingContext, number, boolean, SessionRuntimeSnapshot|null): EnforcementAction} handleTick
 * @property {function(): SuspiciousPlayer[]} listSuspiciousPlayers
 * @property {function(): CalibrationHistogram[]} listCalibrationHistograms
 * @property {function(): ConfigField[]} describeConfig
 *   The full operator-tunable surface: schema plus currently applied values.
 * @property {function(Object): ConfigApplyResult} applyConfig
 *   Validates an override document ({ [fieldId]: value }) and REPLACES all previous
 *   overrides with it (an absent id reverts that field to its default). Valid entries
 *   apply immediately; invalid ones are skipped and reported in `errors`, so a strict
 *   caller rejects on any error (re-applying its previous document) while boot applies
 *   what it can and logs the rest.
 */

module.exports.BotDetectorContract = {
    ENFORCEMENT_ACTIONS,
    PROTOCOL_ANOMALIES
};
