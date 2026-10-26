# Logging Guidelines

This project uses structured, sanitized backend logging. Each request should be traceable with a request id.

## Required fields

For backend logs, include these fields whenever available:

- `ts`: ISO timestamp
- `level`: `info` | `warn` | `error`
- `msg`: short event message
- `requestId`: value from `x-request-id`
- `route`: request route or endpoint identifier
- `method`: HTTP method
- `status`: response status

## Request Id behavior

- Incoming `x-request-id` is accepted if present.
- If missing, backend generates a request id.
- Backend echoes `x-request-id` in response headers.
- Error responses include request id in the JSON payload.

## Redaction policy

Never log secrets or sensitive payload data in plaintext:

- API keys, tokens, passwords, webhook signatures
- card numbers / PANs
- phone numbers
- raw request bodies for payment or webhook endpoints

Use `safeLogger` and sanitization helpers to redact sensitive values.

## Example log line

```json
{
  "ts": "2026-05-04T14:00:00.000Z",
  "level": "error",
  "msg": "Paystack charge error",
  "requestId": "req_12345",
  "route": "/v1/api/payments/paystack/charges",
  "method": "POST",
  "status": 500
}
```
