import {
  getReturnAdjustmentCents,
  getSaleCycleNetProfitCents,
  type InventorySaleWithReturns,
} from "@shared/sales-lifecycle";
import type { InventoryItem } from "@shared/schema";
import { getSaleAmount } from "@shared/reporting";
import { getSoldDate } from "@shared/sold-date";
import { calculateWatchCostBreakdown, calculateWatchFinancials } from "@shared/watch-financials";

const REPORTING_TIME_ZONE = "Europe/Amsterdam";

export type MonthlyTrendSale = InventorySaleWithReturns & {
  legacyInventoryFallback?: boolean;
};

export type MonthlyTrendInventorySource = Pick<
  InventoryItem,
  | "id"
  | "brand"
  | "model"
  | "referenceNumber"
  | "serialNumber"
  | "status"
  | "soldDate"
  | "dateSold"
  | "salePrice"
  | "soldPrice"
  | "soldTo"
  | "buyerId"
  | "platformFees"
  | "chrono24FeeRate"
  | "shippingFee"
  | "insuranceFee"
  | "soldPlatform"
  | "shippingPartner"
  | "trackingNumber"
  | "dateShipped"
  | "deliveredDate"
  | "purchaseDate"
  | "dateListed"
  | "purchasePrice"
  | "importFee"
  | "serviceFee"
  | "polishFee"
  | "watchRegister"
  | "watchRegisterFeeSnapshot"
>;

export type MonthlyProfitTrendExpense = {
  date: Date | string;
  amount: number;
};

export type MonthlyProfitTrendPoint = {
  key: string;
  month: string;
  fullMonth: string;
  saleCycleProfitCents: number;
  returnAdjustmentsCents: number;
  expensesCents: number;
  profitCents: number;
};

function getMonthParts(date: Date): { year: number; month: number } | null {
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORTING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  return Number.isFinite(year) && month >= 1 && month <= 12 ? { year, month } : null;
}

function getMonthKey(date: Date | string): string | null {
  const parsed = date instanceof Date ? date : new Date(date);
  const parts = getMonthParts(parsed);
  return parts ? `${parts.year}-${String(parts.month).padStart(2, "0")}` : null;
}

function getYearMonthKeys(year: number): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    `${year}-${String(index + 1).padStart(2, "0")}`,
  );
}

function formatMonth(key: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month] = key.split("-").map(Number);
  // Use the middle of the month so the displayed month is stable in Amsterdam.
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORTING_TIME_ZONE,
    ...options,
  }).format(new Date(Date.UTC(year, month - 1, 15, 12)));
}

/**
 * Preserve saved sale-cycle history, but include currently sold legacy watches
 * when their sale cycle has not yet been backfilled into inventory_sales.
 */
export function mergeMonthlyTrendSales(
  sales: readonly InventorySaleWithReturns[],
  inventory: readonly MonthlyTrendInventorySource[],
  defaultWatchRegisterFeeCents: number,
): MonthlyTrendSale[] {
  const salesByInventoryId = new Map<number, InventorySaleWithReturns[]>();
  for (const sale of sales) {
    if (sale.inventoryId == null) continue;
    const existing = salesByInventoryId.get(sale.inventoryId) ?? [];
    existing.push(sale);
    salesByInventoryId.set(sale.inventoryId, existing);
  }

  const fallbackSales: MonthlyTrendSale[] = [];
  for (const watch of inventory) {
    if (watch.status !== "sold") continue;
    const soldDate = getSoldDate(watch);
    if (!soldDate) continue;

    const existingCycles = salesByInventoryId.get(watch.id) ?? [];
    if (existingCycles.some(sale => {
      if (!sale.soldDate) return false;
      const savedDate = sale.soldDate instanceof Date ? sale.soldDate : new Date(sale.soldDate);
      return Number.isFinite(savedDate.getTime()) && savedDate.getTime() === soldDate.getTime();
    })) {
      continue;
    }

    const cost = calculateWatchCostBreakdown(watch, defaultWatchRegisterFeeCents);
    const salePrice = getSaleAmount(watch) ?? 0;
    const profitAtSaleCents = calculateWatchFinancials(
      watch,
      salePrice,
      0,
      defaultWatchRegisterFeeCents,
      true,
    ).profitCents;
    const cycleNumber = Math.max(0, ...existingCycles.map(sale => sale.cycleNumber)) + 1;

    fallbackSales.push({
      id: -watch.id,
      inventoryId: watch.id,
      cycleNumber,
      brandSnapshot: watch.brand,
      modelSnapshot: watch.model,
      referenceNumberSnapshot: watch.referenceNumber,
      serialNumberSnapshot: watch.serialNumber,
      salePrice,
      soldTo: watch.soldTo,
      buyerId: watch.buyerId,
      platformFees: watch.platformFees ?? 0,
      chrono24FeeRate: watch.chrono24FeeRate,
      shippingFee: watch.shippingFee ?? 0,
      insuranceFee: watch.insuranceFee ?? 0,
      soldDate,
      soldPlatform: watch.soldPlatform,
      shippingPartner: watch.shippingPartner,
      trackingNumber: watch.trackingNumber,
      dateShipped: watch.dateShipped,
      deliveredDate: watch.deliveredDate,
      purchaseDateSnapshot: watch.purchaseDate,
      dateListedSnapshot: watch.dateListed,
      purchasePriceSnapshot: watch.purchasePrice,
      importFeeSnapshot: watch.importFee ?? 0,
      serviceFeeSnapshot: watch.serviceFee ?? 0,
      polishFeeSnapshot: watch.polishFee ?? 0,
      watchRegisterFeeSnapshot: cost.watchRegisterFeeCents,
      watchRegisterSnapshot: Boolean(watch.watchRegister),
      acquisitionCostCents: cost.acquisitionCostsCents,
      profitAtSaleCents,
      createdAt: soldDate,
      updatedAt: soldDate,
      returns: [],
      legacyInventoryFallback: true,
    });
  }

  return [...sales, ...fallbackSales].sort((a, b) => {
    const aDate = a.soldDate
      ? (a.soldDate instanceof Date ? a.soldDate.getTime() : new Date(a.soldDate).getTime())
      : Number.NEGATIVE_INFINITY;
    const bDate = b.soldDate
      ? (b.soldDate instanceof Date ? b.soldDate.getTime() : new Date(b.soldDate).getTime())
      : Number.NEGATIVE_INFINITY;
    return bDate - aDate || b.id - a.id;
  });
}

export function buildMonthlyProfitTrend(
  sales: readonly InventorySaleWithReturns[],
  expenses: readonly MonthlyProfitTrendExpense[],
  selectedYear: number | null,
): MonthlyProfitTrendPoint[] {
  if (selectedYear == null || !Number.isInteger(selectedYear)) return [];
  const monthKeys = getYearMonthKeys(selectedYear);
  const monthKeySet = new Set(monthKeys);
  const salesByMonth = new Map<string, {
    saleCycleProfitCents: number;
    returnAdjustmentsCents: number;
    profitCents: number;
  }>();
  const expensesByMonth = new Map<string, number>();

  for (const sale of sales) {
    const key = getSaleMonthKey(sale.soldDate);
    if (!key || !monthKeySet.has(key)) continue;
    const current = salesByMonth.get(key) ?? {
      saleCycleProfitCents: 0,
      returnAdjustmentsCents: 0,
      profitCents: 0,
    };
    current.saleCycleProfitCents += sale.profitAtSaleCents;
    current.returnAdjustmentsCents += getReturnAdjustmentCents(sale, sale.returns);
    current.profitCents += getSaleCycleNetProfitCents(sale);
    salesByMonth.set(key, current);
  }

  for (const expense of expenses) {
    const key = getMonthKey(expense.date);
    if (!key || !monthKeySet.has(key) || !Number.isFinite(expense.amount)) continue;
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + expense.amount);
  }

  return monthKeys.map(key => {
    const monthSales = salesByMonth.get(key);
    const expensesCents = monthSales ? expensesByMonth.get(key) ?? 0 : 0;
    return {
      key,
      month: formatMonth(key, { month: "short" }),
      fullMonth: formatMonth(key, { month: "long", year: "numeric" }),
      saleCycleProfitCents: monthSales?.saleCycleProfitCents ?? 0,
      returnAdjustmentsCents: monthSales?.returnAdjustmentsCents ?? 0,
      expensesCents,
      // Empty months stay at zero rather than showing expenses as a loss.
      profitCents: monthSales ? monthSales.profitCents - expensesCents : 0,
    };
  });
}

export function getSaleMonthKey(value: Date | string | null): string | null {
  return value ? getMonthKey(value) : null;
}

export function getSaleYear(value: Date | string | null): number | null {
  const key = getSaleMonthKey(value);
  return key ? Number(key.slice(0, 4)) : null;
}

export function getSalesForMonth(
  sales: readonly MonthlyTrendSale[],
  monthKey: string | null,
): MonthlyTrendSale[] {
  if (!monthKey) return [];
  return sales.filter(sale => getSaleMonthKey(sale.soldDate) === monthKey);
}

export function getSalesForYear(
  sales: readonly MonthlyTrendSale[],
  year: number | null,
): MonthlyTrendSale[] {
  if (year == null || !Number.isInteger(year)) return [];
  return sales.filter(sale => getSaleYear(sale.soldDate) === year);
}

export type SaleCycleHistoryKind =
  | "original_sale"
  | "resale"
  | "returned"
  | "return_in_progress";

export type SaleCycleHistoryFilter = "all" | SaleCycleHistoryKind;

export function getSaleCycleHistoryKind(sale: InventorySaleWithReturns): SaleCycleHistoryKind {
  const activeReturns = sale.returns.filter(
    record => record.status !== "cancelled" && record.status !== "declined",
  );
  if (activeReturns.some(record => record.receivedDate != null)) return "returned";
  if (activeReturns.length > 0) return "return_in_progress";
  return sale.cycleNumber > 1 ? "resale" : "original_sale";
}

export function getSaleCycleHistoryLabel(sale: MonthlyTrendSale): string {
  if (sale.legacyInventoryFallback) return "Legacy inventory record";
  switch (getSaleCycleHistoryKind(sale)) {
    case "returned":
      return "Returned";
    case "return_in_progress":
      return "Return in progress";
    case "resale":
      return `Resale · cycle ${sale.cycleNumber}`;
    case "original_sale":
      return "Original sale";
  }
}

export function filterMonthlySaleCycles(
  sales: readonly MonthlyTrendSale[],
  searchText: string,
  historyFilter: SaleCycleHistoryFilter = "all",
): MonthlyTrendSale[] {
  const query = searchText.trim().toLocaleLowerCase();
  return sales.filter(sale => {
    if (historyFilter !== "all" && getSaleCycleHistoryKind(sale) !== historyFilter) return false;
    if (!query) return true;
    const snapshotText = [
      sale.brandSnapshot,
      sale.modelSnapshot,
      sale.referenceNumberSnapshot,
      sale.serialNumberSnapshot,
      sale.soldTo,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return snapshotText.includes(query);
  });
}

function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatSaleDateForCsv(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORTING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function buildMonthlySaleCyclesCsv(sales: readonly InventorySaleWithReturns[]): string {
  if (sales.length === 0) return "";

  const headers = [
    "Sale Date",
    "Brand",
    "Model",
    "Reference Number",
    "Sale Cycle",
    "Sale Price (EUR)",
    "Profit After Return Adjustments (EUR)",
    "Return / Resale",
  ];
  const rows = sales.map(sale => [
    formatSaleDateForCsv(sale.soldDate),
    sale.brandSnapshot,
    sale.modelSnapshot,
    sale.referenceNumberSnapshot,
    sale.cycleNumber,
    (sale.salePrice / 100).toFixed(2),
    (getSaleCycleNetProfitCents(sale) / 100).toFixed(2),
    getSaleCycleHistoryLabel(sale),
  ]);

  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map(row => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
}

export function getCurrentReportingYear(now = new Date()): number {
  const parts = getMonthParts(now);
  return parts?.year ?? now.getFullYear();
}
