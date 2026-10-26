# Architecture Decision Records (ADR)

| ID | Decision | Status |
|----|----------|--------|
| ADR-1 | Mobile talks only to Express `/v1/api/*` in production; no direct Supabase data reads | Accepted |
| ADR-2 | Wire DTOs live in `packages/contracts/`; domain types in mobile adapters/repositories | Accepted |
| ADR-3 | All JSON responses use envelope: `success`, `code`, `errorCode`, `message`, `data`, `timestamp` | Accepted |
| ADR-4 | Express layering: routes → services → data (Supabase/RPC) | Accepted |
| ADR-5 | Mobile state: `AuthContext` + `AppStateContext` + repositories; no Redux | Accepted |
| ADR-6 | Mock and API repositories share interfaces; switch at `repositories/index.ts` factory only | Accepted |
| ADR-7 | Database changes via numbered migrations in `database/migrations/`; platform lead approves | Accepted |
| ADR-8 | Web v1 archived in `apps/web-legacy/`; future web uses same BFF | Accepted |
| ADR-9 | AI: task endpoints `/v1/api/ai/<task>`; providers server-side only | Accepted |
| ADR-10 | Gemini is v1 AI provider; OSS/custom via `AiProvider` interface | Accepted |
| ADR-11 | Escrow: hold funds, buyer-confirm/auto-release, payout via Paystack Transfers, manual disputes, 100% refund during hold — see [`ESCROW_POLICY.md`](./ESCROW_POLICY.md) | Accepted |

## Repo map

| Path | Purpose |
|------|---------|
| `apps/mobile/` | Active Expo client |
| `apps/web-legacy/` | Archived Vite+Redux reference |
| `backend/` | Express BFF |
| `packages/contracts/` | Shared API types |
| `database/migrations/` | Ordered Supabase SQL |
| `backend/handlers/` | Payment/AI/webhook handlers (legacy mount points; migrate into `services/` over time) |
| `core/` | Shared validation, hooks |
