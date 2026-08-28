# Enciclopédia do Bom Gosto

Scaffold inicial (Fase 1). Documentação canônica (fonte da verdade) fora deste repo de código:
`PROJECT_MANIFEST.md`, `AGENTS.md`, `GLOSSARY.md`, `ADR-001`, `DATABASE_SPEC.md`, `API_SPEC.md`,
`proposta-enciclopedia-do-bom-gosto-v3.md`.

Nenhuma regra de negócio deve ser inferida fora desses documentos (ver AGENTS.md).

## Estrutura
- `apps/web` — Next.js 15 (App Router), PWA, mobile-first
- `apps/api` — NestJS, expõe o contrato em `API_SPEC.md`
- `packages/shared-types` — schemas Zod compartilhados (contrato único front/back)

## Setup
```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# preencha os dois .env com os valores do Supabase (Settings > API / Database / JWT)
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
pnpm db:seed
pnpm dev
```
