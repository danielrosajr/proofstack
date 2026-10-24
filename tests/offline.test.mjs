import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scenarios } from '../src/data/scenarios.js'
import { getPriority } from '../src/data/world.js'
import {
  initSession, advance, sendReply, saveNote, performChoice, getSla, inspectKnowledge,
  setWaiting, evaluate, canEnd, endSession, persistSession, loadSession, forgetSession,
  inspectEmployee, closeTicket, unmet
} from '../src/engine/simulator.js'

test('prioridade calculada por matriz, não campo fixo', () => {
  assert.equal(getPriority('alto','alta'), 'P1')
  assert.equal(getPriority('médio','alta'), 'P2')
  assert.equal(getPriority('médio','média'), 'P3')
  assert.equal(getPriority('baixo','baixa'), 'P4')
})

test('chamados e mensagens chegam por tempo virtual', () => {
  let state = initSession()
  assert.equal(Object.values(state.tickets).filter(t=>t.visible).length,2)
  state = advance(state,60)
  assert.equal(state.tickets['NS-1006'].visible,true)
  assert.equal(state.tickets['NS-1007'].visible,false)
  state = advance(state,30)
  assert.equal(state.tickets['NS-1008'].visible,true)
  assert.ok(state.messages.some(m=>m.text.includes('CRM')))
})

test('bloqueia ação sem investigação/documentação', () => {
  let state = initSession()
  state = performChoice(state,'NS-1001','verify')
  const before = state.elapsed
  state = performChoice(state,'NS-1001','safe-reset')
  assert.equal(state.elapsed,before)
  assert.equal(state.tickets['NS-1001'].stage,'process')
  assert.deepEqual(unmet(state,'NS-1001',['kb:password']),['abrir a KB-101'])
})

test('resolução segura e encerramento são eventos diferentes', () => {
  let state = initSession()
  state = sendReply(state,'NS-1001','clear')
  state = performChoice(state,'NS-1001','verify')
  state = inspectKnowledge(state,'NS-1001','password')
  state = performChoice(state,'NS-1001','safe-reset')
  state = saveNote(state,'NS-1001','Identidade confirmada e fluxo autorizado executado.')
  state = performChoice(state,'NS-1001','done')
  assert.equal(state.tickets['NS-1001'].status,'resolvido')
  assert.equal(state.tickets['NS-1001'].completedAt !== null,true)
  const metric = getSla(state,'NS-1001')
  assert.equal(metric.responseMet,true)
  state = closeTicket(state,'NS-1001')
  assert.equal(state.tickets['NS-1001'].status,'encerrado')
  assert.equal(state.tickets['NS-1001'].firstResponseAt,0)
})

test('comunicação perigosa registra erro de segurança', () => {
  let state = initSession()
  state = sendReply(state,'NS-1001','password')
  state = performChoice(state,'NS-1001','secret')
  assert.equal(evaluate(state).criticalErrors.length,2)
  assert.ok(state.tickets['NS-1001'].flags.includes('critical_error'))
})

test('consultas ao diretório viram evidências e evitam acesso indevido', () => {
  let state = advance(initSession(),60)
  state = inspectEmployee(state,'NS-1006','caio')
  assert.ok(state.tickets['NS-1006'].flags.includes('directory:caio'))
  state = performChoice(state,'NS-1006','verify')
  assert.ok(state.tickets['NS-1006'].flags.includes('employment_checked'))
})

test('pausa justificada de SLA não altera tempo de resposta e não pode ser reaplicada', () => {
  let state = initSession()
  state = sendReply(state,'NS-1002','clear')
  state = performChoice(state,'NS-1002','check')
  state = saveNote(state,'NS-1002','Falta aprovação formal; aguardando responsável pelo sistema.')
  state = setWaiting(state,'NS-1002','aguardando_aprovação')
  assert.equal(state.tickets['NS-1002'].status,'aguardando_aprovação')
  const initial = getSla(state,'NS-1002')
  state = advance(state,30)
  assert.equal(getSla(state,'NS-1002').resolutionUsed,initial.resolutionUsed)
  state = setWaiting(state,'NS-1002','retomar')
  const before = state.elapsed
  state = setWaiting(state,'NS-1002','aguardando_aprovação')
  assert.equal(state.elapsed,before)
  assert.equal(state.tickets['NS-1002'].status,'em_andamento')
})

test('fim do expediente 17h e conclusão do turno', () => {
  let state = initSession()
  assert.equal(canEnd(state),false)
  assert.equal(endSession(state),state)
  for (let i=0;i<8;i++) state=advance(state,60)
  assert.equal(state.elapsed,480)
  assert.equal(canEnd(state),true)
  assert.equal(endSession(state).phase,'finished')
})

test('estado local persistido e descartado corretamente', () => {
  const data = new Map()
  const storage = {getItem:key=>data.get(key)??null,setItem:(key,v)=>data.set(key,v),removeItem:key=>data.delete(key)}
  const state = sendReply(initSession(),'NS-1001','clear')
  assert.equal(persistSession(state,storage),true)
  assert.equal(loadSession(storage).tickets['NS-1001'].firstResponseAt,0)
  assert.equal(forgetSession(storage),true)
  assert.equal(loadSession(storage),null)
})

test('cenários contêm IDs distintos, finais e rubricas', () => {
  assert.equal(scenarios.length,8)
  assert.equal(new Set(scenarios.map(s=>s.id)).size,8)
  for (const s of scenarios) {
    assert.equal(s.stages[0].id,'start')
    assert.ok(s.stages.at(-1).options.some(o=>o.finish))
    assert.ok(s.rubric.length>0)
  }
})
