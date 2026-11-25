---
name: Monthly profit follows current Sold status
description: Scope rule for the Financials monthly net profit trend.
---

The Financials monthly net profit trend includes only watches whose current inventory status is `sold` and that have a valid sale date (`soldDate`, with `dateSold` as the legacy fallback). If a watch's status changes after a return or for another reason, it is no longer part of this trend.

**Why:** The user wants the trend to be a straightforward view of current Sold inventory by sale date; older sale-cycle history should not keep a watch in the trend after its status changes.

**How to apply:** Use current inventory records for the monthly trend and its drill-down/export. Keep the separate sale/return history features for their own records, but do not use those snapshots to determine monthly trend membership.
