# API Pagination Contract

This document defines the pagination standard for API endpoints consumed by mobile and web clients.

## Recommended standard: cursor pagination

Use cursor pagination for all new list endpoints.

### Request

- `limit` (optional): number of items to return. Default `20`, max `100`.
- `cursor` (optional): opaque cursor string from the previous response.

Example:

`GET /v1/api/resource?limit=20&cursor=eyJpZCI6IjEyMyJ9`

### Response

```json
{
  "items": [],
  "pageInfo": {
    "nextCursor": "eyJpZCI6IjQ1NiJ9",
    "hasNextPage": true
  }
}
```

- `nextCursor` is `null` when there is no next page.
- `hasNextPage` indicates whether another page is available.

## Legacy compatibility: offset pagination

Existing endpoints that still use offsets should keep a stable contract until migrated.

### Request

- `limit` (optional): number of items to return.
- `offset` (optional): number of items to skip.

### Response

```json
{
  "items": [],
  "pageInfo": {
    "offset": 0,
    "limit": 20,
    "total": 200
  }
}
```

- `total` is optional when total counting is expensive.

## Validation and errors

When pagination params are invalid, return:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid pagination parameters.",
    "details": [
      {
        "field": "limit",
        "message": "Limit must be between 1 and 100."
      }
    ]
  }
}
```

## Notes for production readiness

- Cursors must be opaque and not client-generated identifiers.
- Endpoints must use deterministic ordering to avoid duplicate or skipped items.
- In-memory rate limiting is acceptable for development, but production should use a shared store (for example Redis) or gateway-level throttling.
