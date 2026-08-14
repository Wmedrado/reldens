# Asset Browser (Vibecraft)

Ferramenta local para **revisar, marcar e decidir** quais assets CC0 entram no jogo.

## Rodar

```bash
npm run assets:browser
# ou: node tools/asset-browser/server.mjs
```

Abra **http://localhost:4300**.

## O que faz

- Navega toda a árvore de `assets-cc0/` (Kenney, 0x72, OGA).
- **Imagens**: grid de tiles sobreposto (tile default 16px, ajustável + offset), clique no tile → estado cicla: `usar` → `pular` → `favorito` → limpar.
- **Áudio**: player embutido + estado por arquivo.
- Filtro por estado, botões "Sel. todos" / "Limpar", stats no topo.
- **Salvar** grava decisões em `assets-cc0/selection.json` (fonte de verdade para o importador do jogo).

## Como decidir

1. Navegue por pack (sidebar esquerda).
2. Abra imagem, ajuste tile size se necessário (16px padrão).
3. Clique nos frames que quer usar (verde = usar, vermelho = pular, dourado = favorito).
4. Salve. Repita por categoria: tiles, mobs, NPCs, itens, UI, efeitos, áudio.

## Importação para o jogo

- `selection.json` → ferramenta futura (`reldens importAssets`) copia frames marcados `use` para `theme/default/assets/custom/sprites/` + registra em `objects-assets`/`objects-animations` no banco.
- Asset sem decisão = não entra no jogo.

## Registro de licença

Todo asset deve estar em `assets-cc0/MANIFEST.md` (origem, licença, URL). Política: `docs/kaetram-map/07-asset-map-cc0.md`.
