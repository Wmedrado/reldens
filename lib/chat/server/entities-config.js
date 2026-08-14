/**
 *
 * Reldens - Entities Config
 *
 */

const { ChatEntityOverride } = require('./entities/chat-entity-override');
const { ChatMessageTypesEntityOverride } = require('./entities/chat-message-types-entity-override');
const { ChatMutesEntityOverride } = require('./entities/chat-mutes-entity-override');
const { ChatQuotasEntityOverride } = require('./entities/chat-quotas-entity-override');

module.exports.entitiesConfig = {
    chat: ChatEntityOverride,
    chatMessageTypes: ChatMessageTypesEntityOverride,
    chatMutes: ChatMutesEntityOverride,
    chatQuotas: ChatQuotasEntityOverride
};
