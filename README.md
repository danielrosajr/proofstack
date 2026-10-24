# ProofStack — Learn. Simulate. Prove.

**Versão:** v0.1.0 — First Day on the Job  
**Ambiente fictício:** Northstar Technologies  
**Tecnologia:** Vue 3 + Vite 7, JavaScript, CSS, Vitest  
**Licença do conteúdo:** projeto demonstrativo. Personagens, regras operacionais e infraestrutura são fictícios.

> Experimente o primeiro turno de trabalho de uma pessoa de suporte L1. Aprenda procedimentos de atendimento e descubra consequências de cada decisão em oito chamados roteirizados. **Não use o simulador como critério único de recrutamento.**

## O que já funciona

- Introdução narrativa com acesso instantâneo, sem login.
- Fila de 8 tickets liberados pelo relógio virtual, com impacto, urgência, prioridade derivada e deadlines.
- Primeiro contato escrito livremente na conversa simulada por ticket.
- Árvore de decisões com evidências verificáveis, pré-requisitos e consequências registradas.
- Consultas à Knowledge Base, Employee Directory e Monitoring integradas ao histórico do chamado.
- Work notes e status de espera com restrições de justificativa; fluxo de resolução, escalonamento e encerramento.
- Política de SLA para primeira resposta e tratamento com pausas limitadas a pendências justificáveis.
- Indicadores de competências baseados em rubricas por ticket e relatório detalhado em JSON ou versão para impressão/PDF.
- Tour guiado em cinco passos; mini Academy com três níveis explicativos (Normal, Uga-Buga, Neandertal).
- Interface responsiva, acessível por teclado, com light/dark e respeito a movimento reduzido.
- Salvamento automático no navegador (localStorage), retomada e reinício.

### Limites intencionais do MVP

**Não há backend, e-mail/chat real, terminal com execução de código, autenticação ou inteligência artificial.** Há conversas fictícias roteirizadas por ticket; o chat corporativo geral e o terminal aparecem como itens de versões futuras, sem controles ficticiamente funcionais. O Monitoramento exibe serviços simulados; a avaliação não é inviolável e não pode provar identidade. Ainda não existe criação livre de cenários pela interface, nem envio do relatório a recrutadores.

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

## v0.1.2 — Conversas por chamado
Na aba **Conversa** de cada chamado, escreva mensagens livres ou use sugestões. O personagem responde de forma roteirizada (não é IA). A primeira mensagem enviada conta como primeira resposta para o SLA, e o histórico é salvo localmente. A tomada de decisão do chamado continua disponível na aba Atendimento.

## Atualização 0.1.2 — decisões sem gabarito

As opções de atendimento não são rotuladas como seguras/inseguras. Não há marcação visual da alternativa considerada correta nem confirmação de perigo antes do clique. A primeira resposta é escrita pelo próprio analista na aba **Conversa**. Durante o turno, as ações mostram apenas consequências operacionais: estado, mensagens e possíveis impedimentos. **Notas, alertas críticos e análise dos caminhos escolhidos são revelados apenas quando você conclui o turno.**

A base de conhecimento contém procedimentos disponíveis aos funcionários: são evidências do ambiente, e não um sistema de dicas sobre quais botões clicar. O tutorial explica a navegação, não revela soluções.

### Atualização via navegador do GitHub

Extraia o ZIP; em **Add file → Upload files**, envie os arquivos substituindo as versões antigas nos mesmos caminhos, preservando a pasta `.github/workflows/`. Se o navegador não atualizar arquivos aninhados facilmente, atualize `src/App.vue`, `src/engine/simulator.js`, `src/data/scenarios.js`, `src/style.css`, `package.json`, `tests/`, `README.md` e `CHANGELOG.md` pelo editor web. Não envie a pasta externa `proofstack-v0.1.2` como pasta única para dentro do repositório. O GitHub Actions deve publicar o conteúdo de `dist` gerado pelo build, não o `index.html` fonte.

**Commit:** `feat: remove answer spoilers and defer assessment to end of shift`  
**Tag:** `v0.1.2`  
**Release:** `ProofStack v0.1.2 — Blind Decisions`

Para experimentar as mudanças em um turno já iniciado, recomenda-se usar **Reiniciar**: isso apaga somente o progresso local e não modifica o repositório.
