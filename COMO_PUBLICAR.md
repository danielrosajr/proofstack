# Como instalar, testar e publicar no GitHub Pages

> O jeito mais simples: **upload pela interface do GitHub**, sem configurar Git no terminal. Você usa npm localmente só para rodar/testar. O GitHub Actions publica automaticamente o site.

## 1. Preparar Ubuntu

Abra o Terminal e confira:

```bash
node -v
npm -v
```

Recomendado: Node.js **22 LTS**. Se a versão for antiga, instale Node 22 por um método confiável (por exemplo, `nvm` do projeto oficial, ou o pacote oficial disponível para seu ambiente). Confirme `node -v` após a instalação.

## 2. Executar localmente

Extraia o ZIP e, dentro da pasta extraída:

```bash
cd proofstack-v0.1.0
npm install
npm run dev
```

No terminal aparece a URL do servidor (normalmente `http://localhost:5173`). Abra no navegador.

## 3. Testar e gerar build de produção

```bash
npm test
npm run build
npm run preview
```

`npm run build` gera a pasta `dist/`. **Não é necessário enviar `dist/` ao GitHub**, pois o workflow compila no servidor de Actions. O `node_modules/` também não deve ser enviado.

## 4. Criar repositório sem terminal Git

1. Acesse **GitHub → botão `+` → New repository**.
2. Sugestão de nome: `proofstack`.
3. Description: `Learn. Simulate. Prove. Interactive tech learning and realistic IT support career simulations.`
4. Selecione Public; se quiser usar Pages gratuitamente, verifique as regras atuais do seu plano para repositórios privados.
5. Clique **Create repository**.
6. Na tela vazia, use **uploading an existing file** (ou Add file → Upload files).
7. **Extraia o ZIP**. Arraste os arquivos e as pastas da raiz `proofstack-v0.1.0` para o upload, incluindo `.github` (pasta oculta: no gerenciador de arquivos do Ubuntu, use `Ctrl+H`).
8. **Confira que `index.html`, `package.json` e `.github/workflows/deploy.yml` aparecem nos caminhos corretos.** Não envie a pasta `proofstack-v0.1.0` como subpasta dentro do repositório.
9. Clique **Commit changes**. Sugestão: `feat: initial ProofStack v0.1.0 career simulator`.

Se o upload via navegador não preservar pastas em seu dispositivo/navegador, use a interface web para criar as pastas e inserir os arquivos, mantendo os caminhos exatos. Não é necessário usar `git push`.

## 5. Ativar GitHub Pages

1. Abra o repositório em **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Em **Actions**, confira a execução de `Deploy ProofStack to GitHub Pages`. Se necessário, use `Run workflow` no menu do workflow.
4. O workflow instala dependências, roda os testes, compila em `dist` e publica.
5. Confira a URL em **Settings → Pages**. Em um repositório chamado `proofstack` da conta `USUARIO`, normalmente será `https://USUARIO.github.io/proofstack/`.

## 6. Rotas e caminhos (evitando página branca)

O `vite.config.js` identifica automaticamente o nome do repositório em GitHub Actions e ajusta `base` para `/<nome-do-repositório>/`. Para repositórios `USUARIO.github.io`, usa `/`.

- `index.html` fica na raiz do repositório, não dentro de `src`.
- Todos os imports em `src` são processados pelo Vite durante o build.
- Não há Vue Router nesta versão: as telas mudam no estado Vue, **sem rotas URL**. Isso evita erro 404 ao dar refresh em `/proofstack/`.
- Se uma futura versão adicionar URL por rota, prefira hash routing ou um fallback válido para Pages.
- Caso a tela fique em branco, verifique **Actions → logs de build** e o console do navegador; confira `base` e existência de `dist/index.html` no artefato de Pages.
- O progresso salvo no browser fica ligado à origem/endereço do site e não será transferido automaticamente ao trocar a URL.
- Com domínio personalizado, ajuste `base` para `/` e configure o domínio em Pages antes de publicar.

## 7. Atualizações futuras

1. Faça backup dos arquivos locais e do relatório da partida, quando relevante.
2. Modifique e teste localmente: `npm test`, `npm run build`.
3. Pelo GitHub, abra **Add file → Upload files** e substitua arquivos nos caminhos originais, ou edite diretamente na interface web.
4. Commit sugerido para bugfix: `fix: improve ticket state transitions and SLA rules`.
5. Em **Releases → Draft a new release**, use tag SemVer (`v0.1.1`, `v0.2.0`, etc.).
6. Confira **Actions** e atualize `CHANGELOG.md` com o que realmente mudou.

### Release v0.1.0 (sugestão pronta)

**Título:** `ProofStack v0.1.0 — First Day on the Job`

**Resumo:** Primeira versão jogável do ProofStack com uma jornada de suporte L1 na Northstar Technologies, empresa fictícia. Inclui 8 chamados roteirizados, relógio e SLA virtual, decisões com consequências, base de conhecimento, diretório, monitoramento, mini Academy, relatórios e salvamento local. Sem backend nem integração real com sistemas empresariais.

## Problemas comuns

| Sintoma | Verificação |
| --- | --- |
| `npm: command not found` | Instale Node.js e npm, reabra Terminal. |
| `npm install` falhou | Verifique rede/DNS, proxy, registro npm e versão do Node. |
| `npm run build` deu erro | Rode `npm install` e confira logs. |
| GitHub Actions não executou | Confira `main`, o arquivo `.github/workflows/deploy.yml` e permissões de Actions. |
| Site abre mas JS não carrega | Confira pasta raiz e `base` de Vite. |
| Refresh dá 404 | A v0.1 só usa a rota raiz. Evite links de caminho inexistentes. |
| Mudança não aparece | Aguarde a conclusão de Actions e faça recarga normal/sem cache no navegador. |
| Progresso desapareceu | Verifique se abriu a mesma URL e se dados do navegador não foram limpos. |

Documentação oficial: https://vite.dev/guide/static-deploy.html#github-pages
