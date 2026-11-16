import { amsterdamToday, isCalendarDate } from "./delivery";
import { z } from "zod";

export const WARRANTY_TERM_OPTIONS = [6, 12, 24, 36, 60] as const;
export const DEFAULT_WARRANTY_MONTHS = 12;
export const WARRANTY_EXPIRING_SOON_DAYS = 30;
const DAY_MS = 86_400_000;

export const storeWarrantyMonthsSchema = z.number().int().refine(
  value => value === 0 || WARRANTY_TERM_OPTIONS.includes(value as typeof WARRANTY_TERM_OPTIONS[number]),
  "Choose a supported store warranty term.",
).nullable().optional();

export type StoreWarrantyStatus =
  | "not_recorded"
  | "none"
  | "awaiting_delivery"
  | "active"
  | "expiring"
  | "expired";

export type WarrantyCoverage = {
  status: StoreWarrantyStatus;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  percentRemaining: number | null;
};

export function normalizeWarrantyMonths(value: unknown): number {
  return typeof value === "number" && WARRANTY_TERM_OPTIONS.includes(value as typeof WARRANTY_TERM_OPTIONS[number])
    ? value
    : DEFAULT_WARRANTY_MONTHS;
}

export function addCalendarMonths(date: string, months: number): string | null {
  if (!isCalendarDate(date) || !Number.isInteger(months) || months < 1) return null;
  const [year, month, day] = date.split("-").map(Number);
  const totalMonth = year * 12 + month - 1 + months;
  const targetYear = Math.floor(totalMonth / 12);
  const targetMonth = totalMonth % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);
  return `${String(targetYear).padStart(4, "0")}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

export function calendarDaysBetween(start: string, end: string): number | null {
  if (!isCalendarDate(start) || !isCalendarDate(end)) return null;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS);
}

export function getStoreWarrantyCoverage(
  months: number | null | undefined,
  deliveredDate: string | null | undefined,
  today = amsterdamToday(),
): WarrantyCoverage {
  if (months == null) return { status: "not_recorded", startDate: null, endDate: null, daysRemaining: null, percentRemaining: null };
  if (months === 0) return { status: "none", startDate: null, endDate: null, daysRemaining: null, percentRemaining: null };
  if (!Number.isInteger(months) || months < 1 || !deliveredDate || !isCalendarDate(deliveredDate)) {
    return { status: "awaiting_delivery", startDate: null, endDate: null, daysRemaining: null, percentRemaining: null };
  }

  const endDate = addCalendarMonths(deliveredDate, months);
  if (!endDate || !isCalendarDate(today)) {
    return { status: "awaiting_delivery", startDate: null, endDate: null, daysRemaining: null, percentRemaining: null };
  }
  const daysRemaining = calendarDaysBetween(today, endDate)!;
  const totalDays = Math.max(calendarDaysBetween(deliveredDate, endDate) ?? 1, 1);
  const status: StoreWarrantyStatus = daysRemaining < 0
    ? "expired"
    : daysRemaining <= WARRANTY_EXPIRING_SOON_DAYS ? "expiring" : "active";
  return {
    status,
    startDate: deliveredDate,
    endDate,
    daysRemaining,
    percentRemaining: Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100)),
  };
}

export type ManufacturerWarrantyStatus = "not_recorded" | "end_date_unknown" | "active" | "expiring" | "expired";

export function getManufacturerWarrantyCoverage(
  purchaseDate: string | null | undefined,
  expiresDate: string | null | undefined,
  cardPresent: boolean,
  details: string | null | undefined,
  today = amsterdamToday(),
) {
  const hasInformation = !!purchaseDate || !!expiresDate || cardPresent || !!details?.trim();
  if (!hasInformation) return { status: "not_recorded" as const, daysRemaining: null, percentRemaining: null };
  if (!expiresDate || !isCalendarDate(expiresDate) || !isCalendarDate(today)) {
    return { status: "end_date_unknown" as const, daysRemaining: null, percentRemaining: null };
  }
  const daysRemaining = calendarDaysBetween(today, expiresDate)!;
  const status: ManufacturerWarrantyStatus = daysRemaining < 0
    ? "expired"
    : daysRemaining <= WARRANTY_EXPIRING_SOON_DAYS ? "expiring" : "active";
  const totalDays = purchaseDate && isCalendarDate(purchaseDate)
    ? Math.max(calendarDaysBetween(purchaseDate, expiresDate) ?? 1, 1)
    : null;
  return {
    status,
    daysRemaining,
    percentRemaining: totalDays === null
      ? null
      : Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100)),
  };
}
