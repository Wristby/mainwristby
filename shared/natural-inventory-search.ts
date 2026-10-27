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
  soldYear: z.number().int().min(1800).max(2200).optional(),
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
).refine(
  (filters) => filters.soldYear === undefined || filters.status === "sold",
  { message: "A sold year requires sold status." },
);

export const naturalInventoryAggregateSchema = z.enum(["count", "asking_price_total"]);
export const naturalInventoryGroupBySchema = z.enum(["brand", "model", "year", "status", "condition"]);
export const naturalInventorySearchIntentSchema = z.object({
  filters: naturalInventoryFiltersSchema,
  aggregate: naturalInventoryAggregateSchema.optional(),
  groupBy: naturalInventoryGroupBySchema.optional(),
}).strict().refine(
  (intent) => intent.groupBy === undefined || intent.aggregate !== undefined,
  { message: "Grouped inventory summaries require an aggregate.", path: ["aggregate"] },
);

export type NaturalInventoryFilters = z.infer<typeof naturalInventoryFiltersSchema>;
export type NaturalInventoryAggregate = z.infer<typeof naturalInventoryAggregateSchema>;
export type NaturalInventoryGroupBy = z.infer<typeof naturalInventoryGroupBySchema>;

export type NaturalInventoryAggregateResult =
  | { type: "count"; value: number }
  | { type: "grouped_count"; field: NaturalInventoryGroupBy; groups: { label: string; count: number }[]; total: number }
  | { type: "asking_price_total"; valueInCents: number; pricedCount: number; missingPriceCount: number }
  | {
    type: "grouped_asking_price_total";
    field: NaturalInventoryGroupBy;
    groups: { label: string; valueInCents: number; pricedCount: number; missingPriceCount: number; watchCount: number }[];
    total: number;
  };

const combiningMarks = new RegExp("\\p{M}", "gu");
const normalize = (value: unknown) => String(value ?? "")
  .normalize("NFKD")
  .replace(combiningMarks, "")
  .toLowerCase()
  .trim();

function getInventoryGroup(watch: InventoryItem, field: NaturalInventoryGroupBy) {
  const rawValue = watch[field];
  if (field === "year") {
    return typeof rawValue === "number" && Number.isFinite(rawValue)
      ? { key: `year:${rawValue}`, label: String(rawValue), missing: false }
      : { key: "missing:year", label: "Year not recorded", missing: true };
  }

  const label = typeof rawValue === "string" && rawValue.trim()
    ? field === "status" ? rawValue.replace(/_/g, " ") : rawValue.trim()
    : field === "model" ? "Model not recorded" : "Unknown";
  const missing = typeof rawValue !== "string" || !rawValue.trim();
  return {
    key: missing ? `missing:${field}` : `${field}:${normalize(label)}`,
    label,
    missing,
  };
}

function sortInventoryGroups<T extends { label: string; missing?: boolean }>(
  groups: T[],
  field: NaturalInventoryGroupBy,
): T[] {
  return groups.sort((a, b) => {
    if (field === "year" && a.missing !== b.missing) return a.missing ? 1 : -1;
    if (field === "year" && !a.missing && !b.missing) return Number(a.label) - Number(b.label);
    return a.label.localeCompare(b.label);
  });
}

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
    if (filters.soldYear !== undefined) {
      const soldDate = watch.soldDate || watch.dateSold;
      const soldTimestamp = soldDate ? new Date(soldDate).getTime() : Number.NaN;
      if (watch.status !== "sold" || !Number.isFinite(soldTimestamp) || new Date(soldTimestamp).getUTCFullYear() !== filters.soldYear) return false;
    }
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

/** Computes supported summaries from matching application records, never from model output. */
export function getNaturalInventoryAggregate<T extends InventoryItem>(
  watches: readonly T[],
  filters: NaturalInventoryFilters,
  aggregate: NaturalInventoryAggregate,
  groupBy?: NaturalInventoryGroupBy,
): NaturalInventoryAggregateResult {
  const matches = findNaturalInventoryMatches(watches, filters);
  if (groupBy) {
    const groupedCounts = new Map<string, { label: string; count: number; missing: boolean }>();
    for (const watch of matches) {
      const descriptor = getInventoryGroup(watch, groupBy);
      const group = groupedCounts.get(descriptor.key);
      if (group) group.count += 1;
      else groupedCounts.set(descriptor.key, { ...descriptor, count: 1 });
    }
    const groups = sortInventoryGroups(Array.from(groupedCounts.values()), groupBy);
    if (aggregate === "count") {
      return {
        type: "grouped_count",
        field: groupBy,
        groups: groups.map(({ label, count }) => ({ label, count })),
        total: matches.length,
      };
    }

    const groupedPrices = new Map<string, {
      label: string;
      valueInCents: number;
      pricedCount: number;
      missingPriceCount: number;
      watchCount: number;
      missing: boolean;
    }>();
    for (const watch of matches) {
      const descriptor = getInventoryGroup(watch, groupBy);
      const group = groupedPrices.get(descriptor.key) ?? {
        ...descriptor,
        valueInCents: 0,
        pricedCount: 0,
        missingPriceCount: 0,
        watchCount: 0,
      };
      group.watchCount += 1;
      if (watch.listPrice == null) {
        group.missingPriceCount += 1;
      } else {
        group.valueInCents += watch.listPrice;
        group.pricedCount += 1;
      }
      groupedPrices.set(descriptor.key, group);
    }
    return {
      type: "grouped_asking_price_total",
      field: groupBy,
      groups: sortInventoryGroups(Array.from(groupedPrices.values()), groupBy)
        .map(({ label, valueInCents, pricedCount, missingPriceCount, watchCount }) => ({
          label,
          valueInCents,
          pricedCount,
          missingPriceCount,
          watchCount,
        })),
      total: matches.length,
    };
  }
  if (aggregate === "count") return { type: "count", value: matches.length };

  const priced = matches.filter((watch) => watch.listPrice != null);
  return {
    type: "asking_price_total",
    valueInCents: priced.reduce((total, watch) => total + watch.listPrice!, 0),
    pricedCount: priced.length,
    missingPriceCount: matches.length - priced.length,
  };
}
