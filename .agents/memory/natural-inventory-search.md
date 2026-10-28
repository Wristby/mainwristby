---
name: Natural-language inventory search
description: Privacy and correctness boundary for AI-assisted inventory search
---

Gemini translates watch-inventory questions into strict, allowlisted filters. Client search is instant and local across saved profile details, with no client-information search blocks. The app is single-user; preserve the user's full access to client records.

**Why:** The user is the only app user and explicitly wants to search all stored client information without restrictions.

**How to apply:** Client lookup should update as the user types and match saved profile fields locally. Do not add privacy gates that block client searches. Keep existing sign-in intact unless the user separately asks to change authentication. Validate watch AI filters and calculate any results from saved records.
