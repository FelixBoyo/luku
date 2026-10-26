# npm audit HIGH/CRITICAL Triage

Last run: 2026-05-04  
Command: `npm audit --json`  
Current summary: **HIGH: 5, CRITICAL: 0**

## Triage Register

| Package | Severity | Direct? | Proposed action | Owner | Target date | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `rollup` | HIGH | No | Upgrade via Vite chain updates; verify lockfile resolves to patched range | FE Platform | 2026-05-11 | Open |
| `picomatch` | HIGH | No | Update transitive resolver by refreshing dependent packages and lockfile | FE Platform | 2026-05-11 | Open |
| `path-to-regexp` | HIGH | No | Update transitive dependency; verify no vulnerable range in lock | FE Platform | 2026-05-11 | Open |
| `flatted` | HIGH | No | Refresh transitive package set to patched `>3.4.1` | FE Platform | 2026-05-11 | Open |
| `jws` | HIGH | No | Upgrade dependent chain using `jws` and validate signature logic unaffected | Backend Platform | 2026-05-11 | Open |

## Actions completed in this hard pass

- Upgraded direct `vite` dependency to `^7.1.10` (removed previous direct HIGH finding).
- Re-ran `npm audit` and captured remaining HIGH-only transitive findings.

## Notes and constraints

- Dependency updates currently require `--legacy-peer-deps` because of peer mismatch between current `@reduxjs/toolkit` version and React 19 in this repo.
- No CRITICAL vulnerabilities are currently reported.
- Keep payment business logic unchanged while updating dependencies.
