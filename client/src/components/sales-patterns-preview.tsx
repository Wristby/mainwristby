import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import {
  buildSalesPatternData,
  SALES_PATTERN_MONTHS,
} from "@/lib/sales-patterns";
import type { InventoryItem } from "@shared/schema";

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
