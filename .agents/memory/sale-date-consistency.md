---
name: Sale-date consistency
description: Canonical sale-date rules across legacy fields, status edits, and reporting.
---

Use `soldDate` as the canonical sale date and `dateSold` only as a fallback for legacy records. When a sale date is explicitly written, synchronize both fields; clearing it clears both. Do not invent a date when editing a watch already marked sold without one. A current date may be used only when the status changes from another state to sold and the user did not explicitly clear the date.

**Why:** Conflicting saved dates caused different reports to disagree, and an automatic fallback could overwrite a historical correction.

**How to apply:** Use the shared sale-date helper for reads, reporting, and writes. Do not bulk-rewrite old records; normalize them when a sale date is next explicitly saved.
