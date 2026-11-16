import { calculateTargetSalePriceCents } from "@shared/watch-financials";

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
  return calculateTargetSalePriceCents(cogsCents, targetMarginPercent, platformFeePercent);
}
