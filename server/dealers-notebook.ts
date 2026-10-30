import {
  calculateNotebookCurrentStock,
  calculateNotebookPeriod,
  notebookComparisonMonthKeys,
  notebookMonthKey,
  type NotebookComparisonMode,
  type NotebookPriceInput,
  type NotebookWatchInput,
} from "@shared/dealers-notebook";

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/Amsterdam" })
    .format(new Date(Date.UTC(year, month - 1, 15)));
};

function formatPeriod(keys: string[], mode: NotebookComparisonMode): string {
  if (mode === "previous-month") return monthLabel(keys[0]);
  if (mode === "same-month-last-year") return monthLabel(keys[0]);
  return `${monthLabel(keys[0])}–${monthLabel(keys[keys.length - 1])}`;
}

export function prepareNotebookAnalysis(
  inventory: readonly NotebookWatchInput[],
  priceHistory: readonly NotebookPriceInput[],
  monthKey: string,
  comparisonMode: NotebookComparisonMode,
  watchRegisterFeeCents: number,
  contextNote: string,
  now = new Date(),
) {
  const comparisonMonthKeys = notebookComparisonMonthKeys(monthKey, comparisonMode);
  const period = calculateNotebookPeriod(inventory, priceHistory, [monthKey], watchRegisterFeeCents, monthLabel(monthKey));
  const comparison = calculateNotebookPeriod(
    inventory,
    priceHistory,
    comparisonMonthKeys,
    watchRegisterFeeCents,
    formatPeriod(comparisonMonthKeys, comparisonMode),
  );
  const currentStock = calculateNotebookCurrentStock(inventory, now);
  const selectedMonths = new Set([monthKey, ...comparisonMonthKeys]);
  const soldWatches = inventory
    .filter((watch) => watch.status === "sold" && selectedMonths.has(notebookMonthKey(watch.soldDate ?? watch.dateSold) ?? ""))
    .sort((a, b) => new Date(b.soldDate ?? b.dateSold ?? 0).getTime() - new Date(a.soldDate ?? a.dateSold ?? 0).getTime());
  const watchLinks = new Map<string, { id: number; label: string }>();

  const saleSamples = soldWatches.slice(0, 24).map((watch, index) => {
    const code = `S${String(index + 1).padStart(2, "0")}`;
    const label = `${watch.brand} ${watch.model}`.trim();
    const soldMonth = notebookMonthKey(watch.soldDate ?? watch.dateSold)!;
    const oneSale = calculateNotebookPeriod([watch], priceHistory, [soldMonth], watchRegisterFeeCents, monthLabel(soldMonth));
    watchLinks.set(code, { id: watch.id, label });
    return {
      code,
      month: soldMonth,
      brand: watch.brand,
      model: watch.model,
      condition: watch.condition,
      salePriceCents: oneSale.revenueCents,
      netProfitCents: oneSale.netProfitCents,
      marginPercent: oneSale.marginPercent,
      daysListed: oneSale.medianDaysListed,
      priceReductions: oneSale.priceReductionCount,
      box: watch.box,
      papers: watch.papers,
    };
  });

  const currentCandidates = currentStock.candidates.map((watch) => {
    const label = `${watch.brand} ${watch.model}`.trim();
    watchLinks.set(watch.code, { id: watch.id, label });
    const { id: _id, label: _label, ...safeWatch } = watch;
    return safeWatch;
  });

  const money = (cents: number) => euro.format(cents / 100);
  const percentChange = (current: number, previous: number, previousPeriods = 1) => {
    if (previous <= 0 || previousPeriods <= 0) return "No comparable baseline is available.";
    const average = previous / previousPeriods;
    const change = ((current - average) / average) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs the comparison-period monthly average.`;
  };
  const evidence: Record<string, string> = {
    period_sales: `${period.salesCount} recorded sales in ${period.label}`,
    comparison_sales: `${comparison.salesCount} recorded sales across ${comparison.label}`,
    sales_change: `Sales count is ${percentChange(period.salesCount, comparison.salesCount, comparisonMonthKeys.length)}`,
    period_revenue: `Recorded revenue: ${money(period.revenueCents)}`,
    comparison_revenue: `Comparison revenue: ${money(comparison.revenueCents)}`,
    revenue_change: `Revenue is ${percentChange(period.revenueCents, comparison.revenueCents, comparisonMonthKeys.length)}`,
    period_profit: `Recorded profit before VAT: ${money(period.netProfitCents)}`,
    comparison_profit: `Comparison profit before VAT: ${money(comparison.netProfitCents)}`,
    profit_change: `Recorded profit is ${percentChange(period.netProfitCents, comparison.netProfitCents, comparisonMonthKeys.length)}`,
    period_margin: period.marginPercent == null ? "Margin unavailable: no priced sales." : `Revenue-weighted margin before VAT: ${period.marginPercent.toFixed(1)}%`,
    comparison_margin: comparison.marginPercent == null ? "Comparison margin unavailable: no priced sales." : `Comparison revenue-weighted margin before VAT: ${comparison.marginPercent.toFixed(1)}%`,
    period_days: period.medianDaysListed == null ? "Days-to-sell unavailable: no complete listing-date samples." : `Median days listed before sale: ${period.medianDaysListed.toFixed(0)} (n=${period.daysSampleCount})`,
    comparison_days: comparison.medianDaysListed == null ? "Comparison days-to-sell unavailable." : `Comparison median days listed: ${comparison.medianDaysListed.toFixed(0)} (n=${comparison.daysSampleCount})`,
    period_price_cuts: `${period.salesWithPriceReductions} of ${period.salesWithPriceHistory} sales with tracked price history had at least one recorded reduction (${period.priceReductionCount} reduction${period.priceReductionCount === 1 ? "" : "s"}).`,
    comparison_price_cuts: `${comparison.salesWithPriceReductions} of ${comparison.salesWithPriceHistory} comparison sales with tracked price history had at least one recorded reduction (${comparison.priceReductionCount} reduction${comparison.priceReductionCount === 1 ? "" : "s"}).`,
    current_stock: `${currentStock.activeListings} active listings with a saved asking price; recorded cost basis totals ${money(currentStock.listedCapitalCents)}.`,
    oldest_stock: currentStock.candidates.length ? `Oldest listed current-stock candidate: ${currentStock.candidates[0].label}, ${currentStock.candidates[0].daysListed} days listed.` : "No current priced listings with a valid listing date.",
  };
  period.brands.slice(0, 6).forEach((brand, index) => {
    evidence[`period_brand_${index + 1}`] = `${brand.brand}: ${brand.salesCount} sale${brand.salesCount === 1 ? "" : "s"}, revenue ${money(brand.revenueCents)}, profit before VAT ${money(brand.netProfitCents)}${brand.marginPercent == null ? "" : `, margin ${brand.marginPercent.toFixed(1)}%`}.`;
  });
  comparison.brands.slice(0, 6).forEach((brand, index) => {
    evidence[`comparison_brand_${index + 1}`] = `${brand.brand}: ${brand.salesCount} comparison sale${brand.salesCount === 1 ? "" : "s"}, revenue ${money(brand.revenueCents)}, profit before VAT ${money(brand.netProfitCents)}.`;
  });

  return {
    period,
    comparison,
    currentStock,
    evidence,
    watchLinks,
    promptData: {
      period,
      comparison,
      currentStock: {
        activeListings: currentStock.activeListings,
        listedCapitalCents: currentStock.listedCapitalCents,
        candidates: currentCandidates,
      },
      saleSamples,
      evidence,
      contextNote,
      dataNotes: [
        "The period measures completed sales by saved sale date in Europe/Amsterdam time.",
        "Profit is calculated from recorded watch-level purchase, import, service, polish, platform, shipping, insurance, and watch-register costs; it is before VAT and excludes general overhead.",
        "Price-change history begins when tracking started; earlier reductions may not be available.",
        "Current inventory is a snapshot today, not a historical month-end inventory record.",
        "Buyer names, client contacts, serial numbers, tracking numbers, notes, and client records are not included.",
      ],
    },
  };
}
