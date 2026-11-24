import type { InventoryReturn, InventorySale } from "./schema";

export type InventorySaleWithReturns = InventorySale & { returns: InventoryReturn[] };

export type CurrentInventoryDelivery = {
  id: number;
  status: string;
  deliveredDate: string | null;
};

/** Use the current watch delivery date for its latest sale cycle, including legacy unsynced snapshots. */
export function applyCurrentDeliveryToLatestSaleCycles(
  sales: readonly InventorySale[],
  currentInventory: readonly CurrentInventoryDelivery[],
): InventorySale[] {
  const currentById = new Map(currentInventory.map(item => [item.id, item]));
  const latestCycleByInventoryId = new Map<number, number>();

  for (const sale of sales) {
    if (sale.inventoryId == null) continue;
    const latestCycle = latestCycleByInventoryId.get(sale.inventoryId) ?? 0;
    if (sale.cycleNumber > latestCycle) {
      latestCycleByInventoryId.set(sale.inventoryId, sale.cycleNumber);
    }
  }

  return sales.map(sale => {
    if (sale.inventoryId == null || latestCycleByInventoryId.get(sale.inventoryId) !== sale.cycleNumber) {
      return sale;
    }
    const current = currentById.get(sale.inventoryId);
    if (!current || current.status !== "sold") return sale;
    return { ...sale, deliveredDate: current.deliveredDate };
  });
}

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

export interface MonthlySalesLifecycle {
  returnCount: number;
  refundAmountCents: number;
  sellerPaidShippingCents: number;
  inspectionCostCents: number;
  saleCycleCount: number;
  resaleCount: number;
  saleCycleProfitCents: number;
  returnAdjustmentCents: number;
  returnAdjustedProfitCents: number;
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

const csvEscape = (value: string | number | null | undefined) => {
  let text = String(value ?? "");
  const isNumericCell = typeof value === "number" || /^-?\d+(?:\.\d+)?$/.test(text);
  if (!isNumericCell && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")
    ? `"${text.replace(/"/g, '""')}"`
    : text;
};

const formatCsvDate = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value.toISOString() : value;
  return date.slice(0, 10);
};

const formatCsvMoney = (cents: number) => (cents / 100).toFixed(2);

export function buildReturnReconciliationCsv(items: InventorySaleWithReturns[]): string {
  const caseHeaders = [
    "Return ID",
    "Status",
    "Brand",
    "Model",
    "Reference Number",
    "Serial Number",
    "Sale Cycle",
    "Sale Date",
    "Sale-Cycle Profit Before Returns (EUR)",
    "Request Date",
    "Return Shipped Date",
    "Received Date",
    "Refund Date",
    "Actual Refund (EUR)",
    "Return Carrier",
    "Return Tracking Number",
    "Shipping Payer",
    "Return Shipping Cost (EUR)",
    "Platform Fee Refund Recorded (EUR)",
    "Inspection / Repair Cost (EUR)",
    "Restored COGS Credit (EUR)",
    "Return Adjustment (EUR)",
    "Sale-Cycle Profit After This Case (EUR)",
  ];
  const cases = items.flatMap(sale => sale.returns.map(record => {
    const adjustment = getReturnAdjustmentCents(sale, [record]);
    return [
      record.id,
      record.status,
      sale.brandSnapshot,
      sale.modelSnapshot,
      sale.referenceNumberSnapshot,
      sale.serialNumberSnapshot,
      sale.cycleNumber,
      formatCsvDate(sale.soldDate),
      formatCsvMoney(sale.profitAtSaleCents),
      formatCsvDate(record.requestDate),
      formatCsvDate(record.returnShippedDate),
      formatCsvDate(record.receivedDate),
      formatCsvDate(record.refundDate),
      formatCsvMoney(record.refundAmountCents),
      record.carrier,
      record.trackingNumber,
      record.shippingPayer,
      formatCsvMoney(record.shippingCostCents),
      formatCsvMoney(record.platformFeeRefunded ? sale.platformFees : 0),
      formatCsvMoney(record.inspectionCostCents),
      formatCsvMoney(record.receivedDate ? record.cogsRestoredCents : 0),
      formatCsvMoney(adjustment),
      formatCsvMoney(sale.profitAtSaleCents + adjustment),
    ].map(csvEscape).join(",");
  }));

  const summary = summarizeSalesLifecycle(items);
  const originalSaleCycleProfit = items.reduce((total, sale) => total + sale.profitAtSaleCents, 0);
  const returnCases = items.flatMap(sale => sale.returns);
  const lines = [
    "Return reconciliation report",
    "Scope,All-time sale cycles and all logged return cases",
    "",
    caseHeaders.map(csvEscape).join(","),
    ...cases,
    "",
    "All-time Analytics reconciliation",
    `Sale-cycle profit before returns (EUR),${formatCsvMoney(originalSaleCycleProfit)}`,
    `Return adjustment (EUR),${formatCsvMoney(summary.netProfitCents - originalSaleCycleProfit)}`,
    `Return-adjusted net profit (EUR),${formatCsvMoney(summary.netProfitCents)}`,
    `Recorded refunds across all cases (EUR),${formatCsvMoney(returnCases.reduce((total, record) => total + record.refundAmountCents, 0))}`,
    `Seller-paid return shipping across all cases (EUR),${formatCsvMoney(returnCases.reduce((total, record) => total + (record.shippingPayer === "seller" ? record.shippingCostCents : 0), 0))}`,
    `Inspection / repair costs across all cases (EUR),${formatCsvMoney(returnCases.reduce((total, record) => total + record.inspectionCostCents, 0))}`,
    `Platform fee refunds recorded across all cases (EUR),${formatCsvMoney(items.reduce((total, sale) => total + sale.returns.filter(record => record.platformFeeRefunded).length * sale.platformFees, 0))}`,
    "Case-level profit after this case is informational; all-time totals count each sale cycle once.",
  ];
  return lines.join("\n");
}

const saleMonthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
});

function saleMonthKey(value: Date | null): string | null {
  if (!value || !Number.isFinite(value.getTime())) return null;
  const parts = saleMonthFormatter.formatToParts(value);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : null;
}

export function summarizeMonthlySalesLifecycle(
  items: readonly InventorySaleWithReturns[],
  monthKeys: readonly string[],
): MonthlySalesLifecycle {
  const monthSet = new Set(monthKeys);
  const salesInPeriod = items.filter(sale => {
    const month = saleMonthKey(sale.soldDate);
    return month != null && monthSet.has(month);
  });
  const receivedReturns = items.flatMap(sale => sale.returns
    .filter(record => record.receivedDate
      && monthSet.has(record.receivedDate.slice(0, 7))
      && !isVoidedReturn(record))
    .map(record => ({ sale, record })));
  const saleCycleProfitCents = salesInPeriod
    .reduce((total, sale) => total + sale.profitAtSaleCents, 0);
  const returnAdjustmentCents = receivedReturns.reduce(
    (total, { sale, record }) => total + getReturnAdjustmentCents(sale, [record]),
    0,
  );

  return {
    returnCount: receivedReturns.length,
    refundAmountCents: receivedReturns.reduce((total, { record }) => total + record.refundAmountCents, 0),
    sellerPaidShippingCents: receivedReturns.reduce((total, { record }) => total
      + (record.shippingPayer === "seller" ? record.shippingCostCents : 0), 0),
    inspectionCostCents: receivedReturns.reduce((total, { record }) => total + record.inspectionCostCents, 0),
    saleCycleCount: salesInPeriod.length,
    resaleCount: salesInPeriod.filter(sale => sale.cycleNumber > 1).length,
    saleCycleProfitCents,
    returnAdjustmentCents,
    returnAdjustedProfitCents: saleCycleProfitCents + returnAdjustmentCents,
  };
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
