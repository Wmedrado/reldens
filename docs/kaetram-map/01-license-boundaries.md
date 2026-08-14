# 01 — Limites Legais (LER ANTES DE TUDO)

Fonte: `F:\Kaetram-Open\README.md`, `LICENSE`, `LICENSE_OPL`.

## Licenças do Kaetram-Open

| Camada | Licença | O que significa |
|---|---|---|
| Código (engine, server, client) | **MPL-2.0** (Mozilla Public License 2.0) | Código pode ser estudado/reutilizado se arquivos MPL forem mantidos MPL e crédito mantido. Copyleft **por arquivo**. |
| Restrições adicionais | **OPL** (Omnia Public License) | Camada extra imposta sobre todo o projeto. É a cláusula que nos bloqueia. |
| Assets (sprites, tiles, música, sons) | **CC-BY-SA 3.0** (herança BrowserQuest + Kaetram) | Atribuição + **ShareAlike**: obra derivada herda CC-BY-SA. Incompatível com NFT/Web3 na prática. |

## OPL — cláusulas críticas (tradução direta do README)

> - You MUST provide a direct link to Kaetram in the credits section.
> - You MUST keep the code open-source and continue to do so.
> - **You may NOT use this project or any parts therein for anything related to artificial intelligence, cryptocurrencies, or NFTs without direct permission from the creators.**
> - You may NOT remove the credits section. It MUST remain visible on the front page of the website...
> - You may NOT remove any credits to the artists, musicians, or any other original creators of this project.
> - You may NOT use this project or any parts therein to sell online courses...

**A cláusula 3 proíbe explicitamente uso em cripto/NFT sem permissão direta.** Nosso jogo é Web3/NFT → **qualquer reaproveitamento direto (código ou asset) está proibido**.

## O que PODEMOS fazer

1. **Estudar arquitetura**: ler código, entender padrões, documentar estrutura (estes docs).
2. **Reimplementar padrões**: escrever código próprio que resolve os mesmos problemas (networking, region streaming, entity system, etc.) em stack própria, sem copiar expressão.
3. **Usar as mesmas bibliotecas de terceiros**: uWebSockets.js (Apache-2.0), pako (MIT), express (MIT), mongodb driver (Apache-2.0), Phaser/engine próprio, etc. — licenças permissivas independentes do Kaetram.
4. **Assets CC0 ou próprios**: qualquer asset que seja CC0 (domínio público) ou criado/comissionado por nós.

## O que NÃO PODEMOS fazer

1. Copiar/colar código Kaetram (nem "traduzido" — tradução é obra derivada, mantém restrições).
2. Copiar estrutura de arquivos + nomes de classes de forma idêntica e mecânica (derivação).
3. Usar sprites, tilesheets, música, sons, mapas, JSONs de dados (items.json, mobs.json, quests...) do Kaetram.
4. Usar o mapa real deles ou o `map_template.json` como base do nosso mapa.
5. Distribuir nosso jogo com qualquer arquivo vindo de `F:\Kaetram-Open`.

## Política de clean-room (nosso processo)

- Kaetram: **fonte de referência conceitual apenas**. Docs descrevem padrões, não transcrevem código.
- Nenhum arquivo de `F:\Kaetram-Open` entra no nosso repo (incluindo por `copy`, script ou CI).
- Todo código nosso nasce de especificação escrita (estes docs + tickets), não de transcrição.
- Se uma IA precisar de detalhe de implementação, ela lê o Kaetram, escreve a **ideia** no doc, e implementa do zero.
- Auditoria: rodar ferramenta de similaridade antes de release se houver dúvida (ex.: comparar trechos com o repo deles).

## Assets: resumo

| Uso | Kaetram (CC-BY-SA + OPL) | Nossos (CC0 / próprios) |
|---|---|---|
| Tiles 16x16 | `public/img/tilesets/tilesheet-1..6.png` | Kenney, 0x72, próprios (ver `07-asset-map-cc0.md`) |
| Sprites player/mob/npc/item | `public/img/sprites/**` (~1300 arquivos) | CC0 + comissionados |
| Música/sons | `public/audio/**` | Kenney audio, Juhani Junkala, próprios |
| Interface | `public/img/interface/**` | Kenney UI, próprios |
| Dados de conteúdo | `server/data/*.json` | Criados do zero (balanceamento próprio) |

## Nota sobre o código MPL

Mesmo se um dia o uso de código MPL fosse aceitável (ex.: manter nossos arquivos derivados sob MPL), a **OPL** adiciona a proibição de cripto/NFT. Ou seja: no nosso cenário, código deles = bloqueado também. Regra simples: **nada do Kaetram entra no nosso produto**.
