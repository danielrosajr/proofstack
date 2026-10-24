// Teste offline sem dependências, útil mesmo antes de npm install.
import assert from 'node:assert/strict'
import { initSession, advance, sendReply, saveNote, performChoice, inspectKnowledge, getSla, evaluate, canEnd, endSession } from '../src/engine/simulator.js'
import { scenarios } from '../src/data/scenarios.js'
const assertValid = (s) => {
  for (const [id,t] of Object.entries(s.tickets)) {
    if (t.status === 'resolvido' || t.status === 'escalado' || t.status === 'encerrado') assert.equal(t.stage,'complete',`${id} deve ter etapa terminal`)
  }
}
let s = initSession()
assert.equal(Object.values(s.tickets).filter(t=>t.visible).length,2)
s = sendReply(s, 'NS-1001','clear')
s = performChoice(s,'NS-1001','verify')
s = inspectKnowledge(s,'NS-1001','password')
s = performChoice(s,'NS-1001','safe-reset')
s = saveNote(s,'NS-1001','Identidade confirmada e redefinição pelo fluxo seguro.')
s = performChoice(s,'NS-1001','done')
assert.equal(s.tickets['NS-1001'].status,'resolvido')
assert.equal(getSla(s,'NS-1001').responseMet,true)
const shortcuts = {
  'NS-1002':['grant','done'],
  'NS-1003':['guess','skip','skip'],
  'NS-1004':['guess','early'],
  'NS-1005':['promise','fake'],
  'NS-1006':['trust','unsafe'],
  'NS-1007':['low','wait','false'],
  'NS-1008':['separate','false']
}
s = advance(s,60)
s = advance(s,60)
for (const [id, options] of Object.entries(shortcuts)) {
  assert.equal(s.tickets[id].visible,true,`ticket ${id} desbloqueado`)
  for (const option of options) s=performChoice(s,id,option)
  assert.ok(['resolvido','escalado','encerrado'].includes(s.tickets[id].status),`terminal ${id}`)
  assertValid(s)
}
assert.equal(canEnd(s),true)
s = endSession(s)
assert.equal(s.phase,'finished')
assert.equal(evaluate(s).completed,8)
assert.ok(evaluate(s).criticalErrors.length >=2)
console.log(`ProofStack smoke OK: ${scenarios.length} cenários, ${s.activity.length} ações/eventos, 8 tickets concluídos.`)
