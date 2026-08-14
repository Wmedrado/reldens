--
-- Reldens - Shop demo data
--
-- Extends the existing merchant "Gimly" (object id 10, trader class_type 5) with
-- farming and crafting items so the full economy loop works:
--
--   buy carrot_seed -> plant -> harvest carrot -> sell carrot for coins
--   buy wood -> craft wood_plank -> sell wood_plank for coins
--
-- Buy prices are defined by objects_items_requirements (what the player pays to
-- take an item from the shop) and sell prices by objects_items_rewards (what the
-- player receives when selling an item to the shop).
--

SET FOREIGN_KEY_CHECKS = 0;

-- Stock the shop with farming/crafting raw materials:
REPLACE INTO `objects_items_inventory` (`id`, `owner_id`, `item_id`, `qty`, `remaining_uses`, `is_active`) VALUES
    (7, 10, 9, -1, -1, 0),
    (8, 10, 7, -1, -1, 0);

-- Buy prices (player pays coins to take the item):
REPLACE INTO `objects_items_requirements` (`id`, `object_id`, `item_key`, `required_item_key`, `required_quantity`, `auto_remove_requirement`) VALUES
    (6, 10, 'carrot_seed', 'coins', 10, 1),
    (7, 10, 'wood', 'coins', 5, 1);

-- Sell prices (player receives coins when selling the item):
REPLACE INTO `objects_items_rewards` (`id`, `object_id`, `item_key`, `reward_item_key`, `reward_quantity`, `reward_item_is_required`) VALUES
    (6, 10, 'carrot', 'coins', 15, 0),
    (7, 10, 'wood_plank', 'coins', 8, 0);

SET FOREIGN_KEY_CHECKS = 1;
