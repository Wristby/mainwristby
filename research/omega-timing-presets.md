# Modern Omega Timing Presets

**Research Date:** 2026-11-24  
**Depth:** Standard  
**Sources Consulted:** 21

## Executive Summary

I reviewed Omega movement lists and service documents, then cross-checked the Timegrapher settings the WRISTBY browser integration can accept. The app now offers searchable presets for the Omega calibres with usable, traceable timing data: 2500A/B/C/D, 2007A, 8500/8501/8900/8901, 8800, 9300/9301/9900/9901, and 3861. These are starter settings, not a complete list of every modern Omega movement. Omega’s 2024 operating manual names many more mechanical calibres, but the sources available for this pass do not verify timing fields for all of them.[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf)

The selector applies known beat rate and lift angle values to editable fields for the current watch. Unknown or disputed values stay as they were, manual changes remain possible, and saving still uses the existing per-watch settings endpoint. A preset does not change readings already saved. In particular, the 2500B rate and the 8800 family lift angle are not auto-filled because the references conflict.[[2]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf)[[4]](https://watchscope.app/en/calibers/omega-8800)[[5]](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306)

The important Co-Axial limitation is that an Omega lift-angle number or a Witschi-specific service instruction does not prove this browser analyzer reproduces Omega’s recommended machine mode. The interface labels those limitations, and timing readings should be treated as a personal reference rather than a validated Omega service measurement.[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf)[[7]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf)[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)

## Background

The requested preset fields are beat rate (vibrations per hour) and lift angle. Beat rate helps the analyzer identify a movement’s tick frequency; lift angle is used when calculating displayed amplitude. They do not, on their own, encode every service-machine setting for a particular escapement.[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)[[9]](https://github.com/peterhudson/timegrapher/blob/main/docs/reference/agent-interface.md)

“Modern Omega calibres” needs a practical boundary. Omega’s 2024 operating instructions list a broad mix of mechanical families, chronographs, GMT movements, and older designs, but that list is not a current-production catalogue or a timing specification sheet.[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) I treated “modern” as recent/relevant mechanical families surfaced by those instructions and the available Omega service guides, while excluding quartz movements from the timing preset feature. The result is deliberately a source-verified subset. It favors a safe starting value over an apparently comprehensive menu populated with assumptions.

## Key Findings

### Finding 1: Beat rates and lift angles are not equally well documented

Omega service guides give solid beat-rate data for several families, but lift-angle evidence is patchier. The following table describes what the current selector actually does. “Keep current” means the user’s existing editable value is preserved rather than replaced with an inferred number.

| Preset | Beat rate applied | Lift angle applied | Evidence and handling |
|---|---:|---:|---|
| 2500A | 28,800 vph | Keep current | Omega lists 28,800 vph and distinguishes a 30° Co-Axial angle from 38° settings on named Witschi machines; neither is assumed to be a universal browser setting.[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf) |
| 2500B | Keep current | Keep current | Omega guides conflict/incompletely tabulate the variant; the selector deliberately avoids choosing a rate.[[2]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf) |
| 2500C | 25,200 vph | Keep current | The 2009 guide identifies the 3.5 Hz version; its 38° instructions are tied to particular timing equipment.[[2]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf) |
| 2500D | 25,200 vph | 38° | Omega’s 2011 guide lists both values. The browser analyzer is not verified to reproduce the service machine’s Co-Axial mode.[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf)[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf) |
| 2007A | 25,200 vph | 38° | Omega specifies these values for service timing, with a special mode on named Witschi equipment.[[7]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf) |
| 8500 / 8501 / 8900 / 8901 | 25,200 vph | 38° (lower confidence) | Omega confirms the beat rate; the service guide does not list lift angle. The 38° figure comes from a community report, so the preset identifies it as non-Omega-confirmed.[[10]](https://www.awci.com/wp-content/uploads/2018/03/Omega_8500-8501-8900-8901_TECH_E.pdf)[[11]](https://omegaforums.net/threads/lift-angle-setting-for-cal-8500.34439) |
| 8800 | 25,200 vph | Keep current | Secondary references support the rate, but angle reports conflict between 36° and 38°; no movement-specific primary source resolved that disagreement.[[4]](https://watchscope.app/en/calibers/omega-8800)[[12]](https://calibercorner.com/omega-caliber-8800)[[5]](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306) |
| 9300 / 9301 / 9900 / 9901 | 28,800 vph | Keep current | Omega confirms the rate and points to a separate timing-machine program list; no angle is inferred here.[[13]](https://www.cousinsuk.com/PDF/categories/8597_Omega%209300,%209301,%209900,%209901.pdf)[[14]](https://watchbase.com/omega/caliber/9900) |
| 3861 | 21,600 vph | Keep current | A specialist movement reference reports the rate but marks lift angle unconfirmed; the 2024 Omega manual identifies 3861 in its mechanical chronograph coverage.[[15]](https://calibercorner.com/omega-caliber-3861)[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) |

The 2500B case shows why variants should remain separate: a nearby family member’s setting is not safe evidence for this version. The UI now says the rate is unchanged when its source is unresolved, and applying that preset will not overwrite an existing manual rate. The same rule is used for the 8800 family’s disputed angle.[[2]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf)[[4]](https://watchscope.app/en/calibers/omega-8800)[[5]](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306)

### Finding 2: Co-Axial service instructions are device-specific

Omega’s 2500A material distinguishes the movement’s Co-Axial lift angle from the angle to enter on specific Witschi machines. The 2007A guide likewise names a 38° setting and a special test mode for particular equipment.[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf)[[7]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf) These instructions are useful context, but they do not establish that a browser timegrapher can replicate the same signal processing or correction.

The upstream Timegrapher documentation describes configurable lift angle and beat-rate/calibre data, not a verified Omega Co-Axial mode. Inspection of its shipped train-wheel data also found no Omega entries, so it cannot fill missing Omega presets for us.[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)[[9]](https://github.com/peterhudson/timegrapher/blob/main/docs/reference/agent-interface.md)[[16]](https://raw.githubusercontent.com/peterhudson/timegrapher/main/crates/timegrapher-core/data/train-wheels.json) Therefore, even when a known angle is prefilled, amplitude from this browser integration should not be presented as a certified or service-equivalent result. Rate and beat-error readings can still serve as a consistent personal reference when the microphone setup is repeatable.

### Finding 3: The researched list is not every modern Omega movement

Omega’s 2024 manual names many additional mechanical families, including 8400-series, 8802/8803, 891x/892x/893x, several chronograph families, and more. That manual is useful for identifying coverage gaps, but it is an operating guide, not a source for every family’s beat rate and lift angle.[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) Other secondary movement lists help identify families but do not provide consistent, primary-source timing data for each variant.[[17]](https://www.strapcode.com/blogs/omega-watches/omega-calibers-part-2-modern-omega-movements)[[18]](https://watchguy.co.uk/cgi-bin/lift_angles)

The current presets should consequently be read as “available, sourced starting points,” not “all Omega calibres.” Some popular chronograph families have secondary references only; for example, 3861’s rate is not accompanied by a confirmed angle in the source used here.[[15]](https://calibercorner.com/omega-caliber-3861)[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) A current Omega product page or a recent launch story may identify a watch without exposing the service specification needed to build a reliable preset.[[19]](https://www.omegawatches.com/watches/speedmaster/moonwatch-professional/product)

## Analysis

The value of these presets is reducing setup friction without concealing uncertainty. A single numeric field for every calibre would look convenient, but it would blur three distinct cases: official movement data, a service-machine-specific setting, and a community-reported value. The catalog keeps those cases visible through its confidence label and note. In particular, the 2500A guide’s 30°/38° distinction and the disputed 8800 angle are not normalized into one universal Co-Axial number.[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf)[[4]](https://watchscope.app/en/calibers/omega-8800)[[5]](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306)

Per-watch storage matters because lift angle and beat rate belong to the movement being measured, not to a global account preference. The app’s existing settings and reading endpoints are already keyed by inventory item. Applying a preset changes only the editable values on screen; the owner explicitly saves them, and readings retain their measurement snapshot. That makes later manual corrections possible without rewriting old records.

The safest operational split is: use an official beat rate where the service guide is clear; apply lift angle only when the evidence is sufficiently specific; keep the previous value when documentation is absent or conflicted; and expose the source so the owner can check the movement version. A low-confidence value such as 38° for the 8500 family remains visible as community-sourced, not silently promoted to Omega specification.[[10]](https://www.awci.com/wp-content/uploads/2018/03/Omega_8500-8501-8900-8901_TECH_E.pdf)[[11]](https://omegaforums.net/threads/lift-angle-setting-for-cal-8500.34439)

This first pass does not imply that the generated readings are accurate enough for regulation or service decisions. Omega’s equipment-specific instructions and the analyzer’s own configuration documentation are different evidence streams. Until a Co-Axial watch is compared against a known-good timing machine in the same positions and wind state, WRISTBY should frame these readings as a repeatable personal log.[[7]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf)[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)[[20]](https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles)

## Limitations

The preset coverage is not exhaustive. Omega’s manual includes many more recent mechanical calibres than could be matched to reliable, variant-specific timing sources in this pass; unsupported calibres remain available through manual lift-angle and beat-rate entry.[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) The 2500B tables are inconsistent, 8800 angle reports conflict, 8500-family 38° is secondary evidence, and 3861’s angle remains unconfirmed.[[2]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf)[[3]](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf)[[4]](https://watchscope.app/en/calibers/omega-8800)[[5]](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306)[[11]](https://omegaforums.net/threads/lift-angle-setting-for-cal-8500.34439)[[15]](https://calibercorner.com/omega-caliber-3861)

Omega service information is partly equipment-specific, and no evidence located here verifies that the browser analyzer reproduces a Witschi Co-Axial mode. No live bench comparison or acoustic validation was performed. The 2024 user manual and older technical guides are useful for movement coverage and specifications, but they do not establish the complete set of calibres currently sold in 2026.[[7]](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf)[[6]](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf)[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf)

## Recommendations

1. Use the selector when the calibre is confirmed from the movement marking or watch documentation. Review the confidence note and linked source before relying on amplitude, especially for 8500-family and Co-Axial models.
2. For a 2500B or 8800, keep or manually enter the value confirmed for that exact movement; the preset intentionally preserves the current field where evidence is conflicted.
3. Treat saved timing readings as comparative records for the same watch and setup. Do not use this browser implementation as a substitute for Omega’s named service equipment or as a calibration certificate.
4. Extend the catalog only when variant-specific evidence is available. A useful next coverage pass would prioritize calibres present in the 2024 manual but absent from the selector, then add each as its own source-linked entry rather than grouping variants solely because they look related.[[1]](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf)[[10]](https://www.awci.com/wp-content/uploads/2018/03/Omega_8500-8501-8900-8901_TECH_E.pdf)[[13]](https://www.cousinsuk.com/PDF/categories/8597_Omega%209300,%209301,%209900,%209901.pdf)
5. When the user tests the feature, compare a known Omega watch against a calibrated timegrapher and record movement, position, winding state, microphone placement, and both devices’ settings. That would validate the practical browser setup, not the Omega service procedures themselves.[[8]](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md)[[21]](https://www.witschi.com/en/products/chronomaster-pro-2/)

## Sources

1. [OMEGA Operating Instructions](https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf) -- Published 2024-01; 2nd edition, Tier 1
2. [OMEGA Technical Guide: Calibre 2500 A/B/C](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf) -- Published 2009-06-04, Tier 1
3. [OMEGA Technical Guide: Calibre 2500 A/B/C/D](https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf) -- Published 2011-09-29, Tier 1
4. [Omega 8800: Specs and How to Measure It](https://watchscope.app/en/calibers/omega-8800) -- Published n.d., Tier 3
5. [Lift Angles for New Coaxial Calibres](https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306) -- Published n.d., Tier 3
6. [OMEGA Technical Guide: Calibre 2500A](https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf) -- Published 2004-07-06, Tier 1
7. [OMEGA Technical Guide: Calibre 2007A](https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf) -- Published 2009-01-08, Tier 1
8. [Timegrapher: Settings and Calibres](https://github.com/peterhudson/timegrapher/blob/main/docs/user-guide/24-settings-and-calibres.md) -- Published 2026-11-20 (latest commit shown on fetched page), Tier 2
9. [Timegrapher Agent Interface Reference](https://github.com/peterhudson/timegrapher/blob/main/docs/reference/agent-interface.md) -- Published n.d., Tier 2
10. [OMEGA Technical Guide: Calibre 8500/8501–8900/8901](https://www.awci.com/wp-content/uploads/2018/03/Omega_8500-8501-8900-8901_TECH_E.pdf) -- Published 2015-10-15, Tier 1
11. [Lift Angle Setting for Cal. 8500](https://omegaforums.net/threads/lift-angle-setting-for-cal-8500.34439) -- Published 2016-01-19, Tier 3
12. [Omega Caliber 8800 Watch Movement](https://calibercorner.com/omega-caliber-8800) -- Published n.d., Tier 3
13. [OMEGA Technical Guide: Calibre 9300/9301–9900/9901](https://www.cousinsuk.com/PDF/categories/8597_Omega%209300,%209301,%209900,%209901.pdf) -- Published 2016-10-18, Tier 1
14. [Omega Caliber 9900](https://watchbase.com/omega/caliber/9900) -- Published n.d., Tier 3
15. [Omega Caliber 3861 Watch Movement](https://calibercorner.com/omega-caliber-3861) -- Published n.d., Tier 3
16. [Timegrapher Shipped Train-Wheels Table](https://raw.githubusercontent.com/peterhudson/timegrapher/main/crates/timegrapher-core/data/train-wheels.json) -- Published n.d., Tier 2
17. [Omega Calibres – Modern Omega Movements](https://www.strapcode.com/blogs/omega-watches/omega-calibers-part-2-modern-omega-movements) -- Published 2021-04-05, Tier 3
18. [WatchGuy Lift Angles](https://watchguy.co.uk/cgi-bin/lift_angles) -- Published n.d., Tier 2
19. [OMEGA Speedmaster Moonwatch Professional Collection](https://www.omegawatches.com/watches/speedmaster/moonwatch-professional/product) -- Published n.d., Tier 1
20. [Watch Lift Angles: Essential Knowledge for Watchmakers](https://watchmakingtools.com/watchmaking-resources/watch-movement-lift-angles) -- Published n.d., Tier 3
21. [Witschi ChronoMaster PRO](https://www.witschi.com/en/products/chronomaster-pro-2/) -- Published n.d., Tier 3
