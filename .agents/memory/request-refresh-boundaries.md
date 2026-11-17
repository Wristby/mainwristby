---
name: Request and refresh boundaries
description: Preserve the distinction between saving data and refreshing its dependent views
---

A successful write followed by a failed refresh is still a successful write. Warn that displayed data may be stale; do not report the write as failed or automatically retry it.

**Why:** Retrying a saved action can create duplicate records. A refresh warning must also remain visible alongside a save confirmation rather than being immediately replaced by it.

**How to apply:** Await dependent refreshes before the normal success flow, retain cached data on refresh failure, and keep personal-collection refreshes separate from business inventory and reports. Refreshing Notebook data must not silently regenerate saved AI journal entries or replace historical inventory captures.
