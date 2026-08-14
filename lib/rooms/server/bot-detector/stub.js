/**
 *
 * Reldens - BotDetector stub
 *
 * No-op implementation of the BotDetector contract. Ported verbatim in shape
 * from the TypeScript stub: every tracking context is one shared opaque handle
 * and every hook is a no-op, so hosts can wire the detector surface before a
 * real implementation exists.
 *
 */

/** @type {Object} */
const HANDLE = {__botTrackingBrand: Symbol('BotTrackingContext')};

/**
 * @returns {import('./contract').BotDetector}
 */
function createBotDetector()
{
    return {
        createTrackingContext: () => HANDLE,
        setTrackingConnection: () => {},
        releaseTrackingContext: () => {},
        observeCommand: () => {},
        observeEvent: () => {},
        observeInput: () => {},
        observeProtocolAnomaly: () => {},
        handleTick: () => 'none',
        listSuspiciousPlayers: () => [],
        listCalibrationHistograms: () => [],
        describeConfig: () => [],
        applyConfig: () => ({errors: []})
    };
}

module.exports.BotDetectorStub = {
    createBotDetector
};
