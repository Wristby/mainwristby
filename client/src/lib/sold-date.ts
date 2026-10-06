type SaleDates = { soldDate?: Date | string | null; dateSold?: Date | string | null };

export function getSoldDate(item: SaleDates): Date | null {
  for (const value of [item.soldDate, item.dateSold]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function compareSoldDates(a: SaleDates & { id: number }, b: SaleDates & { id: number }, order: "asc" | "desc") {
  const first = getSoldDate(a)?.getTime();
  const second = getSoldDate(b)?.getTime();
  // Undated sales stay last in either direction.
  if (first === undefined && second !== undefined) return 1;
  if (second === undefined && first !== undefined) return -1;
  const comparison = (first ?? 0) - (second ?? 0);
  return comparison ? (order === "asc" ? comparison : -comparison) : b.id - a.id;
}
