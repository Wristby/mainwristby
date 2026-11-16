---
name: Financial refactor boundaries
description: Preserve tax estimates, historical fee snapshots, and intentional reporting scopes when consolidating financial logic
---

Financial refactors preserve the app's existing VAT estimate of positive watch profit multiplied by the configured VAT rate, with tax rounded per watch before summing. This is not a determination of the legally applicable VAT scheme.

Keep report date scopes distinct unless their definitions are explicitly changed: unfiltered Financials includes sold watches without sale dates, filtered Financials requires a sale date, Analytics uses sale date for sold watches and purchase date for active watches, and Dealer's Notebook uses Europe/Amsterdam month boundaries.

**Why:** Consolidating arithmetic is not permission to change accounting, tax treatment, or intentionally different report scopes. Such changes need a separately agreed definition.

**How to apply:** Keep margin defined as profit divided by sale revenue, and distinguish it from the existing purchase-price-based ROI. Preserve saved register-fee snapshots, including recorded zero values. Do not apply estimated Chrono24 fees to realized sales in addition to their recorded platform fees. Keep business expenses separate from watch-level costs, and preserve documented date scopes and missing-price disclosures.
