import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initSession, performChoice, endSession, advance } from '../src/engine/simulator.js'
import { scenarios } from '../src/data/scenarios.js'
const vue = readFileSync(new URL('../src/App.vue', import.meta.url),'utf-8')
test('UI não divulga qual opção é incorreta antes da decisão',()=>{
 assert.doesNotMatch(vue, /choice\.critical|choice\.tone|choice\.feedback|INSEGURO|id="reply-quality"/)
 assert.match(vue, /v-if="finished && entry\.critical"/)
 assert.match(vue, /<template v-if="finished"><section class="section-heading"/)
 assert.match(vue, /v-else class="panel ps-assessment-locked"/)
})
test('alternativas não têm aviso de resposta embutido',()=>{
 for(const s of scenarios) for(const st of s.stages) for(const o of st.options) {
   assert.doesNotMatch(o.text, /\(INSEGURO\)|\[ERRADO\]|\[CORRETO\]/i)
 }
})
test('avaliação da decisão não aparece no flash nem no texto do histórico operacional',()=>{
 const init=initSession()
 const result=performChoice(init,'NS-1001','secret')
 const decision=result.tickets['NS-1001'].history.find(h=>h.type==='choice')
 assert.ok(decision.critical && decision.review)
 assert.ok(!decision.message.includes(decision.review))
 assert.doesNotMatch(result.flash,/errado|inseguro|segurança|corretamente|senha/i)
})
test('tentativa sem pré-requisito é exibida como operação não concluída, sem dicas antecipadas',()=>{
 const first=performChoice(initSession(),'NS-1001','verify')
 const after=performChoice(first,'NS-1001','safe-reset')
 assert.equal(after.tickets['NS-1001'].stage,'process')
 assert.equal(after.elapsed,first.elapsed+1)
 assert.ok(after.tickets['NS-1001'].history.find(e=>e.type==='attempt')?.review)
 assert.doesNotMatch(after.flash,/KB-101|identidade|abrir a/i)
})
test('o turno pode ser encerrado sem perder evidências do debrief',()=>{
 const first=performChoice(initSession(),'NS-1001','secret')
 const last=endSession(advance(first,60))
 assert.equal(last.phase,'playing') // Ainda há expediente pela frente
 assert.ok(first.tickets['NS-1001'].history.some(x=>x.review))
})

test('histórico de versão anterior preserva o parecer apenas no debrief',async()=>{
 const {loadSession, SAVE_KEY}=await import('../src/engine/simulator.js')
 const old=initSession()
 old.tickets['NS-1001'].history.push({at:0,type:'choice',message:'Ação original — Erro explicado ao jogador.',critical:null})
 old.activity.push({at:0,type:'choice',message:'Ação original — Erro explicado ao jogador.',critical:null})
 old.flash='Erro explicado ao jogador.'
 const storage={getItem:key=>key===SAVE_KEY?JSON.stringify(old):null}
 const resumed=loadSession(storage)
 assert.equal(resumed.tickets['NS-1001'].history.at(-1).message,'Ação original')
 assert.equal(resumed.tickets['NS-1001'].history.at(-1).review,'Erro explicado ao jogador.')
 assert.doesNotMatch(resumed.flash,/Erro explicado/)
})
