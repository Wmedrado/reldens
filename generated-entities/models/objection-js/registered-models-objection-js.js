/**
 *
 * Reldens - Registered Models
 *
 */

const { AchievementsModel } = require('./achievements-model');
const { AdsBannerModel } = require('./ads-banner-model');
const { AdsModel } = require('./ads-model');
const { AdsEventVideoModel } = require('./ads-event-video-model');
const { AdsPlayedModel } = require('./ads-played-model');
const { AdsProvidersModel } = require('./ads-providers-model');
const { AdsTypesModel } = require('./ads-types-model');
const { AudioCategoriesModel } = require('./audio-categories-model');
const { AudioModel } = require('./audio-model');
const { AudioMarkersModel } = require('./audio-markers-model');
const { AudioPlayerConfigModel } = require('./audio-player-config-model');
const { BankItemsModel } = require('./bank-items-model');
const { BlockchainFaucetClaimsModel } = require('./blockchain-faucet-claims-model');
const { BlockchainNftOpsModel } = require('./blockchain-nft-ops-model');
const { BlockchainWalletChallengesModel } = require('./blockchain-wallet-challenges-model');
const { BlockchainWalletsModel } = require('./blockchain-wallets-model');
const { BlockedIpsModel } = require('./blocked-ips-model');
const { ChatModel } = require('./chat-model');
const { ChatMessageTypesModel } = require('./chat-message-types-model');
const { ChatMutesModel } = require('./chat-mutes-model');
const { ChatQuotasModel } = require('./chat-quotas-model');
const { ClanModel } = require('./clan-model');
const { ClanLevelsModel } = require('./clan-levels-model');
const { ClanLevelsModifiersModel } = require('./clan-levels-modifiers-model');
const { ClanMembersModel } = require('./clan-members-model');
const { ConfigModel } = require('./config-model');
const { ConfigTypesModel } = require('./config-types-model');
const { CraftingRecipesModel } = require('./crafting-recipes-model');
const { CraftingRecipesItemsModel } = require('./crafting-recipes-items-model');
const { DropTablesModel } = require('./drop-tables-model');
const { DropTablesItemsModel } = require('./drop-tables-items-model');
const { DropsAnimationsModel } = require('./drops-animations-model');
const { EnchantmentsModel } = require('./enchantments-model');
const { FarmingCropsModel } = require('./farming-crops-model');
const { FarmingPlotsModel } = require('./farming-plots-model');
const { FeaturesModel } = require('./features-model');
const { GatheringResourcesModel } = require('./gathering-resources-model');
const { ItemsGroupModel } = require('./items-group-model');
const { ItemsInventoryModel } = require('./items-inventory-model');
const { ItemsItemModel } = require('./items-item-model');
const { ItemsItemModifiersModel } = require('./items-item-modifiers-model');
const { ItemsTypesModel } = require('./items-types-model');
const { KnexMigrationsDevModel } = require('./knex-migrations-dev-model');
const { KnexMigrationsDevLockModel } = require('./knex-migrations-dev-lock-model');
const { LocaleModel } = require('./locale-model');
const { ObjectsAnimationsModel } = require('./objects-animations-model');
const { ObjectsAssetsModel } = require('./objects-assets-model');
const { ObjectsDamageTypesModel } = require('./objects-damage-types-model');
const { ObjectsDropTablesModel } = require('./objects-drop-tables-model');
const { ObjectsModel } = require('./objects-model');
const { ObjectsItemsInventoryModel } = require('./objects-items-inventory-model');
const { ObjectsItemsRequirementsModel } = require('./objects-items-requirements-model');
const { ObjectsItemsRewardsModel } = require('./objects-items-rewards-model');
const { ObjectsSkillsModel } = require('./objects-skills-model');
const { ObjectsStatsModel } = require('./objects-stats-model');
const { ObjectsTypesModel } = require('./objects-types-model');
const { OperationTypesModel } = require('./operation-types-model');
const { PetsModel } = require('./pets-model');
const { PlayersAchievementsModel } = require('./players-achievements-model');
const { PlayersEnergyModel } = require('./players-energy-model');
const { PlayersModel } = require('./players-model');
const { PlayersPetsModel } = require('./players-pets-model');
const { PlayersQuestsModel } = require('./players-quests-model');
const { PlayersStateModel } = require('./players-state-model');
const { PlayersStatsModel } = require('./players-stats-model');
const { QuestsModel } = require('./quests-model');
const { QuestsObjectivesModel } = require('./quests-objectives-model');
const { QuestsRewardsModel } = require('./quests-rewards-model');
const { RespawnModel } = require('./respawn-model');
const { RewardsModel } = require('./rewards-model');
const { RewardsEventsModel } = require('./rewards-events-model');
const { RewardsEventsStateModel } = require('./rewards-events-state-model');
const { RewardsModifiersModel } = require('./rewards-modifiers-model');
const { RoomsChangePointsModel } = require('./rooms-change-points-model');
const { RoomsModel } = require('./rooms-model');
const { RoomsReturnPointsModel } = require('./rooms-return-points-model');
const { ScoresDetailModel } = require('./scores-detail-model');
const { ScoresModel } = require('./scores-model');
const { SkillsClassLevelUpAnimationsModel } = require('./skills-class-level-up-animations-model');
const { SkillsClassPathModel } = require('./skills-class-path-model');
const { SkillsClassPathLevelLabelsModel } = require('./skills-class-path-level-labels-model');
const { SkillsClassPathLevelSkillsModel } = require('./skills-class-path-level-skills-model');
const { SkillsGroupsModel } = require('./skills-groups-model');
const { SkillsLevelsModel } = require('./skills-levels-model');
const { SkillsLevelsModifiersConditionsModel } = require('./skills-levels-modifiers-conditions-model');
const { SkillsLevelsModifiersModel } = require('./skills-levels-modifiers-model');
const { SkillsLevelsSetModel } = require('./skills-levels-set-model');
const { SkillsOwnersClassPathModel } = require('./skills-owners-class-path-model');
const { SkillsSkillAnimationsModel } = require('./skills-skill-animations-model');
const { SkillsSkillAttackModel } = require('./skills-skill-attack-model');
const { SkillsSkillModel } = require('./skills-skill-model');
const { SkillsSkillGroupRelationModel } = require('./skills-skill-group-relation-model');
const { SkillsSkillOwnerConditionsModel } = require('./skills-skill-owner-conditions-model');
const { SkillsSkillOwnerEffectsConditionsModel } = require('./skills-skill-owner-effects-conditions-model');
const { SkillsSkillOwnerEffectsModel } = require('./skills-skill-owner-effects-model');
const { SkillsSkillPhysicalDataModel } = require('./skills-skill-physical-data-model');
const { SkillsSkillTargetEffectsConditionsModel } = require('./skills-skill-target-effects-conditions-model');
const { SkillsSkillTargetEffectsModel } = require('./skills-skill-target-effects-model');
const { SkillsSkillTypeModel } = require('./skills-skill-type-model');
const { SnippetsModel } = require('./snippets-model');
const { StatsModel } = require('./stats-model');
const { TargetOptionsModel } = require('./target-options-model');
const { UsersModel } = require('./users-model');
const { UsersLocaleModel } = require('./users-locale-model');
const { UsersLoginModel } = require('./users-login-model');
const { PlayersProfessionSkillsModel } = require('./players-profession-skills-model');
const { entitiesConfig } = require('../../entities-config');
const { entitiesTranslations } = require('../../entities-translations');

let rawRegisteredEntities = {
    achievements: AchievementsModel,
    adsBanner: AdsBannerModel,
    ads: AdsModel,
    adsEventVideo: AdsEventVideoModel,
    adsPlayed: AdsPlayedModel,
    adsProviders: AdsProvidersModel,
    adsTypes: AdsTypesModel,
    audioCategories: AudioCategoriesModel,
    audio: AudioModel,
    audioMarkers: AudioMarkersModel,
    audioPlayerConfig: AudioPlayerConfigModel,
    bankItems: BankItemsModel,
    blockchainFaucetClaims: BlockchainFaucetClaimsModel,
    blockchainNftOps: BlockchainNftOpsModel,
    blockchainWalletChallenges: BlockchainWalletChallengesModel,
    blockchainWallets: BlockchainWalletsModel,
    blockedIps: BlockedIpsModel,
    chat: ChatModel,
    chatMessageTypes: ChatMessageTypesModel,
    chatMutes: ChatMutesModel,
    chatQuotas: ChatQuotasModel,
    clan: ClanModel,
    clanLevels: ClanLevelsModel,
    clanLevelsModifiers: ClanLevelsModifiersModel,
    clanMembers: ClanMembersModel,
    config: ConfigModel,
    configTypes: ConfigTypesModel,
    craftingRecipes: CraftingRecipesModel,
    craftingRecipesItems: CraftingRecipesItemsModel,
    dropTables: DropTablesModel,
    dropTablesItems: DropTablesItemsModel,
    dropsAnimations: DropsAnimationsModel,
    enchantments: EnchantmentsModel,
    farmingCrops: FarmingCropsModel,
    farmingPlots: FarmingPlotsModel,
    features: FeaturesModel,
    gatheringResources: GatheringResourcesModel,
    itemsGroup: ItemsGroupModel,
    itemsInventory: ItemsInventoryModel,
    itemsItem: ItemsItemModel,
    itemsItemModifiers: ItemsItemModifiersModel,
    itemsTypes: ItemsTypesModel,
    knexMigrationsDev: KnexMigrationsDevModel,
    knexMigrationsDevLock: KnexMigrationsDevLockModel,
    locale: LocaleModel,
    objectsAnimations: ObjectsAnimationsModel,
    objectsAssets: ObjectsAssetsModel,
    objectsDamageTypes: ObjectsDamageTypesModel,
    objectsDropTables: ObjectsDropTablesModel,
    objects: ObjectsModel,
    objectsItemsInventory: ObjectsItemsInventoryModel,
    objectsItemsRequirements: ObjectsItemsRequirementsModel,
    objectsItemsRewards: ObjectsItemsRewardsModel,
    objectsSkills: ObjectsSkillsModel,
    objectsStats: ObjectsStatsModel,
    objectsTypes: ObjectsTypesModel,
    operationTypes: OperationTypesModel,
    pets: PetsModel,
    playersAchievements: PlayersAchievementsModel,
    playersEnergy: PlayersEnergyModel,
    players: PlayersModel,
    playersPets: PlayersPetsModel,
    playersQuests: PlayersQuestsModel,
    playersState: PlayersStateModel,
    playersStats: PlayersStatsModel,
    quests: QuestsModel,
    questsObjectives: QuestsObjectivesModel,
    questsRewards: QuestsRewardsModel,
    respawn: RespawnModel,
    rewards: RewardsModel,
    rewardsEvents: RewardsEventsModel,
    rewardsEventsState: RewardsEventsStateModel,
    rewardsModifiers: RewardsModifiersModel,
    roomsChangePoints: RoomsChangePointsModel,
    rooms: RoomsModel,
    roomsReturnPoints: RoomsReturnPointsModel,
    scoresDetail: ScoresDetailModel,
    scores: ScoresModel,
    skillsClassLevelUpAnimations: SkillsClassLevelUpAnimationsModel,
    skillsClassPath: SkillsClassPathModel,
    skillsClassPathLevelLabels: SkillsClassPathLevelLabelsModel,
    skillsClassPathLevelSkills: SkillsClassPathLevelSkillsModel,
    skillsGroups: SkillsGroupsModel,
    skillsLevels: SkillsLevelsModel,
    skillsLevelsModifiersConditions: SkillsLevelsModifiersConditionsModel,
    skillsLevelsModifiers: SkillsLevelsModifiersModel,
    skillsLevelsSet: SkillsLevelsSetModel,
    skillsOwnersClassPath: SkillsOwnersClassPathModel,
    skillsSkillAnimations: SkillsSkillAnimationsModel,
    skillsSkillAttack: SkillsSkillAttackModel,
    skillsSkill: SkillsSkillModel,
    skillsSkillGroupRelation: SkillsSkillGroupRelationModel,
    skillsSkillOwnerConditions: SkillsSkillOwnerConditionsModel,
    skillsSkillOwnerEffectsConditions: SkillsSkillOwnerEffectsConditionsModel,
    skillsSkillOwnerEffects: SkillsSkillOwnerEffectsModel,
    skillsSkillPhysicalData: SkillsSkillPhysicalDataModel,
    skillsSkillTargetEffectsConditions: SkillsSkillTargetEffectsConditionsModel,
    skillsSkillTargetEffects: SkillsSkillTargetEffectsModel,
    skillsSkillType: SkillsSkillTypeModel,
    snippets: SnippetsModel,
    stats: StatsModel,
    targetOptions: TargetOptionsModel,
    users: UsersModel,
    usersLocale: UsersLocaleModel,
    usersLogin: UsersLoginModel,
    playersProfessionSkills: PlayersProfessionSkillsModel
};

module.exports.rawRegisteredEntities = rawRegisteredEntities;

module.exports.entitiesConfig = entitiesConfig;

module.exports.entitiesTranslations = entitiesTranslations;
