# CONTEXT

> **Um clique para iniciar uma task. Um clique para verificar o que saiu dela.
> A spec é o que faz os dois cliques funcionarem.**

Este documento responde **o que** é o produto, **qual dor** ele resolve e **para quem**.
A ordem de construção está em [ROADMAP.md](./ROADMAP.md). A stack e os padrões de código ficam em `AGENTS.md`.

---

## 1. A dor

Quem usa agentes de IA a sério hoje acaba virando babá de terminal. O fluxo real é:

1. Criar worktree na mão, abrir terminal, `cd`, instalar dependências, colar contexto.
2. Repetir para cada frente de trabalho — e acabar com seis painéis abertos sem saber mais qual agente faz o quê, qual terminou, e qual está parado esperando uma resposta sua.
3. Reexplicar o projeto para cada agente, porque todo agente começa amnésico. Você vira o barramento de contexto humano, copiando e colando entre eles.
4. Para testar o que a IA fez: `cd` até a worktree, subir o dev do front, subir o dev do back, abrir o navegador, achar a página, testar de memória.
5. Subir a PR e sair da ferramenta para revisar o diff no GitHub.

Os passos 4 e 5 são os mais caros e os menos atendidos pelas ferramentas atuais.

## 2. O produto

Um aplicativo desktop que organiza trabalho com agentes de IA em **Tasks** — entregáveis independentes, cada um no seu worktree.

Não é um gerador de "um prompt → um app pronto". Não compete com Lovable, v0 ou Bolt.
É uma ferramenta de **orquestração** para quem já escreve software de verdade com IA.

O produto se apoia em três pernas:

### Iniciar
Um clique em **New Task** cria o worktree, configura o projeto, instala dependências e te coloca direto na entrevista. A partir de uma ideia em uma frase, um agente te entrevista até arrancar um **PRD com critérios de aceite**, depois um **Techspec**, depois uma **decomposição em mini-tasks com grafo de dependências**.

### Gerenciar
Um painel com todas as Tasks em paralelo: em que step cada uma está, quantas mini-tasks faltam, o que terminou — e, sobretudo, **o que está travado esperando uma resposta sua**. Essa é a informação que seis terminais abertos nunca te deram.

### Verificar
Um clique em **Verificar** sobe os dev servers daquela Task numa porta própria, abre o navegador, e te entrega **o roteiro de teste derivado dos critérios de aceite do PRD** — não inventado na hora. Ao lado, o diff do código, comentável inline.
O que falhar vira **feedback estruturado** que volta para o agente com o contrato violado junto.

## 3. A tese

Spec-Driven Development falha na prática porque escrever spec é cerimônia: custa hoje e paga depois, talvez, para outra pessoa.

Aqui a spec **paga por si mesma imediatamente**, porque ela é infraestrutura:

- Os **critérios de aceite do PRD** são o que o botão Verificar usa para saber o que te mostrar.
- O **Techspec** é o que impede o over-engineering, ao perguntar a escala real do entregável.
- A **decomposição** é o que decide quantos agentes existem e em que ordem rodam.

Você não escreve a spec porque um metodologista mandou. Você escreve porque sem ela o produto não sabe como te ajudar.

Esse acoplamento é o diferencial: um concorrente não copia o botão Verificar sem antes construir o funil de spec inteiro.

## 4. Público-alvo

**Devs e pessoas técnicas que já têm um fluxo maduro com IA e querem deixar de ser babá de agente para virar orquestrador.**

Quem **não** é o público: quem quer descrever um app e recebê-lo pronto sem entender o código.

O produto assume que o usuário lê diff, sabe o que é um code smell e tem opinião sobre arquitetura.

## 5. Decisões de produto

| Decisão | Consequência |
|---|---|
| **Worktree por Task, não por agente** | Um `node_modules`, um dev server, uma porta, uma branch por Task. Sem merge intermediário. Agentes da mesma Task reusam o código uns dos outros. |
| **Agentes sequenciais dentro da Task; Tasks em paralelo** | O paralelismo fica onde a dor está: entre frentes de trabalho. Dentro da Task, o grafo de dependências decide a *ordem*, não quem roda junto. |
| **Local-first. Spec commitada no repo.** | Sem conta, sem nuvem, sem servidor. O PRD e o Techspec são arquivos versionados — viram patrimônio do projeto e acompanham a PR. Um time funciona sem que exista "modo time". |
| **Código só é escrito no step de Implementação** | O Verificar tria e roteia; ele não conserta. Cada step tem um trabalho só. |
| **Feedback de escopo reabre o PRD** | Ver seção 6. É a regra que impede a spec de apodrecer. |

## 6. O loop de verificação

Ao dar feedback, um agente triador propõe a categoria e **o usuário confirma**. O feedback sobe até o step mais alto que precisa mudar, e desce de novo.

| Feedback | Categoria | Sobe até | Spec muda? |
|---|---|---|---|
| "critério 4 falhou: lista vazia dá tela branca" | **Defeito** | Implementação | Não |
| "essa função tem 80 linhas, quebra ela" | **Qualidade** | Implementação | Não |
| "na verdade eu também quero categorias" | **Escopo** | **PRD** → cascata | **Sim** — nasce um critério de aceite |
| "localStorage não aguenta, precisa de IndexedDB" | **Técnico** | **Techspec** → cascata | Techspec sim, PRD não |

```
PRD ──▶ Techspec ──▶ Decomposição ──▶ Implementação ──▶ VERIFICAR
 ▲          ▲                              ▲                │
 │          │                              └── defeito ──────┤
 │          └───────────── técnico ──────────────────────────┤
 └──────────────────────── escopo ───────────────────────────┘
                                                             │
                                                        tudo passou ──▶ Task feita
```

**A regra que sustenta o produto:** todo feedback que muda **o que** o produto faz sobe até o PRD. Feedback que muda só **como** ele faz, não.

Sem essa regra, o usuário pede uma feature nova, o agente a implementa, e o PRD passa a mentir. Duas rodadas depois o checklist de aceite descreve um produto que não existe — e o checklist era a razão de ser da spec.

Cada volta é uma **rodada**. O número da rodada é diagnóstico: se você está na rodada 4, o problema não foi o agente, foi o PRD.

## 7. Panorama competitivo

| Categoria | Quem já faz | Situação |
|---|---|---|
| Orquestrar agentes em worktrees isolados | Conductor, Emdash, Vibe Kanban, Nimbalyst, mux, Orca, +15 | **Saturado.** Já consolidando: Crystal descontinuado (fev/2026), Bloop (Vibe Kanban) fechou (abr/2026). |
| Funil de specs (spec → plan → tasks) | GitHub Spec Kit, AWS Kiro, BMAD, Tessl | **Maduro.** Spec Kit integra com 29 agentes. |
| Dev server + preview por worktree | Vibe Kanban | Existe — mas **sem PRD nenhum**. |
| Roteiro de QA a partir de critérios de aceite | Testsigma e ferramentas de QA enterprise | Existe — mas **desconectado de orquestração**. |
| **Spec que dirige a orquestração *e* a verificação** | — | **Vago.** É aqui que o produto vive. |

A análise da Augment Code sobre os 9 orquestradores open-source resume o buraco:

> *"Most tools converge on git worktrees for isolation but lack true spec-driven coordination."*

## 8. Não-objetivos

- Gerar um app inteiro a partir de um prompt.
- Substituir o editor de código.
- Colaboração em tempo real, contas, nuvem, servidor.
- Ser agnóstico a tudo desde o dia 1 (múltiplos agentes, múltiplas linguagens, múltiplos frameworks).

## 9. Limitações conhecidas

- **Detecção do dev server.** Em um repo Next.js é `npm run dev`. Num monorepo com front, back e docker-compose, não é óbvio. Vai exigir heurística + um arquivo de config de escape para quando ela errar.
- **Repo vazio.** Na primeira Task de um projeto zerado não existe dev server. O botão Verificar só nasce depois da primeira implementação.
- **Duplicação entre Tasks.** Tasks paralelas vivem em branches diferentes e não enxergam o código uma da outra até o merge. Duas Tasks podem escrever a mesma função sem saber. É o preço do isolamento; não há solução barata.

## 10. Modelo de negócio

Open source. Sem plano de monetização. No máximo, doações.
O projeto nasce como ferramenta pessoal; a abertura é princípio, não estratégia de captura.
