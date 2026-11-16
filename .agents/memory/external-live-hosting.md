---
name: External live hosting
description: Distinguish the user's cPanel live website and database from Replit development.
---
The live app and its database are hosted through cPanel. Live schema changes
must follow the documented manual SQL release process; Replit's development
`db:push` does not update or verify cPanel, and app startup must not run
migrations.

**Why:** The user stated that their live hosting and database are on cPanel and confirmed that the Notebook loading error occurred on the live cPanel website.

**How to apply:** Do not treat successful Replit development checks or Replit production database queries as verification of the cPanel database. Confirm the target and authorization before changing the external database. Source-code updates alone do not demonstrate that database schema changes were applied there; verify cPanel's applied migration state before choosing pending SQL.
