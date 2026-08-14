/**
 *
 * Reldens - ChatMutesEntityOverride
 *
 * Extends the chat mutes entity for the admin panel.
 *
 */

const { ChatMutesEntity } = require('../../../../generated-entities/entities/chat-mutes-entity');

class ChatMutesEntityOverride extends ChatMutesEntity
{

    /**
     * @param {Object} extraProps
     * @returns {Object}
     */
    static propertiesConfig(extraProps)
    {
        let config = super.propertiesConfig(extraProps);
        config.navigationPosition = 1010;
        return config;
    }

}

module.exports.ChatMutesEntityOverride = ChatMutesEntityOverride;
