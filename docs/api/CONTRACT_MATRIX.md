# API contract matrix

Source of truth for Phase 2 endpoints. Types in `packages/contracts/src/`.

**Status:** `live` | `stub` | `planned`

**Table scope:** [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md)

## Auth

| Method | Path | Auth | Status | DTO | Tables | Owner |
|--------|------|------|--------|-----|--------|-------|
| POST | `/v1/api/auth/login` | no | live | `LoginRequest` → `SessionDto` | `auth.users` | Platform |
| POST | `/v1/api/auth/refresh` | no | live | `RefreshRequest` → `SessionDto` | `auth.users` | Platform |
| POST | `/v1/api/auth/logout` | bearer | live | — | — | M1 |
| GET | `/v1/api/auth/me` | bearer | live | `UserProfileDto` | `profiles` | M1 |
| POST | `/v1/api/auth/register` | no | live | `RegisterRequest` → `RegistrationPendingDto` | `auth.users`, `profiles` | Platform |
| POST | `/v1/api/auth/verify-otp` | no | live | `VerifyOtpRequest` → `SessionDto` | `auth.users` | Platform |
| POST | `/v1/api/auth/resend-otp` | no | live | `ResendOtpRequest` | `auth.users` | Platform |
| POST | `/v1/api/auth/oauth` | no | live | `OAuthSignInRequest` → `SessionDto` | `auth.users`, `profiles` | Platform |
| POST | `/v1/api/auth/signup` | no | disabled | — (returns `AUTH_FORBIDDEN`) | — | Platform |
| POST | `/v1/api/auth/password-reset` | no | live | `PasswordResetRequest` → `PasswordResetResponseDto` | `auth.users` | M1 |
| POST | `/v1/api/auth/password-reset/confirm` | no | live | `PasswordResetConfirmRequest` | `auth.users` | M1 |

## Profile

| Method | Path | Auth | Status | DTO | Tables | Owner |
|--------|------|------|--------|-----|--------|-------|
| GET | `/v1/api/profile` | bearer | live | `UserProfileDto` | `profiles` | M1 |
| GET | `/v1/api/profile/:userId` | bearer | live | `UserProfileDto` | `profiles` | M1 |
| PATCH | `/v1/api/profile` | bearer | live | `ProfilePatchRequest` → `UserProfileDto` | `profiles` | M1 |

## Connections

| Method | Path | Auth | Status | DTO | Tables | Owner |
|--------|------|------|--------|-----|--------|-------|
| GET | `/v1/api/connections/followers` | bearer | live | `ConnectionUserDto[]` | `user_follows`, `profiles` | M1 |
| GET | `/v1/api/connections/following` | bearer | live | `ConnectionUserDto[]` | `user_follows`, `profiles` | M1 |
| POST | `/v1/api/connections/follow` | bearer | live | `FollowRequest` | `user_follows` | M1 |
| DELETE | `/v1/api/connections/follow/:userId` | bearer | live | — | `user_follows` | M1 |
| POST | `/v1/api/connections/block` | bearer | live | `BlockRequest` | `user_blocks` | M1 |
| DELETE | `/v1/api/connections/block/:userId` | bearer | live | — | `user_blocks` | M1 |
| GET | `/v1/api/connections/blocked` | bearer | live | `ConnectionUserDto[]` | `user_blocks`, `profiles` | M1 |

## Products & wishlist

| Method | Path | Auth | Status | DTO | Tables | Owner |
|--------|------|------|--------|-----|--------|-------|
| GET | `/v1/api/products` | optional | live | `ProductListQuery` → `PaginatedItems<ProductDto>` | `products`, `products_with_ratings` | Platform |
| GET | `/v1/api/products/:id` | optional | live | `ProductDto` | `products` | Platform |
| GET | `/v1/api/wishlist` | bearer | planned | `WishlistItemDto[]` | `wishlist` | M2 |
| POST | `/v1/api/wishlist` | bearer | planned | `{ productId }` | `wishlist` | M2 |
| DELETE | `/v1/api/wishlist/:productId` | bearer | planned | — | `wishlist` | M2 |

## Wardrobe, outfits, listings

| Method | Path | Auth | Status | Tables | Owner |
|--------|------|------|--------|--------|-------|
| GET | `/v1/api/wardrobe` | bearer | planned | `wardrobe_items` | M3 |
| POST | `/v1/api/wardrobe` | bearer | planned | `wardrobe_items` | M3 |
| PATCH | `/v1/api/wardrobe/:id` | bearer | planned | `wardrobe_items` | M3 |
| POST | `/v1/api/wardrobe/:id/log-wear` | bearer | planned | `wardrobe_wear_log` | M3 |
| GET | `/v1/api/outfits` | bearer | planned | `outfits`, `outfit_pieces` | M3 |
| POST | `/v1/api/outfits` | bearer | planned | `outfits`, `outfit_pieces` | M3 |
| GET | `/v1/api/listings` | bearer | planned | `listings` | M3 |
| POST | `/v1/api/listings` | bearer | planned | `listings` | M3 |

## Commerce & inbox

| Method | Path | Auth | Status | Tables | Owner |
|--------|------|------|--------|--------|-------|
| GET | `/v1/api/cart` | bearer | planned | `cart_items` | M4 |
| POST | `/v1/api/cart` | bearer | planned | `cart_items` | M4 |
| GET | `/v1/api/orders` | bearer | planned | `orders` | M4 |
| POST | `/v1/api/orders` | bearer | planned | `orders` (+ RPC) | M4 |
| GET | `/v1/api/inbox` | bearer | planned | `inbox_threads` | M4 |
| GET | `/v1/api/inbox/:id/messages` | bearer | planned | `inbox_messages` | M4 |

## AI (task-based)

| Method | Path | Auth | Status | DTO | Owner |
|--------|------|------|--------|-----|-------|
| POST | `/v1/api/ai/outfit-suggestions` | bearer | stub | `OutfitSuggestionsRequest` | M4 |
| POST | `/api/ai/gemini/generate-content` | no* | live (deprecated) | legacy | — |

\*Rate-limited; migrate to task routes.

## Payments (existing)

| Method | Path | Status |
|--------|------|--------|
| GET | `/v1/api/payments/config` | live |
| POST | `/v1/api/payments/paystack/charges` | live |
| POST | `/v1/api/payments/mpesa/stk-push` | live |

## Health

| Method | Path | Status |
|--------|------|--------|
| GET | `/v1/api/health` | live |
| GET | `/health` | live (legacy) |
