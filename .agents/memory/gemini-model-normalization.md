---
name: Gemini model compatibility
description: Model-name normalization, per-project availability, and transient failure handling for Gemini
---

Gemini's generateContent endpoint returns `400 INVALID_ARGUMENT: GenerateContentRequest.model: unexpected model name format` when the model string is not a clean identifier — e.g. surrounding literal quotes (from migrated settings), a display name with spaces, a `models/` prefix, or trailing whitespace. An invalid API key does NOT produce this error (it produces a key/auth error instead).

**Why:** The `ai_model` setting value historically arrived from database migrations with junk around it, so the raw string was forwarded into the URL and rejected.

**How to apply:** Normalize quotes, whitespace, and `models/` prefixes before calls. Also map old `*-latest` aliases to a current explicit model because those aliases may point to overloaded or unavailable pools.

## Model availability (verified 2026-09-10 with the project's Gemini project)

Direct tests showed:
- Gemini 2.5 Flash and Flash-Lite return 404 and direct new users to Gemini 3.5.
- Gemini 3.1/3.5/3.6/3.8 Flash variants can return 500/503 during a provider-wide demand incident.
- The Interactions API can return the same 500 as legacy `generateContent`, so changing endpoints alone is not a fix.
- Pro/Omni models may return 429 because this project has no quota for them.

**Why:** Model availability and quota differ by key/project and change over time. Google explicitly recommends exponential backoff for 429 and 5xx responses.

**How to apply:** Retry transient 408/429/5xx responses with bounded exponential backoff and jitter, then try current Flash fallbacks. Skip 404 models immediately. If every listed model fails, report provider unavailability rather than blaming the prompt or key.
**Also note:** the user likely runs this app on their **own node.js server** (their screenshots show `DATABASE_URL` at `localhost:5432` with their own env vars), not the Replit deployment — fixes must be redeployed there too.
