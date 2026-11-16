---
name: Financial refactor boundaries
description: Preserve tax estimates, historical fee snapshots, and intentional reporting scopes when consolidating financial logic
---

Financial refactors preserve the app's existing VAT estimate of positive watch profit multiplied by the configured VAT rate, with tax rounded per watch before summing. This is not a determination of the legally applicable VAT scheme.

**Why:** Consolidating arithmetic is not permission to change accounting or tax treatment. Such changes need a separately agreed definition.

**How to apply:** Keep margin defined as profit divided by sale revenue, and distinguish it from the existing purchase-price-based ROI. Preserve saved register-fee snapshots, including recorded zero values. Do not apply estimated Chrono24 fees to realized sales in addition to their recorded platform fees. Keep business expenses separate from watch-level costs, and preserve intentionally different reporting scopes and missing-price disclosures.
