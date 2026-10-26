# Redux + Express discovery prompt

Copy everything inside the fenced block below into a Cursor (or other AI) chat opened on your **reference project** — the codebase where Redux and Express with bearer auth are already working.

The agent should output a single markdown file. Save it as `REDUX_EXPRESS_ARCHITECTURE.md` and copy into LUKU at `apps/mobile/docs/REDUX_EXPRESS_ARCHITECTURE.md`.

---

## Prompt (copy from here)

```
You are documenting an existing codebase's Redux and Express.js architecture for porting to another project (LUKU mobile, React Native / Expo).

## Your task

1. **Read the actual codebase** — search and open files. Do not write generic tutorials or guess patterns.
2. **Produce one markdown document** named `REDUX_EXPRESS_ARCHITECTURE.md`.
3. Include **real file paths** and **short code citations** (5–15 lines) for every major claim.
4. Use **tables** and **mermaid diagrams** where they clarify flows.
5. **Redact** any real API keys, secrets, or tokens in examples (use placeholders like `sk_test_xxx`).
6. Do **not** modify application code unless you hit a broken file path you cannot resolve — prefer documenting what exists.

## Required sections in REDUX_EXPRESS_ARCHITECTURE.md

### 1. Overview

- Project name and repo layout (monorepo vs single app)
- Package versions: `@reduxjs/toolkit`, `react-redux`, `express`, auth libraries (JWT, Passport, Supabase, etc.)
- How frontend and backend connect in **development** vs **production** (Vite/webpack proxy, `API_BASE_URL`, env var names)

### 2. Redux — store setup

Document with file paths:

- Where `configureStore` lives and every registered reducer
- Typed hooks (`useAppDispatch`, `useAppSelector`) — or untyped if not used
- Where `<Provider store={store}>` is mounted in the React tree
- RTK Query vs plain `createAsyncThunk` — which is used and for what
- Any middleware (logger, listener, serializable check overrides)

### 3. Redux — how API calls work

This is the most important section. Trace the full pattern:

- **Who calls HTTP:** slice thunks, `services/` modules, RTK Query `baseQuery`, axios instance, etc.
- **Request flow** — include a mermaid sequence diagram:

  Component → dispatch → thunk/query → HTTP client → Express route → response → reducer

- **Base URL:** env variable names (`VITE_*`, `REACT_APP_*`, etc.) and dev proxy config if any
- **Authorization header:** exactly how `Authorization: Bearer <token>` is attached
  - Interceptor? Wrapper `fetch`? `prepareHeaders` in RTK Query? Manual per-call?
  - Show the code that reads the token and sets the header
- **Error handling:** `rejectWithValue`, global error slice, toast, automatic 401 logout / refresh
- **Loading state:** per-slice `loading` / `status` vs RTK Query tags
- **Worked example:** pick one real endpoint (e.g. login, GET /users/me, POST /orders) and trace it end-to-end with file paths at each step

### 4. Auth — token lifecycle

- **Login flow:** UI → Redux action/thunk → Express route → response shape (access token, refresh token, user object)
- **Where tokens are stored:**
  - `localStorage` / `sessionStorage` / `httpOnly` cookie / SecureStore / memory-only
  - Exact keys or cookie names
  - Show read/write code
- **Access vs refresh tokens:** if used, document refresh strategy, rotation, and expiry handling
- **Hydration on app load:** how session is restored before first authenticated render (e.g. `checkSession` thunk on mount)
- **Logout:** what is cleared client-side; any server revoke endpoint
- **Protected route gating:** how the app decides logged-in vs logged-out (selector, route guard, HOC)
- **Auth provider:** custom JWT, Supabase session, OAuth — document whichever this project uses

### 5. Express — server structure

- Entry file (`server.ts`, `app.ts`, `index.ts`), port, npm scripts
- Middleware **order** (list in sequence): cors → body parser → request id → auth → routes → error handler
- Route organization: inline handlers vs `Router()` per domain vs controller layer
- Where business logic lives vs thin route handlers
- How handlers are imported (shared `api/` folder pattern, etc.)

### 6. Express — security

Document concretely:

- **Bearer auth middleware:** file path, function name, how token is extracted (`Authorization` header format)
- **Token verification:** JWT `verify` with secret, Supabase `auth.getUser`, introspection endpoint, etc.
- **Public vs protected routes:** table of route prefixes and which middleware applies
- **CORS:** allowed origins, `credentials: true` or not
- **Rate limiting:** library, windows, which routes
- **Input validation:** zod/joi/custom — show one validated route example
- **Secrets:** which env vars hold secrets; log redaction if any
- **Webhook verification:** signature headers (e.g. Stripe, Paystack) if present
- **Gaps:** honestly list routes or flows that are NOT secured today

### 7. Environment variables

Table format:

| Variable | Used by | Purpose | Example (no real secrets) |

Include frontend and backend vars related to API URL, auth secrets, CORS, and third-party keys.

### 8. Directory map

ASCII or bullet tree of the key folders:

- `store/` or `src/store/`
- `slices/` or feature folders
- `services/` or `api/` client layer
- `backend/` or `server/`
- middleware, validation, error helpers

### 9. Porting checklist for LUKU mobile (React Native / Expo)

Add a final section with adaptations needed when replicating in Expo:

| Web pattern | Mobile equivalent |
|-------------|-------------------|
| `localStorage` for tokens | `@react-native-async-storage/async-storage` |
| Vite dev proxy `/api` → localhost | `EXPO_PUBLIC_API_BASE_URL` (absolute URL; use LAN IP on device) |
| `import.meta.env.VITE_*` | `process.env.EXPO_PUBLIC_*` via `app.config.ts` `extra` |
| Redux versions | Align to `@reduxjs/toolkit@2.2.6`, `react-redux@9.1.2` |
| Cookie-based auth | May need header-only bearer on mobile |

List what maps 1:1 vs what needs redesign.

### 10. Recommended migration order for LUKU

Suggest an order for introducing Redux + API into a React Native app that today uses:

- `AppStateContext` for cart, wishlist, wardrobe
- `repositories/` with mock/Supabase swap
- Supabase auth in `App.tsx` (not Redux yet)

Example order: auth slice → api client → cart/wishlist slices → domain slices per Phase 2 wave.

## Output format rules

- Single markdown file only: `REDUX_EXPRESS_ARCHITECTURE.md`
- Start with: `> Extracted from: [project name] on [date]`
- No emojis
- Prefer completeness over brevity — this doc will be the blueprint for a team

Begin by listing the top 10 files you will read, then produce the full document.
```

---

## After running the prompt

1. Save the agent output as `REDUX_EXPRESS_ARCHITECTURE.md`.
2. Copy into this repo: `apps/mobile/docs/REDUX_EXPRESS_ARCHITECTURE.md` (replace the placeholder).
3. Review section 6 (security) and section 4 (token storage) before distributing Phase 2 specs.
4. Link the ported doc from member specs via [`PHASE2_SPEC_TEMPLATE.md`](PHASE2_SPEC_TEMPLATE.md).
