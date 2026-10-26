# AI provider architecture

Clients call **tasks**, not providers.

## Task endpoints (target)

| Task | Route | Mobile consumer |
|------|-------|-----------------|
| Outfit suggestions | `POST /v1/api/ai/outfit-suggestions` | `stylistRepository` |
| Wardrobe analyze | `POST /v1/api/ai/wardrobe-analyze` | wardrobe upload |
| Style guidance | `POST /v1/api/ai/style-guidance` | Home / Discover |

DTOs: `packages/contracts/src/ai/`

## Server layout

```
backend/ai/
  providers/
    types.ts          # AiProvider interface
    geminiProvider.ts # v1
  router.ts           # getAiProvider() from env
  tasks/              # prompt + Zod parse + domain JSON
  prompts/            # versioned .txt files
```

## Config

```bash
AI_PROVIDER=gemini          # future: ollama | custom
AI_DEFAULT_MODEL=gemini-2.5-flash
```

## Migration from legacy

- `POST /api/ai/gemini/generate-content` — deprecated
- Port prompts from `apps/web-legacy/services/geminiService.ts` into `backend/ai/prompts/`
- Mobile never imports `@google/genai`
