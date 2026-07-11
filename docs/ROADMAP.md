# ROADMAP

Ordem de construção e escopo por versão.
O **que** e o **porquê** do produto estão em [CONTEXT.md](./CONTEXT.md). A stack e os padrões, em [AGENTS.md](../AGENTS.md).

---

## Princípio: construir na ordem em que o produto roda

O pipeline se constrói na ordem natural — fundação, Tasks, motor de steps, os steps de spec, implementação, e o Validar por último.

Cogitamos inverter a ordem (construir o Validar primeiro, contra um PRD escrito à mão, para descobrir cedo se a tese presta). **Descartado, por duas razões:**

1. **A opção de "matar cedo" vale zero.** O projeto existe porque depender de uma ferramenta de terceiro significa abrir issue e esperar aprovação alheia toda vez que o fluxo incomodar. Isso não é falsificável por um protótipo — e não vamos abandonar o projeto de qualquer forma.
2. **O Validar depende dos steps para existir de verdade.** A triagem tem quatro destinos: defeito e qualidade voltam para a Implementação, mas **escopo sobe para o PRD e técnico sobe para o Techspec**. Sem esses steps, metade da triagem não tem para onde rotear — e é justamente a metade que carrega a regra que sustenta o produto (feedback de escopo reabre a spec). Construir o Validar antes deles significa construí-lo aleijado e reescrevê-lo depois.

O que **não** se adia é o **spike técnico** (abaixo). Os riscos da subida de dev server não somem por serem construídos no fim — mas eles se resolvem em uma tarde, não em uma fase.

---

## Fase 0 — Fundação

O esqueleto que anda.

- Electron + React + TypeScript, com a estrutura de pastas de `AGENTS.md`.
- SQLite local para estado de runtime.
- **O app abre no Fedora.** Janela, build, empacotamento local funcionando.
- Convenções: lint, formatação, teste.

### Spike técnico (descartável, ~1 dia)

Roda **em paralelo à Fase 0** e não vira código de produção. Existe só para provar viabilidade antes de construirmos algo em cima:

- Subir o dev server de um projeto real (um Next.js qualquer) numa porta **alocada por nós**, a partir de código.
- Esperar a porta responder.
- Renderizar num `BrowserView` do Electron.

**Se isso não funcionar bem, descobrimos agora — barato, sem um step construído em cima.**

## Fase 1 — Projeto e Tasks

- Apontar o app para uma pasta (repo existente ou vazio).
- **Detecção do perfil do projeto**: gerenciador de pacotes, comando de instalação, comando de dev. Com arquivo de config de escape para quando a heurística errar.
- Criar Task → worktree + branch + instalação de dependências.
- Ciclo de vida da Task: criada → em andamento → validando → concluída.
- **Painel de N Tasks em paralelo**: lista, status, troca entre Tasks (troca o worktree ativo).

## Fase 2 — Motor de steps e execução de agentes

A espinha dorsal. Nenhum step de negócio ainda — só a máquina que os roda.

- O contrato `AgentEvent` / `AgentExecutor` (ver `AGENTS.md`).
- **`ClaudeAdapter`**: CLI headless como subprocesso, parsing de NDJSON.
- Autenticação por assinatura (`CLAUDE_CODE_OAUTH_TOKEN`), com `ANTHROPIC_API_KEY` removida do ambiente filho.
- Máquina de estados dos steps, persistida em SQLite.
- **"Travado esperando você"** como estado derivado (permissão pendente, ou fim de turno sem sentinela) — visível no painel.
- Um step trivial rodando ponta a ponta, só para provar o motor.

## Fase 3 — Os steps de spec

Agora sim, na ordem do pipeline.

- **PRD** — usuário digita a ideia → agente entrevista sobre ideia e regras de negócio → produz **um** documento:
  - **Contexto e objetivos** — o problema sendo resolvido.
  - **Público-alvo** — quem usa e quais são as dores.
  - **Funcionalidades e regras de negócio** — requisitos funcionais e não funcionais.
  - **Métricas de sucesso** — como saber se a iniciativa deu certo.
  - **Critérios de aceite** — o artefato que alimenta o Validar.
- **Techspec** — entrevista sobre tecnologia e **escala do entregável** (projeto simples / ~100 usuários / 10k+ usuários) → plano de implementação. A pergunta de escala é o guard-rail anti over-engineering.
- **Decomposição** — mini-tasks + grafo de dependências. Cada mini-task carrega **traceback para o critério de aceite** que ela satisfaz.
- Specs gravadas como **arquivos markdown versionados no repo**.
- **Memória de projeto (camada 1: fatos)** — poucos fatos curtos e estáveis (escala do produto, stack, convenções), lidos por toda Task nova. É o que impede o agente de perguntar a escala do projeto pela décima vez.

## Fase 4 — Implementação

- Executar as mini-tasks **em sequência**, na ordem do grafo, dentro do worktree da Task.
- Progresso por mini-task no painel.

## Fase 5 — Validar

Tudo que veio antes existe para alimentar esta fase.

- **Validar comportamento**: subir o dev server na porta da Task, esperar responder, renderizar no preview embutido.
- **Checklist de aceite**: os critérios do PRD como roteiro clicável; usuário marca passou/falhou.
- **Validar código**: diff viewer com comentários inline.
- **Triagem**: agente propõe a categoria (defeito / qualidade / escopo / técnico), usuário confirma.
- **O loop**: feedback sobe até o step certo e desce de novo. Agora os quatro destinos existem.
- Contador de **rodadas**.

**Critério de sucesso do MVP:** rodar um entregável real de ponta a ponta e sentir que foi melhor do que fazer na mão.

---

## v2 — fora do MVP

| Item | Por que ficou fora |
|---|---|
| **Agente de Review que audita contra o PRD** | No MVP, o usuário é o review (checklist + diff). O agente de Review fica melhor depois de vinte rodadas reais, quando soubermos o que ele deveria estar pegando. Quando existir, audita: se todas as mini-tasks foram implementadas; se o código atende ao Techspec e ao PRD; se as **regras de negócio** do PRD foram de fato implementadas; qualidade e boas práticas; **segurança e privacidade**; e a experiência de uso. |
| **Memória de projeto (camada 2: registro de decisões)** | Ao fim de cada Task, um arquivo curto por decisão: o que foi decidido, alternativas rejeitadas, e **por quê** (*"por que SQS e não RabbitMQ?"*). Agentes leem só o **índice**; puxam o corpo sob demanda. Exige mecanismo de retrieval de verdade, e só depois de várias Tasks reais dá para saber o que vale registrar. |
| **Agentes se interrogando entre steps** (o Techspec perguntando ao PRD) | Ideia original e boa, mas passar os documentos anteriores como contexto resolve a maior parte do problema. |
| **Paralelismo dentro de uma Task** | Agentes compartilham o filesystem do worktree e se atropelariam. Exigiria declaração de posse de arquivos por mini-task. |
| **Abrir PR / integração com GitHub** | Já funciona na mão hoje. |
| **Multi-modelo** (Codex, Gemini, Cursor) | Começar com um agente só. O contrato de execução já prevê isso: adicionar um agente é escrever um adaptador, não um SDK (ver `AGENTS.md`). |
| **Validação cross-browser** | O preview embutido roda em Chromium. Rodar o mesmo roteiro de aceite em Firefox e WebKit reais é uma feature legítima — e deliberada, não um acidente de escolha de webview. |

## Fora de escopo (não é "v2", é "não")

- Gerar um app inteiro a partir de um prompt.
- Substituir o editor.
- Colaboração em tempo real, contas, nuvem.
