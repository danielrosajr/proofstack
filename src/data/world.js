export const employees = [
  { id: 'ana', name: 'Ana Martins', role: 'Analista financeiro', department: 'Financeiro', account: 'Ativa', relationship: 'Ativo', access: 'ERP Financeiro', manager: 'Patrícia Ferreira' },
  { id: 'bruno', name: 'Bruno Costa', role: 'Analista de operações', department: 'Operações', account: 'Ativa', relationship: 'Ativo', access: 'Portal interno, VPN', manager: 'Lara Teixeira' },
  { id: 'carla', name: 'Carla Melo', role: 'Assistente', department: 'RH', account: 'Ativa', relationship: 'Ativo', access: 'Intranet', manager: 'Marina Pereira' },
  { id: 'diego', name: 'Diego Nunes', role: 'Analista de projetos', department: 'Projetos', account: 'Ativa', relationship: 'Ativo', access: 'Intranet, Wiki', manager: 'João Dias' },
  { id: 'elisa', name: 'Elisa Rocha', role: 'Coordenadora de atendimento', department: 'Operações', account: 'Ativa', relationship: 'Ativo', access: 'Portal interno', manager: 'Lara Teixeira' },
  { id: 'caio', name: 'Caio Albuquerque', role: 'Ex-diretor de operações', department: 'Operações', account: 'Desativada', relationship: 'Encerrado', access: 'Nenhum', manager: '—' },
  { id: 'felipe', name: 'Felipe Barros', role: 'Analista financeiro', department: 'Financeiro', account: 'Ativa', relationship: 'Ativo', access: 'ERP Financeiro', manager: 'Patrícia Ferreira' },
  { id: 'gabriela', name: 'Gabriela Lima', role: 'Analista comercial', department: 'Comercial', account: 'Ativa', relationship: 'Ativo', access: 'CRM, Intranet', manager: 'Rafael Castro' },
  { id: 'helena', name: 'Helena Torres', role: 'Analista comercial', department: 'Comercial', account: 'Ativa', relationship: 'Ativo', access: 'CRM, Intranet', manager: 'Rafael Castro' }
]

export const knowledge = [
  { id: 'password', code: 'KB-101', title: 'Redefinição de senha e identidade', category: 'Segurança', tags: ['senha','autenticação'], body: 'Jamais solicite senhas. Confirme a identidade utilizando a verificação fictícia prevista no chamado e encaminhe a redefinição pelo fluxo autorizado. Documente a checagem sem registrar segredos.', steps: ['Confirme identidade por fatores previamente cadastrados.', 'Não aceite somente nome, cargo ou pressão como prova.', 'Encaminhe para o fluxo seguro de redefinição e registre a ação.'] },
  { id: 'access', code: 'KB-102', title: 'Solicitações de acesso', category: 'Acessos', tags: ['aprovação','permissão'], body: 'Permissões exigem vínculo ativo e aprovação do responsável pelo sistema. O Service Desk L1 verifica o pedido e encaminha; não atribui papéis privilegiados arbitrariamente.', steps: ['Verifique se o pedido descreve o recurso e a necessidade.', 'Consulte o estado da aprovação no chamado.', 'Solicite aprovação formal e encaminhe à equipe de acessos.'] },
  { id: 'vpn', code: 'KB-103', title: 'Diagnóstico inicial de VPN', category: 'Conectividade', tags: ['VPN','rede'], body: 'Coletar mensagem exata de erro antes de alterar configurações. Verificar conectividade, horário, estado da conta e sessão VPN. Registrar o resultado e escalar anomalias persistentes.', steps: ['Pergunte qual erro aparece e desde quando.', 'Confira conexão, data/hora do dispositivo e status da VPN.', 'Oriente reconexão pelo cliente homologado e documente o resultado.'] },
  { id: 'intranet', code: 'KB-104', title: 'Como acessar a Wiki corporativa', category: 'Informação', tags: ['wiki','intranet'], body: 'Funcionários com vínculo ativo acessam a Wiki pelo Portal interno > Recursos > Base de Conhecimento. Não é necessária permissão administrativa.', steps: ['Abra o Portal interno.', 'Acesse Recursos > Base de Conhecimento.', 'Caso o link apresente erro, registre e encaminhe suporte adicional.'] },
  { id: 'communication', code: 'KB-105', title: 'Comunicação com usuários sob pressão', category: 'Atendimento', tags: ['comunicação','cliente'], body: 'Reconheça o impacto relatado sem prometer prazos não confirmados. Informe próxima ação e canal de acompanhamento. Evite culpabilizar usuários ou interpretar emoções como falta de competência.', steps: ['Confirme o recebimento e explique qual etapa será verificada.', 'Comunique limitações e prazo de atualização, se conhecido.', 'Registre a atualização no ticket.'] },
  { id: 'security', code: 'KB-106', title: 'Pedidos suspeitos e contas encerradas', category: 'Segurança', tags: ['engenharia social','identidade'], body: 'Cargo alegado não substitui autorização. Conta desativada com vínculo encerrado não pode ser reativada por L1. Registre o contato e reporte a tentativa ao time responsável, sem divulgar dados sensíveis.', steps: ['Verifique identidade e situação de vínculo em fonte autorizada.', 'Negue mudanças sem aprovação válida.', 'Preserve as informações mínimas e acione Segurança.'] },
  { id: 'critical', code: 'KB-107', title: 'Protocolo de incidente crítico', category: 'Incidentes', tags: ['P1','incidente'], body: 'Quando múltiplos usuários não conseguem acessar serviço financeiro essencial, registre impacto e início, classifique severidade e acione a equipe de resposta. L1 não reinicia sistemas produtivos sem autorização.', steps: ['Confirme extensão e urgência do impacto.', 'Abra/relacione incidente maior e escale imediatamente.', 'Atualize usuários com o status confirmado, sem inventar ETA.'] },
  { id: 'correlation', code: 'KB-108', title: 'Correlação de incidentes', category: 'Incidentes', tags: ['correlação','monitoramento'], body: 'Sintomas iguais, mesma janela de tempo e dependência de serviço sugerem causa comum. Verifique monitoramento e vincule chamados ao incidente principal; não feche individualmente problemas ainda ativos.', steps: ['Compare serviço, erro e horário dos relatos.', 'Consulte monitoramento fictício e incidentes abertos.', 'Registre vínculo e encaminhe atualização conjunta.'] },
  { id: 'sla', code: 'POL-001', title: 'Política de SLA Northstar', category: 'Políticas', tags: ['SLA','prioridade'], body: 'Turno didático 09:00–17:00 (tempo virtual). Prioridade deriva de impacto × urgência. Primeira resposta e tratamento são medições independentes. Aguardando usuário ou aprovação congela apenas o prazo de solução, não o SLA da primeira resposta; escalonamento não congela SLA.', steps: ['P1: resposta 15 min; resolução/encaminhamento 90 min.', 'P2: resposta 30 min; resolução/encaminhamento 180 min.', 'P3: resposta 45 min; resolução/encaminhamento 240 min.', 'P4: resposta 90 min; resolução/encaminhamento 360 min.'] }
]

export const glossary = [
  { term: 'SLA', normal: 'Acordo de nível de serviço: define os prazos e condições para atender uma demanda.', uga: 'É como um combinado: o atendimento tem um tempo máximo para dar retorno e resolver.', neanderthal: 'Prazo combinado para atender.' },
  { term: 'VPN', normal: 'Conexão criptografada que permite acessar recursos de uma rede corporativa.', uga: 'É como entrar no prédio da empresa por um corredor protegido, mesmo trabalhando de casa.', neanderthal: 'Ligação protegida com rede da empresa.' },
  { term: 'Escalonamento', normal: 'Encaminhamento formal do caso a outra equipe ou nível de responsabilidade.', uga: 'Se você não tem a chave da sala, chama a pessoa autorizada em vez de arrombar a porta.', neanderthal: 'Pedir ajuda ao time certo.' },
  { term: 'Incidente', normal: 'Interrupção ou degradação não planejada de um serviço.', uga: 'É quando a porta da loja trava e ninguém consegue entrar ou trabalhar.', neanderthal: 'Algo parou de funcionar.' },
  { term: 'Autenticação', normal: 'Processo para confirmar a identidade de quem tenta acessar um recurso.', uga: 'É o porteiro conferindo quem está entrando; dizer o nome não é suficiente.', neanderthal: 'Provar quem você é.' },
  { term: 'Prioridade', normal: 'Ordem de atendimento calculada a partir da urgência e do impacto de uma situação.', uga: 'Se uma lâmpada pisca e o prédio inteiro está sem energia, a falta de energia vem primeiro.', neanderthal: 'Resolver primeiro o mais importante.' }
]

export const priorityPolicy = {
  P1: { label: 'Crítica', response: 15, resolution: 90 },
  P2: { label: 'Alta', response: 30, resolution: 180 },
  P3: { label: 'Média', response: 45, resolution: 240 },
  P4: { label: 'Baixa', response: 90, resolution: 360 }
}

export function getPriority(impact, urgency) {
  if (impact === 'alto' && urgency === 'alta') return 'P1'
  if ((impact === 'alto' && urgency === 'média') || (impact === 'médio' && urgency === 'alta')) return 'P2'
  if ((impact === 'alto' && urgency === 'baixa') || (impact === 'médio' && urgency === 'média') || (impact === 'baixo' && urgency === 'alta')) return 'P3'
  return 'P4'
}
