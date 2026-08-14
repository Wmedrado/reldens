# 01 - Visão do Jogo, Nome e Posicionamento

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

## 2. Nome e branding (DECISÃO DO DONO: VibeCraft)

O nome precisa: ser curto, pronunciável em PT e EN, evocar pixel/fazenda, e ter
domínio/social disponível.

### VibeCraft - nome final (decisão do dono, 2026-08-14)

O nome já é usado em outros espaços, e isso foi documentado antes da decisão:

- **CurseForge (Minecraft)**: 11+ modpacks com "VibeCraft" no nome.
- **GitHub**: ~250 repositórios chamados "VibeCraft", incluindo
  `Nearcyan/vibecraft` (~1.4k stars) e `amenti-labs/vibecraft` (ferramenta de IA).
- **Associação ao termo "vibe coding"** dilui identidade própria.

**Conclusão do dono**: apesar da saturação, o jogo **se chama VibeCraft** (decisão
final). Riscos de SEO/marca/domínio aceitos; mitigação por identidade visual e
gameplay próprios. Antes do lançamento: verificar disponibilidade de domínio/social
e diferenciar visualmente dos modpacks de Minecraft.

### Candidatos anteriores (arquivo)

| Nome | Significado | Prós | Contras |
|---|---|---|---|
| **PixVale** | "Pixel" + "Vale" (vale fértil). | Funciona PT/EN; evoca fazenda. | Descartado pelo dono; usar só como referência. |
| **Terrapix** | "Terra" + "Pixel". | Foco em terra/farming. | Menos fluido. |
| **Gleba** | Solo fértil (PT). | Único, identidade forte, raiz BR. | Pode soar estranho em EN. |
| **Pixaria** | "Pixel" + sufixo lúdico. | Leve e memorável. | Parece genérico. |
| **Solanum** | Gênero botânico + eco de "Solana". | Sofisticado; liga chain+natureza. | Pronuncia ambígua; já usado. |
| **BlockFarm / BitFarm** | Literal. | Óbvio. | Genérico, sem identidade. |

**Decisão**: **VibeCraft** é o nome final (usado neste doc e no tema). Não usar
"PixVale" em artefatos novos do jogo.

> **Token atrelado ao nome**: definido após o nome final (ex.: `$CRAFT`, `$FARM`).
> Evitar "VIBE" (colide com o token `VIBE` de outros projetos). O símbolo depende
> da chain escolhida (ver §2.1 abaixo).

### 2.1 Rede (chain) - Ronin ou Solana

O usuário indicou que a rede será **Ronin** ou **Solana**. Decisão em aberto;
recomendação técnica abaixo (não bloqueia dev):

| Critério | Solana | Ronin (sidechain EVM) |
|---|---|---|
| Custo por tx | Baixo (~$0.00025) | Muito baixo (subsid. pelo ecossistema Ronin) |
| Ecossistema gaming | Forte (Star Atlas, Aurory, etc.) | Focado (Axie Infinity, Pixels.xyz) |
| Referência Pixels.xyz | - | [ok] Pixels roda em Ronin |
| Padrão NFT | Metaplex (Token-2022) | ERC-721/1155 |
| Wallet padrão | Phantom/Backpack | Ronin Wallet (EVM, MetaMask-compat) |
| Integração Reldens atual | [ok] `lib/blockchain` já valida Solana (Token-2022) | [!] exige adaptar o `lib/blockchain` para EVM/ERC |

**Observação importante**: o `lib/blockchain` atual já implementa verificação
**Solana** (challenge + token balance + NFT Token-2022). Escolher **Ronin**
implica portar a camada de verificação para EVM (web3/ethers, ERC-20/721). O
custo de migração não é trivial. Decisão recomendada: manter **Solana** para o
MVP (já funcional) e avaliar Ronin como segunda chain no futuro, se o
posicionamento exigir (ex.: proximidade com Pixels.xyz).

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
