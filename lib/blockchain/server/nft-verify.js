/**
 *
 * Reldens - NFT Verify
 *
 * Token-2022 NFT verification: matches every identity-bearing Token-2022
 * extension published for the configured NFT (mint authority, metadata
 * pointer, token group) plus a positive owner balance. The identity constants
 * are configurable via environment variables and default to the CloudCraft
 * Seeker Genesis Token identity.
 *
 */

const bs58 = require('bs58');
const { sc } = require('@reldens/utils');

// Lazily read from the environment: the dotenv config is applied by the server
// manager at boot, which happens AFTER this module is required by the features
// config, so env values must be resolved on first use, not at module load.
let envIdentity = null;

function readEnvIdentity()
{
    if(!envIdentity){
        envIdentity = {
            mintAuthority: sc.get(
                process.env,
                'RELDENS_NFT_MINT_AUTHORITY',
                'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4'
            ),
            metadataAddress: sc.get(
                process.env,
                'RELDENS_NFT_METADATA_ADDRESS',
                'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te'
            ),
            groupAddress: sc.get(
                process.env,
                'RELDENS_NFT_GROUP_ADDRESS',
                'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te'
            ),
            rpcUrl: process.env.RELDENS_SOLANA_RPC_URL ?? ''
        };
    }
    return envIdentity;
}

function nftMintAuthority()
{
    return readEnvIdentity().mintAuthority;
}

function nftMetadataAddress()
{
    return readEnvIdentity().metadataAddress;
}

function nftGroupAddress()
{
    return readEnvIdentity().groupAddress;
}

const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const MINT_BASE_SIZE = 82;
const TOKEN_ACCOUNT_BASE_SIZE = 165;
const MINT_ACCOUNT_TYPE = 1;
const METADATA_POINTER_EXTENSION = 18;
const TOKEN_GROUP_MEMBER_EXTENSION = 23;
const METADATA_POINTER_SIZE = 64;
const TOKEN_GROUP_MEMBER_SIZE = 72;
const MAX_MINT_ACCOUNT_BYTES = 16 * 1024;
const MINT_BATCH_SIZE = 100;
const MAX_SEEKER_TOKEN_ACCOUNTS = 500;
const MAX_SEEKER_TOKEN_MINTS = 200;

function ownsPositiveAmount(amount)
{
    return /^\d+$/.test(amount) && BigInt(amount) > 0n;
}

/**
 * Match every identity-bearing Token-2022 extension published for the NFT.
 * The balance check prevents an emptied token account from proving ownership.
 *
 * @param {Object} descriptor
 * @returns {boolean}
 */
function isSeekerGenesisToken(descriptor)
{
    return (
        ownsPositiveAmount(descriptor.ownerAmount)
        && descriptor.mintAuthority === nftMintAuthority()
        && descriptor.metadataPointerAuthority === nftMintAuthority()
        && descriptor.metadataAddress === nftMetadataAddress()
        && descriptor.groupAddress === nftGroupAddress()
    );
}

/**
 * The first mint address whose descriptor verifies as the NFT, or null.
 *
 * @param {Array<Object>} descriptors
 * @returns {string|null}
 */
function verifiedSeekerGenesisTokenMint(descriptors)
{
    for(let descriptor of descriptors){
        if(isSeekerGenesisToken(descriptor)){
            return descriptor.mintAddress;
        }
    }
    return null;
}

function canonicalPublicKey(value)
{
    if('string' !== typeof value){
        return null;
    }
    try {
        let bytes = bs58.decode(value);
        return 32 === bytes.length ? bs58.encode(bytes) : null;
    } catch (error) {
        return null;
    }
}

function publicKeyAt(data, offset)
{
    if(0 > offset || offset + 32 > data.length){
        return null;
    }
    return bs58.encode(data.subarray(offset, offset + 32));
}

function extensionData(tlv, wantedType)
{
    let offset = 0;
    while(offset + 4 <= tlv.length){
        let type = tlv.readUInt16LE(offset);
        let length = tlv.readUInt16LE(offset + 2);
        let dataOffset = offset + 4;
        let nextOffset = dataOffset + length;
        if(nextOffset > tlv.length){
            return null;
        }
        if(type === wantedType){
            return tlv.subarray(dataOffset, nextOffset);
        }
        offset = nextOffset;
    }
    return null;
}

function accountData(account)
{
    if(!Array.isArray(account.data) || 2 !== account.data.length || 'base64' !== account.data[1]){
        return null;
    }
    let encoded = account.data[0];
    if('string' !== typeof encoded || encoded.length > MAX_MINT_ACCOUNT_BYTES * 2){
        return null;
    }
    try {
        let decoded = Buffer.from(encoded, 'base64');
        if(decoded.length > MAX_MINT_ACCOUNT_BYTES || decoded.toString('base64') !== encoded){
            return null;
        }
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Decode a Token-2022 mint account and verify it matches the NFT identity
 * extensions (metadata pointer + token group member TLV data).
 *
 * @param {string} mintAddress
 * @param {*} value
 * @returns {boolean}
 */
function decodeSeekerGenesisMint(mintAddress, value)
{
    let canonicalMint = canonicalPublicKey(mintAddress);
    if(!canonicalMint || !value || 'object' !== typeof value){
        return false;
    }
    if(value.owner !== TOKEN_2022_PROGRAM_ID){
        return false;
    }
    let data = accountData(value);
    if(
        !data
        || data.length <= TOKEN_ACCOUNT_BASE_SIZE
        || data.length < MINT_BASE_SIZE
        || data[TOKEN_ACCOUNT_BASE_SIZE] !== MINT_ACCOUNT_TYPE
    ){
        return false;
    }

    let mintAuthorityOption = data.readUInt32LE(0);
    if(0 !== mintAuthorityOption && 1 !== mintAuthorityOption){
        return false;
    }
    let mintAuthority = 1 === mintAuthorityOption ? publicKeyAt(data, 4) : null;
    let tlv = data.subarray(TOKEN_ACCOUNT_BASE_SIZE + 1);
    let metadata = extensionData(tlv, METADATA_POINTER_EXTENSION);
    let member = extensionData(tlv, TOKEN_GROUP_MEMBER_EXTENSION);
    if(
        !metadata
        || metadata.length !== METADATA_POINTER_SIZE
        || !member
        || member.length !== TOKEN_GROUP_MEMBER_SIZE
    ){
        return false;
    }

    let memberMint = publicKeyAt(member, 0);
    if(memberMint !== canonicalMint){
        return false;
    }
    return isSeekerGenesisToken({
        mintAddress: canonicalMint,
        ownerAmount: '1',
        mintAuthority: mintAuthority,
        metadataPointerAuthority: publicKeyAt(metadata, 0),
        metadataAddress: publicKeyAt(metadata, 32),
        groupAddress: publicKeyAt(member, 32)
    });
}

function positiveTokenMintAddresses(accounts)
{
    if(!Array.isArray(accounts)){
        return [];
    }
    let unique = new Set();
    for(let value of accounts){
        if(!value || 'object' !== typeof value){
            continue;
        }
        let info = value?.account?.data?.parsed?.info;
        if('string' !== typeof info?.mint || 'string' !== typeof info?.tokenAmount?.amount){
            continue;
        }
        if(!/^\d+$/.test(info.tokenAmount.amount) || BigInt(info.tokenAmount.amount) <= 0n){
            continue;
        }
        let mint = canonicalPublicKey(info.mint);
        if(mint){
            unique.add(mint);
        }
    }
    return [...unique];
}

function boundedPositiveTokenMintAddresses(accounts)
{
    if(!Array.isArray(accounts) || accounts.length > MAX_SEEKER_TOKEN_ACCOUNTS){
        return null;
    }
    let mints = positiveTokenMintAddresses(accounts);
    return mints.length <= MAX_SEEKER_TOKEN_MINTS ? mints : null;
}

/**
 * Minimal JSON-RPC transport: POST a jsonrpc 2.0 request to the RPC URL and
 * return data.result, throwing on HTTP errors or RPC errors.
 *
 * @param {string} rpcUrl
 * @param {string} method
 * @param {Array<*>} params
 * @param {AbortSignal} [signal]
 * @returns {Promise<*>}
 */
async function seekerRpcResult(rpcUrl, method, params, signal)
{
    let res = await fetch(rpcUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method: method, params: params}),
        signal: signal
    });
    if(!res.ok){
        throw new Error('RPC request failed with status '+res.status);
    }
    let data = await res.json();
    if(data.error){
        throw new Error('RPC error: '+JSON.stringify(data.error));
    }
    return data.result;
}

/**
 * Find every verified NFT token the wallet owns, or null on any
 * RPC/parse/bound failure.
 *
 * @param {string} walletAddress
 * @param {string} [rpcUrl]
 * @param {AbortSignal} [signal]
 * @param {string} [requiredMint]
 * @returns {Promise<Array<Object>|null>}
 */
async function findSeekerGenesisTokens(walletAddress, rpcUrl = readEnvIdentity().rpcUrl, signal, requiredMint)
{
    let owner = canonicalPublicKey(walletAddress);
    let canonicalRequiredMint = undefined === requiredMint ? undefined : canonicalPublicKey(requiredMint);
    if(!rpcUrl || !owner || (undefined !== requiredMint && !canonicalRequiredMint)){
        return null;
    }

    let mints;
    let slot;
    try {
        let result = await seekerRpcResult(
            rpcUrl,
            'getTokenAccountsByOwner',
            [
                owner,
                {programId: TOKEN_2022_PROGRAM_ID},
                {commitment: 'confirmed', encoding: 'jsonParsed'}
            ],
            signal
        );
        let addresses = boundedPositiveTokenMintAddresses(result?.value);
        if(!addresses){
            return null;
        }
        if(canonicalRequiredMint){
            if(!addresses.includes(canonicalRequiredMint)){
                return null;
            }
            mints = [canonicalRequiredMint];
        } else {
            mints = [...addresses].sort();
        }
        slot = Number.isSafeInteger(result?.context?.slot) ? result.context.slot : null;
    } catch (error) {
        return null;
    }

    let verified = [];
    for(let offset = 0; offset < mints.length; offset += MINT_BATCH_SIZE){
        let batch = mints.slice(offset, offset + MINT_BATCH_SIZE);
        try {
            let result = await seekerRpcResult(
                rpcUrl,
                'getMultipleAccounts',
                [batch, {commitment: 'confirmed', encoding: 'base64'}],
                signal
            );
            if(!Array.isArray(result?.value) || result.value.length !== batch.length){
                return null;
            }
            for(let i = 0; i < batch.length; i++){
                let mint = batch[i];
                if(mint && decodeSeekerGenesisMint(mint, result.value[i])){
                    verified.push({mint: mint, slot: slot});
                }
            }
        } catch (error) {
            return null;
        }
    }
    return verified;
}

/**
 * The first verified NFT token the wallet owns, or null.
 *
 * @param {string} walletAddress
 * @param {string} [rpcUrl]
 * @param {AbortSignal} [signal]
 * @param {string} [requiredMint]
 * @returns {Promise<Object|null>}
 */
async function findSeekerGenesisToken(walletAddress, rpcUrl = readEnvIdentity().rpcUrl, signal, requiredMint)
{
    let tokens = await findSeekerGenesisTokens(walletAddress, rpcUrl, signal, requiredMint);
    return tokens?.[0] ?? null;
}

module.exports.TOKEN_2022_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;
Object.defineProperty(module.exports, 'NFT_MINT_AUTHORITY', {get: nftMintAuthority});
Object.defineProperty(module.exports, 'NFT_METADATA_ADDRESS', {get: nftMetadataAddress});
Object.defineProperty(module.exports, 'NFT_GROUP_ADDRESS', {get: nftGroupAddress});
module.exports.MINT_BASE_SIZE = MINT_BASE_SIZE;
module.exports.TOKEN_ACCOUNT_BASE_SIZE = TOKEN_ACCOUNT_BASE_SIZE;
module.exports.METADATA_POINTER_EXTENSION = METADATA_POINTER_EXTENSION;
module.exports.TOKEN_GROUP_MEMBER_EXTENSION = TOKEN_GROUP_MEMBER_EXTENSION;
module.exports.METADATA_POINTER_SIZE = METADATA_POINTER_SIZE;
module.exports.TOKEN_GROUP_MEMBER_SIZE = TOKEN_GROUP_MEMBER_SIZE;
module.exports.MAX_MINT_ACCOUNT_BYTES = MAX_MINT_ACCOUNT_BYTES;
module.exports.MINT_BATCH_SIZE = MINT_BATCH_SIZE;
module.exports.MAX_SEEKER_TOKEN_ACCOUNTS = MAX_SEEKER_TOKEN_ACCOUNTS;
module.exports.MAX_SEEKER_TOKEN_MINTS = MAX_SEEKER_TOKEN_MINTS;
module.exports.isSeekerGenesisToken = isSeekerGenesisToken;
module.exports.verifiedSeekerGenesisTokenMint = verifiedSeekerGenesisTokenMint;
module.exports.canonicalPublicKey = canonicalPublicKey;
module.exports.publicKeyAt = publicKeyAt;
module.exports.extensionData = extensionData;
module.exports.accountData = accountData;
module.exports.decodeSeekerGenesisMint = decodeSeekerGenesisMint;
module.exports.positiveTokenMintAddresses = positiveTokenMintAddresses;
module.exports.boundedPositiveTokenMintAddresses = boundedPositiveTokenMintAddresses;
module.exports.seekerRpcResult = seekerRpcResult;
module.exports.findSeekerGenesisTokens = findSeekerGenesisTokens;
module.exports.findSeekerGenesisToken = findSeekerGenesisToken;
