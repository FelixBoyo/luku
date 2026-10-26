# LUKU Web v1 — RETIRED

**Status: RETIRED.** Do not run, repair, or extend this app.

It predates migration [`012_escrow_orders.sql`](../../database/migrations/012_escrow_orders.sql). Its order writes still use the pre-escrow statuses (`pending`, `confirmed`), which the live `orders_status_check` constraint now rejects. A grepped hit for those statuses under `apps/web-legacy/` is not live product code.

Phase 2+ active product is [`apps/mobile`](../mobile/). New work belongs in `apps/mobile/`, `backend/`, `packages/contracts/`, and `database/migrations/`.

## Why it still exists

Reference only — business logic, Supabase query patterns, and payment/AI flows when implementing the Express BFF and mobile repositories. See [`docs/team/LEGACY_REFERENCE_GUIDE.md`](../../docs/team/LEGACY_REFERENCE_GUIDE.md).

## What not to do

- Do not import from `apps/web-legacy` in mobile or backend code
- Do not copy Redux into mobile — use repositories + Context
- Do not extend this app for new LUKU features
- Do not run it against the escrow-migrated database expecting checkout to work

## Emergency local boot (not supported)

The root `dev:legacy` script has been removed on purpose. If you absolutely need the Vite shell for reference:

```bash
npm run dev --workspace=@luku/web-legacy
```

Requires `.env.local` at repo root. Expect order create/status updates to fail against a DB that has migration 012 applied.

## What to reference

| Need | Look here |
|------|-----------|
| Redux + Supabase thunks | `store/slices/` |
| AI prompts / schemas | `services/geminiService.ts` |
| Payments client | `services/paystackService.ts`, `services/mpesaService.ts` |
| UI behavior (desktop) | `components/` |
| Types | `types.ts` |
