## v0.1.2 — Blind Decisions (2026-10-23)

- Removidos avisos de opção insegura, cores diferenciadas, ícones de alerta e confirmações que denunciavam o resultado.
- Reescritas as alternativas dos oito chamados com linguagem mais natural e dilemas de procedimento.
- Primeira resposta agora é escrita livremente na conversa, sem opções prontas com gabarito implícito.
- Removidos atalhos de mensagens sugeridas durante o atendimento.
- Ações sem pré-requisitos produzem uma falha operacional; a avaliação detalhada só é mostrada depois do turno.
- Relatório, erros críticos, recomendações e análises de escolhas ficam ocultos até o encerramento.
- Preservado o registro de consequências e regras de avaliação para o debrief final.
- Testes adicionais contra dicas antecipadas e regressões do simulador.

## v0.1.1 — Ticket Conversations

- Conversa bidirecional por chamado com histórico persistente.
- Mensagens personalizadas e sugestões rápidas.
- Respostas roteirizadas dos funcionários; sem IA.
- Primeira mensagem conta como primeiro contato para SLA.
- Detecção de solicitação insegura de senhas ou códigos.

# Changelog

Formato inspirado em Keep a Changelog. Versões SemVer.

## [0.1.0] — 2026-10-23

### Adicionado

- Marca ProofStack e cenário corporativo Northstar Technologies.
- Interface de Service Desk responsiva, light/dark e tutorial guiado.
- Oito chamados roteirizados com diferentes prioridades, condições e resultados.
- Motor declarativo com eventos, horário virtual e estado compartilhado.
- Consultas auditáveis a base de conhecimento, diretório e monitoramento.
- Primeiro contato, notas, esperas justificadas, resolução, escalonamento e encerramento.
- Cálculo de SLA com política didática e separação de primeira resposta/tratamento.
- Avaliação por competências observáveis, alertas críticos e histórico de decisões.
- Mini Academy (Normal, Uga-Buga, Neandertal).
- Relatório com impressão/PDF do navegador e exportação JSON.
- Persistência local, recuperação e reinício.
- Vitest, smoke offline, documentação e workflow GitHub Pages.

### Limitações conhecidas

- Escalonar é tratado como conclusão do atendimento L1, não como restauração técnica efetiva.
- O tempo virtual não cruza janelas de múltiplos dias de trabalho.
- Feedback narrativo é roteirizado; sem IA conversacional ou gerador procedural.
- A rubrica educacional não garante autenticidade, identidade ou validade para recrutamento.
- Resultados locais e arquivos JSON podem ser alterados pelo usuário.
