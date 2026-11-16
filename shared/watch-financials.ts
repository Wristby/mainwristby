/**
 * Shared watch-level financial calculations.
 *
 * All monetary values are integer cents. Sale margin is net profit divided by
 * sale price; purchase-price ROI remains net profit divided by purchase price.
 */

export interface WatchCostSource {
  purchasePrice?: number | null;
  importFee?: number | null;
  serviceFee?: number | null;
  polishFee?: number | null;
  watchRegister?: boolean | null;
  watchRegisterFeeSnapshot?: number | null;
  platformFees?: number | null;
  shippingFee?: number | null;
  insuranceFee?: number | null;
}

export interface WatchCostBreakdown {
  purchasePriceCents: number;
  importFeeCents: number;
  serviceFeeCents: number;
  polishFeeCents: number;
  watchRegisterFeeCents: number;
  platformFeesCents: number;
  shippingFeeCents: number;
  insuranceFeeCents: number;
  acquisitionCostsCents: number;
  sellingCostsCents: number;
  otherWatchCostsCents: number;
  totalCostsCents: number;
}

export interface SaleFinancialInput {
  salePriceCents: number;
  totalCostsCents: number;
  purchasePriceCents?: number;
  vatRatePercent?: number;
  /** Set for an explicitly recorded zero-value sale, rather than an empty estimate. */
  recordedSale?: boolean;
}

export interface SaleFinancialResult {
  salePriceCents: number;
  profitCents: number;
  marginPercent: number;
  /** ROI uses purchase price as its denominator, matching existing reports. */
  roiPercent: number;
  vatAmountCents: number;
  netAfterVatCents: number;
}

function cents(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
}

export function calculateWatchCostBreakdown(
  watch: WatchCostSource,
  defaultWatchRegisterFeeCents = 0,
): WatchCostBreakdown {
  const purchasePriceCents = cents(watch.purchasePrice);
  const importFeeCents = cents(watch.importFee);
  const serviceFeeCents = cents(watch.serviceFee);
  const polishFeeCents = cents(watch.polishFee);
  const watchRegisterFeeCents = watch.watchRegister
    ? cents(watch.watchRegisterFeeSnapshot ?? defaultWatchRegisterFeeCents)
    : 0;
  const platformFeesCents = cents(watch.platformFees);
  const shippingFeeCents = cents(watch.shippingFee);
  const insuranceFeeCents = cents(watch.insuranceFee);

  const acquisitionCostsCents =
    purchasePriceCents + importFeeCents + serviceFeeCents + polishFeeCents + watchRegisterFeeCents;
  const sellingCostsCents = platformFeesCents + shippingFeeCents + insuranceFeeCents;
  const otherWatchCostsCents = acquisitionCostsCents - purchasePriceCents + sellingCostsCents;

  return {
    purchasePriceCents,
    importFeeCents,
    serviceFeeCents,
    polishFeeCents,
    watchRegisterFeeCents,
    platformFeesCents,
    shippingFeeCents,
    insuranceFeeCents,
    acquisitionCostsCents,
    sellingCostsCents,
    otherWatchCostsCents,
    totalCostsCents: acquisitionCostsCents + sellingCostsCents,
  };
}

export function calculateSaleFinancials({
  salePriceCents: rawSalePrice,
  totalCostsCents: rawTotalCosts,
  purchasePriceCents: rawPurchasePrice = 0,
  vatRatePercent: rawVatRate = 0,
  recordedSale,
}: SaleFinancialInput): SaleFinancialResult {
  const salePriceCents = cents(rawSalePrice);
  const totalCostsCents = cents(rawTotalCosts);
  const purchasePriceCents = cents(rawPurchasePrice);
  const vatRatePercent = Number.isFinite(rawVatRate) ? Math.max(0, rawVatRate) : 0;
  const profitCents = (recordedSale ?? salePriceCents > 0) ? salePriceCents - totalCostsCents : 0;
  const marginPercent = salePriceCents > 0 ? (profitCents / salePriceCents) * 100 : 0;
  const roiPercent = purchasePriceCents > 0 ? (profitCents / purchasePriceCents) * 100 : 0;
  const vatAmountCents = profitCents > 0
    ? Math.round(profitCents * (vatRatePercent / 100))
    : 0;

  return {
    salePriceCents,
    profitCents,
    marginPercent,
    roiPercent,
    vatAmountCents,
    netAfterVatCents: profitCents - vatAmountCents,
  };
}

export function calculateWatchFinancials(
  watch: WatchCostSource,
  salePriceCents: number,
  vatRatePercent = 0,
  defaultWatchRegisterFeeCents = 0,
  recordedSale?: boolean,
) {
  const costs = calculateWatchCostBreakdown(watch, defaultWatchRegisterFeeCents);
  return {
    ...costs,
    ...calculateSaleFinancials({
      salePriceCents,
      totalCostsCents: costs.totalCostsCents,
      purchasePriceCents: costs.purchasePriceCents,
      vatRatePercent,
      recordedSale,
    }),
  };
}

export function calculateSaleFeeCents(salePriceCents: number, feePercent: number): number {
  if (!Number.isFinite(feePercent) || feePercent < 0) return 0;
  return Math.round(cents(salePriceCents) * feePercent / 100);
}

/** Sale price required for profit / sale price to reach the requested margin. */
export function calculateTargetSalePriceCents(
  costCents: number,
  targetMarginPercent: number,
  platformFeePercent = 0,
): number | null {
  if (!Number.isFinite(costCents) || costCents <= 0) return null;
  if (!Number.isFinite(targetMarginPercent) || targetMarginPercent < 0 || targetMarginPercent >= 100) {
    return null;
  }
  if (!Number.isFinite(platformFeePercent) || platformFeePercent < 0) return null;

  const remainingRate = 1 - (targetMarginPercent + platformFeePercent) / 100;
  if (remainingRate <= 0) return null;
  return Math.ceil(costCents / remainingRate);
}
