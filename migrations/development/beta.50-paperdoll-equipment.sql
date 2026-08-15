--
-- Reldens - Vibecraft paper-doll equipment (T2.1)
--
-- Completes the equipment paper-doll to Kaetram slot parity. The core already
-- ships the equip/unequip + modifier pipeline (lib/inventory/server/message-actions.js
-- + @reldens/items-system Equipment type + @reldens/modifiers) and a data-driven
-- client that renders one slot box per items_group row. The only missing piece is
-- DATA: the slot groups and the equipment items that populate them.
--
-- Before this migration the sample data defines 6 equipment groups (weapon,
-- shield, armor=chest, boots, gauntlets, helmet). This adds the 6 missing
-- Kaetram slots -> 12 total (11 Kaetram + our bonus "gauntlets"):
--
--   weapon(1) shield(2) armor/chest(3) boots(4) gauntlets(5) helmet(6)
--   legs(200) cape(201) pendant(202) ring(203, items_limit 2) arrows(204) skins(205)
--
-- Each slot seeds one starter equipment item (type 1 = equipment) wired to its
-- group with flat stat modifiers (operation 1 = increment) against the real
-- player stat paths (stats/atk, stats/def, stats/dodge, stats/speed, stats/aim).
-- "skins" is cosmetic (no modifier). Ring allows two pieces (items_limit 2).
--
-- Ids 200+ avoid the sample data (1-6), vibecraft demo (100-113) and the
-- creature mechanics (400+). Safe to re-run (REPLACE). No new tables, so no
-- `reldens generateEntities` is required (items_group / items_item /
-- items_item_modifiers already exist).
--
-- Group icons (files_name) are placeholders reusing existing CC0 icons until
-- the real slot sprites are selected (asset pipeline, T1/roadmap). They keep
-- the client group box rendering a valid icon instead of a broken image.
--
-- Requires: reldens-install + reldens-sample-data (groups 1-6 and the stats
-- key/label set) applied first.
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- EQUIPMENT SLOT GROUPS (the 6 missing Kaetram slots)
-- ============================================================
REPLACE INTO `items_group` (`id`, `key`, `label`, `description`, `files_name`, `sort`, `items_limit`, `limit_per_item`) VALUES
    (200, 'legs', 'Legs', 'Leg armor.', 'armor.png', 7, 1, 0),
    (201, 'cape', 'Cape', 'Back cape.', 'armor.png', 8, 1, 0),
    (202, 'pendant', 'Pendant', 'Neck pendant.', 'crystal_shard.png', 9, 1, 0),
    (203, 'ring', 'Ring', 'Finger ring (two can be worn).', 'coins.png', 10, 2, 0),
    (204, 'arrows', 'Arrows', 'Ammunition quiver.', 'weapon.png', 11, 1, 0),
    (205, 'skins', 'Skin', 'Cosmetic appearance.', 'helmet.png', 12, 1, 0);

-- ============================================================
-- STARTER EQUIPMENT ITEMS (one per slot, type 1 = equipment)
-- ============================================================
REPLACE INTO `items_item` (`id`, `key`, `type`, `group_id`, `label`, `description`, `qty_limit`, `uses_limit`, `useTimeOut`, `execTimeOut`, `customData`) VALUES
    (200, 'starter_sword', 1, 1, 'Starter Sword', 'A reliable sword for a first adventure.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (201, 'wooden_shield', 1, 2, 'Wooden Shield', 'A simple shield carved from wood.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (202, 'leather_armor', 1, 3, 'Leather Armor', 'Tough leather chest armor.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (203, 'leather_boots', 1, 4, 'Leather Boots', 'Sturdy boots for long journeys.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (204, 'leather_gloves', 1, 5, 'Leather Gloves', 'Gloves that protect the hands.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (205, 'leather_helmet', 1, 6, 'Leather Helmet', 'A padded leather helmet.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (206, 'leather_legs', 1, 200, 'Leather Legs', 'Leg guards made of leather.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (207, 'adventurer_cape', 1, 201, 'Adventurer Cape', 'A light cape favored by travelers.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (208, 'copper_pendant', 1, 202, 'Copper Pendant', 'A protective pendant of copper.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (209, 'copper_ring', 1, 203, 'Copper Ring', 'A simple ring of copper.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (210, 'iron_ring', 1, 203, 'Iron Ring', 'A sturdy iron ring.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (211, 'wooden_arrows', 1, 204, 'Wooden Arrows', 'A quiver of wooden arrows.', 0, 0, NULL, NULL, '{"canBeDropped":true}'),
    (212, 'traveler_skin', 1, 205, 'Traveler Skin', 'A cosmetic appearance for the road.', 0, 0, NULL, NULL, '{"canBeDropped":true}');

-- ============================================================
-- STAT MODIFIERS (operation 1 = flat increment; skins = cosmetic)
-- ============================================================
REPLACE INTO `items_item_modifiers` (`id`, `item_id`, `key`, `property_key`, `operation`, `value`, `maxProperty`) VALUES
    (200, 200, 'atk', 'stats/atk', 1, '6', NULL),
    (201, 201, 'def', 'stats/def', 1, '4', NULL),
    (202, 202, 'def', 'stats/def', 1, '5', NULL),
    (203, 203, 'speed', 'stats/speed', 1, '4', NULL),
    (204, 203, 'dodge', 'stats/dodge', 1, '2', NULL),
    (205, 204, 'atk', 'stats/atk', 1, '2', NULL),
    (206, 205, 'def', 'stats/def', 1, '3', NULL),
    (207, 206, 'def', 'stats/def', 1, '4', NULL),
    (208, 207, 'dodge', 'stats/dodge', 1, '3', NULL),
    (209, 208, 'def', 'stats/def', 1, '3', NULL),
    (210, 209, 'atk', 'stats/atk', 1, '1', NULL),
    (211, 209, 'def', 'stats/def', 1, '1', NULL),
    (212, 210, 'def', 'stats/def', 1, '2', NULL),
    (213, 211, 'aim', 'stats/aim', 1, '3', NULL);

SET FOREIGN_KEY_CHECKS = 1;
