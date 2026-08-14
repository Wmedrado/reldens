# 09 — Adaptação Browser-Native + Web3/NFT

## Contexto

Kaetram **já é browser** (HTML5/canvas). Nosso jogo também será browser-native — a vantagem: quase toda a arquitetura de client deles é diretamente aplicável conceitualmente (canvas, WebSocket, PWA). O que muda é **o modelo de negócio e autenticação**: Web3/NFT.

## Diferenças obrigatórias vs Kaetram

| Área | Kaetram | Nosso jogo |
|---|---|---|
| Licença de assets | CC-BY-SA 3.0 + OPL | Somente CC0/próprios (ver `07`) |
| Auth | login/senha + guest (bcrypt) | Wallet connect (assinatura) como primário; email opcional como recuperação |
| Itens | JSON estático, sem escassez on-chain | Itens NFT: ERC-721/1155, metadata IPFS, escassez verificável |
| Marketplace | Trade in-game simples | Trade in-game + marketplace on-chain (listagens, leilões) |
| Pagamentos | Stripe (doações/upgrades) | Cripto (bridge de pagamento fiat-crypto se necessário) |
| Servidor | Multi-servidor + hub (Node) | Mesma topologia; sem mudança conceitual |
| Persistência | MongoDB por subsistema | Mesma abordagem; adicionar tabela de vínculo wallet↔player |

## Integração Web3 — pontos de encaixe (base Kaetram)

### 1. Auth por wallet (substitui `Login` opcode)

- Fluxo: cliente conecta wallet → assina nonce do servidor → servidor valida assinatura (ethers/viem) → cria/sessão de player vinculada ao endereço.
- Encaixe no padrão Kaetram: novo opcode de login no pacote `common` (ex.: `WalletLogin` com `{address, signedNonce}`), handler em `Incoming`, criação de conta em `Creator`.
- Vantagem: mantém guest mode para demo (bom para aquisição) — guest não pode dropar/mintar NFT.

### 2. Itens NFT ↔ inventário

- Inventário continua autoritativo no servidor (padrão Kaetram: `Container` + `Creator.saveInventory`).
- Item com `tokenId`: o registro server-side guarda `{itemKey, tokenId, contract, chainId}`; o cliente exibe badge NFT.
- Fluxos on-chain: mint (craft/conquista), transfer (trade/marketplace), burn (consumo).
- Validações: antes de "usar" item NFT em jogo, servidor consulta posse on-chain (ou cache com expiração) — previne duplicação via exploit de rollback.
- Escassez: drop tables (`server/data/tables.json`) viram contratos com supply fixo.

### 3. Marketplace

- In-game trade (padrão Kaetram `player/trade.ts`) estendido: confirmação on-chain via carteira embutida no client.
- Listagens off-chain (DB) + contrato de marketplace, ou puramente on-chain; decisão de custo/gas.
- Saque/depósito: itens NFT entram/saem do jogo via wrapper (escrow contract) — o servidor bloqueia/libera o item conforme eventos on-chain (listener ou indexador).

### 4. Indexação on-chain

- Servidor (ou serviço separado) ouve eventos dos contratos (viem/ethers) e atualiza o estado do jogo — padronizar como o Kaetram faz cross-server via hub (padrão de sync aplicável).
- Leaderboards mistos (on-chain + off-chain) seguem o padrão de aggregations do hub.

### 5. Escolhas de stack Web3 (todas permissivas)

| Função | Opções (licenças permissivas) |
|---|---|
| Lib EVM | viem (MIT), ethers (MIT) |
| Wallet client-side | walletconnect, wagmi (MIT) |
| Contratos | Solidity + Hardhat (MIT) / Foundry (MIT/Apache) |
| Storage metadata | IPFS (pinata/own node) ou Arweave |
| Indexador | viem listeners ou The Graph (Apache-2.0) |

## Topologia alvo

```
Browser (game client + wallet) ──WS──> Game Server (autoritativo)
                                          │  valida posse via RPC/indexador
Game Server ──hub──> outros servidores     │
Game Server ──> Indexador de eventos <── Blockchain (NFTs, marketplace)
Game Server ──> IPFS (metadata dos itens)
```

## Fases sugeridas

1. **Fase 0 — clone conceitual offline**: servidor + client rodando com assets CC0, guest mode, sem Web3 (valida a arquitetura).
2. **Fase 1 — wallet auth**: assinatura de nonce, vínculo wallet↔player.
3. **Fase 2 — itens NFT**: contrato ERC-1155 por coleção, mint de conquista, badge no inventário.
4. **Fase 3 — trade/marketplace**: escrow + listagens.
5. **Fase 4 — economia**: drops com supply on-chain, seasons, leaderboards mistos.

## Riscos e cuidados

- **Gas**: desenhar para L2 (Polygon, Arbitrum, Base) — custo por transação baixo.
- **Custódia**: decidir se o jogo gerencia escrow (contrato) ou movimenta somente com assinatura do jogador.
- **Compliance**: jurisdição do time; tokens de utilidade ≠ security (consultar advogado).
- **Auditoria de assets**: re-verificar licenças antes do release (processo no `07`).
- **Anti-bot**: wallet-auth reduz bots mas não elimina; manter rate-limits e validações do padrão Kaetram.
