import type { InventorySaleWithReturns } from "./sales-lifecycle";
import { returnWindow } from "./delivery";

const PAYOUT_WINDOW_DAYS_AFTER_RETURN = 3;

export type SaleAvailabilityState =
  | "awaiting_delivery"
  | "in_return_window"
  | "available"
  | "return_excluded"
  | "needs_review";

export interface SaleAvailabilityEntry {
  id: number;
  inventoryId: number | null;
  cycleNumber: number;
  brand: string;
  model: string;
  referenceNumber: string;
  soldDate: Date | string | null;
  proceedsCents: number | null;
  state: SaleAvailabilityState;
  daysUntilAvailable: number | null;
  releaseDate: string | null;
}

export interface SaleAvailabilitySummary {
  totalSaleCount: number;
  awaitingDelivery: SaleAvailabilityEntry[];
  inReturnWindow: SaleAvailabilityEntry[];
  available: SaleAvailabilityEntry[];
  returnExcludedCount: number;
  needsReview: SaleAvailabilityEntry[];
  awaitingDeliveryCents: number;
  inReturnWindowCents: number;
  availableCents: number;
}

function nextCalendarDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function compareReleaseDates(a: SaleAvailabilityEntry, b: SaleAvailabilityEntry): number {
  return (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "")
    || (a.soldDate ? new Date(a.soldDate).getTime() : 0) - (b.soldDate ? new Date(b.soldDate).getTime() : 0);
}

export function calculateSaleAvailability(
  sales: readonly InventorySaleWithReturns[],
  now = new Date(),
): SaleAvailabilitySummary {
  const awaitingDelivery: SaleAvailabilityEntry[] = [];
  const inReturnWindow: SaleAvailabilityEntry[] = [];
  const available: SaleAvailabilityEntry[] = [];
  const needsReview: SaleAvailabilityEntry[] = [];
  let returnExcludedCount = 0;

  for (const sale of sales) {
    const baseEntry = {
      id: sale.id,
      inventoryId: sale.inventoryId,
      cycleNumber: sale.cycleNumber,
      brand: sale.brandSnapshot,
      model: sale.modelSnapshot,
      referenceNumber: sale.referenceNumberSnapshot,
      soldDate: sale.soldDate,
      daysUntilAvailable: null,
      releaseDate: null,
    } satisfies Omit<SaleAvailabilityEntry, "proceedsCents" | "state">;

    if (sale.returns.some((record) => record.status !== "cancelled" && record.status !== "declined")) {
      returnExcludedCount += 1;
      continue;
    }

    const proceedsCents = sale.salePrice - sale.platformFees;
    if (!Number.isFinite(proceedsCents) || sale.salePrice <= 0 || sale.platformFees < 0 || proceedsCents < 0) {
      needsReview.push({ ...baseEntry, proceedsCents: null, state: "needs_review" });
      continue;
    }

    if (!sale.deliveredDate) {
      awaitingDelivery.push({ ...baseEntry, proceedsCents, state: "awaiting_delivery" });
      continue;
    }

    const window = returnWindow(sale.deliveredDate, now);
    if (!window) {
      needsReview.push({ ...baseEntry, proceedsCents: null, state: "needs_review" });
      continue;
    }
    const releaseDate = nextCalendarDate(window.deadline);
    if (window.daysRemaining >= 0) {
      inReturnWindow.push({
        ...baseEntry,
        proceedsCents,
        state: "in_return_window",
        daysUntilAvailable: window.daysRemaining + 1,
        releaseDate,
      });
    } else if (window.daysRemaining >= -PAYOUT_WINDOW_DAYS_AFTER_RETURN) {
      available.push({ ...baseEntry, proceedsCents, state: "available", releaseDate });
    }
  }

  inReturnWindow.sort(compareReleaseDates);
  awaitingDelivery.sort((a, b) =>
    (a.soldDate ? new Date(a.soldDate).getTime() : 0) - (b.soldDate ? new Date(b.soldDate).getTime() : 0),
  );
  needsReview.sort((a, b) => a.id - b.id);

  const sum = (entries: readonly SaleAvailabilityEntry[]) =>
    entries.reduce((total, entry) => total + (entry.proceedsCents ?? 0), 0);

  return {
    totalSaleCount: sales.length,
    awaitingDelivery,
    inReturnWindow,
    available,
    returnExcludedCount,
    needsReview,
    awaitingDeliveryCents: sum(awaitingDelivery),
    inReturnWindowCents: sum(inReturnWindow),
    availableCents: sum(available),
  };
}
