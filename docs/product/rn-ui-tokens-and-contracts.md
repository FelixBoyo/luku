# React Native v1 — UI tokens and component contracts

This document maps the RN v1 product scope to a minimal shared UI system.
It complements `docs/product/rn-v1-scope.md` by defining visual primitives
and component contracts needed to ship the **In** features.

## Goals

- Keep UI primitives consistent across auth, wardrobe, discover, and checkout.
- Preserve web momentum while avoiding web-only contracts in RN surfaces.
- Define semantic tokens first; map per platform (web and RN) second.
- Keep contracts small and composable so feature teams can ship independently.

## Non-goals (v1)

- Full design system overhaul.
- Pixel-parity with web Tailwind classes on RN.
- New third-party UI dependency adoption.

## Current state

- Web tokens live in `core/theme/tokens.ts` as Tailwind utility strings.
- Shared web primitives exist in `components/common` (`Button`, `Card`, `Input`).
- Product scope and risk decisions are documented in `docs/product/rn-v1-scope.md`.

## Recommended token model

Define and enforce **semantic token groups**, not framework-specific values:

- `color`: brand, background, surface, text, border, status
- `space`: xs, sm, md, lg, xl
- `radius`: sm, md, lg, pill
- `shadow`: subtle, medium, strong
- `typography`: pageTitle, sectionTitle, subtitle, body, caption
- `layout`: container, pagePaddingY, sectionGap

### Platform mapping

- **Web:** semantic tokens map to Tailwind class fragments (current behavior).
- **RN:** semantic tokens map to RN-friendly values (hex, number, font metadata).

This keeps feature code semantic (`tokens.color.text.primary`) and platform
adapters responsible for representation details.

## v1 component contract surface

These contracts cover all **In** routes from RN v1 scope.

### `Button`

- Variants: `primary | secondary | ghost | destructive`
- Sizes: `sm | md | lg`
- States: `default | loading | disabled`
- Required behavior:
  - Loading state disables press and shows progress affordance.
  - No sensitive data in labels or logs (payment states included).

### `Card`

- Variants: `default | elevated | muted`
- Density: `comfortable | compact`
- Optional pressable wrapper support for list/detail navigation.

### `Input`

- Types for v1 journeys: text, email, password, search, phone.
- Shared props: `label`, `helperText`, `error`, `required`, `disabled`.
- Payment-sensitive rule:
  - Mask phone/account entry where appropriate.
  - Never log raw input values for payments.

### `Feedback`

- `Toast` / snackbar for non-blocking success and error feedback.
- `InlineError` for field-level validation and recoverable API failures.
- `ScreenError` fallback for unrecoverable route-level failures.

### `Loading`

- `Spinner` and `Skeleton` primitives with consistent size/spacing tokens.
- Required in data-heavy views: discover lists, wardrobe, marketplace, orders.

## Feature-to-primitive map (RN v1)

- **Auth + password reset:** `Input`, `Button`, `InlineError`, `Toast`
- **Discover + lifestyle hub:** `Card`, `Button`, `Skeleton`
- **Wardrobe + uploads:** `Card`, `Button`, `Input`, `Toast`, `ScreenError`
- **Marketplace + product detail:** `Card`, `Button`, `Input` (search), `Skeleton`
- **Cart + checkout:** `Button`, `Input`, `InlineError`, `Toast`, `ScreenError`
- **Wishlist + my orders:** `Card`, `Button`, `Skeleton`

## Security and privacy constraints

- Never log tokens, keys, card details, full phone numbers, or webhook payloads.
- Payment and auth errors must be sanitized before UI display.
- Preserve server-only logic in `/api` and `/backend`; keep UI contracts client-safe.

## Testing expectations

- Unit tests for shared UI logic (state rendering, disabled/loading behavior).
- Contract tests for variant/size props on common primitives.
- Regression tests for error and loading states on checkout-relevant components.

Run before merge:

- `npm test`

## Decisions for RN v1

- **Token architecture:** Keep one semantic token model with platform adapters
  (web class mapping + RN value mapping), rather than split, duplicated token sources.
- **`Button` variants:** Include `destructive` in v1 to avoid ad hoc one-off delete/remove
  styles across wardrobe, wishlist, cart, and account flows.
- **`Input` masking helper:** Include built-in masking support for phone/account-style
  entry in v1 checkout-related flows, with strict no-plaintext-logging guarantees.

