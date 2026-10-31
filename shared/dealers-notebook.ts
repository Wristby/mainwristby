import { z } from "zod";

export const notebookComparisonModeSchema = z.enum([
  "previous-month",
  "same-month-last-year",
  "prior-three-months",
]);
export type NotebookComparisonMode = z.infer<typeof notebookComparisonModeSchema>;

export const notebookInsightSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  explanation: z.string().trim().min(1).max(900),
  evidenceKeys: z.array(z.string().min(1).max(80)).max(4),
  confidence: z.enum(["high", "medium", "low"]),
});
export type NotebookInsight = z.infer<typeof notebookInsightSchema>;

export const notebookRecommendationSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  action: z.string().trim().min(1).max(500),
  rationale: z.string().trim().min(1).max(700),
  evidenceKeys: z.array(z.string().min(1).max(80)).max(4),
  relatedWatchCodes: z.array(z.string().regex(/^[AS]\d{2}$/)).max(5),
});
export type NotebookRecommendation = z.infer<typeof notebookRecommendationSchema>;

export const savedNotebookRecommendationSchema = notebookRecommendationSchema.extend({
  relatedWatches: z.array(z.object({
    id: z.number().int().positive(),
    label: z.string().max(180),
  })).max(5),
});
export type SavedNotebookRecommendation = z.infer<typeof savedNotebookRecommendationSchema>;

export const notebookAiResponseSchema = z.object({
  overview: z.string().trim().min(1).max(1200),
  wins: z.array(notebookInsightSchema).max(5),
  challenges: z.array(notebookInsightSchema).max(5),
  improvements: z.array(notebookInsightSchema).max(5),
  recommendations: z.array(notebookRecommendationSchema).max(8),
});

export const notebookReportSchema = z.object({
  period: z.object({
    monthKeys: z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)),
    label: z.string(),
    salesCount: z.number().int().nonnegative(),
    pricedSalesCount: z.number().int().nonnegative(),
    revenueCents: z.number().int(),
    netProfitCents: z.number().int(),
    marginPercent: z.number().nullable(),
    medianDaysListed: z.number().nullable(),
    daysSampleCount: z.number().int().nonnegative(),
    salesWithPriceHistory: z.number().int().nonnegative(),
    salesWithPriceReductions: z.number().int().nonnegative(),
    priceReductionCount: z.number().int().nonnegative(),
    brands: z.array(z.object({
      brand: z.string(),
      salesCount: z.number().int().nonnegative(),
      revenueCents: z.number().int(),
      netProfitCents: z.number().int(),
      marginPercent: z.number().nullable(),
      medianDaysListed: z.number().nullable(),
      daysSampleCount: z.number().int().nonnegative(),
    })),
  }),
  comparison: z.object({
    monthKeys: z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)),
    label: z.string(),
    salesCount: z.number().int().nonnegative(),
    pricedSalesCount: z.number().int().nonnegative(),
    revenueCents: z.number().int(),
    netProfitCents: z.number().int(),
    marginPercent: z.number().nullable(),
    medianDaysListed: z.number().nullable(),
    daysSampleCount: z.number().int().nonnegative(),
    salesWithPriceHistory: z.number().int().nonnegative(),
    salesWithPriceReductions: z.number().int().nonnegative(),
    priceReductionCount: z.number().int().nonnegative(),
    brands: z.array(z.object({
      brand: z.string(),
      salesCount: z.number().int().nonnegative(),
      revenueCents: z.number().int(),
      netProfitCents: z.number().int(),
      marginPercent: z.number().nullable(),
      medianDaysListed: z.number().nullable(),
      daysSampleCount: z.number().int().nonnegative(),
    })),
  }),
  currentStock: z.object({
    activeListings: z.number().int().nonnegative(),
    listedCapitalCents: z.number().int().nonnegative(),
    candidates: z.array(z.object({
      id: z.number().int().positive(),
      code: z.string().regex(/^A\d{2}$/),
      label: z.string(),
      brand: z.string(),
      model: z.string(),
      daysListed: z.number().int().nonnegative(),
      listPriceCents: z.number().int().positive(),
      costBasisCents: z.number().int().nonnegative(),
    })),
  }),
  overview: z.string().trim().min(1).max(1200),
  wins: z.array(notebookInsightSchema).max(5),
  challenges: z.array(notebookInsightSchema).max(5),
  improvements: z.array(notebookInsightSchema).max(5),
  recommendations: z.array(savedNotebookRecommendationSchema).max(8),
  evidence: z.record(z.string(), z.string()),
  dataCaveats: z.array(z.string().max(300)).max(8),
  generatedAt: z.string().datetime(),
});
export type NotebookReport = z.infer<typeof notebookReportSchema>;

export const notebookActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  rationale: z.string().trim().max(700),
  evidenceKeys: z.array(z.string().max(80)).max(4).default([]),
  relatedWatches: z.array(z.object({
    id: z.number().int().positive(),
    label: z.string().max(180),
  })).max(5).default([]),
  status: z.enum(["open", "done", "dismissed"]).default("open"),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable().default(null),
});
export type NotebookAction = z.infer<typeof notebookActionSchema>;

export const saveNotebookContextSchema = z.object({
  contextNote: z.string().max(2400),
});
export const saveNotebookActionsSchema = z.object({
  actions: z.array(notebookActionSchema).max(40),
});
export const analyzeNotebookSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  comparisonMode: notebookComparisonModeSchema,
  contextNote: z.string().max(2400),
});

export type NotebookEntry = {
  monthKey: string;
  comparisonMode: NotebookComparisonMode;
  contextNote: string;
  report: NotebookReport | null;
  actions: NotebookAction[];
  generatedAt: string | null;
  updatedAt: string | null;
};

export type NotebookWatchInput = {
  id: number;
  brand: string;
  model: string;
  condition: string;
  status: string;
  archivedAt: Date | string | null;
  purchasePrice: number;
  importFee: number | null;
  serviceFee: number | null;
  polishFee: number | null;
  platformFees: number | null;
  shippingFee: number | null;
  insuranceFee: number | null;
  watchRegister: boolean | null;
  watchRegisterFeeSnapshot: number | null;
  salePrice: number | null;
  soldPrice: number | null;
  soldDate: Date | string | null;
  dateSold: Date | string | null;
  dateListed: Date | string | null;
  listPrice: number | null;
  box: boolean;
  papers: boolean;
};

export type NotebookPriceInput = {
  inventoryId: number | null;
  listPrice: number;
  recordedAt: Date | string;
};

export function isNotebookMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function notebookMonthKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(parsed);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : null;
}

function amsterdamDayOrdinal(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return year && month && day ? Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) : null;
}

export function daysListedUntilSale(
  listedAt: Date | string | null | undefined,
  soldAt: Date | string | null | undefined,
): number | null {
  const listed = amsterdamDayOrdinal(listedAt);
  const sold = amsterdamDayOrdinal(soldAt);
  if (listed == null || sold == null || sold < listed) return null;
  return sold - listed;
}

export function notebookComparisonMonthKeys(
  monthKey: string,
  mode: NotebookComparisonMode,
): string[] {
  if (!isNotebookMonthKey(monthKey)) return [];
  const [year, month] = monthKey.split("-").map(Number);
  if (mode === "same-month-last-year") return [`${year - 1}-${String(month).padStart(2, "0")}`];
  const offset = mode === "previous-month" ? 1 : 3;
  return Array.from({ length: offset }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - offset + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

function safeCost(value: number | null | undefined): number {
  return Number.isFinite(value) && value! > 0 ? value! : 0;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function saleAmount(watch: NotebookWatchInput): number | null {
  const modern = watch.salePrice ?? 0;
  const legacy = watch.soldPrice ?? 0;
  const amount = modern === 0 && legacy !== 0 ? legacy : modern || legacy;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function priceChangeStats(watchIds: Set<number>, histories: readonly NotebookPriceInput[]) {
  const grouped = new Map<number, NotebookPriceInput[]>();
  for (const entry of histories) {
    if (entry.inventoryId == null || !watchIds.has(entry.inventoryId)) continue;
    const list = grouped.get(entry.inventoryId) ?? [];
    list.push(entry);
    grouped.set(entry.inventoryId, list);
  }
  let salesWithPriceHistory = 0;
  let salesWithPriceReductions = 0;
  let priceReductionCount = 0;
  for (const entries of Array.from(grouped.values())) {
    const ordered = [...entries].sort((a, b) => {
      const difference = new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
      return difference || a.listPrice - b.listPrice;
    });
    if (ordered.length < 2) continue;
    salesWithPriceHistory++;
    let reductions = 0;
    for (let index = 1; index < ordered.length; index++) {
      if (ordered[index].listPrice < ordered[index - 1].listPrice) reductions++;
    }
    if (reductions > 0) salesWithPriceReductions++;
    priceReductionCount += reductions;
  }
  return { salesWithPriceHistory, salesWithPriceReductions, priceReductionCount };
}

export function calculateNotebookPeriod(
  inventory: readonly NotebookWatchInput[],
  priceHistory: readonly NotebookPriceInput[],
  monthKeys: readonly string[],
  watchRegisterFeeCents: number,
  label: string,
) {
  const monthSet = new Set(monthKeys);
  const matching = inventory.flatMap((watch) => {
    if (watch.status !== "sold") return [];
    const soldAt = watch.soldDate ?? watch.dateSold;
    const month = notebookMonthKey(soldAt);
    return month && monthSet.has(month) ? [{ watch, soldAt }] : [];
  });
  const priced = matching.flatMap(({ watch, soldAt }) => {
    const revenue = saleAmount(watch);
    if (revenue == null) return [];
    const registerFee = watch.watchRegister
      ? safeCost(watch.watchRegisterFeeSnapshot ?? watchRegisterFeeCents)
      : 0;
    const costs = safeCost(watch.purchasePrice) + safeCost(watch.importFee)
      + safeCost(watch.serviceFee) + safeCost(watch.polishFee)
      + safeCost(watch.platformFees) + safeCost(watch.shippingFee)
      + safeCost(watch.insuranceFee) + registerFee;
    const days = daysListedUntilSale(watch.dateListed, soldAt);
    return [{ watch, revenue, netProfit: revenue - costs, days }];
  });
  const revenueCents = priced.reduce((sum, sale) => sum + sale.revenue, 0);
  const netProfitCents = priced.reduce((sum, sale) => sum + sale.netProfit, 0);
  const days = priced.flatMap((sale) => sale.days == null ? [] : [sale.days]);
  const matchedIds = new Set(matching.map(({ watch }) => watch.id));
  const priceStats = priceChangeStats(matchedIds, priceHistory);

  const brandGroups = new Map<string, typeof priced>();
  for (const sale of priced) {
    const brand = sale.watch.brand.trim() || "Unknown brand";
    const group = brandGroups.get(brand) ?? [];
    group.push(sale);
    brandGroups.set(brand, group);
  }
  const brands = Array.from(brandGroups.entries()).map(([brand, sales]) => {
    const brandRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
    const brandProfit = sales.reduce((sum, sale) => sum + sale.netProfit, 0);
    const brandDays = sales.flatMap((sale) => sale.days == null ? [] : [sale.days]);
    return {
      brand,
      salesCount: sales.length,
      revenueCents: brandRevenue,
      netProfitCents: brandProfit,
      marginPercent: brandRevenue ? (brandProfit / brandRevenue) * 100 : null,
      medianDaysListed: median(brandDays),
      daysSampleCount: brandDays.length,
    };
  }).sort((a, b) => b.salesCount - a.salesCount || b.netProfitCents - a.netProfitCents);

  return {
    monthKeys: [...monthKeys],
    label,
    salesCount: matching.length,
    pricedSalesCount: priced.length,
    revenueCents,
    netProfitCents,
    marginPercent: revenueCents > 0 ? (netProfitCents / revenueCents) * 100 : null,
    medianDaysListed: median(days),
    daysSampleCount: days.length,
    ...priceStats,
    brands,
  };
}

export function calculateNotebookCurrentStock(
  inventory: readonly NotebookWatchInput[],
  now: Date,
) {
  const current = inventory.flatMap((watch) => {
    if (watch.status === "sold" || watch.archivedAt || !watch.listPrice || watch.listPrice <= 0) return [];
    const days = daysListedUntilSale(watch.dateListed, now);
    if (days == null) return [];
    const costBasisCents = safeCost(watch.purchasePrice) + safeCost(watch.importFee)
      + safeCost(watch.serviceFee) + safeCost(watch.polishFee)
      + (watch.watchRegister ? safeCost(watch.watchRegisterFeeSnapshot) : 0);
    return [{
      id: watch.id,
      brand: watch.brand,
      model: watch.model,
      condition: watch.condition,
      daysListed: days,
      listPriceCents: watch.listPrice,
      costBasisCents,
      code: "",
    }];
  }).sort((a, b) => b.daysListed - a.daysListed);
  const candidates = current.slice(0, 10).map((watch, index) => ({
    ...watch,
    code: `A${String(index + 1).padStart(2, "0")}`,
    label: `${watch.brand} ${watch.model}`.trim(),
  }));
  return {
    activeListings: current.length,
    listedCapitalCents: current.reduce((sum, watch) => sum + watch.costBasisCents, 0),
    candidates,
  };
}
