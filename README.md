# ProofStack — Learn. Simulate. Prove.

**Versão:** v0.1.0 — First Day on the Job  
**Ambiente fictício:** Northstar Technologies  
**Tecnologia:** Vue 3 + Vite 7, JavaScript, CSS, Vitest  
**Licença do conteúdo:** projeto demonstrativo. Personagens, regras operacionais e infraestrutura são fictícios.

> Experimente o primeiro turno de trabalho de uma pessoa de suporte L1. Aprenda procedimentos de atendimento e descubra consequências de cada decisão em oito chamados roteirizados. **Não use o simulador como critério único de recrutamento.**

## O que já funciona

- Introdução narrativa com acesso instantâneo, sem login.
- Fila de 8 tickets liberados pelo relógio virtual, com impacto, urgência, prioridade derivada e deadlines.
- Primeiro contato com opções de comunicação adequadas e inadequadas.
- Árvore de decisões com evidências verificáveis, pré-requisitos e consequências registradas.
- Consultas à Knowledge Base, Employee Directory e Monitoring integradas ao histórico do chamado.
- Work notes e status de espera com restrições de justificativa; fluxo de resolução, escalonamento e encerramento.
- Política de SLA para primeira resposta e tratamento com pausas limitadas a pendências justificáveis.
- Indicadores de competências baseados em rubricas por ticket e relatório detalhado em JSON ou versão para impressão/PDF.
- Tour guiado em cinco passos; mini Academy com três níveis explicativos (Normal, Uga-Buga, Neandertal).
- Interface responsiva, acessível por teclado, com light/dark e respeito a movimento reduzido.
- Salvamento automático no navegador (localStorage), retomada e reinício.

### Limites intencionais do MVP

**Não há backend, e-mail/chat real, terminal com execução de código, autenticação ou inteligência artificial.** Chat e terminal aparecem como itens de versões futuras, sem interações enganosas. O Monitoramento exibe serviços simulados; a avaliação não é inviolável e não pode provar identidade. Ainda não existe criação livre de cenários pela interface, nem envio do relatório a recrutadores.

## Executar no Ubuntu

Requer **Node.js 20.19+ ou 22+** e npm. Em um terminal dentro da pasta do projeto:

```bash
node -v
npm -v
npm install
npm run dev
```

Abra o endereço local exibido no terminal (normalmente `http://localhost:5173`).

Produção e testes:

```bash
npm test
npm run build
npm run preview
```

Também existe o teste offline do motor, que não exige instalar dependências:

```bash
npm run test:offline
node tests/smoke-node.mjs
```

> **Observação de validação desta entrega:** o teste offline do motor foi executado com sucesso. O build Vite e os testes Vitest precisam ser executados com npm instalado e acesso ao registro de pacotes; no ambiente de geração desta entrega, a resolução DNS de `registry.npmjs.org` não estava disponível.

## Entendendo a experiência

1. Clique em **Iniciar meu primeiro turno** e siga o mini tutorial.
2. Selecione um ticket na fila. Envie a primeira resposta, verificando seu prazo independente.
3. Consulte as ferramentas adequadas e realize as decisões na ordem do cenário. As alternativas com pré-requisitos ficam bloqueadas até você obter evidências.
4. Registre notas de trabalho (mínimo 8 caracteres) e conclua/escalone o ticket. Se necessário, solicite uma espera justificável e retome o atendimento.
5. Outros chamados aparecem quando o tempo virtual avança com as ações. O botão **+10 min** permite acelerar a jornada.
6. Em **Relatórios**, confira rubricas, SLAs e decisões registradas. Quando todos estiverem concluídos ou após 300 min virtuais, finalize o turno.
7. **Imprimir / PDF** usa a função de impressão do navegador. Escolha **Salvar como PDF**. **Exportar JSON** salva dados estruturados do relatório.

O progresso é armazenado apenas no navegador e dispositivo atuais. Limpar os dados do site pode apagá-lo. Exportar relatório não equivale a criar um backup restaurável da partida.

## Estrutura do projeto

```text
proofstack/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.js
│  ├─ App.vue                 # UI, navegação, acessibilidade e relatórios
│  ├─ style.css
│  ├─ data/
│  │  ├─ scenarios.js        # 8 chamados declarativos
│  │  └─ world.js            # diretório, políticas, KB, minidicionário
│  └─ engine/
│     └─ simulator.js        # transições puras, tempo, SLA, avaliação, persistência
├─ tests/
│  ├─ simulator.test.js       # testes Vitest
│  └─ smoke-node.mjs          # cenário ponta a ponta offline
├─ .github/workflows/deploy.yml
├─ README.md
├─ ARCHITECTURE.md
├─ ROADMAP.md
├─ CHANGELOG.md
└─ COMO_PUBLICAR.md
```

## Segurança e privacidade

Todos os nomes, eventos, políticas, personagens e aplicações simuladas são inventados. Nenhum comando é executado contra ambientes reais. Não existe coleta de credenciais, envio de dados a servidores ou API de IA. O texto adicionado pelo jogador é tratado como texto, não como HTML executável. O relatório pode conter notas digitadas por você: revise-o antes de compartilhá-lo.

Veja `ARCHITECTURE.md` para o contrato do motor, `ROADMAP.md` para versões propostas e `COMO_PUBLICAR.md` para GitHub Pages.

## v0.1.1 — Conversas por chamado
Na aba **Conversa** de cada chamado, escreva mensagens livres ou use sugestões. O personagem responde de forma roteirizada (não é IA). A primeira mensagem enviada conta como primeira resposta para o SLA, e o histórico é salvo localmente. A tomada de decisão do chamado continua disponível na aba Atendimento.
