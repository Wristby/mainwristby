---
name: Query refresh policy
description: Why WRISTBY refreshes cached API data after saves and when a user returns to the app.
---

Use a short finite query freshness window and refetch on window focus, alongside explicit cache invalidation after mutations. Cache invalidation is the immediate source of truth after saves; finite freshness provides a fallback when an edit path misses invalidation or the user returns to an open tab later.

**Why:** The previous infinite freshness window and disabled focus refresh could leave data stale indefinitely when one save path forgot to invalidate a related query.

**How to apply:** Keep query keys and mutation invalidations centralized by data domain. If performance requires longer freshness for a specific query, preserve mutation invalidation and make the exception local and intentional.
