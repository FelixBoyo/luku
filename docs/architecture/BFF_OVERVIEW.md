# BFF overview

Express is the **only** data/auth boundary for mobile (and future web).

## Request flow

```
Screen → repository → apiClient → Express route → service → Supabase
                ↓
         AppStateContext / AuthContext
```

## URL layout

| Prefix | Purpose |
|--------|---------|
| `/v1/api/health` | Liveness |
| `/v1/api/auth/*` | Login, refresh, logout, me |
| `/v1/api/products/*` | Catalog |
| `/v1/api/ai/*` | Task-based AI (not Gemini SDK shape) |
| `/v1/api/payments/*` | Existing payments |
| `/api/ai/gemini/*` | **Deprecated** — use task routes |

## Auth

- Mobile sends `Authorization: Bearer <accessToken>`
- Express verifies via `supabase.auth.getUser(token)`
- Refresh: `POST /v1/api/auth/refresh` with `{ refreshToken }` in body
- Tokens stored in mobile `api/tokenStorage.ts`

## Envelope

See [`../api/envelope.md`](../api/envelope.md) and `packages/contracts/src/envelope.ts`.

Lists use `data: { items: [], pagination: {} }`.

## Environment

**Server** (`.env.local`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`

**Mobile** (`apps/mobile/.env`): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCK_DATA`

## Data source modes (mobile)

```
EXPO_PUBLIC_USE_MOCK_DATA
        │
        ├─ true  → createMock* repositories → data/mock/ fixtures
        │
        └─ false → createApi* (M1 + M2 where live)
                   createEmpty* (M2–M4 pending) → skeleton → EmptyState
```

Screens never import `data/mock/` directly. Factory switch: `repositories/index.ts`.
Policy: [`../../apps/mobile/docs/MOCK_DATA_POLICY.md`](../../apps/mobile/docs/MOCK_DATA_POLICY.md).
