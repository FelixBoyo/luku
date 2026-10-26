# Redux + Express architecture

Canonical copy: **[`docs/architecture/redux-express-reference.md`](../../../docs/architecture/redux-express-reference.md)**

Extracted from **apis-riziki** (RIZIKI FinTech SACCO admin). Use for:

- API response envelope and `errorCode` patterns
- Bearer auth + token lifecycle (adapt for mobile SecureStore)
- Express middleware order and security gaps

Mobile Phase 2 uses **repositories + Context**, not Redux — see [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md) and [`../../../docs/architecture/BFF_OVERVIEW.md`](../../../docs/architecture/BFF_OVERVIEW.md).
