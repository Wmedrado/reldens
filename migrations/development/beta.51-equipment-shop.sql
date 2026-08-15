--
-- Reldens - Vibecraft equipment shop (T2.1 + T3.5)
--
-- Makes the beta.50 paper-doll starter equipment obtainable by stocking it in
-- the capital general merchant (object 112, class_type 5 trader). No new
-- objects, no new tiles: this only extends the existing shop's inventory,
-- buy prices and sell prices for the 13 starter equipment items.
--
-- Contract (same as the sample merchant + capital-content-v1):
--   objects_items_inventory  -> merchant stock (qty -1 = unlimited)
--   objects_items_requirements -> buy price (required_item_key 'coins' = soft currency)
--   objects_items_rewards    -> sell price (Kaetram-style price decay ~50% of buy)
--
-- Ids 200+ avoid the merchant's existing rows (inventory 9-12, requirements
-- 8-11, rewards 8-11) and the creature/drop-table namespace (400+). Safe to
-- re-run (REPLACE).
--
-- Requires: beta.50-paperdoll-equipment.sql (items 200-212) applied first, so
-- the objects_items_inventory.item_id FK resolves.
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- MERCHANT STOCK (object 112): the 13 starter equipment items
-- ============================================================
REPLACE INTO `objects_items_inventory` (`id`, `owner_id`, `item_id`, `qty`, `remaining_uses`, `is_active`) VALUES
    (200, 112, 200, -1, -1, 0),
    (201, 112, 201, -1, -1, 0),
    (202, 112, 202, -1, -1, 0),
    (203, 112, 203, -1, -1, 0),
    (204, 112, 204, -1, -1, 0),
    (205, 112, 205, -1, -1, 0),
    (206, 112, 206, -1, -1, 0),
    (207, 112, 207, -1, -1, 0),
    (208, 112, 208, -1, -1, 0),
    (209, 112, 209, -1, -1, 0),
    (210, 112, 210, -1, -1, 0),
    (211, 112, 211, -1, -1, 0),
    (212, 112, 212, -1, -1, 0);

-- ============================================================
-- BUY PRICES (coins)
-- ============================================================
REPLACE INTO `objects_items_requirements` (`id`, `object_id`, `item_key`, `required_item_key`, `required_quantity`, `auto_remove_requirement`) VALUES
    (200, 112, 'starter_sword', 'coins', 20, 1),
    (201, 112, 'wooden_shield', 'coins', 15, 1),
    (202, 112, 'leather_armor', 'coins', 25, 1),
    (203, 112, 'leather_boots', 'coins', 12, 1),
    (204, 112, 'leather_gloves', 'coins', 10, 1),
    (205, 112, 'leather_helmet', 'coins', 15, 1),
    (206, 112, 'leather_legs', 'coins', 18, 1),
    (207, 112, 'adventurer_cape', 'coins', 20, 1),
    (208, 112, 'copper_pendant', 'coins', 22, 1),
    (209, 112, 'copper_ring', 'coins', 12, 1),
    (210, 112, 'iron_ring', 'coins', 18, 1),
    (211, 112, 'wooden_arrows', 'coins', 8, 1),
    (212, 112, 'traveler_skin', 'coins', 50, 1);

-- ============================================================
-- SELL PRICES (coins, ~50% of buy)
-- ============================================================
REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
    (200, 112, 'starter_sword', 'coins', 10, 0),
    (201, 112, 'wooden_shield', 'coins', 7, 0),
    (202, 112, 'leather_armor', 'coins', 12, 0),
    (203, 112, 'leather_boots', 'coins', 6, 0),
    (204, 112, 'leather_gloves', 'coins', 5, 0),
    (205, 112, 'leather_helmet', 'coins', 7, 0),
    (206, 112, 'leather_legs', 'coins', 9, 0),
    (207, 112, 'adventurer_cape', 'coins', 10, 0),
    (208, 112, 'copper_pendant', 'coins', 11, 0),
    (209, 112, 'copper_ring', 'coins', 6, 0),
    (210, 112, 'iron_ring', 'coins', 9, 0),
    (211, 112, 'wooden_arrows', 'coins', 4, 0),
    (212, 112, 'traveler_skin', 'coins', 25, 0);

SET FOREIGN_KEY_CHECKS = 1;
