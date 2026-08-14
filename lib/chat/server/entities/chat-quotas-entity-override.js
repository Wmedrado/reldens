/**
 *
 * Reldens - ChatQuotasEntityOverride
 *
 * Extends the chat quotas entity for the admin panel.
 *
 */

const { ChatQuotasEntity } = require('../../../../generated-entities/entities/chat-quotas-entity');

class ChatQuotasEntityOverride extends ChatQuotasEntity
{

    /**
     * @param {Object} extraProps
     * @returns {Object}
     */
    static propertiesConfig(extraProps)
    {
        let config = super.propertiesConfig(extraProps);
        config.navigationPosition = 1011;
        return config;
    }

}

module.exports.ChatQuotasEntityOverride = ChatQuotasEntityOverride;
