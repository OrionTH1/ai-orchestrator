# ROADMAP

Ordem de construção e escopo por versão.
O **que** e o **porquê** do produto estão em [CONTEXT.md](./CONTEXT.md).

---

## Princípio: construir de trás para frente

A ordem intuitiva seria construir o pipeline na ordem em que ele roda: PRD, depois Techspec, depois decomposição, depois execução, e por fim a verificação.

**Não é o que vamos fazer.**

Os steps de spec (PRD, Techspec, decomposição) são território conhecido — Spec Kit e Kiro já provaram que funcionam. Construí-los primeiro gastaria semanas em commodity e só revelaria no mês 4 se a ideia original presta.

O **Verificar** é a parte nova, é o diferencial, e é onde mora o risco técnico. Por isso ele vem primeiro, alimentado por um PRD escrito à mão. Se ele não funcionar — ou não for gostoso de usar — o projeto morre na semana 3, não no mês 4.

---

## Fase 1 — Esqueleto

Fundação inevitável.

- Conceito de **Projeto** (uma pasta) e **Task** (um entregável).
- Criar Task → criar worktree + branch.
- Ciclo de vida da Task: criada → em andamento → verificando → concluída.
- Detecção do perfil do projeto: gerenciador de pacotes, comando de instalação, comando de dev.

## Fase 2 — VERIFICAR (a fatia que prova a tese)

Com um PRD **escrito à mão** num arquivo. Sem entrevista, sem decomposição, sem múltiplos agentes.

- Rodar **um** agente sobre um PRD manual, dentro do worktree.
- **Verificar comportamento**: subir dev server na porta daquela Task, esperar responder, abrir o navegador.
- **Checklist de aceite**: renderizar os critérios do PRD como roteiro clicável; usuário marca passou/falhou.
- **Verificar código**: diff viewer com comentários inline.
- **Triagem**: agente propõe a categoria do feedback (defeito / qualidade / escopo / técnico), usuário confirma.
- **Feedback estruturado** volta ao agente com o critério violado e os comentários do diff.
- Contador de **rodadas**.

Riscos que esta fase existe para matar:
- Detecção e subida do dev server em projetos reais.
- Alocação de portas por Task.
- O checklist de aceite é de fato útil, ou é burocracia?

**Critério de sucesso da fase:** rodar um entregável real de ponta a ponta e sentir que foi melhor do que fazer na mão.

## Fase 3 — A entrevista

Substitui o PRD escrito à mão.

- **Step PRD**: usuário digita a ideia → agente entrevista sobre ideia e regras de negócio → produz **um** documento com:
  - **Contexto e objetivos** — o problema sendo resolvido.
  - **Público-alvo** — quem usa e quais são as dores.
  - **Funcionalidades e regras de negócio** — requisitos funcionais e não funcionais.
  - **Métricas de sucesso** — como saber se a iniciativa deu certo.
  - **Critérios de aceite** — o artefato que alimenta o step Verificar.
- **Step Techspec**: entrevista sobre tecnologia e **escala do entregável** (projeto simples / ~100 usuários / 10k+ usuários) → plano de implementação. A pergunta de escala é o guard-rail anti over-engineering.
- Specs gravadas como arquivos versionados no repo.
- Arestas de volta: feedback de **escopo** reabre o PRD; feedback **técnico** reabre o Techspec; a cascata regenera o que vem depois.

## Fase 4 — Decomposição e múltiplos agentes

- Quebrar o Techspec em **mini-tasks** com grafo de dependências.
- Cada mini-task carrega **traceback para o critério de aceite** que ela satisfaz.
- Agrupar mini-tasks dependentes na mesma cadeia; executar **em sequência** dentro do worktree da Task.
- Progresso por mini-task no painel.

## Fase 5 — Gerenciar N Tasks

- Painel com todas as Tasks em paralelo.
- Por Task: step atual, mini-tasks restantes, situação.
- Destaque para **travado esperando você** — a informação que seis terminais nunca deram.
- Trocar de Task troca o worktree ativo.

---

## v2 — fora do MVP

| Item | Por que ficou fora |
|---|---|
| **Agente de Review que audita contra o PRD** | No MVP, o usuário é o review (checklist + diff). O agente de Review fica melhor depois de vinte rodadas reais, quando soubermos o que ele deveria estar pegando. Quando existir, audita: se todas as mini-tasks foram implementadas; se o código atende ao Techspec e ao PRD; se as **regras de negócio** do PRD foram de fato implementadas; qualidade e boas práticas; **segurança e privacidade**; e a experiência de uso. |
| **Agentes se interrogando entre steps** (o Techspec perguntando ao PRD) | Ideia original e boa, mas passar os documentos anteriores como contexto resolve a maior parte do problema. |
| **Paralelismo dentro de uma Task** | Agentes compartilham o filesystem do worktree e se atropelariam. Exigiria declaração de posse de arquivos por mini-task. |
| **Abrir PR / integração com GitHub** | Já funciona na mão hoje. |
| **Multi-modelo** (Codex, Gemini, Cursor) | Começar com um agente só. |

## Fora de escopo (não é "v2", é "não")

- Gerar um app inteiro a partir de um prompt.
- Substituir o editor.
- Colaboração em tempo real, contas, nuvem.
