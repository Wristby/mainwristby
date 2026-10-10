import { returnWindow } from "@shared/delivery";
import { compareSoldDates } from "./sold-date";

export type ReturnWindowFilter = "all" | "unconfirmed" | "active";
type DeliveryDate = { deliveredDate?: string | null };
type SoldDelivery = DeliveryDate & {
  id: number;
  soldDate?: Date | string | null;
  dateSold?: Date | string | null;
};

export function matchesReturnWindowFilter(item: DeliveryDate, filter: ReturnWindowFilter, now: Date): boolean {
  if (filter === "all") return true;
  const window = returnWindow(item.deliveredDate, now);
  if (filter === "unconfirmed") return window === null;
  return window !== null && window.daysRemaining >= 0;
}

/** Unconfirmed deliveries stay last in both directions; tied deadlines use newest sale first. */
export function compareReturnDeadlines(a: SoldDelivery, b: SoldDelivery, order: "asc" | "desc", now: Date): number {
  const first = returnWindow(a.deliveredDate, now)?.deadline;
  const second = returnWindow(b.deliveredDate, now)?.deadline;
  if (first === undefined && second !== undefined) return 1;
  if (second === undefined && first !== undefined) return -1;
  const comparison = (first ?? "").localeCompare(second ?? "");
  return comparison
    ? (order === "asc" ? comparison : -comparison)
    : compareSoldDates(a, b, "desc");
}
