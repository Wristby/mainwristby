export type OmegaTimingPreset = {
  id: string;
  label: string;
  beatRateVph: number | null;
  liftAngleDegrees: number | null;
  confidenceLabel: string;
  note: string;
  sources: Array<{ label: string; url: string }>;
};

export type TimingPresetValues = {
  liftAngleDegrees: number;
  beatRateVph: number | null;
};

const omega2500Guide =
  "https://www.cousinsuk.com/PDF/categories/4435_Omega%202500A,2500B,2500C,2500D.pdf";
const omega2500EarlierGuide =
  "https://mccawcompany.com/wp-content/uploads/2020/04/omega_2500abc.pdf";
const omega8500Guide =
  "https://www.awci.com/wp-content/uploads/2018/03/Omega_8500-8501-8900-8901_TECH_E.pdf";
const omega9300Guide =
  "https://www.cousinsuk.com/PDF/categories/8597_Omega%209300,%209301,%209900,%209901.pdf";

export const OMEGA_TIMING_PRESETS: OmegaTimingPreset[] = [
  {
    id: "omega-2500a",
    label: "Calibre 2500A",
    beatRateVph: 28_800,
    liftAngleDegrees: null,
    confidenceLabel: "Omega service guides",
    note: "Omega distinguishes the 30° Co-Axial lift angle from a 38° setting used on specific Witschi machines. No equivalent browser-analyzer mode is verified, so the current lift angle is kept.",
    sources: [
      { label: "Omega 2500A technical guide", url: "https://boley.de/downloads/1ece3e416fd4423892bf2573756b92d1/OMEGA-2500.pdf" },
      { label: "Omega 2500 A/B/C/D guide", url: omega2500Guide },
    ],
  },
  {
    id: "omega-2500b",
    label: "Calibre 2500B",
    beatRateVph: null,
    liftAngleDegrees: null,
    confidenceLabel: "Omega guides; table conflict",
    note: "Omega guide tables conflict on this variant’s beat rate. The current rate and lift angle are left unchanged; verify the movement version before measuring.",
    sources: [
      { label: "Omega 2500 A/B/C guide", url: omega2500EarlierGuide },
      { label: "Omega 2500 A/B/C/D guide", url: omega2500Guide },
    ],
  },
  {
    id: "omega-2500c",
    label: "Calibre 2500C",
    beatRateVph: 25_200,
    liftAngleDegrees: null,
    confidenceLabel: "Omega service guides",
    note: "The rate is documented at 25,200 vph. Omega’s 38° timing setting is tied to named equipment; this browser analyzer has no verified matching Co-Axial mode, so the current angle is kept.",
    sources: [
      { label: "Omega 2500 A/B/C guide", url: omega2500EarlierGuide },
      { label: "Omega 2500 A/B/C/D guide", url: omega2500Guide },
    ],
  },
  {
    id: "omega-2500d",
    label: "Calibre 2500D",
    beatRateVph: 25_200,
    liftAngleDegrees: 38,
    confidenceLabel: "Omega technical guide",
    note: "Omega’s guide lists 38°. Co-Axial amplitude behavior has not been validated in this browser analyzer; treat amplitude as a reference and allow manual adjustment.",
    sources: [{ label: "Omega 2500 A/B/C/D guide", url: omega2500Guide }],
  },
  {
    id: "omega-2007a",
    label: "Calibre 2007A",
    beatRateVph: 25_200,
    liftAngleDegrees: 38,
    confidenceLabel: "Omega technical guide; device-specific caveat",
    note: "Omega specifies 38° and a special test mode for named Witschi equipment. This browser analyzer does not implement a verified equivalent mode, so Co-Axial amplitude may be inaccurate.",
    sources: [{ label: "Omega 2007A technical guide", url: "https://mccawcompany.com/wp-content/uploads/2020/04/omega_2007a.pdf" }],
  },
  {
    id: "omega-8500-8900",
    label: "Calibres 8500 / 8501 / 8900 / 8901",
    beatRateVph: 25_200,
    liftAngleDegrees: 38,
    confidenceLabel: "Omega rate; secondary lift-angle report",
    note: "Omega confirms 25,200 vph. The 38° angle comes from a watchmaker-community reference, not the Omega service guide. Confirm it before relying on amplitude; browser Co-Axial amplitude is not validated.",
    sources: [
      { label: "Omega 8500/8900 technical guide", url: omega8500Guide },
      { label: "Watchmaker discussion of 8500 angle", url: "https://omegaforums.net/threads/lift-angle-setting-for-cal-8500.34439" },
    ],
  },
  {
    id: "omega-8800",
    label: "Calibre 8800",
    beatRateVph: 25_200,
    liftAngleDegrees: null,
    confidenceLabel: "Rate from secondary references; angle disputed",
    note: "References report 25,200 vph, but published angle claims conflict (36° versus 38°). The angle is left unchanged until a movement-specific source resolves it.",
    sources: [
      { label: "WatchScope 8800 reference", url: "https://watchscope.app/en/calibers/omega-8800" },
      { label: "Caliber Corner 8800 reference", url: "https://calibercorner.com/omega-caliber-8800" },
      { label: "Omega Co-Axial angle discussion", url: "https://omegaforums.net/threads/lift-angles-for-new-coaxial-calibres.98306" },
    ],
  },
  {
    id: "omega-9300-9900",
    label: "Calibres 9300 / 9301 / 9900 / 9901",
    beatRateVph: 28_800,
    liftAngleDegrees: null,
    confidenceLabel: "Omega technical guide",
    note: "Omega confirms 28,800 vph but points to a separate timing-machine program list for further settings. No lift angle is included here, so the current angle is kept.",
    sources: [{ label: "Omega 9300/9900 technical guide", url: omega9300Guide }],
  },
  {
    id: "omega-3861",
    label: "Calibre 3861",
    beatRateVph: 21_600,
    liftAngleDegrees: null,
    confidenceLabel: "Secondary rate reference; angle unconfirmed",
    note: "A specialist movement reference reports 21,600 vph and explicitly marks the lift angle unconfirmed. The current angle is kept; confirm the movement specification before using amplitude.",
    sources: [
      { label: "Caliber Corner 3861 reference", url: "https://calibercorner.com/omega-caliber-3861" },
      { label: "Omega operating instructions", url: "https://www.omegawatches.com/media/pdf/user-manuals/OMEGA_Operating_Instructions_EN.pdf" },
    ],
  },
];

export function applyOmegaTimingPreset(
  preset: OmegaTimingPreset,
  current: TimingPresetValues,
): TimingPresetValues {
  return {
    liftAngleDegrees: preset.liftAngleDegrees ?? current.liftAngleDegrees,
    beatRateVph: preset.beatRateVph ?? current.beatRateVph,
  };
}
