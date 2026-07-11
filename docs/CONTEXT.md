# CONTEXT

> **Um clique para iniciar uma task. Um clique para validar o que saiu dela.
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

### Validar
Um clique em **Validar** sobe os dev servers daquela Task numa porta própria, abre o navegador, e te entrega **o roteiro de teste derivado dos critérios de aceite do PRD** — não inventado na hora.

Você clica pelos itens e marca o que passou. **O que falhar vira feedback estruturado** que volta para o agente com o contrato violado junto — não "tá bugado", mas *"critério AC-04 falhou: lista vazia mostra tela branca"*.

## 3. A tese

Spec-Driven Development falha na prática porque escrever spec é cerimônia: custa hoje e paga depois, talvez, para outra pessoa.

Aqui a spec **paga por si mesma imediatamente**, porque ela é infraestrutura:

- Os **critérios de aceite do PRD** são o que o botão Validar usa para saber o que te mostrar.
- O **Techspec** é o que impede o over-engineering, ao perguntar a escala real do entregável.
- A **decomposição** é o que decide quantos agentes existem e em que ordem rodam.

Você não escreve a spec porque um metodologista mandou. Você escreve porque sem ela o produto não sabe como te ajudar.

O funil de specs, sozinho, não é diferencial — vários já o têm (seção 8). O diferencial é o **acoplamento**: a spec e a validação partilharem o mesmo modelo de dados, de modo que o critério de aceite escrito no PRD seja literalmente o item que você clica na tela de teste. É essa costura que não existe em lugar nenhum, e é ela que não se obtém somando ferramentas.

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
| **Código só é escrito no step de Implementação** | O Validar tria e roteia; ele não conserta. Cada step tem um trabalho só. |
| **Feedback de escopo reabre o PRD** | Ver seção 6. É a regra que impede a spec de apodrecer. |
| **Memória de projeto, compartilhada entre Tasks** | Ver seção 7. A entrevista encurta a cada Task. |

## 6. O loop de validação

Ao dar feedback, um agente triador propõe a categoria e **o usuário confirma**. O feedback sobe até o step mais alto que precisa mudar, e desce de novo.

| Feedback | Categoria | Sobe até | Spec muda? |
|---|---|---|---|
| "critério 4 falhou: lista vazia dá tela branca" | **Defeito** | Implementação | Não |
| "essa função tem 80 linhas, quebra ela" | **Qualidade** | Implementação | Não |
| "na verdade eu também quero categorias" | **Escopo** | **PRD** → cascata | **Sim** — nasce um critério de aceite |
| "localStorage não aguenta, precisa de IndexedDB" | **Técnico** | **Techspec** → cascata | Techspec sim, PRD não |

```
PRD ──▶ Techspec ──▶ Decomposição ──▶ Implementação ──▶ VALIDAR
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

## 7. Memória de projeto

Uma Task não pode nascer amnésica. Se na primeira o usuário respondeu que o projeto é de pequena escala, a décima não deveria perguntar de novo. Um agente com mais contexto é um agente melhor — mas contexto **também é o que mais custa e o que mais faz o modelo alucinar**. Um documento de 500 linhas em todo prompt não é memória, é lastro.

Duas regras mantêm a memória barata e honesta:

> **Índice no contexto, corpo sob demanda.** O agente recebe uma linha por item. Ele puxa o texto completo só do que importa para ele.

> **Append-only, com confirmação humana.** O agente *propõe* o registro; o usuário aprova. Memória que se auto-alimenta sem gate vira lixo — e lixo na memória global envenena *todas* as Tasks futuras, não só uma.

A memória tem duas camadas:

- **Fatos do projeto** — poucos, curtos, estáveis: escala do produto, stack, convenções, o que o produto é. Entram inteiros no contexto sem culpa.
- **Registro de decisões** — ao fim de cada Task, um arquivo curto por decisão: o que foi decidido, quais alternativas foram rejeitadas, e **por quê**. É a resposta para *"por que SQS e não RabbitMQ?"*, que hoje morre no contexto de um agente e se perde para sempre.

O efeito colateral é uma propriedade rara: **a entrevista encurta a cada Task.** Na primeira, o agente pergunta tudo. Na décima, ele já sabe — e pergunta só o que é novo. O produto fica mais rápido de usar quanto mais é usado.

## 8. Panorama competitivo

| Categoria | Quem já faz | Situação |
|---|---|---|
| Orquestrar agentes em worktrees isolados | Conductor, Emdash, Vibe Kanban, Nimbalyst, mux, Orca, +15 | **Saturado.** Já consolidando: Crystal descontinuado (fev/2026), Bloop (Vibe Kanban) fechou (abr/2026). |
| Funil de specs (spec → plan → tasks) | GitHub Spec Kit, AWS Kiro, BMAD, Tessl | **Maduro.** Spec Kit integra com 29 agentes. |
| Pipeline de specs + memória, markdown no repo, local-first | **Compozy** | **Já existe, e é quase este produto.** Ver abaixo. |
| Dev server + preview por worktree | Vibe Kanban | Existe — mas **sem PRD nenhum**. |
| Roteiro de QA a partir de critérios de aceite | Testsigma e ferramentas de QA enterprise | Existe — mas **desconectado de orquestração**. |
| **Spec que dirige a orquestração *e* a validação humana** | — | **Vago.** É aqui, e só aqui, que o produto vive. |

A análise da Augment Code sobre os 9 orquestradores open-source resume o buraco:

> *"Most tools converge on git worktrees for isolation but lack true spec-driven coordination."*

### O caso Compozy

O [Compozy](https://www.compozy.com) é um CLI open-source com pipeline de sete fases — Idea → PRD → TechSpec → Tasks → Execution → Review → **Memory** — com todo artefato em markdown commitado no repo, local-first, e memória cross-task com compactação.

**É o mesmo funil de specs que este projeto descreve.** Convém encarar isso de frente: o pipeline de specs **não é diferencial deste produto**. É commodity, provada três vezes.

O que resta, e resta inteiro:

- O Compozy vende *"da ideia ao código com um comando"* — é a filosofia **one-shot** que este produto rejeita explicitamente (ver Não-objetivos).
- Ele tem *Review* de código. Ele **não tem o Validar**: dev server de pé, browser aberto, e o roteiro de teste derivado dos critérios de aceite na sua frente.
- Ele é CLI. Não tem **painel de N Tasks em paralelo** nem a coluna *"travado esperando você"*.

O diferencial deste produto é, portanto, apenas: **o loop de validação humana** e a **gestão visual de Tasks paralelas**. O funil de specs entra como infraestrutura necessária, não como argumento de venda.

## 9. Por que construir, se cada parte já existe

Toda peça deste produto existe em algum lugar. O Vibe Kanban tem diff e board. O Compozy tem o funil de specs inteiro, mais maduro do que este projeto jamais será no primeiro ano. O Spec Kit tem SDD consolidado, com 29 integrações e uma comunidade.

A resposta não é "faremos melhor". É outra:

**Essas ferramentas não compartilham um modelo de dados.** O spec do Spec Kit não sabe o que é uma worktree do Vibe Kanban. O critério de aceite do PRD do Compozy não tem como virar um checklist ao lado de um preview — porque o Compozy não tem preview e o Vibe Kanban não tem critério de aceite.

Por isso "usar os quatro juntos" não é uma alternativa a este produto. Não é uma questão de conveniência — é que **o valor está justamente na informação que atravessa a fronteira entre eles, e essa informação morre na fronteira.** A costura não é integrável por fora; ela tem que ser nativa.

E a postura: isto é um desenvolvedor resolvendo um problema seu e publicando o resultado — não um empreendedor disputando mercado. **O sucesso do projeto é consequência, não objetivo.** Isso é uma restrição de projeto, não uma desculpa: significa que o produto pode ser opinativo, esquisito e otimizado para uma pessoa só, sem dever satisfação a ninguém.

**Decisão:** o funil de specs será construído do zero, e não sobre o Compozy. Custa a maior parte do tempo e não é o diferencial — mas aprender construindo é um objetivo declarado, e a independência de roadmap de terceiros vale o preço. Esta decisão foi tomada com o custo na mesa, não por desconhecê-lo.

## 10. Não-objetivos

- Gerar um app inteiro a partir de um prompt.
- Substituir o editor de código.
- Colaboração em tempo real, contas, nuvem, servidor.
- Ser agnóstico a tudo desde o dia 1 (múltiplos agentes, múltiplas linguagens, múltiplos frameworks).

## 11. Limitações conhecidas

- **Detecção do dev server.** Em um repo Next.js é `npm run dev`. Num monorepo com front, back e docker-compose, não é óbvio. Vai exigir heurística + um arquivo de config de escape para quando ela errar.
- **Repo vazio.** Na primeira Task de um projeto zerado não existe dev server. O botão Validar só nasce depois da primeira implementação.
- **Duplicação entre Tasks.** Tasks paralelas vivem em branches diferentes e não enxergam o código uma da outra até o merge. Duas Tasks podem escrever a mesma função sem saber. É o preço do isolamento; não há solução barata.
- **A validação não é totalmente "num só lugar" na v1.** O preview abre no navegador padrão do usuário, e a revisão de código continua no GitHub. Preview embutido e diff viewer com comentários inline ficam para a v2. O **checklist de aceite, a triagem e o roteamento do feedback** — o motor do Validar — estão na v1.

## 12. Modelo de negócio

Open source. Sem plano de monetização. No máximo, doações.
O projeto nasce como ferramenta pessoal; a abertura é princípio, não estratégia de captura.
