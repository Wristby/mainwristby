import { differenceInDays } from "date-fns";
import type { InventoryItem } from "@shared/schema";
import { getSaleAmount, matchesCalendarPeriod } from "@shared/reporting";
import { getSoldDate } from "@shared/sold-date";
import { calculateWatchFinancials } from "@shared/watch-financials";

export interface AnalyticsSalesDateFilter {
  start: Date | null;
  end: Date | null;
  month?: number | null;
  year?: number | null;
  custom: boolean;
}

export type AnalyticsSoldWatch = InventoryItem & {
  profit: number;
  roi: number;
  daysOnMarket: number;
  netRevenue: number;
  netFees: number;
};

function matchesDateFilter(date: Date, filter: AnalyticsSalesDateFilter): boolean {
  if (filter.start && filter.end) {
    return date >= filter.start && date <= filter.end;
  }
  if (filter.custom) {
    return matchesCalendarPeriod(date, { month: filter.month, year: filter.year });
  }
  return true;
}

/**
 * Analytics sales metrics follow current inventory status and its recorded sale
 * date. Sale-history snapshots remain separate for return-history reporting.
 */
export function buildAnalyticsCurrentSoldWatches(
  inventory: readonly InventoryItem[],
  dateFilter: AnalyticsSalesDateFilter,
  defaultWatchRegisterFeeCents: number,
): AnalyticsSoldWatch[] {
  return inventory.flatMap((watch) => {
    if (watch.status !== "sold") return [];
    const soldDate = getSoldDate(watch);
    if (!soldDate || !matchesDateFilter(soldDate, dateFilter)) return [];

    const salePrice = getSaleAmount(watch) ?? 0;
    const financials = calculateWatchFinancials(
      watch,
      salePrice,
      0,
      defaultWatchRegisterFeeCents,
      true,
    );
    const acquisitionDate = watch.dateListed
      ? new Date(watch.dateListed)
      : watch.purchaseDate
        ? new Date(watch.purchaseDate)
        : null;

    return [{
      ...watch,
      profit: financials.profitCents,
      roi: financials.roiPercent,
      daysOnMarket: acquisitionDate && !Number.isNaN(acquisitionDate.getTime())
        ? differenceInDays(soldDate, acquisitionDate)
        : 0,
      netRevenue: salePrice,
      netFees: financials.otherWatchCostsCents,
    }];
  });
}
