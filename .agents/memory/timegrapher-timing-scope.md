---
name: Timegrapher timing scope
description: User's stated scope for integrating Timegrapher into WRISTBY.
---

The user said the Timegrapher integration will be run locally, used only by them, and not distributed.

**Why:** the user explicitly clarified this when discussing the upstream project's license.

**How to apply:** Scope timing integration decisions to this private, personal use case. Do not expand the work for public distribution unless the user asks.

The timing printout targets an 80 mm thermal receipt printer and uses English labels with the WRISTBY logo.

**Why:** The user specified 80 mm thermal paper and asked for the timing results to print in English with the logo at the top.

**How to apply:** Keep the receipt layout within 80 mm and verify the final fit on the actual printer when available.

For Omega Co-Axial presets, keep movement-specific lift-angle data separate from settings required by named timing-machine models. Preserve existing editable values when sources conflict or do not verify a field, and label lower-confidence references clearly.

**Why:** Omega service guides describe equipment-specific Co-Axial modes, while the browser analyzer has no verified equivalent.

**How to apply:** Only prefill sourced values; do not present a browser preset as an Omega service-machine mode or treat unverified amplitude as calibrated.
