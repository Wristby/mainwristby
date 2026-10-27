---
name: Natural-language inventory search
description: Privacy and correctness boundary for AI-assisted inventory search
---

Gemini should translate a user's inventory question into a strict, allowlisted filter object. The application validates those filters and performs matching against its own inventory data; watch records and client details are not sent to Gemini.

**Why:** Search results need to be grounded in saved records, while keeping personal or business inventory data out of the prompt and preventing generated SQL or arbitrary query behavior.

**How to apply:** Keep the model limited to intent parsing. Validate every field, enum, and range before applying filters in application code or parameterized database queries. Treat any future aggregate answers as deterministic calculations over the records.
