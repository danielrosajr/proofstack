# ProofStack v0.1 — Arquitetura

## Princípio arquitetural

**Conteúdo é dado; regras operacionais são funções.** `data/scenarios.js` define tickets, etapas, opções, condições e rubricas. `engine/simulator.js` avalia pré-condições, aplica efeitos, registra eventos, atualiza o relógio e calcula desempenho. `App.vue` apresenta a simulação e envia intenções do usuário ao motor.

```text
┌───────────────────────┐        ação escolhida
│ App.vue (Vue/UI)      │ ────────────────────────────┐
│ Desk, KB, IAM, monitor│                              ▼
└───────────▲───────────┘               ┌────────────────────────────┐
            │ estado atualizado          │ simulator.js               │
            │                            │ sendReply / performChoice  │
            │                            │ saveNote / advance / SLA   │
            └────────────────────────────│ checks / evaluate / events │
                                         └──────┬─────────────┬───────┘
                                                │             │
                                            cenários       localStorage
                                                │
                                         ┌──────▼──────────────┐
                                         │ data/scenarios.js   │
                                         │ data/world.js       │
                                         └─────────────────────┘
```

## Modelo de estado

- `phase`: playing | finished
- `elapsed`: minutos virtuais decorridos desde as 09:00
- `selected`: ID do ticket em foco
- `tickets[id]`: visibilidade, status, etapa, horários, flags de evidência, notas e histórico
- `seenEvents`: índices de mensagens já disparadas
- `messages`: alertas globais do mundo
- `activity`: log imutável por ação (a cada transição uma cópia estruturada do estado)

**Uma transição produz sempre um novo objeto:** `performChoice(state, ticketId, choiceId) → newState`. A camada Vue não calcula resultados operacionais.

## Contrato de cenário

```js
{
  id: 'NS-1010', title: 'Exemplo', requester: 'Pessoa fictícia',
  employee: 'ana', department: 'RH', category: 'Acessos',
  impact: 'baixo', urgency: 'média', spawnAt: 95,
  description: 'Texto do chamado',
  brief: 'Objetivo', kb: ['access'],
  stages: [{
    id: 'start', title: 'Investigar', prompt: 'O que fazer?',
    options: [{
      id: 'check', text: 'Validar a aprovação conforme KB-102',
      requires: ['kb:access'], set: ['approval_checked'],
      next: 'conclude', minutes: 4, tone: 'good', feedback: 'Aprovação analisada.'
    }]
  }, {
    id: 'conclude', title: 'Desfecho', prompt: 'Como encerrar?',
    options: [{id: 'done', text:'Escalar', finish:'escalado',
      requires:['contacted','documented','approval_checked'], set:['proper_escalation']}]
  }],
  rubric: [{skill:'Escalonamento',flag:'proper_escalation',description:'Encaminhamento apropriado'}]
}
```

Campos de opção: `id`, `text`, `minutes`, `requires` (flags que já devem existir), `set` (flags concedidas), `next` (etapa subsequente), `finish` (estado terminal), `feedback` (resultado narrativo), `tone` (aparência), `critical` (marcador de erro crítico). Uma opção terminal não precisa ter `next`.

Para criar missão: adicione cadastro fictício em `world.js`, KB, objeto de cenário em `scenarios.js`, flags/rubricas específicas e testes. O motor não possui condicionais sobre casos individuais **exceto** as regras de elegibilidade de espera, que são uma política de serviço e devem futuramente migrar para metadados declarativos.

## Máquina de estados

- `não_iniciado` → `novo` quando `spawnAt <= elapsed`.
- `novo` → `em_andamento` com resposta, nota ou escolha.
- `em_andamento` → `aguardando_usuário` ou `aguardando_aprovação` apenas com justificativa prévia, e depois `em_andamento` novamente ao retomar.
- `em_andamento` → `resolvido` ou `escalado` por opção terminal; `resolvido` → `encerrado` por confirmação posterior.
- Tickets terminais recusam novas escolhas e operações.

## Tempo e política de SLA

O relógio **não depende de `setInterval` nem de espera real**. `consume` avança minutos pela ação e `advance` libera avanço manual. Eventos têm um limiar `spawnAt` ou `at` fixo. Prioridade é derivada da matriz em `world.js` (impacto x urgência).

Primeira resposta = `firstResponseAt - openedAt`. Tratamento = `completedAt - openedAt - pausedMinutes`. Esperas justificadas pausam apenas a segunda métrica. `escalado` é terminal de tratamento no MVP, mas **não** significa que o serviço real foi restaurado; a distinção é exibida na narrativa e relatório. Os prazos fictícios P1–P4 estão em `priorityPolicy` e na `POL-001`. O horário de expediente é virtual. O simulador atual não implementa virada do dia.

## Rubricas

Cada ticket tem evidências `flags` conquistadas por ações. A função `evaluate` agrega critérios de primeiro contato, comunicação, notas, SLA e rubricas específicas. As proporções são **por evidência aplicável e avaliada**, não um teste psicológico. Falhas de segurança explícitas geram registros `critical` e limitam indicador de Segurança a 20, em vez de ser compensado por respostas rápidas. Ausência de evidência ainda não avaliada não gera reprovação prematura. Resultado de sessão incompleta não pode ser apresentado como avaliação concluída.

## Persistência e isolamento

`localStorage['proofstack:session:v1']` guarda a sessão. `proofstack:theme` guarda tema. A rotina de leitura valida versão e campos básicos, mas não protege contra alterações intencionais do usuário: a experiência é educativa, **não antifraude**. Dados brutos não são enviados a nenhum destino externo.

## Preparação para próximos recursos

- Converter elegibilidade de espera e autorizações em políticas declarativas.
- Extrair `App.vue` em componentes de Desk, Academy, Reports, Directory e outros módulos.
- Definir tipagem/validação de esquemas de cenários (ex.: Zod) quando houver editor de cenários.
- Diferenciar motor educativo local de um motor de avaliação sob servidor confiável e versões de rubrica.
- Organizar sistemas como plugins simulados consistentes (e-mail, terminal, SQL, DevOps) com eventos de domínio.
- Usar seeds reproduzíveis e versões congeladas de cenários na futura avaliação empresarial.
