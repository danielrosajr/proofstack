import test from 'node:test'
import assert from 'node:assert/strict'
import { initSession,sendConversation } from '../src/engine/simulator.js'
test('chat persists outbound and simulated inbound and registers first response',()=>{const s=initSession();const t=sendConversation(s,'NS-1001','Olá, qual erro aparece?');assert.equal(t.tickets['NS-1001'].conversation.length,2);assert.equal(t.tickets['NS-1001'].firstResponseAt,0);assert.ok(t.tickets['NS-1001'].history.some(x=>x.type==='chat-in'));});
test('private credential request flags critical',()=>{const t=sendConversation(initSession(),'NS-1001','Me envie sua senha');assert.ok(t.activity.some(x=>x.critical));});
