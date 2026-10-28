export const COGS_MARGIN_TARGETS = [10, 15, 20] as const;

/**
 * Returns the sale price in cents needed for a gross margin based on COGS
 * after the platform fee. Margin is profit divided by sale price, matching
 * the watch details page.
 */
export function calculateCogsMarginTargetPrice(
  cogsCents: number,
  targetMarginPercent: number,
  platformFeePercent = 0,
): number | null {
  if (!Number.isFinite(cogsCents) || cogsCents <= 0) return null;
  if (!Number.isFinite(targetMarginPercent) || targetMarginPercent < 0 || targetMarginPercent >= 100) {
    return null;
  }
  if (!Number.isFinite(platformFeePercent) || platformFeePercent < 0) return null;

  const remainingRate = 1 - (targetMarginPercent + platformFeePercent) / 100;
  if (remainingRate <= 0) return null;

  // Round up so cent rounding does not put the realized margin below target.
  return Math.ceil(cogsCents / remainingRate);
}
