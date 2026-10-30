import { differenceInCalendarDays } from "date-fns";
import type { InventoryItem } from "@shared/schema";
import { getSaleAmount } from "@/lib/sale-amount";
import { getSoldDate } from "@/lib/sold-date";

export const SALES_PATTERN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

type DateInput = Date | string | null;

export type SalesPatternSource = Pick<
  InventoryItem,
  | "id"
  | "brand"
  | "model"
  | "referenceNumber"
  | "status"
  | "dateListed"
  | "soldDate"
  | "dateSold"
  | "salePrice"
  | "soldPrice"
  | "purchasePrice"
  | "importFee"
  | "serviceFee"
  | "polishFee"
  | "platformFees"
  | "shippingFee"
  | "insuranceFee"
  | "watchRegister"
  | "watchRegisterFeeSnapshot"
> & {
  dateListed: DateInput;
  soldDate: DateInput;
  dateSold: DateInput;
};

export interface SalesPatternRecord {
  id: number;
  brand: string;
  model: string;
  referenceNumber: string;
  saleDate: Date;
  year: number;
  month: number;
  salePriceCents: number | null;
  profitCents: number | null;
  marginPercent: number | null;
  daysToSell: number | null;
}

export interface SalesPatternCell {
  brand: string;
  month: number;
  salesCount: number;
  medianDaysToSell: number | null;
  daysToSellSampleCount: number;
  marginPercent: number | null;
  marginSampleCount: number;
  records: SalesPatternRecord[];
}

export interface SalesPatternRow {
  brand: string;
  cells: SalesPatternCell[];
  totalSales: number;
}

export interface SalesPatternData {
  rows: SalesPatternRow[];
  years: number[];
  monthlySalesCounts: number[];
  totalSales: number;
}

function validDate(value: DateInput | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeCost(value: number | null | undefined): number {
  return Number.isFinite(value) && value != null && value > 0 ? value : 0;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function toRecord(item: SalesPatternSource, watchRegisterFeeCents: number): SalesPatternRecord | null {
  if (item.status !== "sold") return null;
  const saleDate = getSoldDate(item);
  if (!saleDate) return null;

  const saleAmount = getSaleAmount(item);
  const salePriceCents = saleAmount != null && Number.isFinite(saleAmount) && saleAmount > 0
    ? saleAmount
    : null;
  const hasMarginInputs = salePriceCents != null && item.purchasePrice > 0;
  const effectiveRegisterFee = item.watchRegisterFeeSnapshot ?? watchRegisterFeeCents;
  const totalCostCents = item.purchasePrice
    + safeCost(item.importFee)
    + safeCost(item.serviceFee)
    + safeCost(item.polishFee)
    + safeCost(item.platformFees)
    + safeCost(item.shippingFee)
    + safeCost(item.insuranceFee)
    + (item.watchRegister ? safeCost(effectiveRegisterFee) : 0);
  const listedDate = validDate(item.dateListed);
  const daysToSell = listedDate
    ? differenceInCalendarDays(saleDate, listedDate)
    : null;

  return {
    id: item.id,
    brand: item.brand.trim() || "Unspecified brand",
    model: item.model,
    referenceNumber: item.referenceNumber,
    saleDate,
    year: saleDate.getFullYear(),
    month: saleDate.getMonth(),
    salePriceCents,
    profitCents: hasMarginInputs ? salePriceCents! - totalCostCents : null,
    marginPercent: hasMarginInputs
      ? ((salePriceCents! - totalCostCents) / salePriceCents!) * 100
      : null,
    daysToSell: daysToSell != null && daysToSell >= 0 ? daysToSell : null,
  };
}

export function buildSalesPatternData(
  inventory: readonly SalesPatternSource[],
  watchRegisterFeeCents: number,
  year: number | null = null,
): SalesPatternData {
  const allRecords = inventory.flatMap((item) => {
    const record = toRecord(item, watchRegisterFeeCents);
    return record ? [record] : [];
  });
  const years = Array.from(new Set(allRecords.map((record) => record.year))).sort((a, b) => b - a);
  const records = year == null ? allRecords : allRecords.filter((record) => record.year === year);
  const byBrandAndMonth = new Map<string, SalesPatternRecord[]>();
  for (const record of records) {
    const key = `${record.brand}\u0000${record.month}`;
    const group = byBrandAndMonth.get(key) ?? [];
    group.push(record);
    byBrandAndMonth.set(key, group);
  }

  const brands = Array.from(new Set(records.map((record) => record.brand)));
  const rows = brands.map((brand): SalesPatternRow => {
    const cells = SALES_PATTERN_MONTHS.map((_, month): SalesPatternCell => {
      const cellRecords = byBrandAndMonth.get(`${brand}\u0000${month}`) ?? [];
      const days = cellRecords.flatMap((record) => record.daysToSell == null ? [] : [record.daysToSell]);
      const marginRecords = cellRecords.filter((record) => record.salePriceCents != null && record.profitCents != null);
      const revenue = marginRecords.reduce((sum, record) => sum + record.salePriceCents!, 0);
      const profit = marginRecords.reduce((sum, record) => sum + record.profitCents!, 0);
      return {
        brand,
        month,
        salesCount: cellRecords.length,
        medianDaysToSell: median(days),
        daysToSellSampleCount: days.length,
        marginPercent: revenue > 0 ? profit / revenue * 100 : null,
        marginSampleCount: marginRecords.length,
        records: cellRecords,
      };
    });
    return { brand, cells, totalSales: cells.reduce((sum, cell) => sum + cell.salesCount, 0) };
  }).sort((a, b) => b.totalSales - a.totalSales || a.brand.localeCompare(b.brand));

  const monthlySalesCounts = Array.from({ length: 12 }, (_, month) =>
    records.filter((record) => record.month === month).length,
  );

  return { rows, years, monthlySalesCounts, totalSales: records.length };
}
