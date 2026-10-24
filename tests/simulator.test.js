import { describe, it, expect } from 'vitest'
import { getPriority } from '../src/data/world.js'
import { scenarios } from '../src/data/scenarios.js'
import {
  initSession, advance, sendReply, saveNote, performChoice, getSla,
  inspectKnowledge, inspectEmployee, setWaiting, evaluate, endSession,
  persistSession, loadSession, forgetSession, canEnd
} from '../src/engine/simulator.js'

describe('prioridade e relógio', () => {
  it('deriva a prioridade de impacto x urgência', () => {
    expect(getPriority('alto','alta')).toBe('P1')
    expect(getPriority('médio','alta')).toBe('P2')
    expect(getPriority('médio','média')).toBe('P3')
    expect(getPriority('baixo','baixa')).toBe('P4')
  })
  it('libera eventos e tickets no tempo roteirizado', () => {
    let s = initSession()
    expect(Object.values(s.tickets).filter(x => x.visible)).toHaveLength(2)
    s = advance(s, 60)
    expect(s.tickets['NS-1006'].visible).toBe(true)
    expect(s.tickets['NS-1007'].visible).toBe(false)
    s = advance(s, 30)
    expect(s.tickets['NS-1008'].visible).toBe(true)
  })
})

describe('estados e avaliações', () => {
  it('não deixa avançar sem a evidência necessária', () => {
    const state = initSession()
    const s = performChoice(state,'NS-1001','verify')
    const blocked = performChoice(s,'NS-1001','safe-reset')
    expect(blocked.tickets['NS-1001'].stage).toBe('process')
    expect(blocked.tickets['NS-1001'].flags).not.toContain('safe_reset')
    expect(blocked.flash).toMatch(/KB-101/)
  })
  it('fecha caminho correto do ticket de senha e preserva evidências', () => {
    let s = initSession()
    s = sendReply(s,'NS-1001','clear')
    s = performChoice(s,'NS-1001','verify')
    s = inspectKnowledge(s,'NS-1001','password')
    s = performChoice(s,'NS-1001','safe-reset')
    s = saveNote(s,'NS-1001','Identidade conferida; fluxo seguro aplicado e orientações enviadas.')
    s = performChoice(s,'NS-1001','done')
    expect(s.tickets['NS-1001'].status).toBe('resolvido')
    expect(s.tickets['NS-1001'].flags).toContain('correct_closure')
    expect(s.tickets['NS-1001'].firstResponseAt).toBe(0)
    expect(s.tickets['NS-1001'].history.length).toBeGreaterThan(4)
  })
  it('registra erro de segurança e limita o indicador', () => {
    let s = initSession()
    s = sendReply(s,'NS-1001','password')
    s = performChoice(s,'NS-1001','secret')
    const assessment = evaluate(s)
    expect(assessment.criticalErrors.length).toBe(2)
    expect(s.tickets['NS-1001'].flags).toContain('critical_error')
  })
  it('separa SLA de primeira resposta do prazo de solução e congela espera permitida', () => {
    let s = initSession()
    s = sendReply(s,'NS-1002','clear')
    s = performChoice(s,'NS-1002','check')
    s = saveNote(s,'NS-1002','Aprovação formal ainda pendente no sistema de acessos.')
    s = setWaiting(s,'NS-1002','aguardando_aprovação')
    const before = getSla(s,'NS-1002')
    s = advance(s, 30)
    const during = getSla(s,'NS-1002')
    expect(during.responseUsed).toBe(before.responseUsed)
    expect(during.resolutionUsed).toBe(before.resolutionUsed)
    s = setWaiting(s,'NS-1002','retomar')
    expect(s.tickets['NS-1002'].status).toBe('em_andamento')
    expect(getSla(s,'NS-1002').resolutionUsed).toBeGreaterThanOrEqual(during.resolutionUsed)
  })
  it('mantém terminal distinto de encerramento e não permite escolhas posteriores', () => {
    let s = initSession()
    s = performChoice(s,'NS-1002','grant')
    s = performChoice(s,'NS-1002','done')
    expect(s.tickets['NS-1002'].status).toBe('resolvido')
    const after = performChoice(s,'NS-1002','escalate')
    expect(after).toBe(s)
  })
  it('só finaliza turno quando todos foram tratados ou houve passagem de turno', () => {
    let s = initSession()
    expect(canEnd(s)).toBe(false)
    expect(endSession(s)).toBe(s)
    for (let i=0;i<5;i++) s = advance(s,60)
    expect(canEnd(s)).toBe(true)
    expect(endSession(s).phase).toBe('finished')
  })
  it('guarda/reabre progresso e descarta ao reiniciar', () => {
    const fake = new Map()
    const storage = {setItem:(k,v)=>fake.set(k,v),getItem:k=>fake.get(k)??null,removeItem:k=>fake.delete(k)}
    const s = sendReply(initSession(),'NS-1001','clear')
    expect(persistSession(s,storage)).toBe(true)
    expect(loadSession(storage).tickets['NS-1001'].firstResponseAt).toBe(0)
    expect(forgetSession(storage)).toBe(true)
    expect(loadSession(storage)).toBe(null)
  })
  it('todos os cenários têm IDs únicos, estados finais e critérios explícitos', () => {
    expect(new Set(scenarios.map(x=>x.id)).size).toBe(8)
    for(const scenario of scenarios) {
      expect(scenario.stages[0].id).toBe('start')
      expect(scenario.stages.at(-1).options.some(x=>x.finish)).toBe(true)
      expect(scenario.rubric.length).toBeGreaterThan(0)
    }
  })
})
