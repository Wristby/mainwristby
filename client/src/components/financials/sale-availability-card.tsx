import type { SaleAvailabilityEntry, SaleAvailabilitySummary } from "@shared/sale-availability";
import { formatDeliveryDate } from "@shared/delivery";
import { AlertTriangle, CalendarClock, CheckCircle2, Truck, Wallet } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type SaleAvailabilityCardProps = {
  summary: SaleAvailabilitySummary;
  isLoading: boolean;
  isError: boolean;
  formatCurrency: (cents: number) => string;
  compact?: boolean;
};

function Metric({
  title,
  amount,
  count,
  tone,
  testId,
}: {
  title: string;
  amount: string;
  count: number;
  tone: "slate" | "amber" | "emerald";
  testId?: string;
}) {
  const amountColor = {
    slate: "text-slate-900",
    amber: "text-amber-800",
    emerald: "text-emerald-800",
  }[tone];
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4" data-testid={testId}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 truncate text-xl font-bold tabular-nums ${amountColor}`}>{amount}</p>
      <p className="mt-1 text-xs text-slate-500">{count} {count === 1 ? "sale" : "sales"}</p>
    </div>
  );
}

function SaleIdentity({ sale }: { sale: SaleAvailabilityEntry }) {
  const label = `${sale.brand} ${sale.model}`;
  const details = `Ref. ${sale.referenceNumber} · Sale cycle ${sale.cycleNumber}`;
  return (
    <div className="min-w-0">
      {sale.inventoryId != null ? (
        <Link href={`/inventory/${sale.inventoryId}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-emerald-800 hover:underline">
          {label}
        </Link>
      ) : (
        <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
      )}
      <p className="truncate text-xs text-slate-500">{details}</p>
    </div>
  );
}

function ReleaseRow({
  sale,
  formatCurrency,
}: {
  sale: SaleAvailabilityEntry;
  formatCurrency: (cents: number) => string;
}) {
  const releaseLabel = sale.releaseDate ? formatDeliveryDate(sale.releaseDate) : "Date unavailable";
  const countdown = sale.daysUntilAvailable == null
    ? `Available ${releaseLabel}`
    : `Available ${releaseLabel} · ${sale.daysUntilAvailable} ${sale.daysUntilAvailable === 1 ? "day" : "days"}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <SaleIdentity sale={sale} />
          <p className="mt-1 text-xs font-medium text-amber-800">{countdown}</p>
        </div>
      </div>
      <p className="ml-auto text-right text-sm font-bold tabular-nums text-slate-900">
        {sale.proceedsCents == null ? "Not recorded" : formatCurrency(sale.proceedsCents)}
      </p>
    </div>
  );
}

function DeliveryRow({
  sale,
  formatCurrency,
}: {
  sale: SaleAvailabilityEntry;
  formatCurrency: (cents: number) => string;
}) {
  const soldDate = sale.soldDate ? new Date(sale.soldDate) : null;
  const soldLabel = soldDate && Number.isFinite(soldDate.getTime())
    ? `Sold ${formatDeliveryDate(soldDate.toISOString().slice(0, 10))} · awaiting delivery`
    : "Awaiting delivery";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Truck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <SaleIdentity sale={sale} />
          <p className="mt-1 text-xs font-medium text-slate-500">{soldLabel}</p>
        </div>
      </div>
      <p className="ml-auto text-right text-sm font-bold tabular-nums text-slate-900">
        {sale.proceedsCents == null ? "Not recorded" : formatCurrency(sale.proceedsCents)}
      </p>
    </div>
  );
}

export function SaleAvailabilityCard({
  summary,
  isLoading,
  isError,
  formatCurrency,
  compact = false,
}: SaleAvailabilityCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="sale-availability-card">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">Incoming Sale Proceeds</h3>
            <p className="text-xs text-slate-500">
              Expected money from sold watches after marketplace fees, shown as it moves toward payout.
            </p>
          </div>
          <Badge variant="outline" className="ml-auto shrink-0 border-slate-200 bg-slate-50 text-slate-600">
            All sales
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading sale availability">
            {[0, 1, 2, 3].map((key) => <div key={key} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : isError ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600" role="status">
            Sale availability could not be loaded. Refresh the page to try again.
          </p>
        ) : summary.totalSaleCount === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            No sale proceeds to track yet. Sale availability will appear here after you record a sale.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric title="Awaiting delivery" amount={formatCurrency(summary.awaitingDeliveryCents)} count={summary.awaitingDelivery.length} tone="slate" />
              <Metric title="Inside return window" amount={formatCurrency(summary.inReturnWindowCents)} count={summary.inReturnWindow.length} tone="amber" />
              <Metric title="Cleared from return hold" amount={formatCurrency(summary.availableCents)} count={summary.available.length} tone="emerald" />
              <Metric
                title="Total proceeds in pipeline"
                amount={formatCurrency(summary.totalTrackedCents)}
                count={summary.totalTrackedSaleCount}
                tone="emerald"
                testId="sale-availability-total"
              />
            </div>
            {!compact && (
              <>
            <p className="text-xs text-slate-500">
              Cleared proceeds stay here through delivery day 17, then drop off automatically.
            </p>

            {(summary.returnExcludedCount > 0 || summary.needsReview.length > 0) && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                {summary.returnExcludedCount > 0 && (
                  <span>{summary.returnExcludedCount} {summary.returnExcludedCount === 1 ? "sale excluded" : "sales excluded"} due to a return case.</span>
                )}
                {summary.needsReview.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    {summary.needsReview.length} {summary.needsReview.length === 1 ? "sale needs" : "sales need"} its sale price, fee, or delivery date checked.
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-5 border-t border-slate-100 pt-4 lg:grid-cols-2">
              <section aria-labelledby="upcoming-release-title">
                <div className="mb-1 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  <h4 id="upcoming-release-title" className="text-sm font-semibold text-slate-800">Upcoming releases</h4>
                  <span className="ml-auto text-xs text-slate-400">{summary.inReturnWindow.length}</span>
                </div>
                {summary.inReturnWindow.length ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    {summary.inReturnWindow.map((sale) => <ReleaseRow key={sale.id} sale={sale} formatCurrency={formatCurrency} />)}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-slate-500">
                    {summary.awaitingDelivery.length ? "No dates until delivery is recorded." : "No proceeds are currently inside a return window."}
                  </p>
                )}
              </section>

              <section aria-labelledby="awaiting-delivery-title">
                <div className="mb-1 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <h4 id="awaiting-delivery-title" className="text-sm font-semibold text-slate-800">Awaiting delivery</h4>
                  <span className="ml-auto text-xs text-slate-400">{summary.awaitingDelivery.length}</span>
                </div>
                {summary.awaitingDelivery.length ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    {summary.awaitingDelivery.map((sale) => <DeliveryRow key={sale.id} sale={sale} formatCurrency={formatCurrency} />)}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-slate-500">All recorded sales have a delivery date.</p>
                )}
              </section>
            </div>

            {summary.available.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {summary.available.length} {summary.available.length === 1 ? "sale has" : "sales have"} passed the tracked return window. Actual marketplace payout timing may differ.
              </p>
            )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
