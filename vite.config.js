import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// A configuração do caminho é automática no GitHub Actions e funciona na raiz em dev.
// Para GitHub Pages de projeto: /nome-do-repositorio/.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase = repo?.endsWith('.github.io') ? '/' : repo ? `/${repo}/` : '/'
export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS === 'true' ? pagesBase : '/',
  test: { environment: 'node', include: ['tests/**/*.test.js'] }
})
