# Security CI Lane Notes

## Lane definition

The security hard-pass lane runs:

- `npm test -- --run backend/http/redact.test.ts backend/handlers/webhooks/paystack.test.ts backend/handlers/ai/gemini.test.ts`
- `npm audit --audit-level=high`

Workflow file:

- `.github/workflows/security-hard-pass.yml`

## Current baseline status

- Focused security tests: passing.
- Full suite (`npm test -- --run`): failing due to existing unrelated test failures outside security hard-pass scope.

## Known unrelated full-suite failures (current snapshot)

- `components/Marketplace.test.tsx` (`No products found` assertion path)
- `components/ProductDetail.test.tsx` (`quantity selection` assertion path)

These should be tracked independently so they do not block security regression verification.
