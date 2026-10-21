export const DELIVERY_TIME_ZONE = "Europe/Amsterdam";
const DAY_MS = 86_400_000;
const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: DELIVERY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

/** Date-only values never pass through the browser's local timezone. */
export function amsterdamToday(now = new Date()): string {
  const parts = dayFormatter.formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function deliveryDateError(value: string, now = new Date()): string | null {
  if (!isCalendarDate(value)) return "Enter a valid delivery date.";
  if (value > amsterdamToday(now)) return "Delivery date cannot be in the future.";
  return null;
}

export function returnWindow(deliveredDate: string | null | undefined, now = new Date()) {
  if (!deliveredDate || !isCalendarDate(deliveredDate)) return null;
  const deadlineMs = Date.parse(`${deliveredDate}T00:00:00Z`) + 14 * DAY_MS;
  const deadline = new Date(deadlineMs).toISOString().slice(0, 10);
  const daysRemaining = Math.round((deadlineMs - Date.parse(`${amsterdamToday(now)}T00:00:00Z`)) / DAY_MS);
  const label = daysRemaining < 0 ? "Return window ended"
    : daysRemaining === 0 ? "Last day"
    : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} remaining`;
  return { deadline, daysRemaining, label };
}

export function formatDeliveryDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC", day: "numeric", month: "short", year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

/** Locate the next Amsterdam date boundary, including 23/25-hour DST days. */
export function msUntilNextAmsterdamDay(now = new Date()): number {
  const today = amsterdamToday(now);
  let low = now.getTime();
  let high = low + 26 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (amsterdamToday(new Date(middle)) === today) low = middle;
    else high = middle;
  }
  return high - now.getTime();
}
