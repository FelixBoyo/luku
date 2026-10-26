# LUKU landing page

Next.js 15 marketing site. Brand aligns with the Expo mobile app — see [`docs/qa/LANDING_RN_BRAND_ALIGNMENT.md`](../docs/qa/LANDING_RN_BRAND_ALIGNMENT.md).

## Dev (from repo root)

```bash
npm install --prefix landing
npm run dev:landing
```

Open http://localhost:3000

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev:landing` | Dev server (repo root) |
| `npm run build:landing` | Production build (repo root) |
| `npm run lint --prefix landing` | Next.js lint |
| `npm run build --prefix landing` | Production build |

## Stack

- Next.js 15 App Router
- Tailwind CSS
- Outfit (Google Fonts) — matches `apps/mobile/src/theme/tokens.ts`
