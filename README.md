# LUKU

AI-powered fashion companion. **Phase 2** ships the **Expo mobile app** talking to an **Express BFF** (`/v1/api/*`). Supabase is server-side only.

## Monorepo map

| Path | What it is | Who edits it |
|------|------------|--------------|
| [`apps/mobile/`](apps/mobile/) | **Active product** — React Native (Expo) | Mobile devs |
| [`backend/`](backend/) | **Active API** — Express, auth, products, payments | Backend / platform |
| [`backend/handlers/`](backend/handlers/) | Payment, AI, webhook route handlers (mounted by `server.ts`) | Backend |
| [`packages/contracts/`](packages/contracts/) | Shared API wire types (DTOs, envelope) | Platform + all members |
| [`core/`](core/) | Shared validation & hooks | Mobile + legacy web |
| [`database/`](database/) | Migrations (`migrations/`) + legacy SQL (`legacy/`) | Platform lead only |
| [`docs/`](docs/) | **All documentation** — [`docs/README.md`](docs/README.md) | Everyone |
| [`apps/web-legacy/`](apps/web-legacy/) | Archived Vite + Redux web — **reference only** | Do not extend |
| [`designs/`](designs/) | Figma export / design reference | Design |
| [`marketing/`](marketing/) | Marketing & campaign docs | Marketing |

## Where to start (by role)

| Role | Read first | Work in |
|------|------------|---------|
| **Current program (team)** | **[`docs/team/TEAM_ROADMAP.md`](docs/team/TEAM_ROADMAP.md)** · [`PHASE0_STATUS`](docs/team/PHASE0_STATUS.md) · [`TEAM_GO_CHECKLIST`](docs/team/TEAM_GO_CHECKLIST.md) (John — incl. smoke findings) | Phases 0–5 by role |
| New dev | [`docs/README.md`](docs/README.md) | — |
| Phase 2 member | [`docs/team/README.md`](docs/team/README.md) + your `01`–`04` spec | `apps/mobile/` + `backend/` |
| Platform / DB lead | [`docs/team/TEAM_ROADMAP.md`](docs/team/TEAM_ROADMAP.md) + [`00_PLATFORM_GATE.md`](docs/team/00_PLATFORM_GATE.md) | `database/`, `packages/contracts/` |
| Porting web logic | [`docs/team/LEGACY_REFERENCE_GUIDE.md`](docs/team/LEGACY_REFERENCE_GUIDE.md) | Read `apps/web-legacy/`, implement in `backend/` + mobile repos |

## Quick start

```bash
npm install
```

### Environment

| File | Used by |
|------|---------|
| `.env.local` (repo root) | Express `backend/` — Supabase service role, Gemini, CORS |
| `apps/mobile/.env` | Expo — see [`apps/mobile/.env.example`](apps/mobile/.env.example) |

Details: [`docs/ops/env.md`](docs/ops/env.md)

### Run services

```bash
# Express API → http://localhost:3001
npm run dev:api

# Mobile (separate terminal)
npm run dev:mobile
# Set EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 in apps/mobile/.env
# On a physical device use your machine LAN IP instead of localhost

# Legacy web (optional — reference UI only)
npm run dev:legacy
```

### Database

Apply Supabase migrations: [`docs/database/MIGRATION_RUNBOOK.md`](docs/database/MIGRATION_RUNBOOK.md)

### Scripts (from repo root)

| Command | Purpose |
|---------|---------|
| `npm run dev:mobile` | Start Expo |
| `npm run dev:mobile:clean` | Start Expo with Metro cache cleared |
| `npm run dev:api` | Start Express BFF |
| `npm run dev:legacy` | Start archived web SPA |
| `npm run lint:mobile` | Typecheck mobile (`tsc --noEmit`) |
| `npm run typecheck:contracts` | Typecheck `packages/contracts` |
| `npm run verify:deps` | Fail if multiple `react` versions are installed |
| `npm run verify:mobile` | Fail if Metro cannot resolve mobile/RN dependencies |
| `npm run verify:no-direct-mock-imports` | Fail if screens/context/components import `data/mock/` |
| `npm run test` | Vitest — `backend/`, `core/`, `apps/web-legacy/` |

## Architecture (short)

```
Mobile (apps/mobile)
  → apiClient + repositories + AuthContext / AppStateContext
  → Express (backend) /v1/api/*
  → Supabase (service role, RPCs)

Legacy web (apps/web-legacy) — read-only reference for business logic
```

Deep dive: [`docs/architecture/BFF_OVERVIEW.md`](docs/architecture/BFF_OVERVIEW.md)

**Mobile demo vs integration:** `EXPO_PUBLIC_USE_MOCK_DATA=true` (default) runs the full offline UI; `false` uses the BFF where live and shows skeleton/empty elsewhere. See [`apps/mobile/docs/MOCK_DATA_POLICY.md`](apps/mobile/docs/MOCK_DATA_POLICY.md).

## License

MIT — see [LICENSE](LICENSE) if present.
