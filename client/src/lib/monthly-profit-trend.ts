import {
  getSaleCycleNetProfitCents,
  type InventorySaleWithReturns,
} from "@shared/sales-lifecycle";

const REPORTING_TIME_ZONE = "Europe/Amsterdam";

export type MonthlyProfitTrendExpense = {
  date: Date | string;
  amount: number;
};

export type MonthlyProfitTrendPoint = {
  key: string;
  month: string;
  fullMonth: string;
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

export function buildMonthlyProfitTrend(
  sales: readonly InventorySaleWithReturns[],
  expenses: readonly MonthlyProfitTrendExpense[],
  selectedYear: number | null,
): MonthlyProfitTrendPoint[] {
  if (selectedYear == null || !Number.isInteger(selectedYear)) return [];
  const monthKeys = getYearMonthKeys(selectedYear);
  const monthKeySet = new Set(monthKeys);
  const salesByMonth = new Map<string, { count: number; profitCents: number }>();
  const expensesByMonth = new Map<string, number>();

  for (const sale of sales) {
    const key = saleMonthKey(sale.soldDate);
    if (!key || !monthKeySet.has(key)) continue;
    const current = salesByMonth.get(key) ?? { count: 0, profitCents: 0 };
    current.count += 1;
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
    return {
      key,
      month: formatMonth(key, { month: "short" }),
      fullMonth: formatMonth(key, { month: "long", year: "numeric" }),
      // Empty months stay at zero rather than showing expenses as a loss.
      profitCents: monthSales
        ? monthSales.profitCents - (expensesByMonth.get(key) ?? 0)
        : 0,
    };
  });
}

function saleMonthKey(value: Date | string | null): string | null {
  return value ? getMonthKey(value) : null;
}

export function getCurrentReportingYear(now = new Date()): number {
  const parts = getMonthParts(now);
  return parts?.year ?? now.getFullYear();
}
