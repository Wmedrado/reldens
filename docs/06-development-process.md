# 06 — Processo de Desenvolvimento (Regras Multi-IA)

**LEIA ANTES DE ATUAR.** Este projeto é desenvolvido por MUITAS IAs atuando em paralelo
sobre o mesmo repo. Este documento define o processo para evitar conflitos de processo,
servidores duplicados e janelas de terminal desnecessárias.

## Regra #1 — NUNCA iniciar o servidor manualmente

Existe **um único runner oficial** de desenvolvimento: **`start-game.bat`** (que executa
`dev.mjs`). Nenhuma IA deve subir `node index.js`, `npm run dev`, `node tools/asset-browser/server.mjs`,
nem qualquer outro comando de servidor por conta própria.

```bat
start-game.bat
```

- Sobe **tudo numa única janela de terminal**: game server (API + front) + asset browser (editor).
- Logs unificados com prefixo `[game]` / `[assets]`.
- `Ctrl+C` derruba tudo.
- **Hot reload**: mudanças em `lib/`, `bin/`, `index.js`, `server.js` reiniciam o game server automaticamente.
- **Config de banco/admin**: `RELDENS_HOT_PLUG=1` já está no `.env` → mudanças de config via admin
  não precisam de restart.

## Regra #2 — Uma única instância (anti-duplicata)

`dev.mjs` verifica as portas `8080` (game) e `4300` (assets) ANTES de subir. Se já houver
uma instância rodando, ele **recusa iniciar** e imprime a mensagem:

```
ERROR: uma instância já está rodando nestas portas.
```

Se você (IA) vir essa mensagem:

1. **NÃO** force iniciar outra instância.
2. Encontre o dono das portas e mate a instância existente:
   ```powershell
   Get-NetTCPConnection -LocalPort 8080,4300 | select OwningProcess
   taskkill /PID <pid> /T /F
   ```
3. Só então rode `start-game.bat` novamente.

## Regra #3 — Nunca matar processos que você não iniciou

Processos podem ser de OUTRA IA trabalhando no mesmo momento. Antes de matar:
- Confirme que a porta/processo pertence a algo que VOCÊ iniciou.
- Se não tiver certeza, **pergunte** ao usuário em vez de matar.
- Exceção: derrubar instância duplicada do runner (Regra #2) é permitido e incentivado.

## Regra #4 — Uma janela, todos os logs

Não abra terminais extras. Não use `start "" ...` para abrir janelas novas. O runner é a
única superfície de logs:

| Processo | Onde roda | Porta |
|---|---|---|
| Game server (API + front) | dentro do `dev.mjs` (`[game]`) | 8080 |
| Asset browser (editor de assets) | dentro do `dev.mjs` (`[assets]`) | 4300 |
| Client (browser) | aba do navegador | http://localhost:8080 |

## Regra #5 — Hot reload durante o desenvolvimento

- **Código JS do servidor** (`lib/`, `bin/`, `index.js`, `server.js`): watcher do `dev.mjs`
  reinicia o game server automaticamente (~4s). Nenhum restart manual.
- **Assets** (sprites, mapas, áudio em `theme/default/assets/`): servidos estáticos; recarregue
  a aba do navegador (Ctrl+F5). Não precisa restart.
- **Config de jogo no banco** (via admin, `RELDENS_HOT_PLUG=1`): aplicada sem restart.
- **Mapas**: `theme/default/assets/maps/*.json` são recarregados ao entrar na room (o mapa é
  enviado ao cliente por room). Trocar o arquivo + reentrar na room é suficiente.
- **Client bundling**: só é preciso quando mudam os arquivos de entrada do bundle
  (`theme/default/*.html`, `client.js`). O game server roda o bundle no boot.

## Regra #6 — Preferências de commit

- Commits pequenos e descritivos. Nunca incluir `selection.json` de outra IA sem avisar.
- Não commitar `dist/`, `_edited/`, logs (`*.log`), `.env`, `node_modules`.
- Se outra IA já estiver com mudanças no working tree, **não** commitar os arquivos dela:
  commite apenas os seus.

## Glossário de processos

| Arquivo | Papel |
|---|---|
| `dev.mjs` | Runner oficial (única janela, game + assets, hot reload, anti-duplicata). |
| `start-game.bat` | Atalho para `node dev.mjs` (duplo clique). |
| `run-server.js` | Launcher antigo (detached) — usar somente em produção/CI. |
| `tools/asset-browser/server.mjs` | Editor de assets — subir SOMENTE via `dev.mjs`. |
| `index.js` | Entrada do game server — subir SOMENTE via `dev.mjs`. |
