import { useMemo, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleHelp,
  TrendingUp,
} from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import {
  buildSalesPatternData,
  SALES_PATTERN_MONTHS,
  type SalesPatternCell,
} from "@/lib/sales-patterns";
import type { InventoryItem } from "@shared/schema";

type Metric = "sales" | "days" | "margin";

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

const metricLabels: Record<Metric, string> = {
  sales: "Sales count",
  days: "Median days listed before sale",
  margin: "Realized margin",
};

const salesRamp = ["#ecf2ee", "#c1dcce", "#97c5ad", "#6dae8d", "#44986d"];
const daysRamp = ["#eff1f3", "#bdd1df", "#8ab1cc", "#5891b9", "#2672a6"];
const lossRamp = ["#F8F0F0", "#F1CBC8", "#EA9F9B", "#E3726F", "#CE5C5A"];

function rampColor(value: number, maximum: number, ramp: string[]): string {
  const intensity = Math.min(1, Math.abs(value) / Math.max(maximum, 1));
  const index = Math.min(ramp.length - 1, Math.floor(intensity * ramp.length));
  return ramp[index];
}

function cellColor(cell: SalesPatternCell, metric: Metric, maximum: number): string {
  if (metric === "sales") {
    if (!cell.salesCount) return "#f1f4f0";
    return rampColor(cell.salesCount, maximum, salesRamp);
  }
  if (metric === "days") {
    if (cell.medianDaysToSell == null) return "#f1f4f0";
    return rampColor(cell.medianDaysToSell, maximum, daysRamp);
  }
  if (cell.marginPercent == null) return "#f1f4f0";
  if (cell.marginPercent === 0) return "#FFFFFF";
  return cell.marginPercent < 0
    ? rampColor(cell.marginPercent, maximum, lossRamp)
    : rampColor(cell.marginPercent, maximum, salesRamp);
}

function isDarkCell(cell: SalesPatternCell, metric: Metric, maximum: number): boolean {
  const value = metric === "sales"
    ? cell.salesCount
    : metric === "days"
      ? cell.medianDaysToSell ?? 0
      : Math.abs(cell.marginPercent ?? 0);
  return value > 0 && value / Math.max(maximum, 1) >= 0.8;
}

function cellValue(cell: SalesPatternCell, metric: Metric): string {
  if (metric === "sales") return cell.salesCount ? String(cell.salesCount) : "";
  if (metric === "days") {
    return cell.medianDaysToSell == null ? "" : `${decimal.format(cell.medianDaysToSell)}d`;
  }
  return cell.marginPercent == null ? "" : `${decimal.format(cell.marginPercent)}%`;
}

function cellSampleCount(cell: SalesPatternCell, metric: Metric): number | null {
  if (metric === "days") return cell.daysToSellSampleCount;
  if (metric === "margin") return cell.marginSampleCount;
  return null;
}

function cellDescription(cell: SalesPatternCell, metric: Metric): string {
  const value = cellValue(cell, metric);
  const sampleCount = cellSampleCount(cell, metric);
  const sampleText = sampleCount == null ? "" : `, ${sampleCount} samples`;
  return `${cell.brand}, ${SALES_PATTERN_MONTHS[cell.month]}: ${value || "no value"}${sampleText}; ${cell.salesCount} sales`;
}

export function SalesPatternsPreview({
  inventory,
  watchRegisterFeeCents,
  periodLabel,
}: {
  inventory: InventoryItem[];
  watchRegisterFeeCents: number;
  periodLabel: string;
}) {
  const preview = useMemo(
    () => buildSalesPatternData(inventory, watchRegisterFeeCents),
    [inventory, watchRegisterFeeCents],
  );
  const peak = Math.max(0, ...preview.monthlySalesCounts);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#d8e2dc] bg-[#fbfcf8] shadow-[0_3px_12px_rgba(24,50,40,.045)]" aria-labelledby="sales-pattern-preview-title">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#8a7650]">
            <BarChart3 aria-hidden="true" className="h-4 w-4" />
            Sales intelligence
          </div>
          <h2 id="sales-pattern-preview-title" className="mt-2 text-lg font-semibold text-[#173c32]">Sales Patterns</h2>
          <p className="mt-1 text-sm text-[#718077]">
            {preview.totalSales
              ? `${preview.totalSales} ${preview.totalSales === 1 ? "sale" : "sales"} · ${periodLabel}`
              : `No completed sales in ${periodLabel}`}
          </p>
        </div>
        {preview.totalSales > 0 && (
          <div className="grid min-w-0 flex-1 grid-cols-6 gap-x-2 gap-y-3 sm:grid-cols-12 sm:max-w-[650px]" aria-label={`Monthly sales counts for ${periodLabel}`}>
            {preview.monthlySalesCounts.map((count, month) => (
              <div key={month} className="flex min-w-0 flex-col items-center gap-1.5" aria-label={`${SALES_PATTERN_MONTHS[month]}: ${count} sales`}>
                <div className="flex h-9 w-full items-end justify-center border-b border-[#e4eae4]">
                  {count > 0 && <span className="w-3 rounded-t-sm bg-[#6f9a7d]" style={{ height: `${Math.max(4, (count / peak) * 30)}px` }} />}
                </div>
                <span className="text-[10px] font-medium text-[#839087]">{SALES_PATTERN_MONTHS[month]}</span>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/sales-patterns"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#cad9ce] bg-[#f4f7f1] px-4 text-sm font-semibold text-[#315747] hover:bg-[#eaf1e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b38b4c]"
        >
          Explore patterns <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default function SalesPatterns() {
  const inventoryQuery = useInventory("sold", true);
  const settingsQuery = useSettings();
  const [metric, setMetric] = useState<Metric>("sales");
  const [year, setYear] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const isLoading = inventoryQuery.isLoading || settingsQuery.isLoading;
  const hasError = inventoryQuery.isError || settingsQuery.isError;
  const retry = () => {
    void inventoryQuery.refetch();
    void settingsQuery.refetch();
  };
  const patterns = useMemo(
    () => buildSalesPatternData(
      inventoryQuery.data ?? [],
      settingsQuery.settings.watch_register_fee,
      year === "all" ? null : Number(year),
    ),
    [inventoryQuery.data, settingsQuery.settings.watch_register_fee, year],
  );
  const maxCount = Math.max(0, ...patterns.rows.flatMap((row) => row.cells.map((cell) => cell.salesCount)));
  const maxDays = Math.max(0, ...patterns.rows.flatMap((row) => row.cells.map((cell) => cell.medianDaysToSell ?? 0)));
  const maxMargin = Math.max(0, ...patterns.rows.flatMap((row) => row.cells.map((cell) => Math.abs(cell.marginPercent ?? 0))));
  const selectedCell = patterns.rows
    .flatMap((row) => row.cells)
    .find((cell) => `${cell.brand}\u0000${cell.month}` === selectedKey) ?? null;
  const hasDaysSamples = patterns.rows.some((row) => row.cells.some((cell) => cell.daysToSellSampleCount > 0));
  const hasMarginSamples = patterns.rows.some((row) => row.cells.some((cell) => cell.marginSampleCount > 0));
  const peakMonth = patterns.monthlySalesCounts.reduce(
    (best, count, month, all) => count > all[best] ? month : best,
    0,
  );

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading sales patterns">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[#e4ebe4]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-[#dce5dd] bg-[#fbfcf8]" />)}
        </div>
        <div className="h-[390px] animate-pulse rounded-2xl border border-[#dce5dd] bg-[#fbfcf8]" />
      </div>
    );
  }

  if (hasError) {
    return (
      <section className="rounded-2xl border border-[#e5d7cf] bg-[#fffaf6] p-7 sm:p-9" role="alert">
        <AlertCircle aria-hidden="true" className="mb-4 h-6 w-6 text-[#a65c4b]" />
        <h1 className="text-2xl font-semibold text-[#173c32]">Sales patterns could not load</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[#68786f]">Sold inventory or fee settings are temporarily unavailable. Your existing records have not been changed.</p>
        <button type="button" onClick={retry} className="mt-5 min-h-11 rounded-lg bg-[#173c32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245444]">Try again</button>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.19em] text-[#79877d]">
            <TrendingUp aria-hidden="true" className="h-4 w-4 text-[#b38b4c]" /> Trade intelligence
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#173c32]">Sales Patterns</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68786f]">A month-by-month read on what sells, how long listings take, and the margin realized after watch-level costs.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.12em] text-[#7b897f]">
            Measure
            <select aria-label="Choose heatmap metric" value={metric} onChange={(event) => setMetric(event.target.value as Metric)} className="min-h-11 min-w-[210px] rounded-lg border border-[#d8e2dc] bg-[#fbfcf8] px-3 text-sm font-medium normal-case tracking-normal text-[#294238] outline-none focus:border-[#799b88] focus:ring-2 focus:ring-[#dce9de]">
              <option value="sales">Sale count</option>
              <option value="days">Median days listed before sale</option>
              <option value="margin">Realized margin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[.12em] text-[#7b897f]">
            Sale year
            <select aria-label="Filter by sale year" value={year} onChange={(event) => { setYear(event.target.value); setSelectedKey(null); }} className="min-h-11 min-w-[150px] rounded-lg border border-[#d8e2dc] bg-[#fbfcf8] px-3 text-sm font-medium normal-case tracking-normal text-[#294238] outline-none focus:border-[#799b88] focus:ring-2 focus:ring-[#dce9de]">
              <option value="all">All years</option>
              {patterns.years.map((saleYear) => <option key={saleYear} value={String(saleYear)}>{saleYear}</option>)}
            </select>
          </label>
        </div>
      </header>

      {!patterns.totalSales ? (
        <section className="rounded-2xl border border-[#dce5dd] bg-[#fbfcf8] px-6 py-14 text-center">
          <CalendarDays aria-hidden="true" className="mx-auto h-8 w-8 text-[#8da192]" />
          <h2 className="mt-4 text-lg font-semibold text-[#294238]">{year === "all" ? "No completed sales to map yet" : `No sales recorded in ${year}`}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#718077]">{year === "all" ? "Once watches have a valid sale date, their brand and sale month will appear here. No values are estimated or filled in." : "There are no completed sales with a valid sale date in this year. Choose another year or show all years."}</p>
          {year !== "all" && <button type="button" onClick={() => { setYear("all"); setSelectedKey(null); }} className="mt-4 min-h-11 rounded-lg border border-[#cad9ce] px-4 py-2 text-sm font-semibold text-[#315747] hover:bg-[#f0f4ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b38b4c]">Show all years</button>}
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Sales pattern summary">
            <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
              <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Watches sold</div>
              <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#183d33]">{patterns.totalSales}</div>
            </div>
            <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
              <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Brands represented</div>
              <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#183d33]">{patterns.rows.length}</div>
            </div>
            <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
              <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Most active month</div>
              <div className="mt-2 flex items-baseline gap-2 font-mono text-2xl font-semibold tracking-tight text-[#183d33]">
                <span>{SALES_PATTERN_MONTHS[peakMonth]}</span>
                <span className="text-sm font-medium text-[#718077]">{Math.max(...patterns.monthlySalesCounts)} sales</span>
              </div>
            </div>
          </section>

          {patterns.totalSales < 5 && (
            <div className="flex gap-3 rounded-xl border border-[#e6e4d9] bg-[#f7f6ef] p-4 text-sm text-[#6e7164]" role="status">
              <CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#9a8456]" />
              <p><strong className="font-semibold text-[#5f624f]">Early sample.</strong> This view reflects {patterns.totalSales} recorded {patterns.totalSales === 1 ? "sale" : "sales"}; month-to-month patterns may be sparse.</p>
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#dce5dd] bg-[#fbfcf8] shadow-[0_3px_12px_rgba(24,50,40,.04)]" aria-labelledby="heatmap-title">
            <div className="flex flex-col gap-4 border-b border-[#e5ebe5] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <h2 id="heatmap-title" className="text-lg font-semibold text-[#183d33]">Brand × sale month</h2>
                <p className="mt-1 text-sm text-[#75847a]">{year === "all" ? "All recorded sale years pooled by calendar month" : `Sale year ${year}`} · select a filled cell to inspect watches</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718077]" aria-label={`${metricLabels[metric]} color scale`}>
                {metric === "sales" ? (
                  <><span>Fewer</span><span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-[#ecf2ee]" /><i className="h-3 w-3 rounded-sm bg-[#c1dcce]" /><i className="h-3 w-3 rounded-sm bg-[#97c5ad]" /><i className="h-3 w-3 rounded-sm bg-[#6dae8d]" /><i className="h-3 w-3 rounded-sm bg-[#44986d]" /></span><span>More</span></>
                ) : metric === "days" ? (
                  <><span>Faster</span><span className="h-3 w-16 rounded-sm bg-gradient-to-r from-[#eff1f3] via-[#8ab1cc] to-[#2672a6]" /><span>Slower</span></>
                ) : (
                  <><span>Loss</span><span className="h-3 w-16 rounded-sm bg-gradient-to-r from-[#CE5C5A] via-white to-[#44986D]" /><span>Profit</span></>
                )}
              </div>
            </div>

            <div className="overflow-x-auto p-4 sm:p-6" role="region" aria-label="Brand by month sales heatmap. On narrow screens, scroll horizontally." tabIndex={0}>
              <table className="w-full min-w-[900px] border-separate border-spacing-[3px] text-left">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 min-w-[150px] bg-[#fbfcf8] px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-[#829087]">Brand</th>
                    {SALES_PATTERN_MONTHS.map((month) => <th key={month} scope="col" className="min-w-[58px] px-1 pb-2 text-center text-[11px] font-semibold uppercase tracking-[.08em] text-[#829087]">{month}</th>)}
                    <th scope="col" className="min-w-[60px] px-2 pb-2 text-right text-[11px] font-semibold uppercase tracking-[.08em] text-[#829087]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.rows.map((row) => (
                    <tr key={row.brand}>
                      <th scope="row" className="sticky left-0 z-10 bg-[#fbfcf8] px-3 py-1 text-sm font-semibold text-[#294238]">{row.brand}</th>
                      {row.cells.map((cell) => {
                        const sampleCount = cellSampleCount(cell, metric);
                        const isSelected = selectedKey === `${cell.brand}\u0000${cell.month}`;
                        const value = cellValue(cell, metric);
                        return (
                          <td key={cell.month} className="p-0.5 text-center">
                            {cell.salesCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedKey(isSelected ? null : `${cell.brand}\u0000${cell.month}`)}
                                aria-pressed={isSelected}
                                aria-label={cellDescription(cell, metric)}
                                className={`flex min-h-[48px] w-full flex-col items-center justify-center rounded-md px-1 py-1 text-xs text-[#294238] hover:brightness-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b38b4c] ${isSelected ? "ring-2 ring-inset ring-[#b38b4c]" : ""}`}
                                style={{ backgroundColor: cellColor(cell, metric, metric === "days" ? maxDays : metric === "margin" ? maxMargin : maxCount) }}
                                title={cellDescription(cell, metric)}
                              >
                                <span className={`font-mono font-semibold ${isDarkCell(cell, metric, metric === "days" ? maxDays : metric === "margin" ? maxMargin : maxCount) ? "text-white" : ""}`}>{value}</span>
                                {sampleCount != null && <span className="mt-0.5 text-[9px] leading-none opacity-80">n={sampleCount}</span>}
                              </button>
                            ) : (
                              <div aria-label={`${row.brand}, ${SALES_PATTERN_MONTHS[cell.month]}: no sales`} className="min-h-[48px] rounded-md bg-[#f6f7f3]" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 text-right font-mono text-xs font-semibold text-[#718077]">{row.totalSales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(metric === "days" && !hasDaysSamples || metric === "margin" && !hasMarginSamples) && (
              <div className="mx-5 mb-5 flex gap-3 rounded-xl border border-[#e6e4d9] bg-[#f7f6ef] p-4 text-sm text-[#6e7164] sm:mx-6">
                <CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#9a8456]" />
                <p>{metric === "days" ? "Sales are present, but none have both a valid listing date and a non-negative time-to-sell sample." : "Sales are present, but no sale has enough recorded price and cost data to calculate realized margin."} Empty heatmap values are intentionally left blank.</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ece6] px-5 py-3 text-xs text-[#75847a] sm:px-6">
              <span>{metric === "days" ? "Cell label: median days · n = valid listing-time samples" : metric === "margin" ? "Cell label: revenue-weighted margin · n = sales with complete margin inputs" : "Cell label: number of watches sold"}</span>
              <span>Sale counts include records without a saved sale price.</span>
            </div>
          </section>

          {selectedCell && (
            <section className="overflow-hidden rounded-2xl border border-[#dce5dd] bg-[#fbfcf8] shadow-[0_3px_12px_rgba(24,50,40,.04)]" aria-labelledby="selected-sales-title">
              <div className="flex flex-col gap-1 border-b border-[#e5ebe5] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8a7650]">Selected cell</div>
                  <h2 id="selected-sales-title" className="mt-1 text-lg font-semibold text-[#183d33]">{selectedCell.brand} · {SALES_PATTERN_MONTHS[selectedCell.month]}</h2>
                </div>
                <span className="font-mono text-sm text-[#718077]">{selectedCell.records.length} {selectedCell.records.length === 1 ? "watch" : "watches"}</span>
              </div>
              <ul className="divide-y divide-[#edf0eb]">
                {selectedCell.records.map((record) => (
                  <li key={record.id}>
                    <Link href={`/inventory/${record.id}`} className="group flex min-h-[64px] items-center justify-between gap-4 px-5 py-3 hover:bg-[#f2f6f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b38b4c] sm:px-6">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#294238]">{record.brand} {record.model}</span>
                        <span className="mt-0.5 block truncate font-mono text-xs text-[#829087]">{record.referenceNumber} · Sold {format(record.saleDate, "dd MMM yyyy")}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-right">
                        <span className="hidden text-xs text-[#718077] sm:block">{record.daysToSell == null ? "Listing time unavailable" : `${record.daysToSell} days listed`}</span>
                        <span className="font-mono text-sm font-semibold text-[#315747]">{record.salePriceCents == null ? "Price unavailable" : money.format(record.salePriceCents / 100)}</span>
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[#97a59a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <aside className="rounded-xl border border-[#dce5dd] bg-[#f1f5ef] p-5 sm:p-6">
            <div className="flex items-center gap-2"><CircleHelp aria-hidden="true" className="h-4 w-4 text-[#a27e43]" /><h2 className="font-semibold text-[#294238]">Reading the pattern</h2></div>
            <div className="mt-3 grid gap-4 text-sm leading-6 text-[#68786f] sm:grid-cols-2">
              <p><strong className="font-semibold text-[#365347]">Listing time</strong> uses the median calendar days between each watch’s listing and valid sale date. The sample count is shown on every cell.</p>
              <p><strong className="font-semibold text-[#365347]">Realized margin</strong> is pre-VAT, weighted by sale revenue, and reflects saved costs, including historical watch-register fees where recorded. Missing values are not treated as zero.</p>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
