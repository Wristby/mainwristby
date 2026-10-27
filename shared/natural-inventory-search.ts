import { z } from "zod";
import type { InventoryItem } from "./schema";

export const naturalInventoryFiltersSchema = z.object({
  brand: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(120).optional(),
  referenceNumber: z.string().trim().min(1).max(100).optional(),
  serialNumber: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["in_stock", "sold", "incoming", "servicing", "received"]).optional(),
  condition: z.enum(["New", "Mint", "Used", "Damaged", "Good", "Very Good", "Excellent", "Like New"]).optional(),
  minYear: z.number().int().min(1800).max(2200).optional(),
  maxYear: z.number().int().min(1800).max(2200).optional(),
  minPriceEuro: z.number().finite().min(0).max(100_000_000).optional(),
  maxPriceEuro: z.number().finite().min(0).max(100_000_000).optional(),
  priceField: z.enum(["purchasePrice", "listPrice", "salePrice"]).optional(),
  box: z.boolean().optional(),
  papers: z.boolean().optional(),
}).strict().refine(
  (filters) => filters.minYear === undefined || filters.maxYear === undefined || filters.minYear <= filters.maxYear,
  { message: "Minimum year cannot be later than maximum year." },
).refine(
  (filters) => filters.minPriceEuro === undefined || filters.maxPriceEuro === undefined || filters.minPriceEuro <= filters.maxPriceEuro,
  { message: "Minimum price cannot be greater than maximum price." },
);

export type NaturalInventoryFilters = z.infer<typeof naturalInventoryFiltersSchema>;

const combiningMarks = new RegExp("\\p{M}", "gu");
const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFKD")
  .replace(combiningMarks, "")
  .toLowerCase()
  .trim();

/** Applies only validated, explicit filters to inventory already loaded by the app. */
export function findNaturalInventoryMatches<T extends InventoryItem>(
  watches: readonly T[],
  filters: NaturalInventoryFilters,
): T[] {
  const priceField = filters.priceField || "listPrice";

  return watches.filter((watch) => {
    if (filters.brand && !normalize(watch.brand).includes(normalize(filters.brand))) return false;
    if (filters.model && !normalize(watch.model).includes(normalize(filters.model))) return false;
    if (filters.referenceNumber && !normalize(watch.referenceNumber).includes(normalize(filters.referenceNumber))) return false;
    if (filters.serialNumber && ![watch.serialNumber, watch.internalSerial].some((value) => normalize(value).includes(normalize(filters.serialNumber)))) return false;
    if (filters.status && watch.status !== filters.status) return false;
    if (filters.condition && normalize(watch.condition) !== normalize(filters.condition)) return false;
    if (filters.minYear !== undefined && (watch.year == null || watch.year < filters.minYear)) return false;
    if (filters.maxYear !== undefined && (watch.year == null || watch.year > filters.maxYear)) return false;
    if (filters.box !== undefined && watch.box !== filters.box) return false;
    if (filters.papers !== undefined && watch.papers !== filters.papers) return false;

    if (filters.minPriceEuro !== undefined || filters.maxPriceEuro !== undefined) {
      const valueInCents = watch[priceField];
      if (valueInCents == null) return false;
      const priceInEuro = valueInCents / 100;
      if (filters.minPriceEuro !== undefined && priceInEuro < filters.minPriceEuro) return false;
      if (filters.maxPriceEuro !== undefined && priceInEuro > filters.maxPriceEuro) return false;
    }
    return true;
  });
}
