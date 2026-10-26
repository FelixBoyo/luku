# Platform gate — Platform lead only

**Owner:** John  
**Blocks:** Member specs 01–04 until signed off

## Deliverables

### Repo structure
- [x] `apps/web-legacy/` — archived web SPA
- [x] `packages/contracts/` — shared DTOs
- [x] `backend/router/v1/` — BFF router
- [x] `database/legacy/` + `database/migrations/`
- [x] `docs/team/`, `docs/architecture/`, `docs/api/`, `docs/database/`

### Database
- [x] Introspection → [`LIVE_INVENTORY.md`](../database/LIVE_INVENTORY.md) (`npm run db:introspect`)
- [x] Migrations `003`–`008` (`npm run db:migrate`)
- [x] Seed data (`npm run db:seed`)
- [x] [`SCHEMA.md`](../database/SCHEMA.md) + [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md)

### Express
- [x] `/v1/api/health`, `/v1/api/auth/login|refresh|logout|me`, `/v1/api/products`
- [x] `POST /v1/api/auth/signup`
- [x] AI task stub `POST /v1/api/ai/outfit-suggestions`
- [x] `ALLOWED_ORIGINS` documented — see [`.env.example`](../../.env.example), [`apps/mobile/README.md`](../../apps/mobile/README.md)

### Mobile foundation
- [x] `api/apiClient.ts`, `api/tokenStorage.ts`, `api/responseData.ts`
- [x] `context/AuthContext.tsx` wired in `App.tsx`
- [x] `SignInScreen` → Express login
- [x] `createApiProductsRepository` spike
- [x] Root [`.env.example`](../../.env.example)

### Docs
- [x] Contract matrix + table scope tags
- [x] Member specs 01–04 refreshed
- [x] [`DISTRIBUTION.md`](./DISTRIBUTION.md)

## Sign-off criteria

1. [x] Dev Supabase has products + RPCs (9 active after seed)
2. [ ] `npm run verify:gate` green (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` + `npm run dev:api`)
3. [x] `cd apps/mobile && npm run lint:check` green
4. [ ] Contract matrix reviewed by team at kickoff
5. [ ] Demo: SignIn with seed user → products on Discover/Home with `EXPO_PUBLIC_USE_MOCK_DATA=false`

## Verification

```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run verify:gate
```

Manual curls (replace password from seed header):

```bash
curl -s http://localhost:3001/v1/api/health
curl -s -X POST http://localhost:3001/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev+buyer@luku.app","password":"<from dev_seed.sql>"}'
curl -s "http://localhost:3001/v1/api/products?limit=5"
```

## After sign-off

1. Fill owners in specs 01–04
2. Share [`DISTRIBUTION.md`](./DISTRIBUTION.md) with team
3. Distribute M1–M3; M4 after M2 cart/catalog patterns are clear

| Approved by | Date | Notes |
|-------------|------|-------|
| _platform lead_ | _YYYY-MM-DD_ | _pending verify:gate + lint_ |
