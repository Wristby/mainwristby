export const COGS_MARGIN_TARGETS = [10, 15, 20] as const;

export function calculateCogsMarginTargetPrice(
  cogsCents: number,
  targetMarginPercent: number,
  platformFeePercent = 0,
) {
  const divisor = 1 - platformFeePercent / 100 - targetMarginPercent / 100;
  return divisor > 0 ? Math.ceil(cogsCents / divisor) : null;
}
