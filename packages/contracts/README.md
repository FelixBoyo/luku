# @luku/contracts

Shared API wire types for Express BFF and mobile clients.

## Rules

- **Wire DTOs only** — no UI/view-model types
- Backend routes and mobile `apiClient` import from here
- Mobile repositories map DTOs → domain types in `apps/mobile/src/adapters/`
- Breaking changes require a new `/v2/api/` version

## Layout

```
src/
  envelope.ts    # ApiResponse, Pagination, ErrorCode
  auth.ts
  products.ts
  ai/            # task-based AI (not Gemini SDK shapes)
  index.ts
```
