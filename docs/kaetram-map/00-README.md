# Kaetram Mapping — Base de Conhecimento

Mapeamento estrutural do projeto **Kaetram-Open** (`F:\Kaetram-Open`) como base de **estudo** para a construção do nosso jogo. Não copiamos código, arte, música ou dados do Kaetram. Documentamos **como foi projetado** para não precisarmos orquestrar tudo do zero.

## Objetivo

1. Entender arquitetura completa de um MMO 2D browser maduro (servidor autoritativo, client, hub, admin, pipeline de mapas).
2. Reutilizar **padrões de arquitetura** (não código) no nosso projeto.
3. Mapear assets CC0 equivalentes para nosso jogo Web3/NFT (licença extremamente permissiva).
4. Guiar cada IA de desenvolvimento: onde olhar no Kaetram, o que construir do zero.

## Índice

| Arquivo | Conteúdo |
|---|---|
| `01-license-boundaries.md` | **LER PRIMEIRO.** Limites legais: MPL-2.0, OPL, CC-BY-SA3.0. O que é permitido e proibido. |
| `02-architecture-overview.md` | Visão geral: monorepo, pacotes, stack, fluxo de rede, loop de jogo. |
| `03-server-map.md` | Mapa completo do pacote server (entrada, rede, entidades, sistemas). |
| `04-client-map.md` | Mapa completo do pacote client (Astro, renderer, UI, rede). |
| `05-common-map.md` | Camada compartilhada (protocolo de rede, config, banco, i18n). |
| `06-hub-api-admin-tools-map.md` | Hub (gateway multi-servidor), API REST, admin panel, pipeline de mapas. |
| `07-asset-map-cc0.md` | Inventário de assets do Kaetram + tabela de equivalentes CC0. |
| `08-ai-agent-guide.md` | Guia por papel: onde cada IA olha no Kaetram ao desenvolver cada área. |
| `09-web3-adaptation-notes.md` | Adaptação para browser-native + Web3/NFT (integração blockchain). |
| `10-gameplay-content-systems.md` | Contratos de dados (items/mobs/quests/crafting...), combate, skills, economia, drops, minigames. |

## Regras de uso (todas as IAs)

1. Kaetram = somente leitura. Nunca editar nada em `F:\Kaetram-Open`.
2. Nunca colar código Kaetram no nosso repo. Documentar padrão, reescrever do zero.
3. Assets Kaetram são proibidos (CC-BY-SA3.0 + OPL). Usar somente CC0 ou próprios.
4. Antes de começar tarefa, ler o doc correspondente + `01-license-boundaries.md`.
5. Duplicar caminho: "Kaetram faz X em `path` → nós fazemos X no nosso stack".

## Convenção de referência

- `F:\Kaetram-Open\packages\{pacote}` — paths absolutos do Kaetram.
- "Nosso projeto" — código novo, sem dependência do Kaetram.
