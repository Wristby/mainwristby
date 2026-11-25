import { BookOpenText, Clock3, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "wouter";
import type { NotebookReport } from "@shared/dealers-notebook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMonth(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return "This month";
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export function MonthlyBusinessBriefing({
  monthKey,
  report,
  isLoading,
  isError,
  onRetry,
}: {
  monthKey: string;
  report: NotebookReport | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const notebookHref = `/dealers-notebook?month=${encodeURIComponent(monthKey)}`;

  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="monthly-business-briefing">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Owner’s briefing</p>
          <CardTitle className="mt-1 text-lg text-slate-900">Monthly business briefing</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{formatMonth(monthKey)}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <BookOpenText aria-hidden="true" className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500" role="status">Loading saved briefing…</p>
        ) : isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">The saved briefing could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />Retry
            </Button>
          </div>
        ) : report ? (
          <div className="space-y-4">
            <p className="max-w-4xl text-sm leading-6 text-slate-700">{report.overview}</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <BriefMetric label="Watches sold" value={String(report.period.salesCount)} />
              <BriefMetric label="Revenue" value={formatCurrency(report.period.revenueCents)} />
              <BriefMetric label="Recorded profit" value={formatCurrency(report.period.netProfitCents)} />
              <BriefMetric
                label="Proceeds tracked at review"
                value={report.currentOperations
                  ? formatCurrency(report.currentOperations.saleProceeds.trackedCents)
                  : "Refresh review"}
              />
            </div>
            {!report.currentOperations && (
              <p className="text-xs text-slate-500">
                This saved review predates the operations snapshot. Refresh it in Dealer’s Notebook to add current proceeds and inventory queues.
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                Saved {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(report.generatedAt))}
                {report.currentOperations && <> · operations as of {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.currentOperations.capturedAt))}</>}
              </p>
              <Link href={notebookHref} className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
                <Sparkles aria-hidden="true" className="h-4 w-4" />Open full review
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              No saved review for this month yet. Generate one in Dealer’s Notebook to see sales, profit, proceeds, and evidence-backed recommendations together.
            </p>
            <Link href={notebookHref} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900">
              <Sparkles aria-hidden="true" className="h-4 w-4" />Open Notebook
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
