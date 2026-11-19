import type { InventoryReturn, InventorySale } from "./schema";

export type InventorySaleWithReturns = InventorySale & { returns: InventoryReturn[] };

export interface SalesLifecycleSummary {
  revenueCents: number;
  purchaseCostsCents: number;
  otherAcquisitionCostsCents: number;
  acquisitionCostsCents: number;
  saleCostsCents: number;
  netProfitCents: number;
  returnedSaleCount: number;
  saleCount: number;
  returnRatePercent: number;
}

const isVoidedReturn = (item: InventoryReturn) =>
  item.status === "cancelled" || item.status === "declined";

const hasFinancialImpact = (item: InventoryReturn) =>
  item.refundAmountCents > 0
  || (item.shippingPayer === "seller" && item.shippingCostCents > 0)
  || item.inspectionCostCents > 0
  || item.cogsRestoredCents > 0
  || item.platformFeeRefunded;

export function getReturnAdjustmentCents(
  sale: InventorySale,
  returns: InventoryReturn[],
): number {
  return returns.filter(hasFinancialImpact).reduce((total, item) => {
    const returnShipping = item.shippingPayer === "seller" ? item.shippingCostCents : 0;
    const restoredCost = item.receivedDate ? item.cogsRestoredCents : 0;
    const refundedPlatformFee = item.platformFeeRefunded ? sale.platformFees : 0;
    return total
      - item.refundAmountCents
      - returnShipping
      - item.inspectionCostCents
      + restoredCost
      + refundedPlatformFee;
  }, 0);
}

export function getSaleCycleNetProfitCents(item: InventorySaleWithReturns): number {
  return item.profitAtSaleCents + getReturnAdjustmentCents(item, item.returns);
}

export function summarizeSalesLifecycle(
  items: InventorySaleWithReturns[],
): SalesLifecycleSummary {
  const revenueCents = items.reduce((sum, item) => {
    const refunds = item.returns
      .filter(record => record.refundAmountCents > 0)
      .reduce((subtotal, record) => subtotal + record.refundAmountCents, 0);
    return sum + item.salePrice - refunds;
  }, 0);
  const acquisitionCostsCents = items.reduce((sum, item) => {
    const restored = item.returns
      .filter((record) => record.receivedDate)
      .reduce((subtotal, record) => subtotal + record.cogsRestoredCents, 0);
    return sum + Math.max(0, item.acquisitionCostCents - restored);
  }, 0);
  const purchaseCostsCents = items.reduce((sum, item) => {
    const restored = item.returns
      .filter((record) => record.receivedDate)
      .reduce((subtotal, record) => subtotal + record.cogsRestoredCents, 0);
    return sum + Math.max(0, item.purchasePriceSnapshot - Math.min(item.purchasePriceSnapshot, restored));
  }, 0);
  const otherAcquisitionCostsCents = Math.max(0, acquisitionCostsCents - purchaseCostsCents);
  const saleCostsCents = items.reduce((sum, item) => {
    const records = item.returns.filter(hasFinancialImpact);
    const refundedFees = records
      .filter((record) => record.platformFeeRefunded)
      .reduce((subtotal, record) => subtotal + item.platformFees, 0);
    const returnCosts = records.reduce((subtotal, record) => subtotal
      + (record.shippingPayer === "seller" ? record.shippingCostCents : 0)
      + record.inspectionCostCents, 0);
    return sum + item.platformFees - Math.min(item.platformFees, refundedFees)
      + item.shippingFee + item.insuranceFee + returnCosts;
  }, 0);
  const returnedSaleIds = new Set(items
    .filter((item) => item.returns.some((record) =>
      Boolean(record.receivedDate) && !isVoidedReturn(record)))
    .map((item) => item.id));
  const saleCount = items.length;
  const returnedSaleCount = returnedSaleIds.size;
  return {
    revenueCents,
    purchaseCostsCents,
    otherAcquisitionCostsCents,
    acquisitionCostsCents,
    saleCostsCents,
    netProfitCents: items.reduce((sum, item) => sum + getSaleCycleNetProfitCents(item), 0),
    returnedSaleCount,
    saleCount,
    returnRatePercent: saleCount ? (returnedSaleCount / saleCount) * 100 : 0,
  };
}

export function groupReceivedReturnsByMonth(
  items: InventorySaleWithReturns[],
): Array<{ month: string; count: number }> {
  const counts = new Map<string, Set<number>>();
  for (const sale of items) {
    for (const item of sale.returns) {
      if (!item.receivedDate || isVoidedReturn(item)) continue;
      const month = item.receivedDate.slice(0, 7);
      const saleIds = counts.get(month) ?? new Set<number>();
      saleIds.add(sale.id);
      counts.set(month, saleIds);
    }
  }
  return Array.from(counts, ([month, saleIds]) => ({ month, count: saleIds.size }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
