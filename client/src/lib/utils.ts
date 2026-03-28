import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a price string typed by the user, handling both European (1.234,56)
 * and American (1,234.56) number formats correctly.
 *
 * Strategy: whichever separator (. or ,) appears LAST is the decimal separator.
 * All earlier occurrences of the other separator are treated as thousands separators.
 */
export function parsePriceInput(value: string | number | undefined | null): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  const v = value.toString().replace(/[€$\s]/g, "").trim();
  if (!v) return 0;

  const lastDot = v.lastIndexOf(".");
  const lastComma = v.lastIndexOf(",");

  let normalized: string;

  if (lastDot > -1 && lastComma > -1) {
    if (lastComma > lastDot) {
      // European: "1.234,56" — comma is decimal, dots are thousands
      normalized = v.replace(/\./g, "").replace(",", ".");
    } else {
      // American: "1,234.56" — period is decimal, commas are thousands
      normalized = v.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    const afterComma = v.slice(lastComma + 1);
    if (afterComma.length === 3 && /^\d+$/.test(afterComma)) {
      // e.g. "1,234" — comma is a thousands separator, no decimals
      normalized = v.replace(/,/g, "");
    } else {
      // e.g. "1234,56" — comma is decimal separator
      normalized = v.replace(",", ".");
    }
  } else if (lastDot > -1) {
    const afterDot = v.slice(lastDot + 1);
    if (afterDot.length === 3 && /^\d+$/.test(afterDot) && v.indexOf(".") === lastDot) {
      // e.g. "1.234" — period is a thousands separator, no decimals
      normalized = v.replace(/\./g, "");
    } else {
      // e.g. "1234.56" — period is decimal separator
      normalized = v;
    }
  } else {
    normalized = v;
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
