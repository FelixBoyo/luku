> Extracted from: **apis-riziki** (RIZIKI FinTech SACCO admin) on **2026-06-10**

Blueprint for porting Redux + Express bearer/cookie auth patterns to LUKU mobile (React Native / Expo).

---

## Top 10 reference files

1. `app/redux/store.ts` — store, reducers, preloaded auth state
2. `app/redux/utils/apiClient.ts` — fetch wrapper, 401/403 handling
3. `app/redux/utils/helpers.ts` — custom async thunk helper
4. `app/redux/middleware/auth/login.ts` — login thunk + localStorage
5. `app/redux/providers.tsx` — Redux Provider mount
6. `app/hooks/useAuthSync.ts` — session hydration on load
7. `app/components/auth/ProtectedRoute.tsx` — route gating
8. `app.ts` — Express + Next.js combined server
9. `apis/app.ts` — API router, middleware order, route mounts
10. `apis/middleware/auth.ts` — JWT, cookies, refresh, `verifyToken`

---

## 1. Overview

### Project name and layout

| Aspect | Detail |
|--------|--------|
| Package name | `apis-riziki` |
| Layout | **Single-repo, dual-layer app** — Next.js 14 frontend in `app/` + Express API in `apis/`, served from **one Node process** |
| Not a Turborepo/Nx monorepo | One `package.json` at repo root |
| Frontend | Next.js App Router (`app/`) |
| Backend | Express 4 mounted at `/api` via `apis/app.ts` |
| Database | Prisma + PostgreSQL (`apis/DBPrisma/`) |

### Package versions (from `package.json`)

| Package | Version |
|---------|---------|
| `@reduxjs/toolkit` | `^2.8.2` |
| `react-redux` | `^9.2.0` |
| `express` | `^4.18.2` |
| `jsonwebtoken` | `^9.0.0` |
| `cookie-parser` | `^1.4.7` |
| `express-rate-limit` | `^7.5.0` |
| `express-validator` | `^7.0.1` |
| `helmet` | `^8.1.0` |
| `next` | `^14.1.0` |
| Auth provider | **Custom JWT** (not Supabase/Passport) |

### Dev vs production connection

There is **no Vite/webpack dev proxy**. Frontend and API share the same origin.

| Environment | How they connect |
|-------------|------------------|
| **Development** | `npm run dev` → `tsx watch server.ts` → Express + Next on `http://localhost:3000`. Frontend calls **relative** paths like `/api/transactions/groups/:id`. |
| **Production** | `npm run build:all` then `npm start` → compiled `dist/server.js`. Same relative `/api/*` URLs. HTTPS enforced via `x-forwarded-proto` in `app.ts`. |

**Env vars for URLs:**

- `PORT`, `HOST` — server bind (default `3000`, `0.0.0.0`)
- `API_BASE_URL` — documented in `.env.example` for ops/docs; **web Redux client does not use it**
- `FRONTEND_URL`, `ALLOWED_ORIGINS` — CORS (comma-separated)
- `NEXT_PUBLIC_*` — branding only (`NEXT_PUBLIC_PLATFORM_NAME`, etc.), not API base URL

No Next.js `rewrites` — API is mounted directly on the same Express app:

```47:52:app.ts
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // API routes.
  app.use('/api', apiRouter);
```

---

## 2. Redux — store setup

### `configureStore` location and reducers

**File:** `app/redux/store.ts`

| Reducer key | Source | Domain |
|-------------|--------|--------|
| `login` | `app/redux/reducers/auth/login.ts` | Auth session / user display |
| `logout` | `app/redux/reducers/auth/logout.ts` | Logout in-flight state |
| `register` | `app/redux/reducers/auth/register.ts` | Group registration |
| `transactions` | `app/redux/reducers/transactions/transactions.ts` | Group transaction feed |
| `requests` | `app/redux/reducers/requests/requests.ts` | Join/loan/withdrawal requests |
| `members` | `app/redux/reducers/members/members.ts` | Group members |
| `admin` | `app/redux/reducers/admin/admin.ts` | Platform admin dashboards |

```66:77:app/redux/store.ts
const store = configureStore({
    reducer: {
        login: loginReducer,
        logout: logoutReducer,
        register: registerReducer,
        transactions: transactionsReducer,
        requests: requestsReducer,
        members: membersReducer,
        admin: adminReducer,
    },
    preloadedState,
});
```

### Typed hooks

**Partial typing only.** `AppDispatch` and `RootState` are exported; there are **no** `useAppDispatch` / `useAppSelector` wrapper files.

```79:81:app/redux/store.ts
export type AppDispatch = typeof store.dispatch;
export type RootState = typeof store.getState>;
```

Usage pattern (inline):

```typescript
const dispatch = useDispatch<AppDispatch>();
const loginState = useSelector((state: RootState) => state.login);
```

### Provider mount

```8:15:app/redux/providers.tsx
export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <Provider store={store}>
                <AuthSyncWrapper>{children}</AuthSyncWrapper>
            </Provider>
        </ThemeProvider>
    );
}
```

Mounted in root layout:

```26:30:app/layout.tsx
                <Providers>
                    <NotificationProvider>
                        <HoveredUrlProvider>{children}</HoveredUrlProvider>
                    </NotificationProvider>
                </Providers>
```

### RTK Query vs thunks

| Pattern | Used? | Notes |
|---------|-------|-------|
| RTK Query (`createApi`) | **No** | Not present in codebase |
| `createAsyncThunk` | **No** | Not used |
| Custom `createAsyncAction` | **Yes** | All async flows |
| Plain reducers + string action types | **Yes** | Manual `REQUEST/SUCCESS/FAILURE` |

Folder naming: thunks live under `app/redux/middleware/` (historical naming — they are **thunk creators**, not Redux middleware).

### Middleware / store config

- **No custom Redux middleware** (no logger, listener, serializable check overrides)
- Default RTK middleware only
- **Preloaded state:** reads `localStorage.user` for display hydration, but sets `isSuccess: false` until server confirms session

```40:48:app/redux/store.ts
        return {
            isLoading: false,
            // Do not mark authenticated from localStorage alone; server session must confirm.
            isSuccess: false,
            isError: false,
            error: null,
            user: groupUser,
            token: null,
        };
```

---

## 3. Redux — how API calls work

### Who calls HTTP

| Layer | Path | Role |
|-------|------|------|
| Thunks | `app/redux/middleware/**/*.ts` | Domain API calls via `createAsyncAction` |
| HTTP client | `app/redux/utils/apiClient.ts` | `fetch` wrapper (`apiGet`, `apiPost`, etc.) |
| Response helpers | `app/redux/utils/responseData.ts` | Unwrap envelope / list shapes |
| Components (occasional) | e.g. `app/dashboard/page.tsx` | Direct `apiGet` for one-off reads |

### Request flow

```mermaid
sequenceDiagram
    participant C as React Component
    participant D as dispatch (createAsyncAction)
    participant T as Thunk (middleware/*.ts)
    participant A as apiClient (fetch)
    participant E as Express /api route
    participant R as Reducer

    C->>D: dispatch(fetchTransactions(groupId))
    D->>D: { type: FETCH.REQUEST }
    D->>R: isLoading = true
    T->>A: apiGetList('/api/transactions/groups/:id')
    A->>E: GET + credentials:include (cookie JWT)
    E->>E: verifyToken → checkRole → handler
    E-->>A: JSON envelope { success, data, ... }
    A->>A: handleAuthError on 401/403
    D->>D: { type: FETCH.SUCCESS, payload }
    D->>R: isLoading=false, data=payload
    C->>C: useSelector reads updated state
```

### Base URL

| Client | Base URL strategy |
|--------|-------------------|
| Web (this project) | **Relative** `/api/...` — same origin, no env prefix |
| No `VITE_*` / `REACT_APP_*` | N/A (Next.js, not CRA/Vite) |
| Mobile (per API contract docs) | Expected to use **absolute URL + Bearer** |

### Authorization header

**Web client: cookie-based, not Bearer.**

```64:68:app/redux/utils/apiClient.ts
        const options: RequestInit = {
            method,
            headers,
            credentials: 'include',
        };
```

- JWT access token is set as **httpOnly cookie** `token` by the server
- Refresh token is **httpOnly cookie** `refreshToken`
- Web **does not** attach `Authorization: Bearer ...` on API calls
- Login response token is **stripped** before localStorage write:

```19:23:app/redux/middleware/auth/login.ts
        // Save display data for UI (JWT is httpOnly cookie — not stored client-side)
        if (response?.data) {
            const { token: _omit, ...userForStorage } = response.data;
            localStorage.setItem('user', JSON.stringify(userForStorage));
        }
```

**Server accepts both cookie and Bearer** (mobile path):

```245:246:apis/middleware/auth.ts
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
```

### Error handling

| Mechanism | Behavior |
|-----------|----------|
| `apiClient.handleAuthError` | **401** → dispatch `{ type: 'LOGOUT' }`, redirect to `/auth/login` |
| | **403** → dispatch `AUTH/FORBIDDEN`, redirect to `/forbidden` |
| Thunk `createAsyncAction` | Catches errors → `{ type: FAILURE, error: err.message }` |
| Toasts | `NotificationContext` in auth pages (login/register), not global in apiClient |
| Token refresh | `useAuthSync` + `ProtectedRoute` call `POST /api/auth/refresh`; `authClient.refreshAuthToken()` dedupes concurrent refreshes |

### Loading state

Per-slice flags: `isLoading`, `isSuccess`, `isError`, `error` — no RTK Query tags.

Example (`transactions`):

```24:38:app/redux/reducers/transactions/transactions.ts
        case transactionsActions.FETCH.REQUEST:
            return {
                ...state,
                isLoading: true,
                isSuccess: false,
                isError: false,
                error: null,
            };
        case transactionsActions.FETCH.SUCCESS:
            return {
                ...state,
                isLoading: false,
                isSuccess: true,
                data: action.payload,
            };
```

### Worked example: Group login end-to-end

| Step | File | What happens |
|------|------|----------------|
| 1. UI | `app/auth/login/page.tsx` | `useAuth().login(email, password)` |
| 2. Hook | `app/hooks/useAuth.ts` | `dispatch(loginUser({ email, password }))` |
| 3. Thunk | `app/redux/middleware/auth/login.ts` | `apiPost('/api/auth/groups/login', ...)` |
| 4. HTTP | `app/redux/utils/apiClient.ts` | `fetch` with `credentials: 'include'` |
| 5. Route | `apis/routes/auth/group/groupRoutes.ts` | `POST /login` → validate → verify password |
| 6. Auth | `apis/middleware/auth.ts` | `generateToken`, `setAuthCookie`, `generateRefreshToken` |
| 7. Response | Same route | `{ token, group: { id, email, role, name } }` in envelope |
| 8. Thunk | login middleware | Strip `token`, save rest to `localStorage.user` |
| 9. Reducer | `app/redux/reducers/auth/login.ts` | `LOGIN.SUCCESS` → `user`, `isSuccess: true` |
| 10. UI | login page | Redirect by role (`/admin` vs `/dashboard`) |

Server login handler:

```210:228:apis/routes/auth/group/groupRoutes.ts
    const token = generateToken(groupData, 'group');
    setAuthCookie(res, token);
    await generateRefreshToken(res, groupData, 'group');

    return res.status(200).json(
      createResponse(
        {
          token,
          group: {
            id: groupData.groupid,
            email: groupData.groupemail,
            role: groupData.grouprole,
            name: groupData.groupname
          }
        },
        'Login successful',
        'success',
        200
      )
    );
```

### Worked example: Fetch transactions

| Step | File |
|------|------|
| Component | `app/dashboard/page.tsx` → `dispatch(fetchTransactions(groupId))` |
| Thunk | `app/redux/middleware/transactions/transactions.ts` |
| HTTP | `apiGetList('/api/transactions/groups/${groupid}')` |
| Express mount | `apis/app.ts` → `verifyToken` → `checkRole` → `transactionsRouter` |
| Handler | `apis/routes/transactions/transactions.ts` → `requireScopeAccess('group')` |
| Reducer | `app/redux/reducers/transactions/transactions.ts` |

---

## 3.5 API response contract (envelope)

### Canonical envelope

Every Express handler returns JSON via **`createResponse`** (success or route-level errors) or **`createErrorResponse`** (validation / global handler). Contract is documented in `docs/api-contract-matrix.md` and implemented in `apis/helpers/responseHelpers.ts`.

#### Success response shape

| Field | Type | Meaning |
|-------|------|---------|
| `success` | `boolean` | `true` when `status !== 'error'` and `code < 400` |
| `status` | `string` | Usually `'success'` |
| `code` | `number` | HTTP-style status — **also set on HTTP status line** |
| `errorCode` | `string \| null` | Machine-readable code; `null` on success |
| `message` | `string` | Human-readable summary |
| `error` | `string \| null` | `null` on success; on failure equals `message` |
| `data` | `unknown` | Payload (object, array, or `null`) |
| `timestamp` | `string` | ISO-8601 |

```25:42:apis/helpers/responseHelpers.ts
export const createResponse = (
  data: unknown,
  message = '',
  status = 'success',
  code = 200,
  errorCode: ErrorCode | null = null
): ApiResponse => {
  const isSuccess = status !== 'error' && code < 400;
  return {
    success: isSuccess,
    status,
    code,
    errorCode: isSuccess ? null : (errorCode || 'UNKNOWN_ERROR'),
    message,
    error: isSuccess ? null : message || 'Request failed',
    data,
    timestamp: new Date().toISOString()
  };
};
```

**Example — group login success:**

```json
{
  "success": true,
  "status": "success",
  "code": 200,
  "errorCode": null,
  "message": "Login successful",
  "error": null,
  "data": {
    "token": "eyJ...",
    "group": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin",
      "name": "My SACCO"
    }
  },
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

#### Error response shapes (two variants)

**Variant A — route handlers via `createResponse(..., 'error', 4xx/5xx)`**

Same top-level fields as success, but `success: false`, `data: null`, `error` populated.

**Variant B — validation / global handler via `createErrorResponse`**

Adds an **`errors`** array (express-validator field errors):

| Field | Extra vs success |
|-------|------------------|
| `errors` | `unknown[]` — validation details when present |
| `errorCode` | Always set (e.g. `VALIDATION_FAILED`) |

```45:60:apis/helpers/responseHelpers.ts
export const createErrorResponse = (
  message: string,
  code = 500,
  errors: unknown[] = [],
  errorCode: ErrorCode = 'UNKNOWN_ERROR'
): ErrorResponse => {
  return {
    success: false,
    status: 'error',
    code,
    errorCode,
    message,
    error: message,
    errors,
    timestamp: new Date().toISOString()
  };
};
```

Validation middleware:

```6:19:apis/middleware/requestValidation.ts
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const firstError = errors.array()[0] as { msg?: string } | undefined;
  return res.status(400).json(
    createErrorResponse(firstError?.msg || 'Validation failed', 400, errors.array(), ERROR_CODES.VALIDATION_FAILED)
  );
};
```

#### Machine-readable error codes

Defined in `apis/helpers/errorCodes.ts`:

| Code | Typical use |
|------|-------------|
| `VALIDATION_FAILED` | 400 from express-validator |
| `ROUTE_NOT_FOUND` | 404 unmatched API route |
| `AUTH_UNAUTHORIZED` / `AUTH_FORBIDDEN` / `AUTH_TOKEN_EXPIRED` | Auth |
| `WEBHOOK_INVALID_SIGNATURE` | IntaSend webhook |
| `PROVIDER_TIMEOUT` / `PROVIDER_RETRY_EXHAUSTED` | Payment/SMS providers |
| `PAYOUT_METHOD_*` | Payout CRUD |
| `UNKNOWN_ERROR` | Default fallback |

### List payload shape (paginated endpoints)

Standard list responses nest rows under **`data.items`** with **`data.pagination`**:

```634:649:apis/models/CRUDAPIModel.ts
      const payload = {
        items: responseData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      const response = createResponse(
        payload,
        `${table} retrieved successfully.`,
        'success',
        200
      );
```

Query params (via `validatePaginationQuery`):

| Param | Rules |
|-------|-------|
| `page` | int ≥ 1 |
| `limit` | int 1–100 |
| `q` | search string, max 120 chars |
| `sortBy` | string, max 64 chars |
| `sortOrder` | `'asc'` \| `'desc'` |

Transaction feed uses the same `items` + `pagination` shape (merged in memory, not DB-paged):

```100:114:apis/routes/transactions/transactions.ts
    return res.status(200).json(
      createResponse(
        {
          items: paged,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        'transactions retrieved successfully.',
        'success',
        200
      )
    );
```

### HTTP status vs envelope

| Layer | Behavior |
|-------|----------|
| HTTP status | Set on `res.status(code)` — **authoritative for `fetch` `response.ok`** |
| Envelope `code` | Mirrors HTTP status in well-behaved routes |
| `apiClient` | Treats **`!response.ok`** as failure; appends `errorBody.message` to thrown `Error` |
| Thunk | Catches thrown error → `FAILURE` with `error: err.message` (string, not full envelope) |

On success, `apiClient` returns the **full parsed JSON envelope**:

```90:90:app/redux/utils/apiClient.ts
        return (await response.json()) as ApiResponse<T>;
```

---

## 4. Auth — token lifecycle

### Login flows

| Actor | Endpoint | Body keys | Response `data` |
|-------|----------|-----------|-----------------|
| Group (web admin) | `POST /api/auth/groups/login` | `groupemail`, `password` | `{ token, group: { id, email, role, name } }` |
| User (member/mobile) | `POST /api/auth/users/login` | `useremail`, `password` | `{ token, user: { id, email, role } }` |

Both set httpOnly cookies and return token in JSON (for mobile Bearer use).

### Where tokens are stored

| Storage | Key | Contents | Read/write |
|---------|-----|----------|------------|
| **httpOnly cookie** | `token` | JWT access (15 min) | Server `setAuthCookie` / `clearAuthCookie` |
| **httpOnly cookie** | `refreshToken` | Opaque refresh (7 days, hashed in DB) | Server `generateRefreshToken` |
| **localStorage** | `user` | Display profile (`group` or `user` object, **no JWT**) | Login thunk write; logout/remove on 401 |
| **localStorage** | `group` | Registration staging data | Register thunk only |
| **localStorage** | `userType` | `'group'` after registration | Register thunk |
| **sessionStorage** | `auth-last-validated-at` | Timestamp for refresh debounce | `ProtectedRoute` |

Cookie settings:

```47:54:apis/middleware/auth.ts
export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });
};
```

### Access vs refresh tokens

| Token | Lifetime | Storage | Rotation |
|-------|----------|---------|----------|
| Access JWT | 15 minutes | Cookie (+ optional Bearer) | Reissued on refresh |
| Refresh | 7 days | Cookie + DB hash | **Rotated** on each refresh; old revoked; replay detection revokes family |

Refresh endpoint: `POST /api/auth/refresh` (public route, requires `refreshToken` cookie).

Client-side deduped refresh:

```8:16:app/utils/authClient.ts
export async function refreshAuthToken(): Promise<Response> {
    if (globalRefreshPromise) {
        return await globalRefreshPromise;
    }

    globalRefreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
    });
```

### Hydration on app load

1. `AuthSyncWrapper` → `useAuthSync` on mount
2. If `localStorage.user` exists → `POST /api/auth/refresh` with cookies
3. Success → `LOGIN.SUCCESS` with cached group/user
4. Failure → clear `localStorage`, `LOGIN.RESET`

```26:42:app/hooks/useAuthSync.ts
                    const response = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });

                    if (!response.ok) {
                        localStorage.removeItem('user');
                        dispatch({ type: loginActions.LOGIN.RESET });
                        return;
                    }

                    dispatch({
                        type: loginActions.LOGIN.SUCCESS,
                        payload: {
                            group: groupUser,
                        },
                    });
```

### Logout

| Step | Detail |
|------|--------|
| Client thunk | `logoutGroup()` or `logoutUser()` → `POST /api/auth/groups/logout` or `.../users/logout` |
| Server | Revoke refresh token family, `clearAuthCookie` |
| Client | `localStorage.removeItem('user')`, `LOGIN.RESET`, redirect `/auth/login` |

### Protected route gating

**Component:** `app/components/auth/ProtectedRoute.tsx`

- Checks `localStorage.user` (UI gate)
- Role-based path access via `app/utils/accessPolicy.ts`
- Revalidates session every 60s via `/api/auth/refresh`
- Used on dashboard/admin pages (e.g. `app/dashboard/page.tsx`)

**Not a server-side Next.js middleware** — client-side only.

### Auth provider summary

**Custom JWT** with `jsonwebtoken`, Prisma-backed refresh tokens, role checks (`admin`, `user`, `platform_admin`). No Supabase/OAuth in this stack.

---

## 5. Express — server structure

### Entry files and scripts

| File | Role |
|------|------|
| `server.ts` | Listens on `PORT` / `HOST` |
| `app.ts` | Express + Next.js hybrid app |
| `apis/app.ts` | API sub-router mounted at `/api` |

```7:13:server.ts
import app from './app.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.info(`Server is running on http://${host}:${port}`);
```

| Script | Command |
|--------|---------|
| `npm run dev` / `start:dev` | `tsx watch server.ts` |
| `npm start` | `node dist/server.js` |
| `npm run build:api` | Compile API TypeScript |

### Middleware order

**Outer app (`app.ts`):**

1. Trust proxy
2. HTTPS redirect (production)
3. CORS
4. `cookieParser`
5. Body parsers
6. `/api` → `apiRouter`
7. Next.js catch-all

**API router (`apis/app.ts`):**

| Order | Middleware |
|-------|------------|
| 1 | Request ID (`x-request-id`) |
| 2 | Helmet (CSP, HSTS, frameguard) |
| 3 | Global rate limit (100 / 15 min) |
| 4 | `express.json` (+ raw body capture for webhooks) |
| 5 | `express.urlencoded` |
| 6 | `requestLogger` (Winston) |
| 7 | Swagger (non-production only) |
| 8 | Public routes |
| 9 | Protected routes (`verifyToken`, role checks) |
| 10 | Webhooks (signature verified) |
| 11 | 404 handler |
| 12 | `errorHandler` |

### Route organization

```
apis/routes.ts          → barrel exports
apis/routes/auth/       → public + protected auth routers
apis/routes/transactions/
apis/routes/requests/
apis/routes/admin/
apis/routes/webhooks/
apis/routes/intasend/
```

Pattern: **`express.Router()` per domain**, inline async handlers, shared **`CRUDAPIModel`** for CRUD, helpers in `apis/helpers/`, extra middleware on sub-routes (`requireScopeAccess`, `requireActiveGroup`, `validateAmountFields`).

### Business logic placement

- **Thin route handlers** calling Prisma via `session` / `CRUDAPIModel`
- **Helpers:** `apis/helpers/groupPolicy.ts`, `mergedTransactionSemantics.ts`, `payoutMethods.ts`, etc.
- **Middleware:** auth, roles, scope, onboarding, financial validation

---

## 6. Express — security

### Bearer auth middleware

**File:** `apis/middleware/auth.ts`  
**Function:** `verifyToken`

- Extracts: `req.cookies.token` **or** `Authorization: Bearer <token>` (second segment after split)
- Verifies with `jwt.verify(token, JWT_SECRET)`
- Loads user/group from Prisma; attaches `req.user`, `req.userType`
- Invalidates token if issued before `lastpasswordchange`

### Public vs protected routes

| Prefix | Auth | Role / extra |
|--------|------|--------------|
| `GET /api/health` | Public | — |
| `POST /api/auth/users/*` (register, login) | Public | `authLimiter` |
| `POST /api/auth/groups/*` (register, login) | Public | `authLimiter` |
| `POST /api/auth/refresh` | Public | Requires refresh cookie |
| `/api/auth/*` (protected sub-router) | `verifyToken` | Per-route |
| `/api/transactions/*` | `verifyToken` | `checkRole(['admin','user','platform_admin'])` + scope |
| `/api/requests/*` | `verifyToken` | Same + onboarding/scope on writes |
| `/api/payment/*` | `verifyToken` | + `paymentWriteLimiter` |
| `/api/sms/*` | `verifyToken` | `checkRole(['admin'])` |
| `/api/admin/*` | `verifyToken` | `checkPlatformRole(['platform_admin'])` |
| `GET /api/health/details` | `verifyToken` | Platform admin |
| `POST /api/webhooks/intasend` | Public | HMAC signature |

### CORS

```37:44:app.ts
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
```

`credentials: true` — required for cookie auth on web.

### Rate limiting

| Limiter | Window | Max (default) | Applies to |
|---------|--------|---------------|------------|
| Global | 15 min | 100 | All `/api/*` |
| Auth | 15 min | 5 (`AUTH_RATE_LIMIT_MAX`) | Login/register |
| Payment write | 5 min | 60 | `/api/payment` |
| Webhook | 1 min | 120 prod / 600 dev | `/api/webhooks` |
| Admin moderation | 1 min | 60 | Admin approve/decline routes |

### Input validation example

Group login uses `express-validator`:

```94:97:apis/middleware/requestValidation.ts
export const validateGroupLoginPayload = [
  body('groupemail').notEmpty().withMessage('Email and password are required'),
  body('password').notEmpty().withMessage('Email and password are required')
];
```

Route chain:

```153:153:apis/routes/auth/group/groupRoutes.ts
publicGroupRouter.post('/login', authLimiter, validateGroupLoginPayload, validateRequest, async (req: Request, res: Response) => {
```

### Secrets (env vars)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing (required at startup) |
| `PII_ENCRYPTION_KEY` | PII encryption (asserted in production) |
| `INTASEND_SECRET_KEY`, `INTASEND_WEBHOOK_SECRET` | Payments |
| `TWILIO_AUTH_TOKEN`, `AFRICAS_TALKING_API_KEY` | SMS |
| `STRIPE_SECRET_KEY` | Stripe (if used) |
| `DATABASE_URL` | PostgreSQL |

**Log redaction:** `requestLogger` sanitizes `email=` and `token=` query params in URLs.

### Webhook verification

IntaSend HMAC-SHA256 on raw body:

```34:48:apis/routes/webhooks/webhookRoutes.ts
webhooksRouter.post('/intasend', async (req: Request, res: Response) => {
  try {
    const webhookSecret = String(process.env.INTASEND_WEBHOOK_SECRET || '').trim();
    const incomingSignature = getIntaSendSignature(req);
    if (!webhookSecret || !incomingSignature) {
      return res.status(401).json(
        createResponse(
          null,
          'Missing webhook signature configuration or header.',
          'error',
          401,
          ERROR_CODES.WEBHOOK_INVALID_SIGNATURE
        )
      );
    }
```

### Security gaps (honest)

| Gap | Risk |
|-----|------|
| **Client route guard uses localStorage** | UI can show "logged in" before cookie session is valid; API still enforces auth |
| **Refresh requires httpOnly cookie** | Mobile Bearer-only clients cannot refresh without API extension |
| **Login JSON includes access token** | Token in body is redundant with httpOnly cookie; mobile must not log it |
| **Empty `ALLOWED_ORIGINS`** | CORS may block cross-origin clients if unset |
| **Swagger in dev** | API surface exposed in non-production |
| **No Next.js server middleware** | Page routes not protected at SSR layer |
| **Transactions feed pagination** | Documented as partial — in-memory merge, not DB paging |

---

## 7. Environment variables

| Variable | Used by | Purpose | Example (no real secrets) |
|----------|---------|---------|---------------------------|
| `PORT` | Server | HTTP port | `3000` |
| `HOST` | Server | Bind address | `0.0.0.0` |
| `NODE_ENV` | Both | Environment mode | `development` |
| `ALLOWED_ORIGINS` | Express CORS | Comma-separated origins | `http://localhost:3000` |
| `FRONTEND_URL` | Docs/ops | Frontend base URL | `http://localhost:3000` |
| `API_BASE_URL` | Docs/third-party | API base (not web Redux client) | `http://localhost:3000/api` |
| `DATABASE_URL` | Prisma | PostgreSQL connection | `postgresql://user:pass@localhost:5432/riziki_db` |
| `JWT_SECRET` | API auth | JWT signing | `generate-a-strong-random-secret-here` |
| `AUTH_RATE_LIMIT_MAX` | Auth routes | Login/register limit | `5` |
| `PAYMENT_RATE_LIMIT_MAX` | Payment routes | Payment write limit | `60` |
| `WEBHOOK_RATE_LIMIT_MAX` | Webhooks | Webhook limit | `120` |
| `PLATFORM_ADMIN_GROUP_EMAILS` | Seed/bootstrap | Platform admin grant | `admin.group@yourdomain.com` |
| `INTASEND_PUBLIC_KEY` | Payments | IntaSend public key | `pk_test_xxx` |
| `INTASEND_SECRET_KEY` | Payments | IntaSend secret | `sk_test_xxx` |
| `INTASEND_WEBHOOK_SECRET` | Webhooks | HMAC verification | `whsec_xxx` |
| `TWILIO_ACCOUNT_SID` | SMS | Twilio account | `ACxxx` |
| `TWILIO_AUTH_TOKEN` | SMS | Twilio auth | `xxx` |
| `AFRICAS_TALKING_API_KEY` | SMS | AT API key | `xxx` |
| `PII_ENCRYPTION_KEY` | API | 64-char hex encryption key | `64-hex-chars...` |
| `NEXT_PUBLIC_PLATFORM_NAME` | Next.js UI | Branding | `RIZIKI` |
| `NEXT_PUBLIC_PLATFORM_TAGLINE` | Next.js UI | Tagline | `Your Financial Growth Partner` |
| `SWAGGER_SERVER_URL` | Swagger dev | OpenAPI server URL | `http://localhost:3000/api` |

---

## 8. Directory map

```
sacco-admin-and-apis/
├── server.ts                 # HTTP server entry
├── app.ts                    # Express + Next.js combined app
├── app/                      # Next.js frontend
│   ├── layout.tsx            # Root layout → Providers
│   ├── auth/                 # Login, register, password pages
│   ├── dashboard/            # Protected dashboard pages
│   ├── admin/                # Platform admin pages
│   ├── components/
│   │   └── auth/ProtectedRoute.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAuthSync.ts
│   │   └── useLogout.ts
│   ├── utils/
│   │   ├── authClient.ts     # Deduped refresh fetch
│   │   └── accessPolicy.ts   # Role/path rules
│   └── redux/
│       ├── store.ts
│       ├── providers.tsx
│       ├── AuthSyncWrapper.tsx
│       ├── actions/          # Action type constants
│       ├── middleware/       # Thunk creators (API calls)
│       ├── reducers/         # Plain reducers
│       ├── utils/
│       │   ├── apiClient.ts  # fetch wrapper
│       │   ├── helpers.ts    # createAsyncAction
│       │   └── responseData.ts
│       └── types/entities.ts
└── apis/                     # Express API
    ├── app.ts                # API router + middleware stack
    ├── routes.ts             # Route barrel
    ├── routes/
    │   ├── auth/
    │   ├── transactions/
    │   ├── requests/
    │   ├── admin/
    │   └── webhooks/
    ├── middleware/
    │   ├── auth.ts           # JWT, cookies, refresh
    │   ├── roles.ts
    │   ├── scopeAccess.ts
    │   ├── onboardingGate.ts
    │   ├── requestValidation.ts
    │   ├── validateFinancial.ts
    │   ├── rateLimiter.ts
    │   ├── errorHandler.ts
    │   └── Logger.ts
    ├── helpers/              # Business logic helpers
    │   ├── responseHelpers.ts
    │   └── errorCodes.ts
    ├── models/CRUDAPIModel.ts
    └── DBPrisma/             # Prisma schema + client
```

---

## 9. Frontend response helpers

### Helper map

| Helper | File | Purpose |
|--------|------|---------|
| `apiGet` / `apiPost` / `apiPatch` / `apiDelete` / `apiGetList` | `app/redux/utils/apiClient.ts` | HTTP + auth side-effects |
| `unwrapApiData` | `app/redux/utils/responseData.ts` | Peel one level of `{ data: T }` |
| `extractListData` | `app/redux/utils/responseData.ts` | Normalize list shapes → `T[]` |
| `createAsyncAction` | `app/redux/utils/helpers.ts` | Dispatch REQUEST/SUCCESS/FAILURE; auto-unwraps `.data` |
| Domain `normalize*` functions | `app/redux/middleware/*/` | Coerce amounts, usernames, types before reducer |

### `unwrapApiData`

Use for **single-object** endpoints (admin overview, detail views):

```1:3:app/redux/utils/responseData.ts
export function unwrapApiData<T = any>(payload: any): T {
    return (payload?.data ?? payload) as T;
}
```

Admin example:

```typescript
const response = await apiGet('/api/admin/overview');
return { ...response, data: unwrapApiData(response.data) };
```

### `extractListData`

Tolerates **legacy and current** shapes:

| Input shape | Result |
|-------------|--------|
| `[{...}]` | As-is |
| `{ data: [...] }` | Inner array |
| `{ data: { items: [...] } }` | `items` |
| `{ data: { records: [...] } }` | `records` |
| `{ data: { data: [...] } }` | nested `data` |
| Anything else | `[]` |

```5:32:app/redux/utils/responseData.ts
export function extractListData<T = any>(payload: any): T[] {
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    const unwrapped = unwrapApiData<any>(payload);

    if (Array.isArray(unwrapped)) {
        return unwrapped as T[];
    }
    // ... items, records, data fallbacks ...
    return [];
}
```

Tests in `app/redux/utils/responseData.test.ts` document expected compatibility.

### `apiGetList` — 404-as-empty

List fetches treat **404 as an empty list** when `allow404AsEmpty: true`:

```102:128:app/redux/utils/apiClient.ts
export async function apiGetList<T = any>(
    url: string,
    options: ApiGetListOptions = {}
): Promise<ApiResponse<T>> {
    try {
        return await apiGet<T>(url);
    } catch (error: any) {
        const requestError = error as ApiRequestError;
        if (options.allow404AsEmpty && requestError?.status === 404) {
            return {
                data: options.emptyPayload ?? {
                    items: [],
                    pagination: { page: 1, limit: 25, total: 0, pages: 0 },
                },
                status: 200,
                message: 'No records found',
            } as ApiResponse<T>;
        }
        throw error;
    }
}
```

### Data flow: envelope → Redux state

```mermaid
flowchart LR
    A[fetch JSON envelope] --> B{createAsyncAction}
    B -->|unwrap .data| C[thunk return value]
    C --> D{domain normalize*}
    D --> E[reducer payload]
    E --> F[slice state.data]
```

**Important:** `createAsyncAction` puts **`response.data`** (inner payload) into the reducer:

```20:28:app/redux/utils/helpers.ts
            const payload =
                response &&
                typeof response === 'object' &&
                'data' in (response as any)
                    ? (response as any).data
                    : response;
            dispatch({
                type: actionType.SUCCESS,
                payload,
            });
```

List thunks map arrays before return so the reducer receives a **clean array**:

```34:47:app/redux/middleware/transactions/transactions.ts
export const fetchTransactions = (groupid: string) =>
    createAsyncAction<any[]>(
        transactionsActions.FETCH,
        async () => {
            const response = await apiGetList(`/api/transactions/groups/${groupid}`, {
                allow404AsEmpty: true,
            });
            const extracted = extractListData(response.data);
            const cleanedResponse = {
                ...response,
                data: extracted.map(normalizeTransaction),
            };
            return cleanedResponse;
        }
    );
```

### Error surfacing in UI

| Layer | What the UI sees |
|-------|------------------|
| `apiClient` | Throws `Error` with `"GET /api/... failed: 401 Unauthorized - No token provided"` |
| Reducer | `error: action.error` (string from thunk) |
| Pages | `loginState.error`, `error?.message` in modals, `NotificationContext` toasts |

Password reset pages read **`response.message`** from envelope directly (bypass Redux).

### Typed entities (frontend)

Shared TypeScript shapes live in `app/redux/types/entities.ts` — e.g. `RequestItem`, `Pagination`, `AdminOverviewData`, `AdminAnalyticsOverview`.

---

## 10. Backend helpers consumers should know

| Helper | Path | Role |
|--------|------|------|
| `createResponse` / `createErrorResponse` | `apis/helpers/responseHelpers.ts` | All JSON responses |
| `ERROR_CODES` | `apis/helpers/errorCodes.ts` | Stable error identifiers |
| `CRUDAPIModel` | `apis/models/CRUDAPIModel.ts` | Generic CRUD + pagination + field sanitization |
| `validateRequest` + validators | `apis/middleware/requestValidation.ts` | Input validation |
| `validateAmountFields` / `validateIdParams` | `apis/middleware/validateFinancial.ts` | Money/UUID guards on writes |
| `requireScopeAccess` | `apis/middleware/scopeAccess.ts` | Group/membership tenancy |
| `requireActiveGroup` | `apis/middleware/onboardingGate.ts` | Blocks writes until group activated |
| `logFinancialAction` | `apis/helpers/auditLog.ts` | Audit trail for financial ops |
| `mergedTransactionSemantics` | `apis/helpers/mergedTransactionSemantics.ts` | `direction`, `displayamount`, `signedamount` |

### Transaction semantics (for list UIs)

Merged feeds expose canonical fields documented in `docs/api-contract-matrix.md`:

| Field | Values | Use |
|-------|--------|-----|
| `direction` | `inflow` \| `outflow` \| `neutral` | Icons, coloring |
| `displayamount` | absolute number | Display |
| `signedamount` | signed number | Totals/charts |

Frontend also normalizes in `app/redux/middleware/transactions/transactions.ts` (`normalizeTransaction`).

### Request correlation

API router assigns **`x-request-id`** on every request (`apis/app.ts`). Useful when logging client errors against server logs.

---

## 11. Redux conventions

### Action naming

String constants grouped as `REQUEST | SUCCESS | FAILURE | RESET`:

```1:8:app/redux/actions/transactions/transactions.ts
export const transactionsActions = {
    FETCH: {
        REQUEST: 'transactions/fetch/request',
        SUCCESS: 'transactions/fetch/success',
        FAILURE: 'transactions/fetch/failure',
        RESET: 'transactions/fetch/reset',
    },
};
```

Pattern: `<domain>/<verb>/<phase>` — no Redux Toolkit slice names.

### Folder roles (three-layer slice)

```
actions/<domain>.ts     → action type strings only
middleware/<domain>.ts  → thunk creators (API + normalize)
reducers/<domain>.ts    → pure reducer (switch on action.type)
```

The folder **`middleware/`** is **not** Redux middleware — it is legacy naming for thunks.

### Global auth actions (non-slice)

| Action type | Trigger | Effect |
|-------------|---------|--------|
| `LOGOUT` | 401 from `apiClient` | `login` reducer resets |
| `AUTH/FORBIDDEN` | 403 from `apiClient` | Redirect only (no dedicated reducer) |

### Legacy naming

| Deprecated | Current |
|------------|---------|
| `saccos` routes/docs | `groups` |
| `usersaccos` | `usergroups` |
| `registerSacco`, `logoutSacco` | `registerGroup`, `logoutGroup` |
| `localStorage` key `group` (register only) | Primary key is `user` after login |

---

## 12. Porting checklist for LUKU mobile (React Native / Expo)

| Web pattern (RIZIKI) | Mobile equivalent (LUKU) |
|------------------------|----------------------------|
| `localStorage` key `user` | `@react-native-async-storage/async-storage` for profile display |
| httpOnly JWT cookies | **SecureStore** (or memory) for access token; **cannot use cookies like web** |
| `credentials: 'include'` fetch | `fetch` with `Authorization: Bearer ${token}` header |
| Relative `/api/...` URLs | `EXPO_PUBLIC_API_BASE_URL` absolute URL (LAN IP for physical device) |
| `import.meta.env.VITE_*` / none | `process.env.EXPO_PUBLIC_*` via `app.config.ts` `extra` |
| Cookie refresh (`POST /api/auth/refresh`) | **Needs redesign:** extend API to accept refresh token in body/header, or re-login on 401 |
| `ProtectedRoute` + localStorage | Navigation guard + Redux `auth.isAuthenticated` |
| `useAuthSync` refresh on mount | App launch thunk: validate/refresh token before main navigator |
| Redux `@reduxjs/toolkit@^2.8.2` | Align to `@reduxjs/toolkit@2.2.6`, `react-redux@9.1.2` per LUKU spec |
| Custom `createAsyncAction` | Can port 1:1 or migrate to `createAsyncThunk` |
| `NotificationContext` toasts | Expo toast / in-app alert for errors |
| Supabase auth in `App.tsx` (LUKU today) | Replace with JWT auth slice matching this API **or** keep Supabase if backend differs |
| `responseData.ts` | Copy/adapt `unwrapApiData` + `extractListData` into `apps/mobile/src/api/` |
| Full envelope from `fetch` | Parse once; branch on `success` / `errorCode` before unwrap |
| `errorBody.message` in thrown errors | Map `errorCode` → user-facing copy (i18n-friendly) |
| `allow404AsEmpty` on lists | Same for collections that may 404 for new users |
| Thunk `normalize*` mappers | Keep in slice layer or shared `adapters/` |

### Maps 1:1 vs needs redesign

| Maps 1:1 | Needs redesign |
|----------|----------------|
| Reducer shape (`isLoading/isSuccess/isError`) | Cookie session → Bearer + SecureStore |
| Action type constants pattern | Refresh token flow for non-browser |
| API envelope parsing (`responseData.ts`) | CORS + absolute base URL |
| Express routes and roles | `AppStateContext` cart/wishlist → Redux slices |
| `verifyToken` Bearer path on server | Protected navigation without localStorage soft gate |
| Rate limits, validation, webhooks | Supabase auth → custom JWT if switching backends |

### Recommended mobile slice shape for lists

```typescript
interface ListSliceState<T> {
  items: T[];
  pagination: Pagination | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}
```

Today RIZIKI reducers often store **only the array** (`data: T[]`) and drop pagination — acceptable for admin dashboards but LUKU may want pagination in state if infinite scroll is planned.

---

## 13. Recommended migration order for LUKU

Assuming LUKU mobile today has `AppStateContext` (cart, wishlist, wardrobe), `repositories/` mock/Supabase swap, and Supabase auth in `App.tsx`:

| Phase | Work | Rationale |
|-------|------|-----------|
| **1** | **API client layer** — `apiClient.ts` with Bearer header from SecureStore, envelope parsing | Foundation for all slices |
| **2** | **Auth slice** — login/logout/refresh thunks, token storage, hydration on app launch | Unblocks authenticated API calls; replaces Supabase-in-App.tsx |
| **3** | **Navigation guards** — auth-aware stack/tabs | Mirrors `ProtectedRoute` |
| **4** | **Cart slice** — migrate from `AppStateContext` | High-traffic, good Redux proof |
| **5** | **Wishlist + wardrobe slices** | Same pattern as cart |
| **6** | **Domain slices per Phase 2 wave** — orders, profile, etc. | One feature spec at a time |
| **7** | **Retire mock repositories** — point `repositories/` at Express API via thunks | Keep repository interface as adapter if useful |

Within each slice, follow RIZIKI's three-file pattern:

1. `actions/<domain>.ts` — action constants
2. `middleware/<domain>.ts` — thunks calling `apiClient`
3. `reducers/<domain>.ts` — state transitions

---

## Appendix A: Custom async thunk pattern

```11:36:app/redux/utils/helpers.ts
export const createAsyncAction =
    <T = any>(
        actionType: AsyncActionType,
        apiCall: () => Promise<{ data?: T } | T>
    ) =>
    async (dispatch: Dispatch) => {
        try {
            dispatch({ type: actionType.REQUEST });
            const response = await apiCall();
            const payload =
                response &&
                typeof response === 'object' &&
                'data' in (response as any)
                    ? (response as any).data
                    : response;
            dispatch({
                type: actionType.SUCCESS,
                payload,
            });
        } catch (err: any) {
            dispatch({
                type: actionType.FAILURE,
                error: err.message || err.response?.data,
            });
        }
    };
```

---

## Appendix B: Related docs in this repo

| File | Contents |
|------|----------|
| `docs/api-contract-matrix.md` | Endpoint inventory, envelope spec, transaction semantics |
| `.env.example` | All environment variables with placeholders |
| `apis/README.md` | API layer overview |

---

## Distribution checklist (for LUKU team)

1. Copy this file to LUKU at `apps/mobile/docs/REDUX_EXPRESS_ARCHITECTURE.md`
2. Review **section 4** (token storage) and **section 6** (security gaps) before Phase 2 specs
3. Link from member specs via `PHASE2_SPEC_TEMPLATE.md`
