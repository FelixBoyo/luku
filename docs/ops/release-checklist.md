# Release Checklist (Draft)

This checklist is for predictable releases with current web scope and future mobile scope.

## 1) Pre-flight (all releases)

- [ ] Confirm required env vars are present for target environment (`docs/ops/env.md`).
- [ ] Confirm no secrets are in diff, logs, or documentation.
- [ ] CI is green: typecheck, lint (if configured), tests, and build.
- [ ] Verify payment mode configuration is consistent (`PAYMENTS_ENV_MODE` vs keys).

## 2) Web release (today)

- [ ] Run `npm ci`.
- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Smoke test key web flows:
  - [ ] Sign in / session flow
  - [ ] Checkout flow
  - [ ] Paystack card path
  - [ ] M-Pesa path (where enabled)
- [ ] Verify backend responses return `x-request-id`.
- [ ] Verify webhook endpoint rejects invalid signatures.

## 3) Post-release checks

- [ ] Watch error logs for payment/API spikes.
- [ ] Use request id to trace and triage failed requests.
- [ ] Record incidents and rollback decision if needed.

## 4) Mobile release (later)

- [ ] Reuse backend pre-flight and post-release checks above.
- [ ] Add mobile-specific QA matrix (devices/OS versions).
- [ ] Add signing and store submission gates.
- [ ] Validate mobile app does not embed server-only secrets.

## Scope options (if uncertain)

- Option A: add a staging promotion gate with explicit sign-off.
- Option B: add a release notes template and semantic versioning rules.
- Option C: add a rollback runbook with owner and SLA fields.
