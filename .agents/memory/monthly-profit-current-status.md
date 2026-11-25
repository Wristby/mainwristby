---
name: Sales reporting follows current Sold status
description: Scope rule for period-based profit metrics and Sales Patterns.
---

Period-based sales reporting, including Analytics profit metrics and Sales Patterns, includes only watches whose current inventory status is `sold` and that have a valid sale date (`soldDate`, with `dateSold` as the legacy fallback). If a watch's status changes after a return or for another reason, it is no longer part of those sales metrics.

**Why:** The user wants sales metrics to be a straightforward view of current Sold inventory by sale date; older sale-cycle history should not keep a watch in sales metrics after its status changes.

**How to apply:** Use current inventory records for monthly profit trends, Analytics period metrics, and Sales Patterns. Keep separate sale/return history features on their saved records, but do not use those snapshots to determine current sales-metric membership.
