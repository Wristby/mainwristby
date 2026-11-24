# Research Notes: Modern Omega Timing Presets

**Status:** cross-checking
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

- [ ] Define which mechanical calibers count as modern for this preset list.
- [ ] Verify beat rates for included caliber families.
- [ ] Verify lift angles by caliber; leave unknown values unset rather than infer them.
- [ ] Check whether Co-Axial movements need a special analyzer mode or only correct measurement settings.
- [ ] Identify conflicting or weakly sourced settings and state how they are handled.
- [ ] Confirm presets can populate existing per-watch editable settings without changing past readings.

## Findings Log

_[@key] markers reference sources in research/sources.json; they become numbered citations in the final report._

### Current/recent mechanical caliber scope and beat rates

- Omega’s 2024 manual enumerates a wide range of mechanical calibers; it defines a useful coverage boundary but does not prove which are still sold today [@omega-operating-manual].
- Omega’s 2015 service guide confirms 25,200 vph for the 8500/8501 and 8900/8901 guide families [@omega-8500-8900-guide-2015].
- The Omega 2500 guide has conflicting 2500B frequency entries in its overview and version-comparison material; variants must not be collapsed into one 2500 preset [@omega-2500-guide-2011].

### Co-Axial families and documented settings

- Omega’s 2007A guide reports 25,200 vph and specifies 38° on named equipment; it also limits accurate amplitude results to newer Witschi equipment using its specified test mode [@omega-2007a-guide].
- Omega’s 2500A guide distinguishes a 30° Co-Axial lift angle from a 38° setting required on named instruments [@omega-2500a-guide-2004].
- Search results list caliber-specific beat rate and lift-angle values for some families; each preset value needs fetched evidence and cross-checking.

### Modern chronograph and high-frequency caliber families

- Secondary references report 21,600 vph for 3861 and 28,800 vph for 9900, but lift angles are unconfirmed or supported only by community statements; do not present them as complete service presets [@calibercorner-omega-3861] [@watchbase-omega-9900] [@omega-forums-coaxial-angles].
### Lift-angle tables and evidence quality

- Omega publishes variant-specific 2500 data, while specialist lists sometimes flatten variants; the Omega guide must take precedence where the values conflict [@omega-2500-guide-2011] [@watchguy-lift-angles].
- 8800 lift angle is disputed (36° versus 38°); no primary source resolved it. Recent 8500/8900 service guides provide beat rate but no lift angle [@watchscope-omega-8800] [@omega-forums-coaxial-angles] [@omega-8500-8900-guide-2015].
### What browser timegrapher settings mean for Co-Axial movements

- Timegrapher docs state a selected lift angle affects amplitude calculation and sources can disagree; the analyzer supports per-caliber beat-rate/lift-angle values but does not verify Omega Co-Axial performance [@timegrapher-settings].
- Omega warns Co-Axial signals are less clear and provides instrument-specific instructions. No source establishes that this browser analyzer implements an equivalent special mode [@omega-2500a-guide-2004] [@omega-2007a-guide] [@timegrapher-settings].
## Conflicts & Open Questions

- Omega’s 2500A guide includes both 30° and 38° and specifies a 38° setting on named timing machines; that is not a universal setting for all Co-Axial watches.
- Omega’s 2500 guide has an internal frequency discrepancy for 2500B; do not include an unqualified 2500B preset until resolved.
- 8800 lift angle is reported as both 36° and 38° in secondary sources; no official source found yet resolves the conflict.
- Omega technical guides verify beat rates for some 8500/8900 and 2500 variants but do not provide newer-family lift angles.
- Omega describes Co-Axial acoustic signals as less clear and names special settings on specific Witschi devices; this does not prove this browser analyzer has a Co-Axial mode.

## Gaps

- Omega’s 2024 operating manual is a useful modern movement scope reference, but it does not establish which calibers remain in production in 2026.
- Many recent caliber lift angles and several movement frequencies remain unverified; these must stay unset or out of the preset list.