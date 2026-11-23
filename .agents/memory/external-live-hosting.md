---
name: External live hosting
description: Distinguish the user's cPanel live website and database from Replit development.
---
The live app and its database are hosted through cPanel. Live schema changes
must follow the documented manual SQL release process; Replit's development
`db:push` does not update or verify cPanel, and app startup must not run
migrations.

**Why:** The user stated that their live hosting and database are on cPanel and confirmed that the Notebook loading error occurred on the live cPanel website. The Timing warning cleared after applying its migration to Replit development, confirming that preview and live schema states can differ.

**How to apply:** Apply SQL to Replit development for preview testing, then separately follow the manual SQL release process for cPanel live. Do not treat successful Replit checks as verification of cPanel. Confirm the target and authorization before changing the external database; app startup must never run migrations.
