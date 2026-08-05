---
name: Gemini model name normalization
description: Gemini rejects non-identifier model names with 400 "unexpected model name format"; server sanitizes before calling
---

Gemini's generateContent endpoint returns `400 INVALID_ARGUMENT: GenerateContentRequest.model: unexpected model name format` when the model string is not a clean identifier — e.g. surrounding literal quotes (from migrated settings), a display name with spaces, a `models/` prefix, or trailing whitespace. An invalid API key does NOT produce this error (it produces a key/auth error instead).

**Why:** The `ai_model` setting value historically arrived from database migrations with junk around it, so the raw string was forwarded into the URL and rejected.

**How to apply:** `server/routes.ts` has `normalizeGeminiModel()` which strips quotes/whitespace/`models/` prefix and falls back to `DEFAULT_GEMINI_MODEL` (`gemini-flash-lite-latest`) when the result isn't a valid identifier. All `generateGeminiText` calls go through it. If AI calls fail again with this error, suspect a dirty `ai_model` value in the DB — sanitization should already handle it, so the fix belongs in the server, not the DB.
