# PR checklist (Phase 2)

- [ ] Work matches assigned member spec (`docs/team/0X_*.md`)
- [ ] Endpoints listed in `docs/api/CONTRACT_MATRIX.md`
- [ ] DTOs in `packages/contracts/` (no duplicate types in screens)
- [ ] Express: route → service → data (no Supabase in routes)
- [ ] Responses use `createResponse` / `createErrorResponse`
- [ ] Mobile: no `supabase.from` / `supabase.rpc` in screens
- [ ] Mobile: no direct `data/mock/` imports in screens, context, or components (`npm run verify:no-direct-mock-imports`)
- [ ] Mobile: HTTP only via `apps/mobile/src/api/apiClient.ts`
- [ ] Repository interface unchanged or versioned; mock + api factories updated
- [ ] `cd apps/mobile && npm run lint:check` passes
- [ ] Manual test with `EXPO_PUBLIC_USE_MOCK_DATA=false` for your domain
- [ ] No secrets in code or commits
- [ ] No edits to `apps/web-legacy/` except docs
