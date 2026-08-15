--
-- Reldens - Vibecraft NPC dialogue (T3.4)
--
-- Enriches the capital NPCs' dialogue to proper VibeCraft (PT-BR) flavor and
-- fixes the language inconsistency: the NPCs spoke English one-liners while the
-- signs and the wiki are PT-BR. This REPLACEs only the client_params (content +
-- option labels) of the 5 existing capital NPCs, keeping every functional field
-- (id, tile, class_type, object_class_key, private_params, option value/key/icon)
-- untouched so the action wiring (buy/sell, blacksmith weapons, healer HP/MP)
-- keeps working. No new objects, no new sprites, no map changes.
--
-- Idempotent (REPLACE). Requires capital-content-v1.sql (objects 112-116) first.
--

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- CAPITAL NPC DIALOGUE (PT-BR flavor)
-- ============================================================
REPLACE INTO `objects` (`id`, `room_id`, `layer_name`, `tile_index`, `class_type`, `object_class_key`, `client_key`, `title`, `private_params`, `client_params`, `enabled`) VALUES
    (112, 101, 'house-collisions-over-player', 498, 5, 'capital_mercador', 'merchant_1', 'Mercador da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Bem-vindo à minha loja, aventureiro! Tenho armas, armaduras e equipamentos para a sua jornada. O que deseja fazer?","options":{"buy":{"label":"Comprar","value":"buy"},"sell":{"label":"Vender","value":"sell"}}}', 1),
    (113, 101, 'house-collisions-over-player', 508, 3, 'capital_ferreiro', 'weapons_master_1', 'Ferreiro da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Sou o ferreiro da Capital. Forjo armas para quem enfrenta os perigos da floresta. Escolha a sua e boa caçada!","options":{"1":{"key":"axe","label":"Machado","value":1,"icon":"axe"},"2":{"key":"spear","label":"Lança","value":2,"icon":"spear"}},"ui":true}', 1),
    (114, 101, 'house-collisions-over-player', 358, 3, 'capital_quests', 'quest_npc_1', 'Avisos da Capital', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Olá, viajante! Chegou em boa hora. Tenho moedas para quem me trouxer um galho de árvore. Topa?","options":{"1":{"label":"Claro!","value":1},"2":{"label":"Agora não, obrigado.","value":2}},"ui":true}', 1),
    (115, 101, 'house-collisions-over-player', 554, 3, 'capital_healer', 'healer_1', 'Curadora', '{"runOnAction":true,"playerVisible":true,"sendInvalidOptionMessage":true}', '{"content":"Bem-vindo, viajante. Posso restaurar sua vitalidade e sua mana. O que você precisa?","options":{"1":{"label":"Curar HP","value":1},"2":{"label":"Nada por enquanto","value":2},"3":{"label":"Restaurar MP","value":3}},"ui":true}', 1),
    (116, 101, 'house-collisions-over-player', 560, 12, 'capital_banker', 'banker_1', 'Banqueiro', '{"runOnAction":true,"playerVisible":true}', '{"content":"Bem-vindo ao banco da Capital. Aqui seu ouro e seus pertences ficam em segurança. Em que posso ajudar?","ui":true}', 1);

SET FOREIGN_KEY_CHECKS = 1;
