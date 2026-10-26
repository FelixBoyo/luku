# LUKU documentation index

## Start here (Phase 2 / Phase 3)

| Doc | Purpose |
|-----|---------|
| **[Team roadmap](./team/TEAM_ROADMAP.md)** | **Current program** — phases 0–5, roles, start today |
| [Phase 0 status](./team/PHASE0_STATUS.md) | Live done/pending dashboard (incl. smoke failures M2-03, M2-05, M4-13) |
| [Team go checklist](./team/TEAM_GO_CHECKLIST.md) | John pre-flight + smoke findings before team go |
| [Marketplace epic](./team/MARKETPLACE_EPIC.md) | Unified feed + peer checkout (Phases 1–2) |
| [Team specs](./team/README.md) | Member assignments 00–04, PR checklist |
| [Architecture ADRs](./architecture/ADR.md) | Locked technical decisions |
| [BFF overview](./architecture/BFF_OVERVIEW.md) | Express + mobile data flow |
| [Redux/Express reference](./architecture/redux-express-reference.md) | RIZIKI patterns (auth, envelope, API client) |
| [AI providers](./architecture/AI_PROVIDER.md) | Task-based AI, Gemini v1 |
| [API contract matrix](./api/CONTRACT_MATRIX.md) | Endpoint source of truth |
| [API changelog](./api/CHANGELOG.md) | Endpoint add/change log for mobile + backend |
| [Response envelope](./api/envelope.md) | JSON shape for all `/v1/api/*` |
| [Database runbook](./database/MIGRATION_RUNBOOK.md) | Apply Supabase migrations |
| [Schema map](./database/SCHEMA.md) | Tables → repositories (target) |
| [Table scope](./database/TABLE_SCOPE.md) | mobile-v1 vs web-legacy tags |
| [DB introspection SQL](./database/introspection.sql) | Query live Supabase schema + buckets |
| [Live inventory](./database/LIVE_INVENTORY.md) | Dev project snapshot + gap analysis |
| `npm run db:introspect` | Auto-run introspection via `SUPABASE_DB_URL` |

## Backend & payments

| Doc | Purpose |
|-----|---------|
| [Backend quick start](./backend/quick-start.md) | Supabase RPCs, Redux slice patterns (web legacy) |
| [Payments API](./payments/api.md) | Payment endpoints |
| [Paystack frontend](./payments/paystack-frontend.md) | Client integration |
| [Payments checklist](./payments/integration-checklist.md) | Integration QA |
| [Payment secrets](./payments/secrets.md) | Env var handling |
| [Integrations guide](./integrations/guide.md) | Cross-service setup |
| [Integrations quick reference](./integrations/quick-reference.md) | Cheat sheet |

## Mobile product

| Doc | Purpose |
|-----|---------|
| [RN v1 scope](./product/rn-v1-scope.md) | Feature in/out for native v1 |
| [UI tokens & contracts](./product/rn-ui-tokens-and-contracts.md) | Shared primitives |
| [Mobile README](../apps/mobile/README.md) | Run, env, architecture |
| [Phase 1 inventory](../apps/mobile/docs/PHASE1_INVENTORY.md) | Screen → data source |
| [Product decisions](../apps/mobile/docs/PRODUCT_DECISIONS.md) | Locked IA decisions |
| [Coming soon triage](../apps/mobile/docs/COMING_SOON_TRIAGE.md) | Stub routes + QA matrices |

## QA, security, ops

| Doc | Purpose |
|-----|---------|
| [Zeus remediation](./qa/ZEUS_REMEDIATION.md) | Phase 0 task tracker (incl. M4-13 M-Pesa STK) |
| [Landing page](../../landing/README.md) | Next.js marketing site — `npm run dev:landing` |
| [Landing ↔ RN brand alignment](./qa/LANDING_RN_BRAND_ALIGNMENT.md) | Checklist to align landing to mobile app brand |
| [Testing](./qa/testing.md) | Test strategy |
| [Usability — nav/onboarding](./qa/usability-nav-onboarding.md) | UX testing notes |
| [Coverage report](./qa/coverage-report.md) | Coverage notes |
| [RLS checklist](./security/rls-checklist.md) | Supabase RLS |
| [Threat model](./security/threat-model.md) | Security review |
| [Env vars](./ops/env.md) | Environment setup |
| [Release checklist](./ops/release-checklist.md) | Ship checklist |
| [Logging](./ops/logging.md) | Log conventions |

## Support & brand

| Doc | Purpose |
|-----|---------|
| [Support FAQ](./support/faq.md) | User FAQ |
| [Support guides](./support/guides.md) | How-to guides |
| [Support resources](./support/resources.md) | Resource index |
| [Brand guidelines](./brand/guidelines.md) | Legacy voice/tone (see [landing alignment](./qa/LANDING_RN_BRAND_ALIGNMENT.md) for current spec) |

## Analytics & marketing

| Doc | Purpose |
|-----|---------|
| [Analytics system](./analytics/system.md) | Engagement analytics |
| [Marketing hub](../marketing/README.md) | Campaign docs |

## Archive (web v1 / historical)

| Doc | Purpose |
|-----|---------|
| [Integration summary](./archive/web-v1/integration-summary.md) | Old integration notes |
| [Bug report](./archive/web-v1/bug-report.md) | Historical triage |
| [Implementation report](./archive/web-v1/implementation-report.md) | Past implementation log |
| [Backend improvements](./archive/web-v1/backend-improvements.md) | Legacy backend notes |
| [Rebranding summary](./archive/rebranding-summary.md) | Rebrand log |

Legacy web code: [`apps/web-legacy/`](../apps/web-legacy/) — see [Legacy reference guide](./team/LEGACY_REFERENCE_GUIDE.md).
