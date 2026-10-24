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
    brief: 'O usuário relata dificuldade de autenticação no início do expediente.', kb: ['password'],
    stages: [
      step('start', 'Solicitação de redefinição', 'Ana solicita ajuda para voltar a acessar sua conta. Como você dará andamento?', [
        good('verify', 'Abrir a rotina corporativa de identificação do solicitante.', 'identity_verified', 'process', { feedback: 'Os fatores cadastrados foram confirmados na simulação. Nenhuma senha foi solicitada.' }),
        poor('trust', 'Confirmar nome, área e matrícula usando os dados enviados no chamado.', 'process', { feedback: 'Nome não comprova identidade. Você ainda pode verificar antes de concluir.' }),
        poor('secret', 'Considerar o remetente do e-mail corporativo como validação de identidade.', 'process', { critical: 'Usou o remetente como prova suficiente de identidade.', feedback: 'O remetente do chamado, por si só, não comprova que a pessoa está autorizada a redefinir a conta.' })
      ]),
      step('process', 'Fluxo de redefinição', 'Qual ação você realizará no sistema de identidades?', [
        good('safe-reset', 'Iniciar a rotina de recuperação de senha no portal de identidades.', 'safe_reset', 'conclude', { requires: ['identity_verified', 'kb:password'], feedback: 'Fluxo seguro iniciado; Ana receberia orientações pelo canal corporativo.' }),
        poor('manual', 'Executar uma troca administrativa de senha pelo console de suporte.', 'conclude', { critical: 'Tentou redefinir senha sem seguir política.', feedback: 'Alterações manuais fora do procedimento não são aceitáveis.' }),
        poor('handoff', 'Transferir a solicitação à equipe de Identidades com as informações coletadas.', 'conclude', { set: ['legitimate_handoff'], feedback: 'Encaminhamento é seguro quando não há informação suficiente, embora possa exigir mais trabalho.' })
      ]),
      conclude([
        complete('done', 'Concluir o atendimento como acesso recuperado.', 'resolvido', ['contacted', 'documented', 'identity_verified', 'safe_reset'], 'correct_closure'),
        complete('handoff-done', 'Transferir o atendimento para a fila de Identidades.', 'escalado', ['contacted', 'documented', 'legitimate_handoff'], 'safe_handoff'),
        early('premature', 'Finalizar o chamado com a orientação enviada até o momento.')
      ])
    ],
    rubric: [rubric('Segurança', 'identity_verified', 'Verificação de identidade'), rubric('Segurança', 'safe_reset', 'Procedimento seguro de redefinição'), rubric('Documentação', 'documented', 'Registro de notas de trabalho')]
  },
  {
    id: 'NS-1002', title: 'Preciso de acesso ao ERP', category: 'Acessos', employee: 'bruno', requester: 'Bruno Costa', department: 'Operações', impact: 'médio', urgency: 'média', spawnAt: 0,
    description: 'Fui transferido para outra equipe e preciso acessar o ERP financeiro. Meu chefe comentou que seria liberado, pode conceder?',
    brief: 'Nova função; acesso solicitado ao ERP financeiro.', kb: ['access'],
    stages: [
      step('start', 'Entender a solicitação', 'Bruno não está na lista de acesso ao ERP. Por onde começar?', [
        good('check', 'Abrir a solicitação de perfil com o recurso, a finalidade e o responsável indicado.', 'request_reviewed', 'approval'),
        poor('grant', 'Reaplicar o perfil ERP associado à equipe anterior de Bruno.', 'conclude', { critical: 'Concessão de acesso sem autorização.', set: ['unauthorized_grant'], feedback: 'A liberação não era autorizada. É uma falha crítica mesmo que a pessoa alegue urgência.' }),
        poor('deny', 'Devolver o chamado para Bruno solicitar diretamente ao gestor.', 'approval', { feedback: 'Recusar sem explicar o fluxo de aprovação impede o atendimento adequado.' })
      ]),
      step('approval', 'Aprovação formal', 'O portal de acesso exibe status “Aprovação: pendente”. Qual atualização você fará?', [
        good('review', 'Consultar o procedimento e o fluxo de aprovação do portal.', 'approval_checked', 'conclude', { requires: ['kb:access'], feedback: 'A aprovação segue pendente; o L1 não deve conceder o papel diretamente.' }),
        poor('word', 'Registrar a autorização verbal mencionada como aprovação do pedido.', 'conclude', { feedback: 'Uma promessa verbal não substitui a aprovação registrada.' }),
        poor('ignore', 'Provisionar acesso de curta duração para a transição de equipe.', 'conclude', { feedback: 'Regras de acesso não são detalhes opcionais.' })
      ]),
      conclude([
        complete('escalate', 'Encaminhar a solicitação para a fila de Acessos.', 'escalado', ['contacted', 'documented', 'approval_checked'], 'proper_escalation'),
        early('done', 'Encerrar o chamado informando que o novo perfil foi disponibilizado.', 'resolvido', { critical: 'Fechou solicitação como acesso concedido sem aprovação.' })
      ])
    ],
    rubric: [rubric('Diagnóstico', 'request_reviewed', 'Levantamento dos requisitos de acesso'), rubric('Segurança', 'approval_checked', 'Conferência de aprovação'), rubric('Escalonamento', 'proper_escalation', 'Encaminhamento à equipe competente')]
  },
  {
    id: 'NS-1003', title: 'A VPN não conecta', category: 'Conectividade', employee: 'carla', requester: 'Carla Melo', department: 'RH', impact: 'médio', urgency: 'alta', spawnAt: 12,
    description: 'Estou em casa e a VPN dá erro. Preciso abrir o sistema de RH. Só aparece “Falha na autenticação 691”.',
    brief: 'Erro de conexão VPN durante trabalho remoto.', kb: ['vpn'],
    stages: [
      step('start', 'Coleta de contexto', 'Carla informa falha de autenticação ao conectar. Qual será a sua primeira ação?', [
        good('ask', 'Coletar horário da falha, mensagem exibida e estado da conexão local.', 'error_collected', 'diagnose', { feedback: 'Erro confirmado após troca de senha; conexão com a internet está funcionando.' }),
        poor('guess', 'Solicitar reinício do computador e teste por outra rede.', 'diagnose', { feedback: 'A hipótese foi escolhida sem investigação; a conexão não era a causa.' }),
        poor('blame', 'Orientar Carla a falar com a operadora de internet antes de novas verificações.', 'diagnose', { feedback: 'O diagnóstico foi direcionado à operadora sem evidência de falha no acesso à internet.' })
      ]),
      step('diagnose', 'Análise da VPN', 'O erro 691 continua e a sessão do cliente VPN permanece sem autenticar.', [
        good('kb', 'Executar o diagnóstico de autenticação descrito no procedimento VPN.', 'vpn_diagnosed', 'conclude', { requires: ['error_collected', 'kb:vpn'], feedback: 'A sessão VPN fictícia foi renovada e o acesso voltou a funcionar.' }),
        poor('unsafe', 'Solicitar uma captura da configuração VPN com os campos de autenticação visíveis.', 'conclude', { critical: 'Solicitou exposição de dados de autenticação da VPN.', feedback: 'A captura solicitada poderia divulgar segredos de autenticação; o diagnóstico exige apenas dados técnicos não sensíveis.' }),
        poor('skip', 'Orientar Carla a recriar o perfil VPN e registrar o procedimento enviado.', 'conclude', { feedback: 'Não há evidência de restauração do serviço.' })
      ]),
      conclude([
        complete('resolved', 'Finalizar o atendimento como conexão VPN restabelecida.', 'resolvido', ['contacted', 'documented', 'vpn_diagnosed'], 'resolution_verified'),
        early('skip', 'Concluir o ticket com base nas orientações já enviadas.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'error_collected', 'Coleta de sintomas'), rubric('Diagnóstico', 'vpn_diagnosed', 'Diagnóstico apoiado por procedimento'), rubric('Cumprimento de procedimentos e SLAs', 'resolution_verified', 'Validação antes da solução')]
  },
  {
    id: 'NS-1004', title: 'Onde fica a Wiki interna?', category: 'Informação', employee: 'diego', requester: 'Diego Nunes', department: 'Projetos', impact: 'baixo', urgency: 'baixa', spawnAt: 22,
    description: 'Pessoal, qual é o caminho para a base de conhecimento interna? Não achei no menu.',
    brief: 'Dúvida sobre navegação no portal interno.', kb: ['intranet'],
    stages: [
      step('start', 'Orientação documentada', 'Diego quer acessar a Wiki corporativa. Que orientação você enviará?', [
        good('kb', 'Consultar o catálogo de serviços e enviar o caminho da Wiki mostrado no portal.', 'correct_guidance', 'conclude', { requires: ['kb:intranet'], feedback: 'Diego confirmou que encontrou a Wiki pelo caminho descrito.' }),
        poor('guess', 'Usar o endereço da Wiki registrado em um comunicado antigo.', 'conclude', { feedback: 'O endereço do comunicado antigo está desatualizado para o portal atual.' }),
        poor('skip', 'Encaminhar Diego ao time de Comunicação Interna para localizar a Wiki.', 'conclude', { feedback: 'O usuário continua sem a informação solicitada.' })
      ]),
      conclude([
        complete('resolve', 'Concluir a solicitação de localização da Wiki.', 'resolvido', ['contacted', 'documented', 'correct_guidance'], 'correct_closure'),
        early('early', 'Encerrar após informar o endereço encontrado.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'correct_guidance', 'Uso de fonte confiável'), rubric('Comunicação', 'correct_closure', 'Orientação encerrada com confirmação')]
  },
  {
    id: 'NS-1005', title: 'Não recebi atualização do meu chamado', category: 'Atendimento', employee: 'elisa', requester: 'Elisa Rocha', department: 'Operações', impact: 'médio', urgency: 'média', spawnAt: 35,
    description: 'Faz tempo que pedi ajuda para o sistema de cadastro. Ninguém me dá posição! Tenho uma reunião em seguida.',
    brief: 'Uma solicitante quer uma atualização sobre o status do atendimento.', kb: ['communication'],
    stages: [
      step('start', 'Gestão de expectativa', 'O ticket anterior de Elisa continua com a equipe de aplicação; não existe previsão confirmada.', [
        good('update', 'Informar o status confirmado com a equipe de aplicação e combinar uma nova atualização.', 'clear_followup', 'conclude', { requires: ['kb:communication'], feedback: 'Elisa recebeu uma atualização honesta e sabe onde acompanhar a situação.' }),
        poor('promise', 'Informar o prazo estimado que costuma valer para esse tipo de solicitação.', 'conclude', { set: ['false_promise'], feedback: 'Você prometeu um prazo que o sistema não confirma.' }),
        poor('blame', 'Encaminhar a cobrança à equipe de aplicação e retornar apenas quando houver uma solução.', 'conclude', { feedback: 'A solicitante ficou sem previsão de novo contato e sem visibilidade do encaminhamento.' })
      ]),
      conclude([
        complete('resolve', 'Concluir o ticket referente ao pedido de atualização.', 'resolvido', ['contacted', 'documented', 'clear_followup'], 'correct_closure'),
        early('fake', 'Fechar também o incidente original com base no retorno enviado.')
      ])
    ],
    rubric: [rubric('Comunicação', 'clear_followup', 'Atualização objetiva, sem promessa falsa'), rubric('Documentação', 'documented', 'Registro do contato')]
  },
  {
    id: 'NS-1006', title: 'URGENTE: reativação de conta de diretoria', category: 'Segurança', employee: 'caio', requester: 'Pessoa alegando ser Caio Albuquerque', department: 'Operações', impact: 'médio', urgency: 'alta', spawnAt: 50,
    description: '“Sou diretor. Reative minha conta agora. Se demorar, vou falar com a gerência e você terá problemas.”',
    brief: 'Solicitação urgente para restaurar acesso a uma conta desativada.', kb: ['security'],
    stages: [
      step('start', 'Solicitação sob pressão', 'O solicitante afirma ter urgência e pede uma exceção. Como você encaminha?', [
        good('verify', 'Verificar o registro da conta no Diretório de Funcionários.', 'employment_checked', 'authorize', { requires: ['directory:caio'], feedback: 'O diretório interno mostra vínculo encerrado e conta desativada. Isso impede a reativação por L1.' }),
        poor('trust', 'Aplicar o fluxo de restauração emergencial para cargo de diretoria.', 'conclude', { critical: 'Tentou reativar conta de vínculo encerrado.', set: ['unauthorized_grant'], feedback: 'Ação insegura registrada. Um cargo alegado não autoriza restauração de acesso.' }),
        poor('threat', 'Solicitar uma exceção provisória enquanto o vínculo é apurado.', 'authorize', { feedback: 'Pressão ou ameaça não altera a política de segurança.' })
      ]),
      step('authorize', 'Autorização atual', 'O solicitante insiste. Qual será o próximo encaminhamento para o pedido de reativação?', [
        good('safe', 'Consultar o fluxo corporativo e encaminhar para análise da equipe responsável.', 'security_policy', 'conclude', { requires: ['employment_checked', 'kb:security'], feedback: 'Procedimento de segurança identificado. O contato deve ser registrado sem revelar dados internos.' }),
        poor('release', 'Explicar o motivo administrativo registrado para a desativação da conta.', 'conclude', { critical: 'Divulgou dados internos a solicitante não verificado.', feedback: 'Não divulgue registros de funcionários a um contato não identificado.' }),
        poor('ignore', 'Habilitar acesso de teste por 30 minutos para validar a conta.', 'conclude', { critical: 'Autorizou acesso temporário indevido.', feedback: 'Acesso temporário ainda é acesso. Não foi autorizada nenhuma exceção.' })
      ]),
      conclude([
        complete('secure', 'Registrar a tratativa e encaminhar o caso à Segurança.', 'escalado', ['contacted', 'documented', 'employment_checked', 'security_policy'], 'security_escalation'),
        early('unsafe', 'Concluir o pedido como acesso liberado em caráter emergencial.', 'resolvido', { critical: 'Concluiu com liberação de acesso não autorizado.' })
      ])
    ],
    rubric: [rubric('Segurança', 'employment_checked', 'Verificação do vínculo independente do solicitante'), rubric('Segurança', 'security_policy', 'Política seguida após consulta'), rubric('Escalonamento', 'security_escalation', 'Encaminhamento de suspeita à Segurança')]
  },
  {
    id: 'NS-1007', title: 'Sistema financeiro indisponível para equipe', category: 'Incidente', employee: 'felipe', requester: 'Felipe Barros', department: 'Financeiro', impact: 'alto', urgency: 'alta', spawnAt: 73,
    description: 'Desde 10h todos do Financeiro recebem erro 503 no ERP. Fechamento do dia bloqueado. Temos vários usuários afetados.',
    brief: 'Indisponibilidade relatada por usuários de um sistema financeiro.', kb: ['critical'],
    stages: [
      step('start', 'Classificação do impacto', 'Há relatos de erro 503 no ERP. Qual encaminhamento inicial você escolherá?', [
        good('p1', 'Registrar alcance da falha e aplicar a classificação de prioridade da operação.', 'severity_recognized', 'response', { feedback: 'Indisponibilidade crítica reconhecida e impacto registrado.' }),
        poor('low', 'Registrar tickets separados para as pessoas afetadas e trabalhar pela ordem de chegada.', 'response', { feedback: 'A severidade foi subestimada apesar da indisponibilidade coletiva.' }),
        poor('try', 'Solicitar reinício do serviço ERP pelo console de suporte da operação.', 'response', { critical: 'Tentou operação produtiva sem autorização.', feedback: 'Um L1 não deve alterar produção sem autorização e procedimento.' })
      ]),
      step('response', 'Resposta ao incidente', 'O painel de disponibilidade indica falha no ERP Financeiro com usuários afetados.', [
        good('escalate', 'Iniciar o processo de incidente maior e envolver a equipe de aplicação.', 'major_escalation', 'conclude', { requires: ['severity_recognized', 'kb:critical'], feedback: 'Equipe de resposta fictícia acionada. A correção permanece com o time de aplicação.' }),
        poor('wait', 'Aguardar a próxima atualização automática antes de mobilizar outras equipes.', 'conclude', { feedback: 'Aguardar sem acionar resposta não atende a severidade do caso.' }),
        poor('fix', 'Aplicar ajustes de serviço para recuperar o ERP sem abrir uma mudança.', 'conclude', { critical: 'Tentou modificar sistema crítico fora da alçada.', feedback: 'Mudanças não autorizadas elevam risco operacional.' })
      ]),
      conclude([
        complete('escalate', 'Encaminhar o incidente para resposta e registrar as ações do L1.', 'escalado', ['contacted', 'documented', 'major_escalation'], 'proper_escalation'),
        early('false', 'Concluir após comunicar que o incidente foi encaminhado.')
      ])
    ],
    rubric: [rubric('Priorização', 'severity_recognized', 'Identificação de incidente P1'), rubric('Escalonamento', 'major_escalation', 'Acionamento de incidente maior'), rubric('Segurança', 'proper_escalation', 'Respeito aos limites do L1')]
  },
  {
    id: 'NS-1008', title: 'Duas pessoas com erro no CRM', category: 'Incidente', employee: 'gabriela', requester: 'Gabriela Lima e Helena Torres', department: 'Comercial', impact: 'alto', urgency: 'média', spawnAt: 82,
    description: 'Gabriela e Helena reportam o mesmo erro “Gateway 502” no CRM desde 10h20. Há suspeita de falha em serviço compartilhado.',
    brief: 'Falha relatada por duas pessoas do Comercial.', kb: ['correlation'],
    relatedReports: [
      { id: 'CRM-201', requester: 'Gabriela Lima', error: 'Gateway 502', at: '10:20' },
      { id: 'CRM-202', requester: 'Helena Torres', error: 'Gateway 502', at: '10:21' }
    ],
    stages: [
      step('start', 'Correlação de sintomas', 'Os dois relatos mencionam sintomas semelhantes. Como você investigará?', [
        good('monitor', 'Comparar os relatos com a disponibilidade e as dependências monitoradas.', 'incident_linked', 'conclude', { requires: ['monitor', 'kb:correlation'], feedback: 'CRM e ERP usam o mesmo gateway fictício com falha. Os relatos foram vinculados a um incidente comum.' }),
        poor('separate', 'Executar testes de sessão individuais antes de associar os chamados.', 'conclude', { feedback: 'Hipótese de causa comum não foi investigada.' }),
        poor('closed', 'Associar os relatos à falha geral e encerrar os tickets individuais.', 'conclude', { feedback: 'Identificar que é sistêmico não significa que os usuários voltaram a operar.' })
      ]),
      conclude([
        complete('escalate', 'Encaminhar os relatos vinculados ao incidente encontrado.', 'escalado', ['contacted', 'documented', 'incident_linked'], 'proper_escalation'),
        early('false', 'Concluir os dois relatos após indicar uma provável causa compartilhada.')
      ])
    ],
    rubric: [rubric('Diagnóstico', 'incident_linked', 'Correlação baseada em evidências'), rubric('Documentação', 'documented', 'Registro da hipótese e evidências'), rubric('Escalonamento', 'proper_escalation', 'Encaminhamento dos relatos relacionados')]
  }
]

export const scenarioById = Object.fromEntries(scenarios.map(s => [s.id, s]))
export const scheduledMessages = [
  { at: 0, text: 'Bem-vindo à Northstar. Você tem acesso aos chamados, ao diretório e à documentação interna.' },
  { at: 30, text: 'Operações: a central registra horários de atendimento e movimentações dos chamados.' },
  { at: 73, text: 'ALERTA DO MONITORAMENTO: ERP Financeiro indisponível. Incidente crítico em investigação.' },
  { at: 82, text: 'ALERTA DO MONITORAMENTO: CRM com erro 502; gateway compartilhado apresenta anomalias.' }
]
