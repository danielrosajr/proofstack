import { scenarios, scenarioById, scheduledMessages } from '../data/scenarios.js'
import { getPriority, priorityPolicy } from '../data/world.js'

export const SAVE_KEY = 'proofstack:session:v1'
export const TERMINAL = ['resolvido', 'escalado', 'encerrado']
const PAUSED = ['aguardando_usuário', 'aguardando_aprovação']
const classes = ['Primeiro contato', 'Comunicação', 'Priorização', 'Diagnóstico', 'Segurança', 'Escalonamento', 'Documentação', 'Cumprimento de procedimentos e SLAs']

export function clock(minutes = 0) {
  const absolute = 9 * 60 + minutes
  return `${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`
}
export function initSession() {
  const state = {
    version: 1,
    phase: 'playing',
    elapsed: 0,
    selected: 'NS-1001',
    activeView: 'desk',
    tutorialStep: 0,
    tutorialVisible: true,
    tickets: {},
    seenEvents: [],
    messages: [],
    activity: [],
    flash: 'Seu turno começou às 09:00. As decisões mudam o estado da simulação.'
  }
  for (const s of scenarios) {
    state.tickets[s.id] = {
      id: s.id, visible: false, status: 'não_iniciado', stage: s.stages[0].id,
      openedAt: s.spawnAt, firstResponseAt: null, completedAt: null,
      pauseStartedAt: null, pausedMinutes: 0, notes: [], flags: [], history: [], replyQuality: null
    }
  }
  return emitScheduled(state)
}
function record(state, id, type, message, critical = null) {
  const entry = { at: state.elapsed, ticketId: id, type, message, critical }
  state.activity.push(entry)
  if (id && state.tickets[id]) state.tickets[id].history.push(entry)
}
function emitScheduled(state) {
  for (const scenario of scenarios) {
    if (scenario.spawnAt <= state.elapsed && !state.tickets[scenario.id].visible) {
      const ticket = state.tickets[scenario.id]
      ticket.visible = true
      ticket.status = 'novo'
      record(state, scenario.id, 'received', `Novo chamado recebido: ${scenario.title}`)
    }
  }
  for (let index = 0; index < scheduledMessages.length; index++) {
    if (scheduledMessages[index].at <= state.elapsed && !state.seenEvents.includes(index)) {
      state.seenEvents.push(index)
      state.messages.unshift({ at: scheduledMessages[index].at, text: scheduledMessages[index].text })
      record(state, null, 'event', scheduledMessages[index].text)
    }
  }
  return state
}
function consume(state, minutes) {
  state.elapsed += minutes
  if (state.elapsed > 480) state.elapsed = 480
  emitScheduled(state)
}
export function advance(state, minutes = 10) {
  if (state.phase !== 'playing') return state
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) return state
  const next = structuredClone(state)
  consume(next, minutes)
  next.flash = next.elapsed === 480 ? 'Fim do expediente virtual (17:00). Você pode finalizar o turno.' : `${minutes} min de tempo virtual avançaram; confira possíveis chamados e alertas.`
  return next
}
function ready(state, id) {
  return state.phase === 'playing' && state.tickets[id]?.visible && !TERMINAL.includes(state.tickets[id].status)
}
function addFlags(ticket, flags = []) {
  for (const flag of flags) if (!ticket.flags.includes(flag)) ticket.flags.push(flag)
}
export function hasRequirement(state, id, requirement) {
  return Boolean(state.tickets[id]?.flags.includes(requirement))
}
export const readableRequirements = {
  contacted: 'enviar primeira resposta', documented: 'registrar nota de trabalho',
  identity_verified: 'validar identidade', safe_reset: 'executar fluxo seguro',
  legitimate_handoff: 'encaminhar o caso com segurança', approval_checked: 'conferir aprovação',
  error_collected: 'coletar erro', vpn_diagnosed: 'investigar VPN',
  correct_guidance: 'encontrar orientação correta', clear_followup: 'comunicar próximos passos',
  employment_checked: 'consultar vínculo no diretório', security_policy: 'seguir política de segurança',
  severity_recognized: 'reconhecer severidade', major_escalation: 'acionar incidente maior',
  incident_linked: 'correlacionar os incidentes', monitor: 'consultar monitoramento',
  'directory:caio': 'consultar Caio no diretório',
  'kb:password': 'abrir a KB-101', 'kb:access': 'abrir a KB-102', 'kb:vpn': 'abrir a KB-103',
  'kb:intranet': 'abrir a KB-104', 'kb:communication': 'abrir a KB-105',
  'kb:security': 'abrir a KB-106', 'kb:critical': 'abrir a KB-107', 'kb:correlation': 'abrir a KB-108'
}
export function unmet(state, id, requirements = []) {
  return requirements.filter(r => !hasRequirement(state, id, r)).map(r => readableRequirements[r] ?? r)
}
export function sendReply(state, id, quality = 'clear') {
  if (!ready(state, id) || !['clear','promise','password'].includes(quality)) return state
  const next = structuredClone(state)
  const ticket = next.tickets[id]
  if (ticket.firstResponseAt !== null) {
    next.flash = 'A primeira resposta já foi registrada. Acrescente notas para atualizar o atendimento.'
    return next
  }
  const messages = {
    clear: 'Recebemos sua solicitação. Vou verificar as informações e registrar os próximos passos; retorno conforme procedimento.',
    promise: 'Seu problema está resolvido / será resolvido em dois minutos, garantido.',
    password: 'Envie sua senha atual para que eu possa confirmar sua identidade.'
  }
  ticket.firstResponseAt = next.elapsed
  ticket.replyQuality = quality
  addFlags(ticket, ['contacted', ...(quality === 'clear' ? ['clear_contact'] : [])])
  if (ticket.status === 'novo') ticket.status = 'em_andamento'
  const critical = quality === 'password' ? 'Solicitação de senha ao usuário no primeiro contato.' : null
  record(next, id, 'reply', messages[quality], critical)
  consume(next, 3)
  next.flash = quality === 'clear' ? 'Primeira resposta registrada corretamente.' : 'Resposta enviada. Confira o histórico e as consequências dessa comunicação.'
  return next
}
export function saveNote(state, id, note) {
  if (!ready(state, id)) return state
  const clean = typeof note === 'string' ? note.trim().slice(0, 800) : ''
  const next = structuredClone(state)
  if (clean.length < 8) { next.flash = 'Registre ao menos 8 caracteres na nota de trabalho.'; return next }
  const ticket = next.tickets[id]
  ticket.notes.push({ at: next.elapsed, text: clean })
  addFlags(ticket, ['documented'])
  if (ticket.status === 'novo') ticket.status = 'em_andamento'
  record(next, id, 'note', `Nota: ${clean}`)
  consume(next, 2)
  next.flash = 'Nota de trabalho registrada no histórico do chamado.'
  return next
}
export function inspectKnowledge(state, id, kbId) {
  if (!ready(state, id)) return state
  const next = structuredClone(state)
  const ticket = next.tickets[id]
  const flag = `kb:${kbId}`
  if (!ticket.flags.includes(flag)) {
    addFlags(ticket, [flag])
    record(next, id, 'knowledge', `Procedimento ${kbId} consultado`)
    consume(next, 1)
  }
  next.flash = 'Consulta à base de conhecimento registrada.'
  return next
}
export function inspectEmployee(state, id, employeeId) {
  if (!ready(state, id)) return state
  const next = structuredClone(state)
  const ticket = next.tickets[id]
  const flag = `directory:${employeeId}`
  if (!ticket.flags.includes(flag)) {
    addFlags(ticket, [flag])
    record(next, id, 'directory', `Diretório: registro ${employeeId} consultado`)
    consume(next, 1)
  }
  next.flash = 'Consulta ao diretório registrada para este atendimento.'
  return next
}
export function inspectMonitor(state, id) {
  if (!ready(state, id)) return state
  const next = structuredClone(state)
  const ticket = next.tickets[id]
  if (!ticket.flags.includes('monitor')) {
    addFlags(ticket, ['monitor'])
    record(next, id, 'monitor', 'Painel de disponibilidade consultado')
    consume(next, 1)
  }
  next.flash = 'Consulta ao monitoramento registrada.'
  return next
}
export function performChoice(state, id, choiceId) {
  if (!ready(state, id)) return state
  const scenario = scenarioById[id]
  const ticket = state.tickets[id]
  if (PAUSED.includes(ticket.status)) return state
  const stage = scenario.stages.find(s => s.id === ticket.stage)
  const choice = stage?.options.find(o => o.id === choiceId)
  if (!choice) return state
  const missing = unmet(state, id, choice.requires)
  if (missing.length) {
    const next = structuredClone(state)
    next.flash = `Antes desta decisão: ${missing.join(', ')}.`
    return next
  }
  const next = structuredClone(state)
  const target = next.tickets[id]
  addFlags(target, choice.set || [])
  if (choice.critical) addFlags(target, ['critical_error'])
  if (target.status === 'novo') target.status = 'em_andamento'
  record(next, id, 'choice', choice.text + (choice.feedback ? ` — ${choice.feedback}` : ''), choice.critical || null)
  if (choice.finish) {
    target.status = choice.finish
    target.completedAt = next.elapsed + choice.minutes
    target.stage = 'complete'
  } else if (choice.next) {
    target.stage = choice.next
  }
  consume(next, choice.minutes)
  next.flash = choice.feedback || (choice.finish ? `Chamado ${id} ${choice.finish}.` : 'Decisão registrada. Avance para a próxima etapa.')
  return next
}
export function setWaiting(state, id, waiting) {
  if (!ready(state, id) || !['aguardando_usuário', 'aguardando_aprovação', 'retomar'].includes(waiting)) return state
  const next = structuredClone(state)
  const ticket = next.tickets[id]
  if (waiting === 'retomar') {
    if (!PAUSED.includes(ticket.status)) return state
    ticket.pausedMinutes += next.elapsed - ticket.pauseStartedAt
    ticket.pauseStartedAt = null
    ticket.status = 'em_andamento'
    record(next, id, 'resume', 'Atendimento retomado após a espera')
  } else {
    const justified = waiting === 'aguardando_aprovação'
      ? id === 'NS-1002' && ticket.flags.includes('request_reviewed')
      : (id === 'NS-1001' && !ticket.flags.includes('identity_verified')) ||
        (id === 'NS-1003' && !ticket.flags.includes('error_collected'))
    if (!ticket.flags.includes('contacted') || !ticket.flags.includes('documented') ||
        !justified || PAUSED.includes(ticket.status) || ticket.flags.includes(`used:${waiting}`)) {
      next.flash = 'A espera requer primeiro contato, nota e pendência justificável; não pode ser repetida artificialmente.'
      return next
    }
    addFlags(ticket, [`used:${waiting}`])
    ticket.status = waiting
    ticket.pauseStartedAt = next.elapsed
    record(next, id, 'wait', `Status alterado para ${waiting.replaceAll('_',' ')}`)
  }
  consume(next, 1)
  next.flash = waiting === 'retomar' ? 'Chamado retomado.' : 'Espera registrada. A pausa afeta somente o prazo de solução, conforme POL-001.'
  return next
}
export function closeTicket(state, id) {
  if (state.phase !== 'playing' || state.tickets[id]?.status !== 'resolvido') return state
  const next = structuredClone(state)
  next.tickets[id].status = 'encerrado'
  record(next, id, 'close', 'Chamado formalmente encerrado após a resolução')
  consume(next, 1)
  next.flash = 'Chamado encerrado. Resolução e encerramento são eventos diferentes.'
  return next
}
export function getSla(state, id) {
  const ticket = state.tickets[id]
  const s = scenarioById[id]
  if (!ticket?.visible || !s) return null
  const priority = getPriority(s.impact, s.urgency)
  const policy = priorityPolicy[priority]
  const replyPoint = ticket.firstResponseAt === null ? state.elapsed : ticket.firstResponseAt
  const endPoint = ticket.completedAt === null ? state.elapsed : ticket.completedAt
  const livePaused = PAUSED.includes(ticket.status) && ticket.pauseStartedAt !== null ? endPoint - ticket.pauseStartedAt : 0
  const activeElapsed = Math.max(0, endPoint - ticket.openedAt - ticket.pausedMinutes - livePaused)
  return {
    priority,
    responseUsed: Math.max(0, replyPoint - ticket.openedAt),
    responseTarget: policy.response,
    responseMet: ticket.firstResponseAt !== null ? replyPoint - ticket.openedAt <= policy.response : null,
    responseBreach: replyPoint - ticket.openedAt > policy.response,
    resolutionUsed: activeElapsed,
    resolutionTarget: policy.resolution,
    resolutionMet: ticket.completedAt !== null ? activeElapsed <= policy.resolution : null,
    resolutionBreach: activeElapsed > policy.resolution
  }
}
export function canEnd(state) {
  return scenarios.every(s => TERMINAL.includes(state.tickets[s.id]?.status)) || state.elapsed >= 300
}
export function endSession(state) {
  if (!canEnd(state) || state.phase !== 'playing') return state
  const next = structuredClone(state)
  next.phase = 'finished'
  record(next, null, 'complete', 'Turno finalizado; relatório emitido')
  next.flash = 'Turno encerrado. O relatório é educacional, não uma certificação profissional.'
  return next
}
export function evaluate(state) {
  const checks = []
  for (const s of scenarios) {
    const t = state.tickets[s.id]
    if (!t.visible) continue
    const sla = getSla(state, s.id)
    checks.push({ ticketId: s.id, skill: 'Primeiro contato', label: 'Resposta registrada dentro do prazo', pass: sla.responseMet === true, active: t.firstResponseAt !== null || state.phase === 'finished' })
    checks.push({ ticketId: s.id, skill: 'Comunicação', label: 'Primeira resposta adequada e sem promessa falsa', pass: t.replyQuality === 'clear', active: t.replyQuality !== null || state.phase === 'finished' })
    checks.push({ ticketId: s.id, skill: 'Documentação', label: 'Notas de trabalho registradas', pass: t.flags.includes('documented'), active: t.completedAt !== null || state.phase === 'finished' })
    checks.push({ ticketId: s.id, skill: 'Cumprimento de procedimentos e SLAs', label: 'Prazo de conclusão atendido', pass: sla.resolutionMet === true, active: t.completedAt !== null || state.phase === 'finished' })
    for (const item of s.rubric) checks.push({ ticketId: s.id, skill: item.skill, label: item.description, pass: t.flags.includes(item.flag), active: t.completedAt !== null || state.phase === 'finished' })
  }
  const criticalErrors = state.activity.filter(a => a.critical).map(a => ({ ...a }))
  const skills = classes.map(name => {
    const eligible = checks.filter(c => c.skill === name && c.active)
    const passed = eligible.filter(c => c.pass).length
    const total = eligible.length
    let percentage = total ? Math.round(100 * passed / total) : null
    if (name === 'Segurança' && criticalErrors.length > 0 && percentage !== null) percentage = Math.min(percentage, 20)
    return { name, passed, total, percentage, details: eligible }
  })
  const tickets = scenarios.map(s => ({ ...s, state: state.tickets[s.id], sla: getSla(state, s.id) })).filter(t => t.state.visible)
  return {
    skills,
    criticalErrors,
    tickets,
    completed: tickets.filter(t => TERMINAL.includes(t.state.status)).length,
    resolved: tickets.filter(t => ['resolvido','encerrado'].includes(t.state.status)).length,
    escalated: tickets.filter(t => t.state.status === 'escalado').length,
    responded: tickets.filter(t => t.state.firstResponseAt !== null).length,
    responseMet: tickets.filter(t => t.sla.responseMet === true).length,
    responseLate: tickets.filter(t => t.sla.responseBreach).length,
    unresolved: tickets.filter(t => !TERMINAL.includes(t.state.status)).length,
    recommendations: skills.filter(x => x.percentage !== null && x.percentage < 75).map(x => x.name)
  }
}
export function loadSession(storage = localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw)
    if (value.version !== 1 || !value.tickets || !value.activity || !['playing','finished'].includes(value.phase)) return null
    if (scenarios.some(s => !value.tickets[s.id])) return null
    return value
  } catch { return null }
}
export function persistSession(state, storage = localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(state)); return true }
  catch { return false }
}
export function forgetSession(storage = localStorage) {
  try { storage.removeItem(SAVE_KEY); return true }
  catch { return false }
}
