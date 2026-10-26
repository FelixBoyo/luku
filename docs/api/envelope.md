# API response envelope

All `/v1/api/*` routes return:

```json
{
  "success": true,
  "status": "success",
  "code": 200,
  "errorCode": null,
  "message": "Human summary",
  "error": null,
  "data": {},
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

## Errors

| Field | Use |
|-------|-----|
| `errorCode` | Stable machine code — mobile maps to user copy |
| `message` | Human-readable |
| `code` | Mirrors HTTP status |

## Lists

```json
{
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
  }
}
```

Implementation: `backend/lib/envelope.ts`, types in `packages/contracts/src/envelope.ts`.

Reference: [`apps/mobile/docs/REDUX_EXPRESS_ARCHITECTURE.md`](../../apps/mobile/docs/REDUX_EXPRESS_ARCHITECTURE.md) §3.5 (RIZIKI).
