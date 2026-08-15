--
-- Reldens - Vibecraft Farm: ambient NPCs (T3.4)
--
-- The farm (room 103) had mobs, gathering nodes, farm plots, a chest and a sign
-- but no living NPCs. This adds two ambient "villager" NPCs (flavor + lore, no
-- shop or combat function) following the capital-content-v1 NPC contract:
-- class_type 3 (multiple) on the farm "ground" layer, a people sprite (52x71
-- frames), PT-BR dialogue with a close button (ui:true) and no animations
-- (static NPC, same as the capital NPCs 112-116).
--
-- Ids continue the farm namespace (406+, right after the mobs 400-405), keeping
-- the sample/demo/capital/town ranges untouched. object_asset_id mirrors the
-- object id (same convention as beta.48/beta.53). Idempotent (REPLACE). No new
-- tables, no sprites, no map changes: reuses people-c-x2.png / people-d-x2.png
-- already under assets/custom/sprites/.
--
-- Tiles verified free (walkable, no collision, no existing object) against
-- vibecraft-farm.json: 454 = Fazendeiro beside the farm plots; 260 = Camponesa
-- beside the entrance sign.
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- OBJECTS (room 103) - ambient NPCs, class_type 3 (multiple)
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (406, 103, 'ground', 454, 3, 'vibecraft_farm_farmer', 'farmer_1', 'Fazendeiro',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Cuido destas roças todos os dias. Plante as sementes, espere crescer e colha na hora certa. As árvores dão madeira e os arbustos dão frutas. Cuidado com as criaturas que rondam o campo!","ui":true}', 1),
    (407, 103, 'ground', 260, 3, 'vibecraft_farm_villager', 'villager_1', 'Camponesa',
     '{"runOnAction":true,"playerVisible":true}',
     '{"content":"Olá, viajante! Esta é a fazenda da Vila. Plante, colha e colete recursos por aqui. O baú no canto guarda tesouros, mas tome cuidado com os monstros. A vila fica ao norte, pelo portão.","ui":true}', 1);

-- ============================================================
-- OBJECTS ASSETS (people sprites, 52x71 frames, static)
-- ============================================================
REPLACE INTO `objects_assets` (`object_asset_id`, `object_id`, `asset_type`, `asset_key`, `asset_file`, `extra_params`) VALUES
    (406, 406, 'spritesheet', 'farmer_1', 'people-c-x2.png', '{"frameWidth":52,"frameHeight":71}'),
    (407, 407, 'spritesheet', 'villager_1', 'people-d-x2.png', '{"frameWidth":52,"frameHeight":71}');

SET FOREIGN_KEY_CHECKS = 1;
