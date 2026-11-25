import type { InventoryItem } from "@shared/schema";
import { getSaleAmount } from "@shared/reporting";
import { getSoldDate } from "@shared/sold-date";
import { calculateWatchFinancials } from "@shared/watch-financials";

const REPORTING_TIME_ZONE = "Europe/Amsterdam";

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
  | "platformFees"
  | "chrono24FeeRate"
  | "shippingFee"
  | "insuranceFee"
  | "purchasePrice"
  | "importFee"
  | "serviceFee"
  | "polishFee"
  | "watchRegister"
  | "watchRegisterFeeSnapshot"
  | "soldTo"
>;

export type MonthlyTrendSale = {
  id: number;
  inventoryId: number;
  brandSnapshot: string;
  modelSnapshot: string;
  referenceNumberSnapshot: string;
  serialNumberSnapshot: string | null;
  soldTo: string | null;
  salePrice: number;
  soldDate: Date;
  profitAtSaleCents: number;
};

export type MonthlyProfitTrendExpense = {
  date: Date | string;
  amount: number;
};

export type MonthlyProfitTrendPoint = {
  key: string;
  month: string;
  fullMonth: string;
  saleProfitCents: number;
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
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORTING_TIME_ZONE,
    ...options,
  }).format(new Date(Date.UTC(year, month - 1, 15, 12)));
}

/**
 * The monthly trend follows the current inventory state: only watches currently
 * marked Sold, with a recorded sold date, are included. Sale-history snapshots
 * are intentionally not used here.
 */
export function buildMonthlyTrendSales(
  inventory: readonly MonthlyTrendInventorySource[],
  defaultWatchRegisterFeeCents: number,
): MonthlyTrendSale[] {
  return inventory.flatMap(watch => {
    if (watch.status !== "sold") return [];
    const soldDate = getSoldDate(watch);
    if (!soldDate) return [];

    const salePrice = getSaleAmount(watch) ?? 0;
    const profitAtSaleCents = calculateWatchFinancials(
      watch,
      salePrice,
      0,
      defaultWatchRegisterFeeCents,
      true,
    ).profitCents;

    return [{
      id: watch.id,
      inventoryId: watch.id,
      brandSnapshot: watch.brand,
      modelSnapshot: watch.model,
      referenceNumberSnapshot: watch.referenceNumber,
      serialNumberSnapshot: watch.serialNumber,
      soldTo: watch.soldTo,
      salePrice,
      soldDate,
      profitAtSaleCents,
    }];
  }).sort((a, b) => b.soldDate.getTime() - a.soldDate.getTime() || b.id - a.id);
}

export function buildMonthlyProfitTrend(
  sales: readonly MonthlyTrendSale[],
  expenses: readonly MonthlyProfitTrendExpense[],
  selectedYear: number | null,
): MonthlyProfitTrendPoint[] {
  if (selectedYear == null || !Number.isInteger(selectedYear)) return [];
  const monthKeys = getYearMonthKeys(selectedYear);
  const monthKeySet = new Set(monthKeys);
  const salesByMonth = new Map<string, number>();
  const expensesByMonth = new Map<string, number>();

  for (const sale of sales) {
    const key = getSaleMonthKey(sale.soldDate);
    if (!key || !monthKeySet.has(key)) continue;
    salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + sale.profitAtSaleCents);
  }

  for (const expense of expenses) {
    const key = getMonthKey(expense.date);
    if (!key || !monthKeySet.has(key) || !Number.isFinite(expense.amount)) continue;
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + expense.amount);
  }

  return monthKeys.map(key => {
    const hasSales = salesByMonth.has(key);
    const saleProfitCents = salesByMonth.get(key) ?? 0;
    // The user wants months without a current Sold watch to remain at zero.
    const expensesCents = hasSales ? expensesByMonth.get(key) ?? 0 : 0;
    return {
      key,
      month: formatMonth(key, { month: "short" }),
      fullMonth: formatMonth(key, { month: "long", year: "numeric" }),
      saleProfitCents,
      expensesCents,
      profitCents: hasSales ? saleProfitCents - expensesCents : 0,
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

export function filterMonthlySoldWatches(
  sales: readonly MonthlyTrendSale[],
  searchText: string,
): MonthlyTrendSale[] {
  const query = searchText.trim().toLocaleLowerCase();
  if (!query) return [...sales];
  return sales.filter(sale => [
    sale.brandSnapshot,
    sale.modelSnapshot,
    sale.referenceNumberSnapshot,
    sale.serialNumberSnapshot,
    sale.soldTo,
  ].filter(Boolean).join(" ").toLocaleLowerCase().includes(query));
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

export function buildMonthlySoldWatchesCsv(sales: readonly MonthlyTrendSale[]): string {
  if (sales.length === 0) return "";
  const headers = [
    "Sale Date",
    "Brand",
    "Model",
    "Reference Number",
    "Sale Price (EUR)",
    "Profit (EUR)",
  ];
  const rows = sales.map(sale => [
    formatSaleDateForCsv(sale.soldDate),
    sale.brandSnapshot,
    sale.modelSnapshot,
    sale.referenceNumberSnapshot,
    (sale.salePrice / 100).toFixed(2),
    (sale.profitAtSaleCents / 100).toFixed(2),
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
