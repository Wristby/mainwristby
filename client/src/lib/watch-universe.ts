import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { InventoryItem } from "@shared/schema";

export type WatchUniverseSource = Omit<
  Pick<
    InventoryItem,
    | "id"
    | "brand"
    | "model"
    | "referenceNumber"
    | "status"
    | "archivedAt"
    | "dateListed"
    | "listPrice"
    | "purchasePrice"
    | "importFee"
    | "serviceFee"
    | "polishFee"
    | "watchRegister"
    | "watchRegisterFeeSnapshot"
    | "platformFees"
    | "shippingFee"
    | "insuranceFee"
    | "chrono24FeeRate"
  >,
  "archivedAt" | "dateListed"
> & {
  archivedAt: Date | string | null;
  dateListed: Date | string | null;
};

export interface WatchUniverseSettings {
  chrono24CommissionPercent: number;
  watchRegisterFeeCents: number;
}

export interface WatchUniversePoint {
  id: number;
  brand: string;
  model: string;
  referenceNumber: string;
  status: string;
  daysListed: number;
  listPriceCents: number;
  costBasisCents: number;
  estimatedProfitCents: number;
  estimatedMarginPercent: number;
  chrono24FeePercent: number;
}

export interface WatchUniverseResult {
  points: WatchUniversePoint[];
  activeWatchCount: number;
  excludedWatchCount: number;
}

function validDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeCost(value: number | null | undefined): number {
  return Number.isFinite(value) && value != null && value > 0 ? value : 0;
}

function safeFeePercent(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 6.5;
}

export function calculateWatchUniverse(
  inventory: readonly WatchUniverseSource[],
  settings: WatchUniverseSettings,
  now = new Date(),
): WatchUniverseResult {
  const active = inventory.filter((watch) => !watch.archivedAt && watch.status !== "sold");
  const points = active.flatMap((watch): WatchUniversePoint[] => {
    const listedAt = validDate(watch.dateListed);
    const listPriceCents = watch.listPrice;
    if (!listedAt || !listPriceCents || listPriceCents <= 0 || watch.purchasePrice <= 0) return [];

    const watchRegisterFee = watch.watchRegister
      ? watch.watchRegisterFeeSnapshot ?? settings.watchRegisterFeeCents
      : 0;
    const costBasisCents =
      watch.purchasePrice +
      safeCost(watch.importFee) +
      safeCost(watch.serviceFee) +
      safeCost(watch.polishFee) +
      safeCost(watch.platformFees) +
      safeCost(watch.shippingFee) +
      safeCost(watch.insuranceFee) +
      safeCost(watchRegisterFee);

    const chrono24FeePercent = safeFeePercent(
      watch.chrono24FeeRate == null
        ? settings.chrono24CommissionPercent
        : watch.chrono24FeeRate / 100,
    );
    const estimatedFeeCents = Math.round(listPriceCents * chrono24FeePercent / 100);
    const estimatedProfitCents = listPriceCents - estimatedFeeCents - costBasisCents;
    const estimatedMarginPercent = estimatedProfitCents / listPriceCents * 100;

    return [{
      id: watch.id,
      brand: watch.brand,
      model: watch.model,
      referenceNumber: watch.referenceNumber,
      status: watch.status,
      daysListed: Math.max(0, differenceInCalendarDays(startOfDay(now), startOfDay(listedAt))),
      listPriceCents,
      costBasisCents,
      estimatedProfitCents,
      estimatedMarginPercent,
      chrono24FeePercent,
    }];
  });

  return {
    points,
    activeWatchCount: active.length,
    excludedWatchCount: active.length - points.length,
  };
}
