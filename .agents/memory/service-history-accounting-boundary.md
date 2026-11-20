---
name: Service history accounting boundary
description: Keep repair visit records independent from established purchase-cost and sale-snapshot accounting.
---

Service visit history records each visit's dates, work notes, and cost separately. Adding or editing visit history must not change the watch's existing acquisition COGS or saved sale financial snapshots.

**Why:** The user requested complete repair history while explicitly requiring existing acquisition COGS and sale snapshots to remain unchanged.

**How to apply:** Keep visit-history writes separate from financial fields and avoid refreshing sale snapshots for no-op financial edits.
