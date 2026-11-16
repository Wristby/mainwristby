export type SoldDateInput = Date | string | null | undefined;
export type SoldDateFields = {
  soldDate?: SoldDateInput;
  dateSold?: SoldDateInput;
};

function validDate(value: SoldDateInput): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `soldDate` is the canonical field; `dateSold` remains a legacy fallback. */
export function getSoldDate(item: SoldDateFields): Date | null {
  return validDate(item.soldDate) ?? validDate(item.dateSold);
}

/**
 * Normalize explicitly written sale-date fields to both database aliases.
 * Undefined means the caller did not update either date; explicit null clears
 * both. A valid canonical value takes precedence over the legacy alias.
 */
export function getSoldDateWriteFields(
  item: SoldDateFields,
): { soldDate: Date | null; dateSold: Date | null } | undefined {
  const hasCanonical = Object.prototype.hasOwnProperty.call(item, "soldDate") && item.soldDate !== undefined;
  const hasLegacy = Object.prototype.hasOwnProperty.call(item, "dateSold") && item.dateSold !== undefined;
  if (!hasCanonical && !hasLegacy) return undefined;

  const date = getSoldDate(item);
  return { soldDate: date, dateSold: date };
}

export function normalizeSoldDateFields<T extends SoldDateFields>(
  item: T,
): Omit<T, "soldDate" | "dateSold"> & { soldDate?: Date | null; dateSold?: Date | null } {
  const dates = getSoldDateWriteFields(item);
  return (dates ? { ...item, ...dates } : item) as Omit<T, "soldDate" | "dateSold"> & {
    soldDate?: Date | null;
    dateSold?: Date | null;
  };
}

export function compareSoldDates(
  a: SoldDateFields & { id: number },
  b: SoldDateFields & { id: number },
  order: "asc" | "desc",
) {
  const first = getSoldDate(a)?.getTime();
  const second = getSoldDate(b)?.getTime();
  if (first === undefined && second !== undefined) return 1;
  if (second === undefined && first !== undefined) return -1;
  const comparison = (first ?? 0) - (second ?? 0);
  return comparison ? (order === "asc" ? comparison : -comparison) : b.id - a.id;
}
