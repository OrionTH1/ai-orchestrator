# AGENTS.md

Stack, padrões e estrutura do projeto.

- **O que** é o produto, a dor e o público: [docs/CONTEXT.md](./docs/CONTEXT.md)
- **Em que ordem** construir: [docs/ROADMAP.md](./docs/ROADMAP.md)
- **Como** implementar: este arquivo.

---

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Shell desktop | **Electron** | Executor e UI na mesma linguagem (o executor é `child_process.spawn`). E o preview embutido volta na v2 — ver abaixo. |
| Linguagem | **TypeScript** (main + renderer) | O executor inteiro é `child_process.spawn`. Uma linguagem só no processo todo. |
| UI | **React** | |
| Estado de runtime | **SQLite** (local, fora do repo do usuário) | Tasks, steps, sessões de agente, rodadas, portas alocadas, resultados de checklist. Efêmero e nosso. |
| Estado de spec | **Markdown commitado no repo do usuário** | PRD, Techspec, decomposição e memória de projeto são patrimônio do projeto, não do app. Ver CONTEXT §5. |
| Isolamento | **git worktree** por Task | Ver CONTEXT §5. |
| Execução de agentes | **CLI headless como subprocesso** | Ver abaixo. |

## O preview do Validar

**Na v1, o preview é o navegador padrão do usuário** (`shell.openExternal`). O app sobe o dev server na porta da Task, espera responder, e abre o navegador. O **checklist de critérios de aceite fica num painel do app**, onde o usuário marca passou/falhou.

O que se ganha com isso, além da economia: o usuário valida **no navegador real dele**, com o DevTools dele e o motor que os usuários finais dele de fato usam. Não há limitação de single-engine.

O que se perde: o "tudo numa janela só". É uma concessão consciente — a dor de alternar de janela é pequena perto de adiar o produto em um mês.

**Na v2, o preview passa a ser embutido** (`BrowserView`). Aí o motor de renderização da webview vira o motor contra o qual o usuário valida, e isso **decide o shell**:

- **Electron** empacota **Chromium** em todas as plataformas — o mesmo motor da maioria dos alvos reais.
- **Tauri** usaria a webview do sistema: **WebKitGTK** no Linux, **WKWebView** no macOS, **Chromium** no Windows. Três motores, três resultados. Pior: WebKitGTK não é o Safari — você caçaria bugs de um motor que *nenhum usuário final usa*. Ruído, não sinal.

Por isso o shell é Electron desde a v1, mesmo que o preview embutido só chegue depois. Trocar de shell no meio do caminho seria caro; o executor em TypeScript já justifica a escolha sozinho.

**O que não sai da v1:** o **checklist de aceite**, a **triagem** e o **roteamento do feedback**. Eles são o motor do Validar — o preview e o diff viewer são a embalagem. Sem o checklist, os critérios de aceite do PRD não têm quem os leia, e a spec volta a ser cerimônia — que é exatamente o que CONTEXT §3 diz que faz o SDD falhar.

## Execução de agentes

**Todo agente roda como subprocesso de uma CLI headless.** Nenhum SDK específico de fornecedor.

Isso é o padrão de facto da categoria — [Conductor](https://www.conductor.build/docs/reference/harnesses) e [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) fazem exatamente isso, e nenhum orquestrador multi-modelo usa um SDK por fornecedor. O motivo é aritmético: um SDK por modelo significa reimplementar a orquestração N vezes; um subprocesso que fala um protocolo comum significa escrever apenas o *parser* daquele protocolo.

### O contrato

O resto do sistema **nunca** conhece Claude, Codex ou Gemini. Ele conhece só isto:

```ts
export type AgentEvent =
  // núcleo — todo adaptador DEVE emitir
  | { type: "started"; sessionId: string }
  | { type: "permission_request"; id: string; tool: string; input: unknown }
  | { type: "turn_ended"; finalText: string; usage?: { costUsd?: number } }
  | { type: "error"; message: string; fatal: boolean }
  // enriquecimento — opcional; a UI melhora se existir
  | { type: "output"; text: string }
  | { type: "tool_activity"; name: string; summary: string };

export interface AgentRun {
  events: AsyncIterable<AgentEvent>;
  respondPermission(id: string, allow: boolean, reason?: string): void;
  interrupt(): void;
}

export interface AgentExecutor {
  readonly name: string;
  start(opts: { worktree: string; prompt: string; systemPrompt?: string }): AgentRun;
  resume(sessionId: string, prompt: string, worktree: string): AgentRun;
}
```

**Regra:** o conhecimento do formato de saída de um agente vive **inteiramente dentro do seu adaptador**. Se `"claude"` ou `"codex"` aparecer numa string fora de `src/executor/adapters/`, é bug de arquitetura.

Adicionar um agente novo = escrever um arquivo em `src/executor/adapters/` (~70 linhas). Nunca "mais um SDK".

### "Travado esperando você"

É **estado derivado**, não um evento que os agentes emitem. Uma Task está esperando o usuário quando:

- há um `permission_request` pendente, **ou**
- veio um `turn_ended` sem a sentinela de conclusão daquele step (o agente fez uma pergunta — na mecânica turn-based, fim de turno sem conclusão *é* uma pergunta).

`permission_request` é um evento que **pode** ocorrer, não que **deve**: o Claude Code pede aprovação por ferramenta; o Codex headless roda na própria sandbox e não pede. O painel só mostra "esperando aprovação" para quem pede.

### Autenticação e custo

**O usuário gasta a assinatura dele. O projeto não tem custo de token.**

A CLI do Claude Code resolve credencial nesta ordem (a primeira que existir vence):

1. `ANTHROPIC_API_KEY` → **cobra por token** (API pay-per-use)
2. `CLAUDE_CODE_OAUTH_TOKEN` → **assinatura** (Pro/Max/Team)
3. Sessão de login interativo salva → **assinatura**

**O footgun:** um `ANTHROPIC_API_KEY` exportado no shell do usuário — comum em quem já mexeu com a API — vence silenciosamente, e a pessoa passa a pagar por token mesmo tendo Claude Max.

Defesa obrigatória ao spawnar qualquer agente:

```ts
const env = { ...process.env };
delete env.ANTHROPIC_API_KEY;              // corta o footgun na raiz
env.CLAUDE_CODE_OAUTH_TOKEN = savedToken;  // token de assinatura, via `claude setup-token`
```

O token vem de `claude setup-token` (mecanismo oficial para uso headless, atrelado à assinatura) e é guardado no keychain do SO — **nunca** em arquivo de config em texto puro.

### Versão do binário

A CLI é resolvida pelo `PATH` do sistema. Um **guard de versão** avisa quando a versão instalada é mais antiga que a testada, porque o formato NDJSON de saída não é um contrato estável.

**Não vendorizamos o binário na v1.** O Conductor empacota o próprio Claude Code para garantir compatibilidade — é a solução certa quando você tem usuários que não controla. Enquanto o projeto for de uso pessoal, isso é custo de empacotamento sem benefício. Deixe o ponto de extensão pronto (config apontando para um binário alternativo) e revisite quando outras pessoas passarem a instalar.

## Estrutura

```
src/
  main/               # processo principal do Electron
  renderer/           # React — painel, steps, checklist de aceite
  executor/
    contract.ts       # AgentEvent, AgentRun, AgentExecutor
    channel.ts        # fila async → AsyncIterable (ponte callback → for await)
    adapters/
      claude.ts       # ÚNICO lugar que conhece o formato do Claude Code
      codex.ts        # (v2)
  steps/              # prd.ts, techspec.ts, decompose.ts, implement.ts, validate.ts
  git/                # worktrees, branches, diff
  devserver/          # detecção de perfil, alocação de porta, subida
  store/              # SQLite — Tasks, steps, rodadas, portas
docs/
  CONTEXT.md
  ROADMAP.md
```

## Princípios

- **Nenhum step conhece um fornecedor.** Steps falam `AgentExecutor`. Sempre.
- **Código só é escrito no step de Implementação.** O Validar tria e roteia; não conserta. (CONTEXT §5)
- **Feedback de escopo reabre o PRD.** A regra que impede a spec de apodrecer. (CONTEXT §6)
- **O git é a fonte da verdade sobre arquivos.** Não confie no agente para dizer o que ele escreveu — pergunte ao worktree.
- **Uma porta por Task.** N Tasks em paralelo, todas querendo a 3000, explodem.
