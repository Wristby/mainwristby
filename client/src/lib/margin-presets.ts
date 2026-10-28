export const COGS_MARGIN_TARGETS = [10, 15, 20] as const;

/**
 * Returns the sale price in cents needed for a gross margin based on COGS.
 * Margin is profit divided by sale price, matching the watch details page.
 */
export function calculateCogsMarginTargetPrice(
  cogsCents: number,
  targetMarginPercent: number,
): number | null {
  if (!Number.isFinite(cogsCents) || cogsCents <= 0) return null;
  if (!Number.isFinite(targetMarginPercent) || targetMarginPercent < 0 || targetMarginPercent >= 100) {
    return null;
  }

  return Math.round(cogsCents / (1 - targetMarginPercent / 100));
}
