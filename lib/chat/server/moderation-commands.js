/**
 *
 * Reldens - ModerationChatCommands
 *
 * Pure parser for in-chat moderation commands (/kick, /mute, /jail, ...).
 * Invalid arguments remain parsed commands so they are intercepted instead of
 * leaking into ordinary chat; the policy service returns the usage notice.
 *
 */

const MODERATION_COMMAND_REASON_MAX = 500;
const MODERATION_COMMAND_MINUTES_MAX = 10 * 365 * 24 * 60;

const DEFAULT_REASON = 'No reason specified';

function cleanReason(raw)
{
    const reason = raw.trim().slice(0, MODERATION_COMMAND_REASON_MAX);
    return reason || DEFAULT_REASON;
}

function cleanName(raw)
{
    const name = raw.trim().replace(/\s+/g, ' ');
    return name || null;
}

function parseQuotedName(rest)
{
    const match = /^"([^"]*)"(?:\s+([\s\S]*))?$/.exec(rest.trim());
    if(!match){
        return null;
    }
    return {name: cleanName(match[1]), rest: (match[2] ?? '').trim()};
}

function parseNamed(rest)
{
    const parsed = parseQuotedName(rest);
    if(!parsed){
        return {name: null, reason: DEFAULT_REASON};
    }
    return {name: parsed.name, reason: cleanReason(parsed.rest)};
}

function parseNamedTimed(rest)
{
    const named = parseQuotedName(rest);
    if(!named){
        return {name: null, minutes: null, reason: DEFAULT_REASON};
    }
    const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(named.rest);
    if(!match){
        return {name: named.name, minutes: null, reason: DEFAULT_REASON};
    }
    const parsed = /^\d+$/.test(match[1]) ? Number(match[1]) : null;
    const minutes = parsed !== null
        && Number.isSafeInteger(parsed)
        && parsed >= 1
        && parsed <= MODERATION_COMMAND_MINUTES_MAX
            ? parsed
            : null;
    return {name: named.name, minutes, reason: cleanReason(match[2] ?? '')};
}

function parseSpectateName(rest)
{
    const trimmed = rest.trim();
    if(!trimmed.startsWith('"')){
        return cleanName(trimmed);
    }
    const parsed = parseQuotedName(trimmed);
    return parsed?.rest === '' ? parsed.name : null;
}

function parseOptionalQuotedName(rest)
{
    const trimmed = rest.trim();
    if(!trimmed){
        return {name: null, malformed: false};
    }
    const parsed = parseQuotedName(trimmed);
    if(!parsed || parsed.rest !== ''){
        return {name: null, malformed: true};
    }
    return {name: parsed.name, malformed: parsed.name === null};
}

// /jail: no arguments = the moderator's own jail visit. Jailing a player
// REQUIRES a quoted name and a sentence length in minutes (there is no
// indefinite form; that ambiguity invited mistakes), then an optional reason,
// quoted or bare. Anything else is malformed (the usage notice).
function parseJailArguments(rest)
{
    const trimmed = rest.trim();
    if(!trimmed){
        return {name: null, minutes: null, reason: null, malformed: false};
    }
    const invalid = {name: null, minutes: null, reason: null, malformed: true};
    const parsed = parseQuotedName(trimmed);
    if(!parsed || parsed.name === null){
        return invalid;
    }
    const match = /^(\d+)(?:\s+([\s\S]*))?$/.exec(parsed.rest);
    const minutes = match ? Number(match[1]) : null;
    if(
        minutes === null
        || !Number.isSafeInteger(minutes)
        || minutes < 1
        || minutes > MODERATION_COMMAND_MINUTES_MAX
    ){
        return invalid;
    }
    let reasonRaw = (match?.[2] ?? '').trim();
    const quoted = /^"([^"]*)"$/.exec(reasonRaw);
    if(quoted){
        reasonRaw = quoted[1].trim();
    }
    return {
        name: parsed.name,
        minutes,
        reason: reasonRaw ? cleanReason(reasonRaw) : null,
        malformed: false,
    };
}

function parseModerationChatCommand(text)
{
    const trimmed = text.trim();
    const kick = /^\/kick(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(kick){
        return {kind: 'kick', ...parseNamed(kick[1] ?? '')};
    }
    const kill = /^\/kill(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(kill){
        return {kind: 'kill', ...parseNamed(kill[1] ?? '')};
    }
    const forceRename = /^\/forcerename(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(forceRename){
        return {kind: 'forcerename', ...parseNamed(forceRename[1] ?? '')};
    }
    const mute = /^\/mute(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(mute){
        return {kind: 'mute', ...parseNamedTimed(mute[1] ?? '')};
    }
    const ban = /^\/ban(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(ban){
        return {kind: 'ban', ...parseNamed(ban[1] ?? '')};
    }
    const suspend = /^\/suspend(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(suspend){
        return {kind: 'suspend', ...parseNamedTimed(suspend[1] ?? '')};
    }
    const spectate = /^\/spectate(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(spectate){
        return {kind: 'spectate', name: parseSpectateName(spectate[1] ?? '')};
    }
    if(/^\/unspectate$/i.test(trimmed)){
        return {kind: 'unspectate'};
    }
    const jail = /^\/jail(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(jail){
        return {kind: 'jail', ...parseJailArguments(jail[1] ?? '')};
    }
    const unjail = /^\/unjail(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if(unjail){
        return {kind: 'unjail', ...parseOptionalQuotedName(unjail[1] ?? '')};
    }
    return null;
}

module.exports = {
    MODERATION_COMMAND_REASON_MAX,
    MODERATION_COMMAND_MINUTES_MAX,
    parseModerationChatCommand,
};
