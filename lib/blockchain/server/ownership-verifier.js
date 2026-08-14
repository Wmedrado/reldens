/**
 *
 * Reldens - Ownership Verifier
 *
 * Verifies current NFT ownership through injected dependencies, so the
 * verifier stays free of DB/RPC implementations and can be unit tested with
 * fakes. Admission, single-flight, and the request deadline are owned by the
 * caller.
 *
 */

/**
 * @param {Object} deps
 * @param {Function} deps.claimForAccount
 * @param {Function} deps.walletForAccount
 * @param {Function} deps.findToken
 * @returns {Object}
 */
function createOwnershipVerifier(deps)
{
    return {
        /**
         * @param {number} accountId
         * @param {AbortSignal} signal
         * @returns {Promise<boolean>}
         */
        async verify(accountId, signal)
        {
            try {
                let [claim, wallet] = await Promise.all([
                    deps.claimForAccount(accountId),
                    deps.walletForAccount(accountId)
                ]);
                if(!claim || !wallet || signal.aborted){
                    return false;
                }
                let token = await deps.findToken(wallet.pubkey, signal, claim.mint);
                return token?.mint === claim.mint;
            } catch (error) {
                return false;
            }
        }
    };
}

module.exports.createOwnershipVerifier = createOwnershipVerifier;
