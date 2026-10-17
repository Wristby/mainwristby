import type { InventoryItem } from "@shared/schema";

export type ReferenceWatch = Pick<InventoryItem, "id" | "brand" | "model" | "referenceNumber" | "serialNumber" | "status">;

/** Search only owned watch references; never mutate the dashboard's inventory. */
export function findReferenceMatches<T extends ReferenceWatch>(watches: readonly T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const reference = (watch: T) => watch.referenceNumber.trim().toLowerCase();
  return watches.filter(watch => reference(watch).includes(term)).sort((a, b) =>
    Number(reference(b) === term) - Number(reference(a) === term)
    || reference(a).localeCompare(reference(b))
    || b.id - a.id,
  );
}
