# 06 — Processo de Desenvolvimento (Regras Multi-IA)

**LEIA ANTES DE ATUAR.** Este projeto é desenvolvido por MUITAS IAs atuando em paralelo
sobre o mesmo repo. Este documento define o processo para evitar conflitos de processo,
servidores duplicados e janelas de terminal desnecessárias.

## Regra #1 — NUNCA iniciar o servidor manualmente

Existe **um único runner oficial** de desenvolvimento: **`start-game.bat`** (que executa
`dev.mjs`). Nenhuma IA deve subir `node index.js`, `npm run dev`, `node tools/asset-browser/server.mjs`,
`node tools/capital-builder/server.js`, nem qualquer outro comando de servidor por conta própria.

```bat
start-game.bat
```

- Sobe **tudo numa única janela de terminal** (TUI): game server + asset browser + capital builder.
- O TUI mostra status ao vivo (dot verde/vermelho por processo) e **logs em tempo real** com
  prefixo `[game]` / `[assets]` / `[capital]`.
- **Todas** as linhas de log são gravadas em **`dev-runner.log`** (captura de bugs mesmo após
  fechar a janela).
- Teclas na janela: `Q` sai, `R` reinicia o game server, `C` limpa o painel de log.
- Fechar a janela (ou `Ctrl+C`/`Ctrl+Break`) mata **toda a árvore** de processos filhos —
  não sobra processo órfão.
- **Hot reload**: mudanças em `lib/`, `bin/`, `theme/plugins`, `index.js`, `server.js`,
  `client.js` reiniciam o game server automaticamente.
- **Config de banco/admin**: `RELDENS_HOT_PLUG=1` já está no `.env` → mudanças de config via admin
  não precisam de restart.

## Regra #2 — Uma única instância (anti-duplicata)

`dev.mjs` grava um **lock file** (`dev-runner.pid`) e um **reload marker** (`dev-reload.marker`).
Só UMA janela pode existir:

- **Rodar `start-game.bat` com o runner já ativo NÃO abre uma segunda janela.** O novo
  processo detecta o runner vivo pelo lock, escreve no `dev-reload.marker` e sai — o runner
  ativo **recarrega o game server** em resposta.
- O runner também se auto-cura: se as portas `8080/4300/4310` estiverem ocupadas por processos
  órfãos (janela fechada, lock morto), ele os encerra antes de subir. Um runner **vivo** nunca
  é tocado.
- Nenhuma IA deve iniciar servidor fora do runner, nem forçar segunda instância.

## Regra #3 — Nunca matar processos que você não iniciou

Processos podem ser de OUTRA IA trabalhando no mesmo momento. Antes de matar:
- Confirme que a porta/processo pertence a algo que VOCÊ iniciou.
- Se não tiver certeza, **pergunte** ao usuário em vez de matar.
- Exceção: a limpeza de **órfãos** (portas ocupadas sem runner vivo) é feita automaticamente
  pelo próprio runner e é permitida.

## Regra #4 — Uma janela, todos os logs

Não abra terminais extras. Não use `start "" ...` para abrir janelas novas. O runner é a
única superfície de logs:

| Processo | Onde roda | Porta |
|---|---|---|
| Game server (API + front) | dentro do `dev.mjs` (`[game]`) | 8080 |
| Asset browser (editor de assets) | dentro do `dev.mjs` (`[assets]`) | 4300 |
| Capital builder (builder da capital) | dentro do `dev.mjs` (`[capital]`) | 4310 |
| Client (browser) | aba do navegador | http://localhost:8080 |

## Regra #5 — Hot reload durante o desenvolvimento

- **Código JS do servidor** (`lib/`, `bin/`, `theme/plugins/`, `index.js`, `server.js`,
  `client.js`): o watcher do `dev.mjs` reinicia o game server automaticamente (~1s após a
  mudança). Nenhum restart manual.
- **Assets** (sprites, mapas, áudio em `theme/default/assets/`): servidos estáticos; recarregue
  a aba do navegador (Ctrl+F5). Não precisa restart.
- **Config de jogo no banco** (via admin, `RELDENS_HOT_PLUG=1`): aplicada sem restart.
- **Mapas**: `theme/default/assets/maps/*.json` são recarregados ao entrar na room (o mapa é
  enviado ao cliente por room). Trocar o arquivo + reentrar na room é suficiente.
- **Client bundling**: só é preciso quando mudam os arquivos de entrada do bundle
  (`theme/default/*.html`, `client.js`). O game server roda o bundle no boot.
- **Reinício manual**: tecla `R` na janela do runner, ou rode `start-game.bat` de novo
  (recarrega o runner ativo pelo marker).

## Regra #6 — Preferências de commit

- Commits pequenos e descritivos. Nunca incluir `selection.json` de outra IA sem avisar.
- Não commitar `dist/`, `_edited/`, logs (`*.log`), `.env`, `node_modules`, nem os artefatos
  do runner (`dev-runner.log`, `dev-runner.pid`, `dev-reload.marker`, `dev-test.out`).
- Se outra IA já estiver com mudanças no working tree, **não** commitar os arquivos dela:
  commite apenas os seus.

## Glossário de processos

| Arquivo | Papel |
|---|---|
| `dev.mjs` | Runner oficial (TUI única janela, game + assets + capital, hot reload, anti-duplicata, auto-heal de órfãos, log persistente). |
| `start-game.bat` | Atalho para `node dev.mjs` (duplo clique). |
| `dev-runner.log` | Log persistente de todas as linhas do runner (append por execução). |
| `dev-runner.pid` | Lock file — garante instância única. |
| `dev-reload.marker` | Sinal de reload: escrever = runner ativo reinicia o game server. |
| `run-server.js` | Launcher antigo (detached) — usar somente em produção/CI. |
| `tools/asset-browser/server.mjs` | Editor de assets — subir SOMENTE via `dev.mjs`. |
| `tools/capital-builder/server.js` | Builder da capital — subir SOMENTE via `dev.mjs`. |
| `index.js` | Entrada do game server — subir SOMENTE via `dev.mjs`. |
