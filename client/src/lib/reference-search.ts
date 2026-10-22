import type { InventoryItem } from "@shared/schema";

const additionalSearchFields = [
  "internalSerial", "year", "condition", "notes", "serviceNotes",
  "listingTitle", "description", "trackingNumber", "shippingPartner", "soldPlatform",
] as const satisfies readonly (keyof InventoryItem)[];

export type ReferenceWatch = Pick<InventoryItem, "id" | "brand" | "model" | "referenceNumber" | "serialNumber" | "status">
  & Partial<Pick<InventoryItem, typeof additionalSearchFields[number]>>;

const combiningMarks = new RegExp("\\p{M}", "gu");
const normalize = (value: unknown) => String(value ?? "").normalize("NFKD")
  .replace(combiningMarks, "").toLowerCase().trim();

/** Search watch details across all inventory statuses without mutating source data. */
export function findReferenceMatches<T extends ReferenceWatch>(watches: readonly T[], query: string): T[] {
  const term = normalize(query);
  if (!term) return [];
  const terms = term.split(/\s+/);
  return watches.map(watch => {
    const identifiers = [watch.referenceNumber, watch.serialNumber, watch.internalSerial].map(normalize);
    const fields = [
      watch.brand, watch.model, watch.status?.replace(/_/g, " "),
      ...additionalSearchFields.map(field => watch[field]),
    ].map(normalize).concat(identifiers);
    const matches = terms.every(token => fields.some(field => field.includes(token)));
    // Exact identifiers first, then exact brand/model matches, then partial matches.
    const rank = identifiers.includes(term) ? 2
      : [watch.brand, watch.model].some(value => normalize(value) === term) ? 1 : 0;
    return { watch, matches, rank };
  }).filter(result => result.matches).sort((a, b) =>
    b.rank - a.rank
    || normalize(a.watch.referenceNumber).localeCompare(normalize(b.watch.referenceNumber))
    || b.watch.id - a.watch.id,
  ).map(result => result.watch);
}
