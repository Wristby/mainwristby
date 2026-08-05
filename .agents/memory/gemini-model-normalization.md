---
name: Gemini model name normalization
description: Gemini rejects non-identifier model names with 400 "unexpected model name format"; server sanitizes before calling
---

Gemini's generateContent endpoint returns `400 INVALID_ARGUMENT: GenerateContentRequest.model: unexpected model name format` when the model string is not a clean identifier — e.g. surrounding literal quotes (from migrated settings), a display name with spaces, a `models/` prefix, or trailing whitespace. An invalid API key does NOT produce this error (it produces a key/auth error instead).

**Why:** The `ai_model` setting value historically arrived from database migrations with junk around it, so the raw string was forwarded into the URL and rejected.

**How to apply:** `server/routes.ts` has `normalizeGeminiModel()` which strips quotes/whitespace/`models/` prefix and falls back to `DEFAULT_GEMINI_MODEL` (`gemini-flash-lite-latest`) when the result isn't a valid identifier. All `generateGeminiText` calls go through it. If AI calls fail again with this error, suspect a dirty `ai_model` value in the DB — sanitization should already handle it, so the fix belongs in the server, not the DB.

## Quota-blocked / retired models (verified 2026-08 with the project's GEMINI_API_KEY)

The user believes "flash 2.0 lite has higher free limits" — that is false for this key. Direct `:generateContent` tests:
- `gemini-2.0-flash-lite` → HTTP **429** (zero free quota on this key) — always fails despite the user's belief.
- `gemini-2.5-flash-lite` → HTTP **404** (removed from the API).
- Working models (HTTP 200): `gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`.

**Why:** Google's quota per model differs by key/project; the user's preferred model is quota-locked while the default works.

**How to apply:** `generateGeminiText()` retries with `DEFAULT_GEMINI_MODEL` when the selected model returns 429/404, so AI generation keeps working regardless of the stored `ai_model`; `/api/ai/models` also filters out the blocked IDs above. If AI fails on a *different* model, test it directly with `curl` against `:generateContent` before chasing code. When the user reports "quota" errors, first ask which model — a blocked model will 429 even with a perfect key.
**Also note:** the user likely runs this app on their **own node.js server** (their screenshots show `DATABASE_URL` at `localhost:5432` with their own env vars), not the Replit deployment — fixes must be redeployed there too.
