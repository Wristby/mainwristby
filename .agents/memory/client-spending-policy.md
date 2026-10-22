---
name: Client spending totals
description: Treatment of unknown sale amounts in client spending summaries
---
Client spending totals include only recorded sale amounts. Missing amounts still count as purchases, but the UI must disclose that they are excluded from the total. If all linked sales lack amounts, show “Not recorded”; no purchases means zero spending. An explicitly recorded zero is not missing.

**Why:** Treating unknown amounts as zero without disclosure makes incomplete financial records look complete. This policy keeps summaries consistent with the per-watch history.

**How to apply:** Preserve this distinction in future client spending reports and summaries. Sum integer cents before formatting, and use the same legacy-price interpretation as the watch history.
