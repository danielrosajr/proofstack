// Cenários declarativos: o motor não conhece os IDs específicos destes tickets.
// A opção final requer evidências; caminhos inseguros existem para fins de aprendizagem
// e são registrados como erros, não como alternativas equivalentes.
const option = (id, text, settings = {}) => ({ id, text, minutes: 4, ...settings })
const step = (id, title, prompt, options) => ({ id, title, prompt, options })
const conclude = (options) => step('conclude', 'Decisão de atendimento', 'Como você registrará o desfecho deste chamado?', options)
const good = (id, text, set, next, extra = {}) => option(id, text, { set: [set], next, tone: 'good', ...extra })
const poor = (id, text, next, extra = {}) => option(id, text, { next, tone: 'bad', ...extra })
const complete = (id, text, status, requires, set, extra = {}) => option(id, text, { finish: status, requires, set: [set], tone: 'good', minutes: 5, ...extra })
const early = (id, text, status = 'resolvido', extra = {}) => option(id, text, { finish: status, tone: 'bad', set: ['premature_closed'], minutes: 2, ...extra })
const rubric = (skill, flag, description) => ({ skill, flag, description })

export const scenarios = [
  {
    id: 'NS-1001', title: 'Não consigo entrar na minha conta', category: 'Contas', employee: 'ana', requester: 'Ana Martins', department: 'Financeiro', impact: 'baixo', urgency: 'média', spawnAt: 0,
    description: 'Olá, entrei hoje e não lembro a senha da minha conta. Preciso acessar os documentos da equipe. Pode redefinir?',
    brief: 'Uma solicitação cotidiana que exige uma conferência de identidade antes de qualquer alteração.', kb: ['password'],
    stages: [
      step('start', 'Verificação de identidade', 'Ana precisa de acesso. Como você inicia o procedimento?', [
        good('verify', 'Conferir os fatores cadastrados pelo procedimento seguro (simulado).', 'identity_verified', 'process', { feedback: 'Os fatores cadastrados foram confirmados na simulação. Nenhuma senha foi solicitada.' }),
        poor('trust', 'Aceitar apenas o nome informado e seguir com o pedido.', 'process', { feedback: 'Nome não comprova identidade. Você ainda pode verificar antes de concluir.' }),
        poor('secret', 'Pedir a senha anterior por mensagem.', 'process', { critical: 'Solicitou senha ao usuário.', feedback: 'Senhas nunca devem ser solicitadas. O evento ficou registrado como falha crítica de segurança.' })
      ]),
      step('process', 'Fluxo de redefinição', 'Qual é o procedimento de autorização?', [
        good('safe-reset', 'Usar o fluxo autorizado de redefinição descrito na KB-101.', 'safe_reset', 'conclude', { requires: ['identity_verified', 'kb:password'], feedback: 'Fluxo seguro iniciado; Ana receberia orientações pelo canal corporativo.' }),
        poor('manual', 'Alterar diretamente a credencial sem validação.', 'conclude', { critical: 'Tentou redefinir senha sem seguir política.', feedback: 'Alterações manuais fora do procedimento não são aceitáveis.' }),
        poor('handoff', 'Escalar com contexto sem alterar a conta.', 'conclude', { set: ['legitimate_handoff'], feedback: 'Encaminhamento é seguro quando não há informação suficiente, embora possa exigir mais trabalho.' })
      ]),
      conclude([
        complete('done', 'Registrar resolução após verificação, atendimento e notas.', 'resolvido', ['contacted', 'documented', 'identity_verified', 'safe_reset'], 'correct_closure'),
        complete('handoff-done', 'Escalar corretamente porque não foi possível validar a identidade.', 'escalado', ['contacted', 'documented', 'legitimate_handoff'], 'safe_handoff'),
        early('premature', 'Marcar como resolvido sem validação completa.')
      ])
    ],
    rubric: [rubric('Segurança', 'identity_verified', 'Verificação de identidade'), rubric('Segurança', 'safe_reset', 'Procedimento seguro de redefinição'), rubric('Documentação', 'documented', 'Registro de notas de trabalho')]
  },
  {
    id: 'NS-1002', title: 'Preciso de acesso ao ERP', category: 'Acessos', employee: 'bruno', requester: 'Bruno Costa', department: 'Operações', impact: 'médio', urgency: 'média', spawnAt: 0,
    description: 'Fui transferido para outra equipe e preciso acessar o ERP financeiro. Meu chefe comentou que seria liberado, pode conceder?',
    brief: 'A autorização formal é diferente de uma alegação verbal de aprovação.', kb: ['access'],
    stages: [
      step('start', 'Entender a solicitação', 'Bruno não está na lista de acesso ao ERP. Por onde começar?', [
        good('check', 'Registrar recurso, justificativa e quem deveria aprovar.', 'request_reviewed', 'approval'),
        poor('grant', 'Conceder acesso privilegiado imediatamente.', 'conclude', { critical: 'Concessão de acesso sem autorização.', set: ['unauthorized_grant'], feedback: 'A liberação não era autorizada. É uma falha crítica mesmo que a pessoa alegue urgência.' }),
        poor('deny', 'Recusar sem dar qualquer orientação.', 'approval', { feedback: 'Recusar sem explicar o fluxo de aprovação impede o atendimento adequado.' })
      ]),
      step('approval', 'Aprovação formal', 'O sistema registra “Aprovação: pendente”. O que fazer?', [
        good('review', 'Consultar a KB-102 e confirmar a ausência de aprovação.', 'approval_checked', 'conclude', { requires: ['kb:access'], feedback: 'A aprovação segue pendente; o L1 não deve conceder o papel diretamente.' }),
        poor('word', 'Considerar a aprovação verbal suficiente.', 'conclude', { feedback: 'Uma promessa verbal não substitui a aprovação registrada.' }),
        poor('ignore', 'Ignorar as permissões do sistema.', 'conclude', { feedback: 'Regras de acesso não são detalhes opcionais.' })
      ]),
      conclude([
        complete('escalate', 'Encaminhar solicitação à equipe de acessos para aprovação formal.', 'escalado', ['contacted', 'documented', 'approval_checked'], 'proper_escalation'),
        early('done', 'Encerrar como acesso concedido, sem aprovação.', 'resolvido', { critical: 'Fechou solicitação como acesso concedido sem aprovação.' })
      ])
    ],
    rubric: [rubric('Diagnóstico', 'request_reviewed', 'Levantamento dos requisitos de acesso'), rubric('Segurança', 'approval_checked', 'Conferência de aprovação'), rubric('Escalonamento', 'proper_escalation', 'Encaminhamento à equipe competente')]
  },
  {
    id: 'NS-1003', title: 'A VPN não conecta', category: 'Conectividade', employee: 'carla', requester: 'Carla Melo', department: 'RH', impact: 'médio', urgency: 'alta', spawnAt: 12,
    description: 'Estou em casa e a VPN dá erro. Preciso abrir o sistema de RH. Só aparece “Falha na autenticação 691”.',
    brief: 'Diagnóstico em etapas, com coleta de evidências e conferência de informações.', kb: ['vpn'],
    stages: [
      step('start', 'Coleta de contexto', 'Você precisa de mais informações para diagnosticar o erro 691.', [
        good('ask', 'Confirmar horário, conectividade e mensagem exata do erro.', 'error_collected', 'diagnose', { feedback: 'Erro confirmado após troca de senha; conexão com a internet está funcionando.' }),
        poor('guess', 'Assumir que é falha da internet e mandar reiniciar tudo.', 'diagnose', { feedback: 'A hipótese foi escolhida sem investigação; a conexão não era a causa.' }),
        poor('blame', 'Informar que o problema é culpa da usuária.', 'diagnose', { feedback: 'Culpabilizar a pessoa não ajuda a isolar o problema.' })
      ]),
      step('diagnose', 'Análise da VPN', 'Carla relata ter atualizado a senha hoje; o cliente VPN ainda usa uma sessão antiga.', [
        good('kb', 'Seguir KB-103: conferir sessão, horário e credenciais sem pedir senha.', 'vpn_diagnosed', 'conclude', { requires: ['error_collected', 'kb:vpn'], feedback: 'A sessão VPN fictícia foi renovada e o acesso voltou a funcionar.' }),
        poor('unsafe', 'Solicitar que a usuária envie sua senha por texto.', 'conclude', { critical: 'Solicitou credencial durante diagnóstico de VPN.', feedback: 'Credenciais não devem ser transmitidas ao suporte.' }),
        poor('skip', 'Informar solução sem confirmar o resultado.', 'conclude', { feedback: 'Não há evidência de restauração do serviço.' })
      ]),
      conclude([
        complete('resolved', 'Confirmar recuperação, registrar evidências e resolver.', 'resolvido', ['contacted', 'documented', 'vpn_diagnosed'], 'resolution_verified'),
        early('skip', 'Resolver sem teste de conectividade.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'error_collected', 'Coleta de sintomas'), rubric('Diagnóstico', 'vpn_diagnosed', 'Diagnóstico apoiado por procedimento'), rubric('Cumprimento de procedimentos e SLAs', 'resolution_verified', 'Validação antes da solução')]
  },
  {
    id: 'NS-1004', title: 'Onde fica a Wiki interna?', category: 'Informação', employee: 'diego', requester: 'Diego Nunes', department: 'Projetos', impact: 'baixo', urgency: 'baixa', spawnAt: 22,
    description: 'Pessoal, qual é o caminho para a base de conhecimento interna? Não achei no menu.',
    brief: 'Use documentação e comunicação clara para atender uma solicitação de informação.', kb: ['intranet'],
    stages: [
      step('start', 'Orientação documentada', 'Como confirmar o caminho para a Wiki?', [
        good('kb', 'Consultar KB-104 e orientar Portal > Recursos > Base de Conhecimento.', 'correct_guidance', 'conclude', { requires: ['kb:intranet'], feedback: 'Diego confirmou que encontrou a Wiki pelo caminho descrito.' }),
        poor('guess', 'Inventar um endereço que parece correto.', 'conclude', { feedback: 'Orientações não verificadas podem criar novos problemas.' }),
        poor('skip', 'Fechar o pedido sem orientar.', 'conclude', { feedback: 'O usuário continua sem a informação solicitada.' })
      ]),
      conclude([
        complete('resolve', 'Registrar orientação confirmada e resolver.', 'resolvido', ['contacted', 'documented', 'correct_guidance'], 'correct_closure'),
        early('early', 'Encerrar sem confirmação de orientação.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'correct_guidance', 'Uso de fonte confiável'), rubric('Comunicação', 'correct_closure', 'Orientação encerrada com confirmação')]
  },
  {
    id: 'NS-1005', title: 'Não recebi atualização do meu chamado', category: 'Atendimento', employee: 'elisa', requester: 'Elisa Rocha', department: 'Operações', impact: 'médio', urgency: 'média', spawnAt: 35,
    description: 'Faz tempo que pedi ajuda para o sistema de cadastro. Ninguém me dá posição! Tenho uma reunião em seguida.',
    brief: 'Atenção ao comportamento observável, sem “nota de personalidade”.', kb: ['communication'],
    stages: [
      step('start', 'Gestão de expectativa', 'O ticket anterior de Elisa continua com a equipe de aplicação; não existe previsão confirmada.', [
        good('update', 'Reconhecer a situação, explicar o status confirmado e prometer apenas a próxima atualização.', 'clear_followup', 'conclude', { requires: ['kb:communication'], feedback: 'Elisa recebeu uma atualização honesta e sabe onde acompanhar a situação.' }),
        poor('promise', 'Garantir que tudo estará funcionando em dois minutos.', 'conclude', { set: ['false_promise'], feedback: 'Você prometeu um prazo que o sistema não confirma.' }),
        poor('blame', 'Dizer que a usuária deveria ter mais paciência.', 'conclude', { feedback: 'Resposta pouco útil e sem próximos passos concretos.' })
      ]),
      conclude([
        complete('resolve', 'Encerrar a solicitação de atualização com registro do atendimento.', 'resolvido', ['contacted', 'documented', 'clear_followup'], 'correct_closure'),
        early('fake', 'Marcar como “problema técnico resolvido” sem confirmação.')
      ])
    ],
    rubric: [rubric('Comunicação', 'clear_followup', 'Atualização objetiva, sem promessa falsa'), rubric('Documentação', 'documented', 'Registro do contato')]
  },
  {
    id: 'NS-1006', title: 'URGENTE: reativação de conta de diretoria', category: 'Segurança', employee: 'caio', requester: 'Pessoa alegando ser Caio Albuquerque', department: 'Operações', impact: 'médio', urgency: 'alta', spawnAt: 50,
    description: '“Sou diretor. Reative minha conta agora. Se demorar, vou falar com a gerência e você terá problemas.” Verifique antes de aceitar qualquer solicitação de mudança de acesso.',
    brief: 'A identidade e a autorização precisam ser verificadas por fontes independentes da alegação.', kb: ['security'],
    stages: [
      step('start', 'Solicitação sob pressão', 'A pessoa exige uma exceção imediata. O que você faz?', [
        good('verify', 'Conferir vínculo e conta no Diretório de Funcionários.', 'employment_checked', 'authorize', { requires: ['directory:caio'], feedback: 'O diretório interno mostra vínculo encerrado e conta desativada. Isso impede a reativação por L1.' }),
        poor('trust', 'Confiar no cargo alegado e reativar a conta.', 'conclude', { critical: 'Tentou reativar conta de vínculo encerrado.', set: ['unauthorized_grant'], feedback: 'Ação insegura registrada. Um cargo alegado não autoriza restauração de acesso.' }),
        poor('threat', 'Atender por receio de reclamação.', 'authorize', { feedback: 'Pressão ou ameaça não altera a política de segurança.' })
      ]),
      step('authorize', 'Autorização atual', 'O solicitante insiste. Consulte as fontes autorizadas para verificar vínculo e permissão. Quais regras se aplicam?', [
        good('safe', 'Consultar KB-106 e tratar como tentativa suspeita a ser encaminhada.', 'security_policy', 'conclude', { requires: ['employment_checked', 'kb:security'], feedback: 'Procedimento de segurança identificado. O contato deve ser registrado sem revelar dados internos.' }),
        poor('release', 'Compartilhar detalhes privados do ex-funcionário com o solicitante.', 'conclude', { critical: 'Divulgou dados internos a solicitante não verificado.', feedback: 'Não divulgue registros de funcionários a um contato não identificado.' }),
        poor('ignore', 'Reativar temporariamente “só para testar”.', 'conclude', { critical: 'Autorizou acesso temporário indevido.', feedback: 'Acesso temporário ainda é acesso. Não foi autorizada nenhuma exceção.' })
      ]),
      conclude([
        complete('secure', 'Não reativar; registrar e escalar à Segurança.', 'escalado', ['contacted', 'documented', 'employment_checked', 'security_policy'], 'security_escalation'),
        early('unsafe', 'Reativar e encerrar o chamado.', 'resolvido', { critical: 'Concluiu com liberação de acesso não autorizado.' })
      ])
    ],
    rubric: [rubric('Segurança', 'employment_checked', 'Verificação do vínculo independente do solicitante'), rubric('Segurança', 'security_policy', 'Política seguida após consulta'), rubric('Escalonamento', 'security_escalation', 'Encaminhamento de suspeita à Segurança')]
  },
  {
    id: 'NS-1007', title: 'Sistema financeiro indisponível para equipe', category: 'Incidente', employee: 'felipe', requester: 'Felipe Barros', department: 'Financeiro', impact: 'alto', urgency: 'alta', spawnAt: 73,
    description: 'Desde 10h todos do Financeiro recebem erro 503 no ERP. Fechamento do dia bloqueado. Temos vários usuários afetados.',
    brief: 'O impacto coletivo pode exigir resposta de incidente crítico, não correção improvisada.', kb: ['critical'],
    stages: [
      step('start', 'Classificação do impacto', 'Que atitude é apropriada diante da indisponibilidade coletiva?', [
        good('p1', 'Confirmar múltiplos afetados, registrar impacto e reconhecer P1.', 'severity_recognized', 'response', { feedback: 'Indisponibilidade crítica reconhecida e impacto registrado.' }),
        poor('low', 'Tratar como dúvida simples, em fila de baixa prioridade.', 'response', { feedback: 'A severidade foi subestimada apesar da indisponibilidade coletiva.' }),
        poor('try', 'Reiniciar o ERP de produção por conta própria.', 'response', { critical: 'Tentou operação produtiva sem autorização.', feedback: 'Um L1 não deve alterar produção sem autorização e procedimento.' })
      ]),
      step('response', 'Resposta ao incidente', 'Monitoramento confirma ERP Financeiro indisponível para múltiplos usuários.', [
        good('escalate', 'Seguir KB-107 e acionar incidente maior com o time responsável.', 'major_escalation', 'conclude', { requires: ['severity_recognized', 'kb:critical'], feedback: 'Equipe de resposta fictícia acionada. A correção permanece com o time de aplicação.' }),
        poor('wait', 'Aguardar indefinidamente sem comunicação.', 'conclude', { feedback: 'Aguardar sem acionar resposta não atende a severidade do caso.' }),
        poor('fix', 'Modificar configurações do ERP sem permissão.', 'conclude', { critical: 'Tentou modificar sistema crítico fora da alçada.', feedback: 'Mudanças não autorizadas elevam risco operacional.' })
      ]),
      conclude([
        complete('escalate', 'Registrar ações e escalar o incidente grave.', 'escalado', ['contacted', 'documented', 'major_escalation'], 'proper_escalation'),
        early('false', 'Registrar resolução sem restabelecimento do ERP.')
      ])
    ],
    rubric: [rubric('Priorização', 'severity_recognized', 'Identificação de incidente P1'), rubric('Escalonamento', 'major_escalation', 'Acionamento de incidente maior'), rubric('Segurança', 'proper_escalation', 'Respeito aos limites do L1')]
  },
  {
    id: 'NS-1008', title: 'Duas pessoas com erro no CRM', category: 'Incidente', employee: 'gabriela', requester: 'Gabriela Lima e Helena Torres', department: 'Comercial', impact: 'alto', urgency: 'média', spawnAt: 82,
    description: 'Gabriela e Helena reportam o mesmo erro “Gateway 502” no CRM desde 10h20. Há suspeita de falha em serviço compartilhado.',
    brief: 'A tarefa é identificar indícios de causa comum e comunicar sem fechar problemas ainda ativos.', kb: ['correlation'],
    relatedReports: [
      { id: 'CRM-201', requester: 'Gabriela Lima', error: 'Gateway 502', at: '10:20' },
      { id: 'CRM-202', requester: 'Helena Torres', error: 'Gateway 502', at: '10:21' }
    ],
    stages: [
      step('start', 'Correlação de sintomas', 'Os dois relatos têm mesmo sistema, erro e horário. Qual próximo passo?', [
        good('monitor', 'Consultar monitoramento, comparar os relatos e verificar dependência de serviços.', 'incident_linked', 'conclude', { requires: ['monitor', 'kb:correlation'], feedback: 'CRM e ERP usam o mesmo gateway fictício com falha. Os relatos foram vinculados a um incidente comum.' }),
        poor('separate', 'Tratar como incidentes sem relação, sem consultar dados.', 'conclude', { feedback: 'Hipótese de causa comum não foi investigada.' }),
        poor('closed', 'Encerrar ambos porque “o problema é do sistema”.', 'conclude', { feedback: 'Identificar que é sistêmico não significa que os usuários voltaram a operar.' })
      ]),
      conclude([
        complete('escalate', 'Registrar a correlação e encaminhar os relatos ligados ao incidente.', 'escalado', ['contacted', 'documented', 'incident_linked'], 'proper_escalation'),
        early('false', 'Marcar resolvidos os dois relatos sem restauração.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'incident_linked', 'Correlação baseada em evidências'), rubric('Documentação', 'documented', 'Registro da hipótese e evidências'), rubric('Escalonamento', 'proper_escalation', 'Encaminhamento dos relatos relacionados')]
  }
]

export const scenarioById = Object.fromEntries(scenarios.map(s => [s.id, s]))
export const scheduledMessages = [
  { at: 0, text: 'Bem-vindo à Northstar. Seu líder: “Leia os procedimentos e não prometa prazos que você não sabe.”' },
  { at: 30, text: 'Lembrete de Operações: “Registre primeiro contato e notas nos tickets; ambos são auditados.”' },
  { at: 73, text: 'ALERTA DO MONITORAMENTO: ERP Financeiro indisponível. Incidente crítico em investigação.' },
  { at: 82, text: 'ALERTA DO MONITORAMENTO: CRM com erro 502; gateway compartilhado apresenta anomalias.' }
]
