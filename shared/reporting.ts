import type { InventoryItem } from "./schema";
import { getSoldDate } from "./sold-date";
import { calculateWatchCostBreakdown, type WatchCostSource } from "./watch-financials";

export type SaleAmountSource = {
  salePrice?: number | null;
  soldPrice?: number | null;
};

export function getSaleAmount(item: SaleAmountSource): number | null {
  // Legacy rows may have a default modern zero and the recorded amount in soldPrice.
  // Otherwise prefer the modern amount, preserving genuine zero amounts.
  return item.salePrice === 0 && item.soldPrice != null && item.soldPrice !== 0
    ? item.soldPrice
    : item.salePrice ?? item.soldPrice ?? null;
}

export function getPositiveSaleAmount(item: SaleAmountSource): number | null {
  const amount = getSaleAmount(item);
  return amount != null && Number.isFinite(amount) && amount > 0 ? amount : null;
}

export interface CalendarPeriod {
  /** Zero-based month index, matching JavaScript Date.getMonth(). */
  month?: number | null;
  year?: number | null;
}

export type ReportDateInput = Date | string | null | undefined;

export function toReportDate(value: ReportDateInput): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function matchesCalendarPeriod(
  value: ReportDateInput,
  period: CalendarPeriod,
): boolean {
  const hasMonth = period.month != null;
  const hasYear = period.year != null;
  if (!hasMonth && !hasYear) return true;

  const date = toReportDate(value);
  if (!date) return false;
  if (hasMonth && date.getMonth() !== period.month) return false;
  if (hasYear && date.getFullYear() !== period.year) return false;
  return true;
}

export type InventoryReportingDateSource = Pick<
  InventoryItem,
  "status" | "soldDate" | "dateSold" | "purchaseDate"
>;

/**
 * Analytics uses the sale date for sold watches and purchase date otherwise.
 * A sold watch without a valid sale date falls back to purchase date there.
 */
export function getInventoryReportingDate(item: InventoryReportingDateSource): Date | null {
  if (item.status === "sold") {
    const soldDate = getSoldDate(item);
    if (soldDate) return soldDate;
  }
  return toReportDate(item.purchaseDate);
}

export type SoldPeriodSource = Pick<InventoryItem, "status" | "soldDate" | "dateSold">;

/**
 * Financials includes undated sold watches in an unfiltered all-time total,
 * but requires a recorded sale date for month/year filters.
 */
export function isSoldInCalendarPeriod(item: SoldPeriodSource, period: CalendarPeriod): boolean {
  if (item.status !== "sold") return false;
  if (period.month == null && period.year == null) return true;
  const soldDate = getSoldDate(item);
  return soldDate != null && matchesCalendarPeriod(soldDate, period);
}

export type WatchSalesSummarySource = SaleAmountSource & WatchCostSource;

export interface WatchSalesSummary {
  salesCount: number;
  pricedSalesCount: number;
  unpricedSalesCount: number;
  revenueCents: number;
  purchaseCostsCents: number;
  watchCostsCents: number;
  totalCostsCents: number;
  netProfitCents: number;
  averageMarginPercent: number;
}

/** Shared watch-level totals; callers choose the intended reporting scope first. */
export function summarizeWatchSales(
  watches: readonly WatchSalesSummarySource[],
  defaultWatchRegisterFeeCents = 0,
): WatchSalesSummary {
  let pricedSalesCount = 0;
  let revenueCents = 0;
  let purchaseCostsCents = 0;
  let watchCostsCents = 0;
  let totalCostsCents = 0;

  for (const watch of watches) {
    const amount = getSaleAmount(watch);
    if (amount != null) pricedSalesCount += 1;
    revenueCents += amount ?? 0;

    const costs = calculateWatchCostBreakdown(watch, defaultWatchRegisterFeeCents);
    purchaseCostsCents += costs.purchasePriceCents;
    watchCostsCents += costs.otherWatchCostsCents;
    totalCostsCents += costs.totalCostsCents;
  }

  const netProfitCents = revenueCents - totalCostsCents;
  return {
    salesCount: watches.length,
    pricedSalesCount,
    unpricedSalesCount: watches.length - pricedSalesCount,
    revenueCents,
    purchaseCostsCents,
    watchCostsCents,
    totalCostsCents,
    netProfitCents,
    averageMarginPercent: revenueCents > 0 ? (netProfitCents / revenueCents) * 100 : 0,
  };
}
