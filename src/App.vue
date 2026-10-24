<script setup>
import { ref, computed, watch } from 'vue'
import {
  Layers3, LayoutDashboard, BookOpen, UsersRound, Activity, GraduationCap,
  FileBarChart2, Clock3, MessageSquare, ChevronRight, ShieldCheck, Sun, Moon,
  ArrowRight, AlertTriangle, RotateCcw, Bell, Terminal, BriefcaseBusiness,
  Send, FileText, Pause, Play, Download, Menu, X, Search, Info, Flag,
  CheckCircle2, Eye, ArrowUpRight, CircleHelp, Zap, CalendarClock, LockKeyhole
} from 'lucide-vue-next'
import { employees, knowledge, glossary, priorityPolicy } from './data/world.js'
import { scenarios, scenarioById } from './data/scenarios.js'
import {
  initSession, advance, sendReply, saveNote, inspectKnowledge, inspectEmployee,
  inspectMonitor, performChoice, setWaiting, closeTicket, getSla, clock, canEnd,
  endSession, evaluate, loadSession, persistSession, forgetSession, unmet, TERMINAL
} from './engine/simulator.js'

const state = ref(loadSession())
const theme = ref((() => { try { return localStorage.getItem('proofstack:theme') || 'dark' } catch { return 'dark' } })())
const menuOpen = ref(false)
const replyQuality = ref('clear')
const noteText = ref('')
const kbSearch = ref('')
const peopleSearch = ref('')
const knowledgeSelected = ref('password')
const personSelected = ref('ana')
const detailTab = ref('play')
const glossaryMode = ref('normal')
const showReset = ref(false)
const tutorialHints = [
  { title: 'Sua primeira missão', body: 'Veja os chamados na coluna esquerda. Escolha um para investigar.' },
  { title: 'Primeiro contato', body: 'Leia o pedido e envie uma primeira resposta apropriada. O prazo é contabilizado separadamente.' },
  { title: 'Consulte informações', body: 'Use Base de Conhecimento, Diretório e Monitoramento antes das decisões. As consultas ficam registradas.' },
  { title: 'Documente o atendimento', body: 'Escreva uma nota de trabalho. Não registre senhas nem outros segredos.' },
  { title: 'Decida e aprenda', body: 'Escolha os procedimentos, observe as consequências e veja sua avaliação em Relatórios.' }
]

watch(state, value => { if (value) persistSession(value) }, { deep: true })
watch(theme, value => { try { localStorage.setItem('proofstack:theme', value) } catch {} })
const view = computed(() => state.value?.activeView ?? 'desk')
const ticket = computed(() => state.value?.tickets[state.value.selected] || null)
const scenario = computed(() => scenarioById[state.value?.selected] || null)
const stage = computed(() => scenario.value?.stages.find(s => s.id === ticket.value?.stage))
const sla = computed(() => state.value && scenario.value ? getSla(state.value, scenario.value.id) : null)
const metrics = computed(() => state.value ? evaluate(state.value) : null)
const opened = computed(() => state.value ? scenarios.filter(s => state.value.tickets[s.id].visible).sort((a,b) => {
  const priorities = ['P1','P2','P3','P4']
  const pa = priorities.indexOf(getPrioritySafe(a)), pb = priorities.indexOf(getPrioritySafe(b))
  return pa - pb || a.spawnAt - b.spawnAt
}) : [])
function getPrioritySafe(s) { return getSla(state.value, s.id)?.priority || 'P4' }
const searchKb = computed(() => knowledge.filter(k => `${k.title} ${k.code} ${k.category} ${k.tags.join(' ')}`.toLowerCase().includes(kbSearch.value.toLowerCase())))
const searchPeople = computed(() => employees.filter(e => `${e.name} ${e.department} ${e.role}`.toLowerCase().includes(peopleSearch.value.toLowerCase())))
const selectedArticle = computed(() => knowledge.find(x => x.id === knowledgeSelected.value))
const selectedPerson = computed(() => employees.find(x => x.id === personSelected.value))
const isTerminal = computed(() => ticket.value && TERMINAL.includes(ticket.value.status))
const hasPause = computed(() => ticket.value && ['aguardando_usuário','aguardando_aprovação'].includes(ticket.value.status))
const finished = computed(() => state.value?.phase === 'finished')
const activeTickets = computed(() => opened.value.filter(s => !TERMINAL.includes(state.value.tickets[s.id].status)).length)
const completionPercent = computed(() => state.value ? Math.round(100 * metrics.value.completed / scenarios.length) : 0)
const progressLabel = computed(() => state.value && canEnd(state.value) ? 'Concluir turno' : 'Continue os chamados')
const monitoringServices = computed(() => [
  { name: 'Identidades (IAM)', state: 'Online', desc: 'Autenticação de contas corporativas', stable: true },
  { name: 'Wiki interna', state: 'Online', desc: 'Documentação e procedimentos', stable: true },
  { name: 'ERP Financeiro', state: state.value && state.value.elapsed >= 73 ? 'Indisponível' : 'Online', desc: 'Serviço essencial do Financeiro', stable: !(state.value && state.value.elapsed >= 73) },
  { name: 'Gateway corporativo', state: state.value && state.value.elapsed >= 82 ? 'Degradado' : 'Online', desc: 'Serviço compartilhado por aplicações', stable: !(state.value && state.value.elapsed >= 82) },
  { name: 'CRM Comercial', state: state.value && state.value.elapsed >= 82 ? 'Degradado' : 'Online', desc: 'Aplicação do time de Comercial', stable: !(state.value && state.value.elapsed >= 82) }
])

function start() { state.value = initSession(); noteText.value = ''; detailTab.value = 'play' }
function changeView(next) {
  if (!state.value) return
  state.value.activeView = next
  menuOpen.value = false
  if (next === 'knowledge' && selectedArticle.value) readKnowledge(selectedArticle.value.id)
  if (next === 'directory' && selectedPerson.value) readEmployee(selectedPerson.value.id)
  if (next === 'monitor') state.value = inspectMonitor(state.value, state.value.selected)
}
function chooseTicket(id) {
  state.value.selected = id
  state.value.activeView = 'desk'
  detailTab.value = 'play'
  noteText.value = ''
  menuOpen.value = false
}
function readKnowledge(id) {
  knowledgeSelected.value = id
  if (state.value) state.value = inspectKnowledge(state.value, state.value.selected, id)
}
function readEmployee(id) {
  personSelected.value = id
  if (state.value) state.value = inspectEmployee(state.value, state.value.selected, id)
}
function chooseOption(choice) {
  if (!state.value || !scenario.value) return
  if (choice.critical && !window.confirm('Esta decisão apresenta um risco importante de segurança. Deseja simular esta ação e registrar a consequência?')) return
  state.value = performChoice(state.value, scenario.value.id, choice.id)
}
function doReply() { state.value = sendReply(state.value, scenario.value.id, replyQuality.value) }
function doNote() { state.value = saveNote(state.value, scenario.value.id, noteText.value); if (noteText.value.trim().length >= 8) noteText.value = '' }
function doWait(value) { state.value = setWaiting(state.value, scenario.value.id, value) }
function doClose() { state.value = closeTicket(state.value, scenario.value.id) }
function doAdvance(minutes) { state.value = advance(state.value, minutes) }
function doFinish() { state.value = endSession(state.value); state.value.activeView = 'reports' }
function reset() { forgetSession(); showReset.value = false; state.value = null }
function exportReport() {
  const result = metrics.value
  if (!result) return
  const file = new Blob([JSON.stringify({ app: 'ProofStack', version: '0.1.0', company: 'Northstar Technologies (fictícia)', date: new Date().toISOString(), report: result, activity: state.value.activity }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(file)
  const a = document.createElement('a'); a.href = url; a.download = 'proofstack-relatorio-v0.1.0.json'; a.click()
  URL.revokeObjectURL(url)
}
function printReport() { window.print() }
function statusText(status) { return ({ novo:'Novo', em_andamento:'Em andamento', aguardando_usuário:'Aguardando usuário', aguardando_aprovação:'Aguardando aprovação', escalado:'Escalado', resolvido:'Resolvido', encerrado:'Encerrado' })[status] || status }
function statusClass(status) { return status?.startsWith('aguardando') ? 'waiting' : status }
function formatSla(used, target, isDone) { return `${used}/${target} min${isDone ? ' · finalizado' : ''}` }
</script>

<template>
  <div class="app-root" :class="`theme-${theme}`">
    <div v-if="!state" class="landing">
      <div class="landing-orb orb-one"></div><div class="landing-orb orb-two"></div>
      <header class="landing-header">
        <div class="brand"><div class="brand-logo"><Layers3 :size="22" stroke-width="2.5" /></div><div><strong>ProofStack</strong><span>LEARN. SIMULATE. PROVE.</span></div></div>
        <div class="row-gap"><span class="version-pill">v0.1.0 · EARLY ACCESS</span><button class="icon-button" @click="theme = theme === 'dark' ? 'light' : 'dark'" aria-label="Alternar tema"><Sun v-if="theme === 'dark'" :size="19"/><Moon v-else :size="19"/></button></div>
      </header>
      <main class="landing-content">
        <div class="hero-copy">
          <div class="eyebrow"><span class="pulse-dot"></span> SIMULAÇÃO PROFISSIONAL INTERATIVA</div>
          <h1>Seu primeiro dia.<br/><em>Suas decisões.</em><br/>Sua evolução.</h1>
          <p>Entre em uma empresa fictícia, atenda chamados reais em espírito e prove suas competências em um ambiente seguro, sem infraestrutura real.</p>
          <div class="landing-cta"><button class="button primary big" @click="start">Iniciar meu primeiro turno <ArrowRight :size="18" /></button><span>Grátis · Sem conta · Progresso local</span></div>
          <div class="hero-stats"><div><strong>08</strong><small>DESAFIOS</small></div><div><strong>08</strong><small>COMPETÊNCIAS</small></div><div><strong>100%</strong><small>SIMULADO</small></div></div>
        </div>
        <div class="hero-preview" aria-label="Prévia do simulador">
          <div class="fake-window-bar"><div class="dots"><i/><i/><i/></div><span>northstar.internal / service-desk</span><ShieldCheck :size="15"/></div>
          <div class="preview-content"><div class="preview-title"><span><span class="pulse-dot"></span> NORTHSTAR TECHNOLOGIES</span><span>09:00</span></div><h3>Central de Serviços</h3><p>O trabalho começa aqui. O que você faria?</p>
            <div class="preview-ticket"><div class="preview-ticket-icon"><LockKeyhole :size="19" /></div><div><b>NS-1001</b><strong>Não consigo entrar na minha conta</strong><small>Financeiro · Solicitação de acesso</small></div><span class="prio-label p4">P4</span></div>
            <div class="preview-ticket"><div class="preview-ticket-icon orange"><AlertTriangle :size="19" /></div><div><b>NS-1007</b><strong>Sistema financeiro indisponível</strong><small>Incidente · Múltiplos usuários</small></div><span class="prio-label p1">P1</span></div>
            <div class="preview-bottom"><span><CheckCircle2 :size="16"/> Avaliação por decisões observáveis</span><span class="tiny-future">+ labs e carreira nas próximas versões</span></div>
          </div>
        </div>
      </main>
      <footer class="landing-footer"><div><ShieldCheck :size="17"/> Nenhuma senha real · Nenhuma empresa real · Dados no navegador</div><span>ProofStack Academy + Career Simulator</span></footer>
    </div>

    <div v-else class="workspace">
      <aside class="sidebar" :class="{ 'sidebar-visible': menuOpen }">
        <div class="sidebar-top"><div class="brand"><div class="brand-logo"><Layers3 :size="20" stroke-width="2.5"/></div><div><strong>ProofStack</strong><span>SIMULATOR / v0.1.0</span></div></div><button class="icon-button mobile-close" @click="menuOpen=false" aria-label="Fechar menu"><X :size="20"/></button></div>
        <div class="org-card"><span class="org-icon">N</span><div><strong>Northstar Technologies</strong><small>Ambiente fictício · L1</small></div></div>
        <nav class="nav-items" aria-label="Navegação principal">
          <div class="nav-label">ESPAÇO DE TRABALHO</div>
          <button :class="['nav-btn', { active: view === 'desk' }]" @click="changeView('desk')"><LayoutDashboard :size="18"/> Service Desk <span v-if="activeTickets" class="counter">{{ activeTickets }}</span></button>
          <button :class="['nav-btn', { active: view === 'knowledge' }]" @click="changeView('knowledge')"><BookOpen :size="18"/> Base de Conhecimento</button>
          <button :class="['nav-btn', { active: view === 'directory' }]" @click="changeView('directory')"><UsersRound :size="18"/> Diretório</button>
          <button :class="['nav-btn', { active: view === 'monitor' }]" @click="changeView('monitor')"><Activity :size="18"/> Monitoramento</button>
          <div class="nav-label nav-label-spaced">DESENVOLVIMENTO</div>
          <button :class="['nav-btn', { active: view === 'academy' }]" @click="changeView('academy')"><GraduationCap :size="18"/> Mini Academy</button>
          <button :class="['nav-btn', { active: view === 'reports' }]" @click="changeView('reports')"><FileBarChart2 :size="18"/> Relatórios</button>
          <div class="nav-label nav-label-spaced">PRÓXIMAS VERSÕES</div>
          <div class="nav-disabled"><MessageSquare :size="18"/> Chat corporativo <span>v0.2</span></div>
          <div class="nav-disabled"><Terminal :size="18"/> Terminal Linux <span>v0.4</span></div>
        </nav>
        <div class="sidebar-bottom">
          <div class="shift-progress"><div class="between"><span>Progresso do turno</span><b>{{ completionPercent }}%</b></div><div class="progress"><span :style="{ width: completionPercent + '%' }"/></div><small>{{ metrics.completed }} de 8 chamados tratados</small></div>
          <button class="sidebar-profile" @click="changeView('reports')"><span class="profile-avatar">L1</span><span><b>Analista de Suporte</b><small>Primeiro dia · Turno simulado</small></span><ChevronRight :size="16"/></button>
        </div>
      </aside>
      <div v-if="menuOpen" class="nav-scrim" @click="menuOpen=false"></div>
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-title"><button class="icon-button hamburger" @click="menuOpen=true" aria-label="Abrir menu"><Menu :size="21"/></button><span class="breadcrumb">NORTHSTAR / {{ view === 'desk' ? 'SERVICE DESK' : view.toUpperCase() }}</span><span class="topbar-mobile-title">{{ view === 'desk' ? 'Chamados' : view }}</span></div>
          <div class="topbar-actions"><span class="simulated-tag"><span class="small-dot"></span> SIMULAÇÃO</span><div class="virtual-clock"><Clock3 :size="17"/><span>{{ clock(state.elapsed) }}</span><small>VIRTUAL</small></div><button :disabled="finished" class="button subtle advance-btn" @click="doAdvance(10)"><Clock3 :size="16"/> +10 min</button><button class="icon-button" @click="theme = theme === 'dark' ? 'light' : 'dark'" aria-label="Alternar tema"><Sun v-if="theme === 'dark'" :size="18"/><Moon v-else :size="18"/></button></div>
        </header>
        <div class="content-scroll">
          <div v-if="state.flash" class="flash-notice" role="status"><Info :size="18"/><span>{{ state.flash }}</span><button @click="state.flash='';" aria-label="Dispensar aviso"><X :size="17"/></button></div>
          <div v-if="state.tutorialVisible && state.phase === 'playing'" class="tutorial-banner">
            <div class="tutorial-icon"><CircleHelp :size="22"/></div><div class="tutorial-copy"><span class="micro-heading">TOUR GUIADO {{ state.tutorialStep + 1 }}/{{ tutorialHints.length }}</span><strong>{{ tutorialHints[state.tutorialStep].title }}</strong><p>{{ tutorialHints[state.tutorialStep].body }}</p></div>
            <div class="tutorial-buttons"><button class="button ghost compact" @click="state.tutorialVisible=false">Pular</button><button class="button primary compact" @click="state.tutorialStep < 4 ? state.tutorialStep++ : state.tutorialVisible=false">{{ state.tutorialStep === 4 ? 'Concluir tour' : 'Próximo' }} <ArrowRight :size="15"/></button></div>
          </div>

          <template v-if="view === 'desk'">
            <section class="section-heading"><div><div class="page-overline">SEU PRIMEIRO DIA NA NORTHSTAR</div><h1>Central de Serviços <span class="heading-muted">/ Tickets</span></h1><p>Investigue, comunique e resolva com segurança. Nem todo problema deve ser resolvido por L1.</p></div><div class="heading-buttons"><button class="button subtle" @click="state.tutorialVisible=true; state.tutorialStep=0"><CircleHelp :size="16"/> Tutorial</button><button v-if="canEnd(state) && !finished" class="button primary" @click="doFinish">{{ progressLabel }} <Flag :size="16"/></button></div></section>
            <section class="kpi-grid"><div class="kpi-card"><div class="kpi-label">CHAMADOS RECEBIDOS <FileText :size="17"/></div><strong>{{ opened.length }} <small>/ 8</small></strong><span>Entram conforme o tempo</span></div><div class="kpi-card"><div class="kpi-label">EM ABERTO <Clock3 :size="17"/></div><strong>{{ activeTickets }}</strong><span>Ainda exigem atenção</span></div><div class="kpi-card"><div class="kpi-label">TRATADOS <CheckCircle2 :size="17"/></div><strong>{{ metrics.completed }}</strong><span>Resolvidos ou escalados</span></div><div class="kpi-card"><div class="kpi-label">1ª RESPOSTA NO PRAZO <Zap :size="17"/></div><strong>{{ metrics.responseMet }}</strong><span>De {{ metrics.responded }} respondidos</span></div></section>
            <section class="desk-grid">
              <div class="panel tickets-panel"><div class="panel-heading"><div><h2>Fila de atendimento</h2><p>Prioridade calculada por impacto × urgência</p></div><span class="small-count">{{ opened.length }} tickets</span></div><div class="ticket-scroll">
                <button v-for="s in opened" :key="s.id" class="ticket-row" :class="{ selected: state.selected === s.id }" @click="chooseTicket(s.id)"><div class="ticket-row-top"><span class="ticket-id">{{ s.id }}</span><span :class="['prio-label', getPrioritySafe(s).toLowerCase()]">{{ getPrioritySafe(s) }}</span></div><strong>{{ s.title }}</strong><div class="ticket-row-bottom"><span>{{ s.department }}</span><span :class="['state-dot-label', statusClass(state.tickets[s.id].status)]">{{ statusText(state.tickets[s.id].status) }}</span></div><div class="tiny-sla" :class="{ overdue: getSla(state, s.id).responseBreach && !state.tickets[s.id].firstResponseAt }"><Clock3 :size="12"/> 1ª resposta: {{ formatSla(getSla(state, s.id).responseUsed, getSla(state, s.id).responseTarget, state.tickets[s.id].firstResponseAt !== null) }}</div></button>
                <div v-if="opened.length < 8" class="queue-upcoming"><CalendarClock :size="17"/> Outros chamados chegarão ao longo do turno. Não precisa esperar em tempo real.</div>
              </div></div>
              <div v-if="scenario && ticket.visible" class="panel ticket-detail"><div class="ticket-detail-heading"><div class="detail-meta"><span class="ticket-id">{{ scenario.id }}</span><span :class="['prio-label', sla?.priority?.toLowerCase()]">{{ sla?.priority }} · {{ priorityPolicy[sla.priority].label }}</span><span :class="['state-chip', statusClass(ticket.status)]">{{ statusText(ticket.status) }}</span></div><h2>{{ scenario.title }}</h2><div class="detail-subline"><span><UsersRound :size="14"/> {{ scenario.requester }} · {{ scenario.department }}</span><span><Clock3 :size="14"/> Aberto às {{ clock(ticket.openedAt) }}</span></div></div>
                <div class="sla-strip"><div><span>1ª RESPOSTA</span><strong :class="{ danger: sla.responseBreach }">{{ sla.responseUsed }} <small>/ {{ sla.responseTarget }} min</small></strong><div class="progress"><span :class="{ red: sla.responseBreach }" :style="{ width: Math.min(100, 100 * sla.responseUsed / sla.responseTarget) + '%' }"/></div></div><div><span>TRATAMENTO (PAUSA APLICÁVEL)</span><strong :class="{ danger: sla.resolutionBreach }">{{ sla.resolutionUsed }} <small>/ {{ sla.resolutionTarget }} min</small></strong><div class="progress"><span :class="{ red: sla.resolutionBreach }" :style="{ width: Math.min(100, 100 * sla.resolutionUsed / sla.resolutionTarget) + '%' }"/></div></div></div>
                <div class="detail-tabs"><button :class="{ active: detailTab === 'play' }" @click="detailTab='play'">Atendimento</button><button :class="{ active: detailTab === 'history' }" @click="detailTab='history'">Histórico <span>{{ ticket.history.length }}</span></button></div>
                <div v-if="detailTab === 'play'" class="detail-body"><div class="request-box"><div class="request-overline">SOLICITAÇÃO ORIGINAL</div><p>“{{ scenario.description }}”</p><div class="request-facts"><span>Impacto: <b>{{ scenario.impact }}</b></span><span>Urgência: <b>{{ scenario.urgency }}</b></span><span>Categoria: <b>{{ scenario.category }}</b></span></div></div>
                  <div v-if="scenario.relatedReports?.length" class="related-reports"><div class="request-overline">RELATOS RELACIONADOS A INVESTIGAR</div><div v-for="r in scenario.relatedReports" :key="r.id"><b>{{ r.id }}</b><span>{{ r.requester }}</span><small>{{ r.error }} · {{ r.at }}</small></div></div>
                  <template v-if="!isTerminal && !finished"><div class="task-separator"><div class="task-step">1</div><strong>Registre o primeiro contato</strong><span v-if="ticket.firstResponseAt !== null" class="done-text"><CheckCircle2 :size="16"/> Registrado às {{ clock(ticket.firstResponseAt) }}</span></div>
                    <div v-if="ticket.firstResponseAt === null" class="contact-box"><label for="reply-quality">Escolha a mensagem que será enviada ao solicitante</label><select id="reply-quality" v-model="replyQuality"><option value="clear">“Recebemos a solicitação. Vou investigar e informar próximos passos.”</option><option value="promise">“Garanto que estará resolvido em dois minutos.”</option><option value="password">“Envie sua senha atual por mensagem.” (INSEGURO)</option></select><button class="button primary" @click="doReply"><Send :size="15"/> Enviar primeira resposta</button></div><p v-else class="subtle-info">Mensagem e horário salvos no histórico. Você ainda pode consultar as ferramentas e registrar notas.</p>
                    <div class="task-separator"><div class="task-step">2</div><strong>Investigue e tome decisões</strong><span class="step-counter">{{ (scenario.stages.findIndex(s=>s.id===ticket.stage)+1) || 1 }} / {{ scenario.stages.length }}</span></div>
                    <div v-if="hasPause" class="pause-box"><Pause :size="21"/><div><strong>O chamado está em espera</strong><p>O tempo de solução fica pausado conforme a política fictícia. Retome para tomar decisões.</p><button class="button primary compact" @click="doWait('retomar')"><Play :size="14"/> Retomar chamado</button></div></div>
                    <div v-else-if="stage" class="decision-box"><div class="decision-heading"><span class="micro-heading">ETAPA ATUAL</span><h3>{{ stage.title }}</h3><p>{{ stage.prompt }}</p></div><div class="choices"><button v-for="choice in stage.options" :key="choice.id" :disabled="unmet(state,scenario.id,choice.requires).length>0" :class="['choice-button', { risky: choice.critical || choice.tone === 'bad' }]" @click="chooseOption(choice)"><span class="choice-dot">{{ choice.critical ? '!' : '→' }}</span><span><strong>{{ choice.text }}</strong><small v-if="unmet(state,scenario.id,choice.requires).length">Antes: {{ unmet(state,scenario.id,choice.requires).join(' · ') }}</small><small v-else-if="choice.critical">Decisão simulada com consequência de segurança</small></span><ChevronRight :size="17"/></button></div></div>
                    <div class="tools-box"><span class="micro-heading">FERRAMENTAS DE INVESTIGAÇÃO</span><div><button v-for="kbId in scenario.kb" :key="kbId" class="tool-button" @click="readKnowledge(kbId); changeView('knowledge')"><BookOpen :size="16"/> Procedimento {{ knowledge.find(k=>k.id===kbId)?.code }} <ArrowUpRight :size="14"/></button><button class="tool-button" @click="readEmployee(scenario.employee);changeView('directory')"><UsersRound :size="16"/> Consultar solicitante <ArrowUpRight :size="14"/></button><button class="tool-button" @click="changeView('monitor')"><Activity :size="16"/> Monitoramento <ArrowUpRight :size="14"/></button></div></div>
                    <div class="task-separator"><div class="task-step">3</div><strong>Notas e atualização de status</strong></div>
                    <div class="notes-box"><label for="notes">Nota de trabalho (somente dados fictícios)</label><textarea id="notes" v-model="noteText" rows="3" maxlength="800" placeholder="Ex.: Conferi a identidade pelo procedimento; solicitação encaminhada para aprovação..."/><div class="notes-actions"><button class="button subtle compact" @click="doWait(hasPause ? 'retomar' : 'aguardando_usuário')"><Pause :size="14"/> Aguardar usuário</button><button class="button subtle compact" @click="doWait('aguardando_aprovação')"><Clock3 :size="14"/> Aguardar aprovação</button><button class="button primary compact" @click="doNote"><FileText :size="15"/> Registrar nota</button></div></div>
                  </template>
                  <div v-else class="ticket-completed"><CheckCircle2 :size="33"/><h3>{{ statusText(ticket.status) }}</h3><p>As decisões e evidências deste atendimento estão preservadas no histórico. A avaliação distingue boas decisões de desfechos inseguros.</p><button v-if="ticket.status==='resolvido' && !finished" class="button subtle" @click="doClose"><CheckCircle2 :size="16"/> Encerrar formalmente</button><button class="button ghost" @click="detailTab='history'">Ver histórico de decisões <ArrowRight :size="15"/></button></div>
                </div>
                <div v-else class="history-container"><div v-if="!ticket.history.length" class="empty-state">Ainda não há ações registradas neste chamado.</div><div v-for="(entry,index) in [...ticket.history].reverse()" :key="index" :class="['history-entry', { 'history-danger': entry.critical }]"><div class="history-marker"></div><span class="history-time">{{ clock(entry.at) }} · {{ entry.type }}</span><p>{{ entry.message }}</p><strong v-if="entry.critical" class="critical-label"><AlertTriangle :size="13"/> {{ entry.critical }}</strong></div></div>
              </div>
              <div v-else class="panel empty-ticket"><FileText :size="34"/><h2>Selecione um chamado</h2><p>Escolha um item da fila para começar.</p></div>
            </section>
          </template>

          <template v-else-if="view === 'knowledge'"><section class="section-heading"><div><div class="page-overline">RECURSOS INTERNOS</div><h1>Base de Conhecimento</h1><p>Procedimentos simulados e política de SLA utilizados durante o turno.</p></div><span class="context-indicator"><BookOpen :size="16"/> Consultas registradas no ticket atual</span></section><section class="directory-layout"><div class="panel directory-list"><label class="search-field"><Search :size="18"/><input v-model="kbSearch" placeholder="Pesquisar procedimento" aria-label="Pesquisar procedimento"/></label><button v-for="item in searchKb" :key="item.id" class="directory-item" :class="{ selected: knowledgeSelected===item.id }" @click="readKnowledge(item.id)"><span class="small-doc-icon"><BookOpen :size="17"/></span><span><b>{{ item.title }}</b><small>{{ item.code }} · {{ item.category }}</small></span><ChevronRight :size="16"/></button><p v-if="!searchKb.length" class="empty-list">Nenhum artigo encontrado.</p></div><article v-if="selectedArticle" class="panel knowledge-article"><div class="micro-heading">{{ selectedArticle.code }} · {{ selectedArticle.category.toUpperCase() }}</div><h2>{{ selectedArticle.title }}</h2><p class="lead-text">{{ selectedArticle.body }}</p><div class="article-divider"></div><h3>Procedimento</h3><ol class="steps"><li v-for="(paragraph,index) in selectedArticle.steps" :key="index">{{ paragraph }}</li></ol><div class="article-footer"><ShieldCheck :size="17"/> Ambiente de aprendizagem: todas as regras e pessoas desta KB são fictícias.</div><button class="button primary" @click="changeView('desk')">Voltar ao chamado <ArrowRight :size="16"/></button></article></section></template>

          <template v-else-if="view === 'directory'"><section class="section-heading"><div><div class="page-overline">NORTHSTAR / IAM</div><h1>Diretório de Funcionários</h1><p>Consulte registros de identidade autorizados para o atendimento simulado.</p></div><span class="context-indicator"><ShieldCheck :size="16"/> Dados fictícios</span></section><section class="directory-layout"><div class="panel directory-list"><label class="search-field"><Search :size="18"/><input v-model="peopleSearch" placeholder="Buscar pessoa ou área" aria-label="Buscar pessoa ou área"/></label><button v-for="person in searchPeople" :key="person.id" class="directory-item" :class="{ selected:personSelected===person.id }" @click="readEmployee(person.id)"><span class="user-initial">{{ person.name[0] }}</span><span><b>{{ person.name }}</b><small>{{ person.department }}</small></span><ChevronRight :size="16"/></button><p v-if="!searchPeople.length" class="empty-list">Nenhuma pessoa encontrada.</p></div><article v-if="selectedPerson" class="panel knowledge-article"><div class="directory-hero"><span class="profile-large">{{ selectedPerson.name.split(' ').map(w=>w[0]).slice(0,2).join('') }}</span><div><div class="micro-heading">CADASTRO CORPORATIVO</div><h2>{{ selectedPerson.name }}</h2><p>{{ selectedPerson.role }}</p></div></div><div class="attribute-grid"><div><span>Departamento</span><strong>{{ selectedPerson.department }}</strong></div><div><span>Situação do vínculo</span><strong :class="{ danger: selectedPerson.relationship==='Encerrado' }">{{ selectedPerson.relationship }}</strong></div><div><span>Estado da conta</span><strong :class="{ danger: selectedPerson.account==='Desativada' }">{{ selectedPerson.account }}</strong></div><div><span>Gestor cadastrado</span><strong>{{ selectedPerson.manager }}</strong></div><div class="wide"><span>Acessos registrados</span><strong>{{ selectedPerson.access }}</strong></div></div><div class="article-footer"><ShieldCheck :size="17"/> Este diretório é simulado. Nenhuma alteração real de contas é possível.</div><button class="button primary" @click="changeView('desk')">Voltar ao chamado <ArrowRight :size="16"/></button></article></section></template>

          <template v-else-if="view === 'monitor'"><section class="section-heading"><div><div class="page-overline">OPERAÇÕES / SAÚDE DE SERVIÇOS</div><h1>Monitoramento</h1><p>Estado operacional fictício, atualizado pelos eventos roteirizados do turno.</p></div><span class="context-indicator"><Activity :size="16"/> Atualizado às {{ clock(state.elapsed) }}</span></section><div class="monitor-summary panel"><div class="monitor-summary-icon"><Activity :size="23"/></div><div><strong>{{ monitoringServices.filter(x=>!x.stable).length ? 'Anomalias detectadas' : 'Serviços operacionais' }}</strong><p>{{ monitoringServices.filter(x=>!x.stable).length ? 'Verifique as dependências antes de encerrar chamados.' : 'Até o momento, os serviços estão dentro do estado esperado.' }}</p></div></div><div class="monitor-grid"><article v-for="item in monitoringServices" :key="item.name" class="panel monitor-card"><div class="between"><div class="monitor-icon"><Activity :size="19"/></div><span :class="['service-status', { down: !item.stable }]">{{ item.state }}</span></div><h3>{{ item.name }}</h3><p>{{ item.desc }}</p><div class="monitor-line"><span :class="{ down: !item.stable }"></span></div></article></div><div class="panel simulation-tip"><Info :size="18"/> Os serviços não são reais, não há telemetria externa e o estado só muda por eventos programados.</div><button class="button primary" @click="changeView('desk')">Voltar ao chamado <ArrowRight :size="16"/></button></template>

          <template v-else-if="view === 'academy'"><section class="section-heading"><div><div class="page-overline">PROOFSTACK ACADEMY / MINI DICIONÁRIO</div><h1>Aprenda no seu ritmo</h1><p>Um mesmo conceito com três níveis de explicação. A escola completa chega em versões futuras.</p></div></section><div class="academy-control panel"><span>Como prefere a explicação?</span><div class="segmented"><button v-for="mode in [{id:'normal',label:'Normal'},{id:'uga',label:'Uga-Buga'},{id:'neanderthal',label:'Neandertal'}]" :key="mode.id" :class="{active:glossaryMode===mode.id}" @click="glossaryMode=mode.id">{{ mode.label }}</button></div></div><div class="academy-grid"><article v-for="item in glossary" :key="item.term" class="panel glossary-card"><div class="glossary-heading"><span class="glossary-icon"><BookOpen :size="18"/></span><span class="small-count">{{ glossaryMode==='normal'?'TÉCNICO':glossaryMode==='uga'?'ANALOGIA':'BEM SIMPLES' }}</span></div><h3>{{ item.term }}</h3><p>{{ item[glossaryMode] }}</p></article></div></template>

          <template v-else-if="view === 'reports'"><section class="section-heading"><div><div class="page-overline">PROOFSTACK / EVIDÊNCIAS</div><h1>Relatório do turno</h1><p>{{ finished ? 'Turno concluído. Veja seu histórico de decisões.' : 'Prévia de avaliação, atualizada conforme você trabalha.' }}</p></div><div class="heading-buttons"><button class="button subtle" @click="exportReport"><Download :size="16"/> Exportar JSON</button><button class="button primary" @click="printReport"><FileText :size="16"/> Imprimir / PDF</button></div></section><div class="report-disclaimer"><ShieldCheck :size="20"/><span>Resultados educativos desta simulação fictícia. Não representam certificação, aptidão para uma vaga nem nível profissional geral. Em caso de decisão crítica, os indicadores de segurança são limitados.</span></div>
            <div class="kpi-grid"><div class="kpi-card"><div class="kpi-label">ATENDIDOS <FileText :size="17"/></div><strong>{{ metrics.completed }}</strong><span>de 8 previstos</span></div><div class="kpi-card"><div class="kpi-label">RESOLVIDOS <CheckCircle2 :size="17"/></div><strong>{{ metrics.resolved }}</strong><span>inclui encerrados</span></div><div class="kpi-card"><div class="kpi-label">ESCALADOS <ArrowUpRight :size="17"/></div><strong>{{ metrics.escalated }}</strong><span>quando fora da alçada</span></div><div class="kpi-card"><div class="kpi-label">ALERTAS CRÍTICOS <AlertTriangle :size="17"/></div><strong>{{ metrics.criticalErrors.length }}</strong><span>erros com risco relevante</span></div></div>
            <section class="reports-grid"><div class="panel report-panel"><div class="panel-heading"><div><h2>Competências demonstradas</h2><p>Critérios observáveis e rastreáveis no histórico</p></div></div><div v-for="skill in metrics.skills" :key="skill.name" class="skill-row"><div class="between"><span>{{ skill.name }}</span><b>{{ skill.percentage===null ? '—' : skill.percentage+'%' }} <small>({{ skill.passed }}/{{ skill.total }})</small></b></div><div class="progress"><span :style="{width:(skill.percentage ?? 0)+'%'}" :class="{ red: skill.percentage!==null && skill.percentage<40 }"/></div></div><p class="report-footnote">Uma competência sem evidências suficientes aparece com traço; a amostra varia com os chamados concluídos.</p></div><div class="panel report-panel"><div class="panel-heading"><div><h2>O que revisar</h2><p>Recomendações baseadas em critérios não atendidos</p></div></div><div v-if="metrics.recommendations.length"><div v-for="name in metrics.recommendations" :key="name" class="recommend-item"><BookOpen :size="18"/><div><strong>{{ name }}</strong><p>Releia os procedimentos e experimente uma nova abordagem no próximo turno.</p></div></div></div><div v-else class="empty-state">{{ metrics.completed === 0 ? 'Atenda chamados para obter recomendações.' : 'Nenhuma área prioritária identificada pelos critérios disponíveis.' }}</div><div v-if="metrics.criticalErrors.length" class="critical-list"><strong><AlertTriangle :size="16"/> Erros críticos de segurança</strong><p v-for="(entry,i) in metrics.criticalErrors" :key="i">{{ entry.ticketId }} · {{ entry.critical }}</p></div></div></section>
            <section class="panel report-panel report-history"><div class="panel-heading"><div><h2>Evidências por chamado</h2><p>Resposta, atendimento e conclusão independentes</p></div></div><div class="report-table-wrapper"><table class="report-table"><thead><tr><th>Ticket</th><th>Status</th><th>1ª resposta</th><th>Tratamento</th><th>Decisões</th></tr></thead><tbody><tr v-for="t in metrics.tickets" :key="t.id"><td><b>{{ t.id }}</b><small>{{ t.title }}</small></td><td>{{ statusText(t.state.status) }}</td><td :class="{ danger:t.sla.responseBreach }">{{ t.sla.responseUsed }}/{{ t.sla.responseTarget }} min</td><td :class="{ danger:t.sla.resolutionBreach }">{{ t.sla.resolutionUsed }}/{{ t.sla.resolutionTarget }} min</td><td>{{ t.state.history.filter(h=>h.type==='choice').length }} decisões</td></tr></tbody></table></div><div class="report-footnote">{{ metrics.responseMet }} respostas no prazo · {{ metrics.responseLate }} respostas fora do prazo (inclui pendentes vencidas).</div></section>
            <section class="panel report-panel"><div class="panel-heading"><div><h2>Linha do tempo do turno</h2><p>Eventos e consequências registradas com horários virtuais</p></div></div><div class="report-events"><div v-for="(event,index) in [...state.activity].reverse()" :key="index" :class="['report-event',{ 'report-event-danger':event.critical }]"><span>{{ clock(event.at) }}</span><b>{{ event.ticketId || 'NORTHSTAR' }}</b><p>{{ event.message }}</p><strong v-if="event.critical">{{ event.critical }}</strong></div></div></section>
            <section class="finish-strip"><div><strong>{{ finished ? 'Turno concluído!' : 'Quando terminar, encerre o turno.' }}</strong><p>{{ finished ? 'Você pode repetir, testar outras escolhas e comparar os resultados.' : 'Trate os oito chamados ou avance o tempo virtual até o fim da jornada.' }}</p></div><button v-if="!finished" :disabled="!canEnd(state)" class="button primary" @click="doFinish"><Flag :size="16"/> Concluir turno</button><button v-else class="button primary" @click="showReset=true"><RotateCcw :size="16"/> Jogar novamente</button></section>
          </template>
          <footer class="workspace-footer"><span>PROOFSTACK v0.1.0 · FIRST DAY ON THE JOB</span><div><span>Simulação fictícia · Somente navegador</span><button @click="showReset=true"><RotateCcw :size="14"/> Reiniciar</button></div></footer>
        </div>
      </div>
      <div v-if="showReset" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Reiniciar sessão"><div class="modal-card"><div class="modal-icon"><AlertTriangle :size="24"/></div><h2>Reiniciar o simulador?</h2><p>Seu progresso local e decisões anteriores serão apagados. Faça a exportação do relatório antes, se quiser guardá-los.</p><div class="modal-actions"><button class="button subtle" @click="showReset=false">Cancelar</button><button class="button danger-button" @click="reset">Apagar e reiniciar</button></div></div></div>
    </div>
  </div>
</template>

