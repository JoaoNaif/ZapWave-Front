# CLAUDE.md

Frontend do ZapWave (React 19 + Vite + TypeScript).

## Backend

O backend (NestJS) fica em `../ZapWave` (repo `JoaoNaif/ZapWave`) e está acessível nesta sessão.
Antes de implementar algo que consome a API ou o WebSocket, consulte o back para contratos
(rotas, DTOs, payloads, close codes) em vez de supor.

- Contexto específico para o front: @../ZapWave/docs/CONTEXTO-FRONTEND.md
- Visão geral do back: @../ZapWave/CLAUDE.md

O back é atualizado com `git pull` automaticamente ao abrir a sessão (hook em
`.claude/settings.local.json`). Não altere arquivos do back a partir daqui sem pedir.
