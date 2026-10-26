# Team documentation

**Phase 4 & 5 AI Roadmap:** [`PHASE4_AI_ROADMAP.md`](./PHASE4_AI_ROADMAP.md) — AI recommendation engine, Gemini multimodal vision, stylist architecture, and team work breakdown.
**Phase 4 & 5 Team Tickets:** [`PHASE4_TICKETS.md`](./PHASE4_TICKETS.md) — Per-owner issue breakdown, acceptance criteria, and critical dependency graph.

**Phase 3 this week — reference:** [`PHASE3_NEXT.md`](./PHASE3_NEXT.md) — who does what, done-when, how dispute/payout actually work. Share that page first.

**Start here (older program map):** [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md) → [`PHASE0_STATUS.md`](./PHASE0_STATUS.md) → your member spec (`01`–`04`). Phase 0 cards in the roadmap are historical; current escrow work is [`PHASE3_NEXT.md`](./PHASE3_NEXT.md).

Phase 3 program (remediation → marketplace → escrow → perf → AI). Share with the team.

**Phase 3 escrow / delivery / payments — kickoff (historical):** [`PHASE3_KICKOFF.md`](./PHASE3_KICKOFF.md) — reading order, branches, the original blocker.

**Phase 3 — longer story:** [`PHASE3_TEAM_UPDATE.md`](./PHASE3_TEAM_UPDATE.md) — plain-English explanation. Point people at [`PHASE3_NEXT.md`](./PHASE3_NEXT.md) first; this is optional depth.

**Phase 3 mid-flight — where the code is now:** [`PHASE3_INTEGRATION_STATUS.md`](./PHASE3_INTEGRATION_STATUS.md) — all four tracks are on `zeus` (development; PRs go here). `master` is the release line. §4.0 in that doc is stale on “nothing past paid”; the money path is wired — see [`PHASE3_NEXT.md`](./PHASE3_NEXT.md).

**Wiring an escrow transition?** [`PHASE3_C_CORE_1_HANDOFF.md` § Driving a transition](./PHASE3_C_CORE_1_HANDOFF.md#driving-a-transition--for-shannon-felix-and-brian) — who owns which route, paste-ready endpoint shapes, error mapping.

**Phase 3 supporting docs:**
- [`../architecture/ESCROW_POLICY.md`](../architecture/ESCROW_POLICY.md) — accepted escrow rules (ADR-11): windows, payout rail, fees, refunds, state machine
- [`PHASE3_WORK_SPLIT.md`](./PHASE3_WORK_SPLIT.md) — why each owner, payment procedure, buyer–seller flow
- [`PHASE3_TICKETS.md`](./PHASE3_TICKETS.md) — per-owner tickets with acceptance criteria (maps to go/no-go C7–C15)
- [`PHASE3_C_CORE_1_HANDOFF.md`](./PHASE3_C_CORE_1_HANDOFF.md) — **shipped** schema: order statuses, `payments`, `processed_webhook_events`, `escrowPolicy` config

**John before team go:** [`TEAM_GO_CHECKLIST.md`](./TEAM_GO_CHECKLIST.md) — includes smoke findings (wishlist M2-03/M2-05, M-Pesa M4-13).

Phase 2 member specs and gate docs below remain reference for file zones and tables.

Read in this order:

1. [`../architecture/ADR.md`](../architecture/ADR.md) — locked decisions
2. [`../architecture/BFF_OVERVIEW.md`](../architecture/BFF_OVERVIEW.md) — Express + mobile data flow
3. [`../database/TABLE_SCOPE.md`](../database/TABLE_SCOPE.md) — mobile-v1 vs web-legacy tables
4. [`../api/CONTRACT_MATRIX.md`](../api/CONTRACT_MATRIX.md) — endpoints (source of truth)
5. [`LEGACY_REFERENCE_GUIDE.md`](LEGACY_REFERENCE_GUIDE.md) — how to use archived web v1
6. Your member spec: `00_` (platform lead) or `01_`–`04_`
7. [`PR_CHECKLIST.md`](PR_CHECKLIST.md) — before every PR
8. [`../../apps/mobile/docs/MOCK_DATA_POLICY.md`](../../apps/mobile/docs/MOCK_DATA_POLICY.md) — before touching screens or repositories

**Gate:** Phase 0 platform work — see [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md) (John: platform lead + program owner).

**Distribution:** [`DISTRIBUTION.md`](./DISTRIBUTION.md) — historical Phase 2 kickoff; dev setup still valid.

**Marketplace (Phase 1+):** [`MARKETPLACE_EPIC.md`](./MARKETPLACE_EPIC.md)
