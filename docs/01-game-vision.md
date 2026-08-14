# 01 — Visão do Jogo, Nome e Posicionamento

> Camada de produto. Define **o que** é o jogo, **para quem**, **por que** existe e
> **como se chama**. Complementa `02-game-mechanics.md` (mecânicas) e
> `03-technical-architecture.md` (tecnologia).

---

## 1. Referência principal: Pixels.xyz

**Pixels.xyz** é o maior jogo Web3 social/farming por usuários. É nosso benchmark
direto. Resumo do modelo que queremos aproximar:

- **Gênero**: MMO 2D browser, top-down, pixel-art, mundo aberto com hub social.
- **Core loop**: adquirir **terra NFT** → **plantar/colher** → **craftar/cozinhar** →
  **vender/ganhar** tokens → reinvestir em terra/upgrades.
- **Sistemas-chave**: farming (ciclos reais de crescimento), energia (recurso por ação,
  regenera), skills (farming, cooking, woodcutting, mining, fishing, beekeeping,
  animal husbandry), crafting/cooking, quests/tasks, guilds, pets, VIP.
- **Economia**: token de utilidade (**$PIXEL**) + moeda soft in-game (**$BERRY**),
  VIP por assinatura, terras NFT com tiers/raridade.
- **Público**: jogadores casuais de browser + holders Web3; entrada free-to-play,
  monetização via land NFT, VIP e marketplace.

**O que copiamos (conceito)** e **o que adaptamos** estão detalhados em
`02-game-mechanics.md`.

---

## 2. Nome e branding (DECISÃO EM ABERTO)

O nome precisa: ser curto, pronunciável em PT e EN, evocar pixel/fazenda, e ter
domínio/social disponível (verificar antes de travar).

### Opções propostas

| Nome | Significado | Prós | Contras |
|---|---|---|---|
| **PixVale** ⭐ (recomendado) | "Pixel" + "Vale" (vale fértil). Ecoa "Pixels" sem colidir. | Funciona PT/EN; fácil de dizer; evoca fazenda/território. | Verificar disponibilidade de `pixvale.com`/handle. |
| **Terrapix** | "Terra" + "Pixel". | Foco em terra/farming. | Menos fluido. |
| **Gleba** | Solo fértil (PT). | Único, identidade forte, raiz BR. | Pode soar estranho em EN; domínio raro. |
| **Pixaria** | "Pixel" + sufixo lúdico. | Leve e memorável. | Parece genérico. |
| **Solanum** | Gênero botânico (plantas) + eco de "Solana". | Sofisticado; liga chain+natureza. | Pronuncia ambígua; já usado por outros projetos. |
| **BlockFarm / BitFarm** | Literal. | Óbvio. | Genérico, sem identidade. |

**Recomendação**: **PixVale** como nome provisório de trabalho (usado neste doc),
com decisão final após checagem de domínio/marca. Manter um **nome de código
interno** (`cloudcraft`, `reldens-web3`) para não bloquear desenvolvimento.

### Diretrizes de marca

- Tagline candidata: *"Plante. Crie. Explore. Ganhe."*
- Identidade visual: pixel-art 16x16 coerente (ver `kaetram-map/07-asset-map-cc0.md`),
  paleta própria, paper-doll do personagem comissionado (é o asset NFT mais importante).
- Tom: casual, acolhedor, "cozy farming + aventura".

---

## 3. Proposta de valor

| Para quem | O que entregamos |
|---|---|
| Jogador casual | Um MMO de fazenda/aventura divertido **sem precisar entender de crypto**. |
| Holder Web3 | Ativos reais (terra, itens, pets) que **valem fora do jogo** (NFT), economia transparente on-chain. |
| Dev/estúdio | Plataforma Reldens customizada, **extensível** (todo conteúdo é data-driven). |

**Diferencial vs Pixels**: rodamos sobre **Reldens** (framework autoritativo pronto,
com rooms/Colyseus/Phaser/skills/items/modifiers), o que acelera MUITO o
desenvolvimento por IA; e mantemos **guest mode** (já nativo) para aquisição sem
atrito, com NFT como upgrade opcional.

---

## 4. Posicionamento e princípios de design

1. **Fun-first, earn-second**: a jogabilidade funciona sozinha; o token/NFT amplifica,
   não é pré-requisito para se divertir.
2. **Economia sustentável**: sinks (energia, crafting, taxas) > faucets (drops), para
   evitar inflação. Evitar modelo ponzi (ver `02` §economia).
3. **Não-custodial**: o jogador detém as chaves; o servidor assina/verifica, nunca
   detém fundos (invariante do `lib/blockchain`).
4. **Autoritativo mas leve**: lógica no servidor; cliente só renderiza (padrão Reldens).
5. **Conteúdo como dado**: itens, quests, receitas, mobs, drops em JSON validado;
   código genérico + dados de balanceamento (padrão herdado do Kaetram, reimplementado).
6. **Anti-bot por design**: wallet auth + rate limit + throttling + drops server-side.

---

## 5. Critérios de sucesso (MVP → v1)

### MVP (jogável, sem chain obrigatório)

- [ ] Login/guest + link de wallet (já pronto).
- [ ] 1 mapa town + 1 área de farming com tilesets CC0.
- [ ] Farming básico (plantar/colher) + inventário.
- [ ] Crafting básico (receitas → itens).
- [ ] Energia (regen + custo por ação).
- [ ] Quests simples (task board + claim).
- [ ] Shop NPC (compra/venda com moeda soft).
- [ ] Chat + moderação (já pronto).

### v1 (Web3)

- [ ] Terras NFT (mint/verify) como pré-requisito de plots premium.
- [ ] Itens NFT (mint em craft/conquista, badge no inventário, burn).
- [ ] Token de utilidade + faucets/sinks on-chain.
- [ ] Marketplace/transfer de itens NFT.
- [ ] VIP (holding/assinatura) com boost de energia/xp/drops.

---

## 6. Riscos de produto

| Risco | Mitigação |
|---|---|
| Regulatório (token = security?) | Token de utilidade puro; consultar advogado antes de listar. |
| Gas/custo por tx | L2/chain de baixo custo; batch de operações; assinatura off-chain. |
| Bot farms | rate limit + wallet auth + drops server-side + energia. |
| Economia inflacionária | Sinks > faucets; cap de supply; seasons. |
| Licença de assets | Processo de auditoria obrigatório (`07-asset-map-cc0.md`). |
