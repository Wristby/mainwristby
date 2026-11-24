# Research Notes: Modern Omega Timing Presets

**Status:** complete
**Depth:** Standard

## Plan

- **Question:** Which modern mechanical Omega calibers have verifiable beat-rate and lift-angle settings suitable for per-watch Timing presets?
- **Scope:** Current and recent mechanical Omega calibers, including Co-Axial families; quartz excluded. Identify a practical modern boundary and distinguish verified values from gaps.
- **Audience:** WRISTBY owner using a browser timegrapher and external contact microphone.
- **Deliverable:** A source-backed caliber preset list, limitations report, and per-watch selector using existing editable settings.

## Focus Areas

| # | Area | Status | Sources |
|---|---|---|---|
| 1 | Current/recent mechanical caliber scope and beat rates | done | 7 |
| 2 | Co-Axial families and documented settings | done | 7 |
| 3 | Modern chronograph and high-frequency caliber families | done | 7 |
| 4 | Lift-angle tables and evidence quality | done | 7 |
| 5 | What browser timegrapher settings mean for Co-Axial movements | done | 8 |

## Coverage Checklist

- [x] Working scope: mechanical Omega families listed in the 2024 manual, focusing on recent/Co-Axial movements; this is not a claim of every caliber currently for sale [@omega-operating-manual].
- [x] Verified rates for the selected preset families: 2500 variants (with table caveats), 2007A, 8500/8501, 8900/8901, 9300/9301, and 9900/9901 [@omega-2500abc-guide-2009] [@omega-2007a-guide] [@omega-8500-8900-guide-2015] [@omega-9300-9900-guide-2016].
- [x] Record lift angles only where a movement-specific setting is source-backed; leave conflicting or unsupported values unchanged [@omega-2500a-guide-2004] [@omega-2500abc-guide-2009] [@omega-8500-lift-angle-forum].
- [x] Co-Axial timing-machine instructions include vendor-specific programs; no source verifies an equivalent Co-Axial mode in this browser analyzer [@omega-2007a-guide] [@omega-2500a-guide-2004] [@timegrapher-settings].
- [x] Conflicts are documented: 2500B rate tables and 8800 lift angle; lower-confidence 8500 angle is marked rather than presented as Omega-confirmed [@omega-2500abc-guide-2009] [@omega-2500-guide-2011] [@watchscope-omega-8800] [@omega-forums-coaxial-angles].
- [x] Confirm preset application and manual overrides keep editable per-watch settings, leave uncertain values unchanged, and do not modify saved reading history.

## Findings Log

_[@key] markers reference sources in research/sources.json; they become numbered citations in the final report._

### Current/recent mechanical caliber scope and beat rates

- Omega’s 2024 manual enumerates a wide range of mechanical calibers; it defines a useful coverage boundary but does not prove which are still sold today [@omega-operating-manual].
- Omega’s 2015 service guide confirms 25,200 vph for the 8500/8501 and 8900/8901 families; it does not publish their lift angle [@omega-8500-8900-guide-2015].
- Omega’s 2016 service guide confirms 28,800 vph for 9300/9301 and 9900/9901, but defers timing-machine settings to a separate document [@omega-9300-9900-guide-2016].
- Omega’s 2009 and 2011 guides have incomplete/inconsistent 2500B overview tables; comparison tables say 28,800 vph, but the guides do not make a clean, consistent standalone table for B [@omega-2500abc-guide-2009] [@omega-2500-guide-2011].
- The Omega 2500 guide has conflicting 2500B frequency entries in its overview and version-comparison material; variants must not be collapsed into one 2500 preset [@omega-2500-guide-2011].

### Co-Axial families and documented settings

- Omega’s 2007A guide reports 25,200 vph and specifies 38° on named equipment; it also limits accurate amplitude results to newer Witschi equipment using its specified test mode [@omega-2007a-guide].
- Omega’s 2009 2500 guide says the lift-angle setting varies by Witschi model; the 2500A guide distinguishes the 30° Co-Axial angle from instrument-specific 38° settings [@omega-2500abc-guide-2009] [@omega-2500a-guide-2004].
- Omega’s 2500A guide distinguishes a 30° Co-Axial lift angle from a 38° setting required on named instruments [@omega-2500a-guide-2004].
- Search results list caliber-specific beat rate and lift-angle values for some families; each preset value needs fetched evidence and cross-checking.

### Modern chronograph and high-frequency caliber families

- Secondary references report 21,600 vph for 3861 and 28,800 vph for 9900, but lift angles are unconfirmed or supported only by community statements; do not present them as complete service presets [@calibercorner-omega-3861] [@watchbase-omega-9900] [@omega-forums-coaxial-angles].
### Lift-angle tables and evidence quality

- Omega publishes variant-specific 2500 data, while specialist lists sometimes flatten variants; the Omega guide must take precedence where the values conflict [@omega-2500-guide-2011] [@watchguy-lift-angles].
- 8800 lift angle is disputed (36° versus 38°); no primary source resolved it. For 8500, a forum cites 38° but Omega’s 2015 service guide does not confirm that angle; treat it as lower-confidence [@watchscope-omega-8800] [@omega-forums-coaxial-angles] [@omega-8500-8900-guide-2015] [@omega-8500-lift-angle-forum].
### What browser timegrapher settings mean for Co-Axial movements

- Timegrapher docs state that a selected lift angle affects amplitude calculation, sources can disagree, and its shipped table includes no Omega entries; the analyzer's use of a setting is not validation of Omega Co-Axial measurements [@timegrapher-settings] [@timegrapher-agent-interface] [@timegrapher-shipped-calibre-table].
- Omega warns Co-Axial signals are less clear and provides instrument-specific instructions. No source establishes that this browser analyzer implements an equivalent special mode [@omega-2500a-guide-2004] [@omega-2007a-guide] [@timegrapher-settings].
## Conflicts & Open Questions

- Omega’s 2500A guide includes both 30° and 38° and specifies a 38° setting on named timing machines; that is not a universal setting for all Co-Axial watches.
- Omega’s 2500 guide has an internal frequency discrepancy for 2500B; do not include an unqualified 2500B preset until resolved.
- 8800 lift angle is reported as both 36° and 38° in secondary sources; no official source found yet resolves the conflict.
- Omega technical guides verify beat rates for some 8500/8900 and 2500 variants but do not provide newer-family lift angles.
- Omega describes Co-Axial acoustic signals as less clear and names special settings on specific Witschi devices; this does not prove this browser analyzer has a Co-Axial mode.

## Gaps

- Omega’s 2024 operating manual is a useful modern movement scope reference, but it does not establish which calibers remain in production in 2026; the recent Observatory page does not identify its caliber.
- Modern caliber coverage is therefore a source-verified subset, not a complete 2026 catalog. Several entries, including 3861, have only secondary frequency data; 8800 has an unresolved angle conflict.
- The upstream Timegrapher shipped table was inspected and contains no Omega mechanical entries, so it cannot supply missing Omega settings.
- The 2500B selector entry is included only as a source note and preserves the current beat rate and angle because the guides conflict.
- The preset catalog is a verified subset, not an exhaustive list of the mechanical calibres in Omega’s 2024 operating manual; unsupported calibres remain manually configurable.
- Focused type and behavior tests verify the preset helper, independent per-watch settings, and unchanged reading history; no calibrated bench comparison was performed.