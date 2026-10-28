import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getListedPriceChange } from "@shared/price-history";
import type { InventoryPriceHistory } from "@shared/schema";

const formatCurrency = (cents: number) => new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(cents / 100);

const formatRecordedAt = (value: Date | string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : format(date, "d MMM yyyy");
};

export function PriceHistoryCard({
  history = [],
  currentListPrice,
  isLoading = false,
  isError = false,
}: {
  history?: InventoryPriceHistory[];
  currentListPrice: number | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const chronological = [...history].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime() || a.id - b.id,
  );
  const latestFirst = [...chronological].reverse();

  return <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-price-history">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg text-slate-900">Pricing History</CardTitle>
      <p className="text-xs text-slate-500">Saved changes to Price Listed At</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading ? <p role="status" className="text-sm text-slate-500">Loading price history…</p> :
        isError ? <p role="status" className="text-sm text-amber-800">Price history could not be loaded. Your current price is unchanged.</p> :
          latestFirst.length === 0 ? <p className="text-sm text-slate-500">No listed prices recorded yet.</p> :
            <ol className="space-y-0" aria-label="Listed price changes">
              {latestFirst.map((entry, reverseIndex) => {
                const chronologicalIndex = chronological.length - reverseIndex - 1;
                const previous = chronological[chronologicalIndex - 1];
                const change = previous ? getListedPriceChange(previous.listPrice, entry.listPrice) : null;
                const isCurrent = reverseIndex === 0 && currentListPrice != null && currentListPrice === entry.listPrice;
                return <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {reverseIndex < latestFirst.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-slate-200"/>}
                  <span aria-hidden="true" className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${isCurrent ? "border-emerald-600 bg-emerald-100" : "border-slate-300 bg-white"}`}/>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <span className="font-semibold text-slate-900">{formatCurrency(entry.listPrice)}</span>
                      {isCurrent && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Current</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>{chronologicalIndex === 0 ? "Tracking baseline" : "Price updated"}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="h-3 w-3"/>{formatRecordedAt(entry.recordedAt)}</span>
                    </div>
                    {change && <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${change.direction === "down" ? "text-amber-700" : "text-emerald-700"}`}>
                      {change.direction === "down"
                        ? <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5"/>
                        : <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5"/>}
                      {change.direction === "down" ? "Lower" : "Higher"} by {formatCurrency(change.amount)}
                      {change.percent != null && ` (${change.percent.toFixed(1)}%)`}
                    </p>}
                  </div>
                </li>;
              })}
            </ol>}
    </CardContent>
  </Card>;
}
