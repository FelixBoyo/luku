# Phase 3 kickoff — escrow, delivery, payments

**Status:** Ready to start · **Policy:** [`../architecture/ESCROW_POLICY.md`](../architecture/ESCROW_POLICY.md) (ADR-11, accepted) · **Gate:** [`PHASE3_GO_NO_GO.md`](./PHASE3_GO_NO_GO.md) C1 accepted

Phase 3 is a go: the escrow policy is locked, so we can build. This doc is the single hand-off — reading order, branches, the one blocker, and a message you can paste to the team.

---

## Reading order (all members)

Most-specific last. Read your track before writing code.

| Order | Doc | Why |
|-------|-----|-----|
| 1 | [`../architecture/ESCROW_POLICY.md`](../architecture/ESCROW_POLICY.md) | The accepted rules everyone builds against (D1–D11, state machine, config) |
| 2 | [`PHASE3_WORK_SPLIT.md`](./PHASE3_WORK_SPLIT.md) | Your track + how buyer / seller / money flow |
| 3 | [`PHASE3_TICKETS.md`](./PHASE3_TICKETS.md) | Your actual tickets + acceptance criteria (the "done" bar) |
| 4 | [`PHASE3_GO_NO_GO.md`](./PHASE3_GO_NO_GO.md) | The C1–C15 gates you're graded against |

---

## The one blocker — cleared (2026-07-28)

**`C-CORE-1` has shipped.** Read [`PHASE3_C_CORE_1_HANDOFF.md`](./PHASE3_C_CORE_1_HANDOFF.md) for the exact statuses, columns, tables, and config module, then apply [`012_escrow_orders.sql`](../../database/migrations/012_escrow_orders.sql) to your dev DB. No stubs needed — code against the real names.

**Paystack KYC is also complete** and the account is live, so real M-Pesa STK works. Still open: confirming **Transfers** enablement before `C-CORE-4` moves real payouts, and registering the webhook URL (needs a deployed API — polling covers checkout until then).

---

## Branches

These are the branches as they actually exist on the remote. Two drifted from
what this doc originally planned; the doc was corrected rather than the
branches renamed, since renaming breaks local refs and open PRs.

| Member | Track | Branch |
|--------|-------|--------|
| John | Data foundation + reconciliation | `feature/phase3-order-schema` — **the integration branch** |
| Shannon | Payment truth + buyer escrow | `escro-buyer-Shannon` |
| Felix | Seller + money movement (payout, refunds) | `phase3-seller-payout` (no `feature/` prefix) |
| Brian | Notifications, timers + surfacing | `feature/phase3-notify-surfacing` |

Cut from `zeus` and PR **into `zeus`**. `master` is the release line (John
promotes `zeus` → `master`). One member zone per PR; follow [`PR_CHECKLIST.md`](./PR_CHECKLIST.md).

All four tracks have landed on `zeus` (and been promoted onto `master` once).
For where each track stands now, read [`PHASE3_INTEGRATION_STATUS.md`](./PHASE3_INTEGRATION_STATUS.md)
rather than this doc — this one is the historical kickoff.

---

## Kickoff agenda (30 min)

1. Walk the **state-machine diagram** in `ESCROW_POLICY.md` once — statuses, who can drive each transition, timers.
2. Confirm **C-CORE-1 lands first**; everyone builds against the schema stub until then.
3. Each member confirms their tickets + branch from `PHASE3_TICKETS.md`.
4. Confirm the **single-writer** rule (only the payment webhook sets `paid`) and **config** rule (no hardcoded windows/rate — import `escrowPolicy`).
5. Q&A per track.

---

## Definition of done (phase)

All **Section C** gates in [`PHASE3_GO_NO_GO.md`](./PHASE3_GO_NO_GO.md) (C1–C15) pass, and the escrow happy path + refund path demo end-to-end. Re-run go/no-go Section A before sign-off.

---

## Related

- Dev setup (still valid): [`DISTRIBUTION.md`](./DISTRIBUTION.md#dev-setup-shared)
- Program roadmap: [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md) § Phase 3
- M-Pesa test vs live: [`../payments/mpesa-kenya-troubleshooting.md`](../payments/mpesa-kenya-troubleshooting.md)
