import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Info,
  Lightbulb,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDealerNotebookEntry,
  useGenerateDealerNotebookReport,
  useSaveDealerNotebookActions,
  useSaveDealerNotebookContext,
} from "@/hooks/use-dealers-notebook";
import type {
  NotebookAction,
  NotebookComparisonMode,
  NotebookInsight,
  NotebookRecommendation,
} from "@shared/dealers-notebook";
import "./dealers-notebook.css";

const COMPARISONS: { value: NotebookComparisonMode; label: string; detail: string }[] = [
  { value: "previous-month", label: "Previous month", detail: "A direct month-on-month view" },
  { value: "same-month-last-year", label: "Same month last year", detail: "A year-on-year view" },
  { value: "prior-three-months", label: "Prior three months", detail: "A broader recent baseline" },
];

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const MONEY_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

function money(cents: number) {
  return MONEY_FORMATTER.format(cents / 100);
}

function percent(value: number | null) {
  return value == null ? "Not available" : `${value.toFixed(1)}%`;
}

function delta(current: number, comparison: number) {
  const difference = current - comparison;
  return {
    amount: difference,
    label: `${difference > 0 ? "+" : difference < 0 ? "−" : ""}${money(Math.abs(difference))}`,
  };
}

function Confidence({ value }: { value: NotebookInsight["confidence"] }) {
  const label = value === "high" ? "Strong evidence" : value === "medium" ? "Some evidence" : "Limited evidence";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      value === "high" ? "bg-[#e7f0e9] text-[#315b45]" : value === "medium" ? "bg-[#f4efdf] text-[#80652d]" : "bg-[#f3e9e3] text-[#8a5843]"
    }`}>
      <CircleDot aria-hidden="true" className="h-3 w-3" />
      {label}
    </span>
  );
}

function EvidenceList({ keys, evidence }: { keys: string[]; evidence: Record<string, string> }) {
  if (!keys.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {keys.map((key) => (
        <span key={key} title={evidence[key] || key} className="inline-flex max-w-full items-start gap-1.5 rounded-md bg-[#eef3ec] px-2.5 py-1.5 text-xs text-[#53685b]">
          <FileText aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="truncate">{evidence[key] || key}</span>
        </span>
      ))}
    </div>
  );
}

function InsightSection({
  title,
  items,
  evidence,
  icon,
  tone,
}: {
  title: string;
  items: NotebookInsight[];
  evidence: Record<string, string>;
  icon: React.ReactNode;
  tone: "positive" | "watch" | "neutral";
}) {
  const toneClass = tone === "positive" ? "text-[#3a7052]" : tone === "watch" ? "text-[#9a7132]" : "text-[#657b72]";
  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf2eb] ${toneClass}`}>{icon}</span>
        <h3 className="text-[17px] font-semibold text-[#20352e]">{title}</h3>
        <span className="ml-auto text-xs text-[#839087]">{items.length}</span>
      </div>
      {items.length ? (
        <div className="space-y-4 pl-1">
          {items.map((item) => (
            <article key={item.id} className="dn-insight">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold leading-snug text-[#263d33]">{item.title}</h4>
                <Confidence value={item.confidence} />
              </div>
              <p className="mt-1.5 text-sm leading-6 text-[#68776e]">{item.explanation}</p>
              <EvidenceList keys={item.evidenceKeys} evidence={evidence} />
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-[#f3f5f0] px-4 py-3 text-sm text-[#78847c]">No supported findings in this section for the selected period.</p>
      )}
    </section>
  );
}

function newAction(recommendation: NotebookRecommendation): NotebookAction {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: recommendation.title,
    rationale: `${recommendation.action} ${recommendation.rationale}`,
    evidenceKeys: recommendation.evidenceKeys,
    relatedWatches: recommendation.relatedWatches,
    status: "open",
    createdAt: now,
    completedAt: null,
  };
}

export default function DealersNotebook() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const notebook = useDealerNotebookEntry(monthKey);
  const saveContext = useSaveDealerNotebookContext();
  const saveActions = useSaveDealerNotebookActions();
  const generateReport = useGenerateDealerNotebookReport();
  const [contextNote, setContextNote] = useState("");
  const [comparisonMode, setComparisonMode] = useState<NotebookComparisonMode>("previous-month");
  const [feedback, setFeedback] = useState("");
  const [pageError, setPageError] = useState("");
  const initializedMonth = useRef<string | null>(null);

  const entry = notebook.data?.entry;
  const report = entry?.report ?? null;

  useEffect(() => {
    if (entry && entry.monthKey === monthKey && initializedMonth.current !== monthKey) {
      initializedMonth.current = monthKey;
      setContextNote(entry.contextNote);
      setComparisonMode(entry.comparisonMode);
      setFeedback("");
      setPageError("");
    }
  }, [entry, monthKey]);

  async function saveBusinessContext() {
    setFeedback("");
    setPageError("");
    try {
      await saveContext.mutateAsync({ monthKey, contextNote });
      setFeedback("Business context saved.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not save your note. Please try again.");
    }
  }

  async function createReport() {
    setFeedback("");
    setPageError("");
    try {
      await generateReport.mutateAsync({ monthKey, comparisonMode, contextNote });
      setFeedback(`Review generated for ${monthLabel(monthKey)}.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not generate the review. Please try again.");
    }
  }

  async function persistActions(actions: NotebookAction[], successMessage: string) {
    setFeedback("");
    setPageError("");
    try {
      await saveActions.mutateAsync({ monthKey, actions });
      setFeedback(successMessage);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not save this action. Please try again.");
    }
  }

  function changeActionStatus(action: NotebookAction, status: "done" | "dismissed" | "open") {
    const actions = (entry?.actions ?? []).map((current) => current.id === action.id
      ? { ...current, status, completedAt: status === "done" ? new Date().toISOString() : null }
      : current);
    void persistActions(actions, status === "done" ? "Action marked done." : status === "dismissed" ? "Action dismissed." : "Action reopened.");
  }

  function addRecommendation(recommendation: NotebookRecommendation) {
    const current = entry?.actions ?? [];
    const alreadyAdded = current.some((action) => action.title === recommendation.title && action.status !== "dismissed");
    if (alreadyAdded) {
      setFeedback("This recommendation is already in your action list.");
      return;
    }
    void persistActions([...current, newAction(recommendation)], "Recommendation added to your review actions.");
  }

  if (notebook.isLoading && !notebook.data) {
    return (
      <div className="dealer-notebook space-y-7" aria-label="Loading Dealer's Notebook">
        <div className="space-y-3"><div className="dn-skeleton h-3 w-28 rounded" /><div className="dn-skeleton h-10 w-72 rounded-lg" /><div className="dn-skeleton h-4 w-96 max-w-full rounded" /></div>
        <div className="dn-skeleton h-28 rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="dn-skeleton h-60 rounded-2xl" /><div className="dn-skeleton h-60 rounded-2xl" /></div>
      </div>
    );
  }

  if (notebook.isError && !notebook.data) {
    const message = notebook.error instanceof Error ? notebook.error.message : "The notebook could not be loaded.";
    return (
      <div className="dealer-notebook mx-auto max-w-3xl py-12">
        <div className="dn-panel flex flex-col items-start gap-4 p-7 sm:p-9">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6e9e4] text-[#9a5a44]"><AlertCircle aria-hidden="true" /></span>
          <div><p className="dn-eyebrow">Dealer’s Notebook</p><h1 className="mt-2 text-2xl font-semibold">Your journal is unavailable</h1><p className="mt-2 text-sm leading-6 text-[#718078]">{message}</p></div>
          <Button onClick={() => { void notebook.refetch(); }} className="bg-[#234b3d] text-white hover:bg-[#2e5d4a]"><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</Button>
        </div>
      </div>
    );
  }

  const savedActions = entry?.actions ?? [];
  const openActions = savedActions.filter((action) => action.status === "open");
  const resolvedActions = savedActions.filter((action) => action.status !== "open");
  const previousActions = notebook.data?.previousActions ?? [];

  return (
    <div className="dealer-notebook space-y-7 pb-8">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2"><BookOpenText aria-hidden="true" className="h-4 w-4 text-[#9b7b44]" /><span className="dn-eyebrow">Private business review</span></div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#20352e]">Dealer’s Notebook</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-[#6d7b72]">A monthly read on what your recorded sales say — with the evidence, context, and next steps kept together.</p>
        </div>
        <div className="dn-month-controls flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5">
            <span className="dn-eyebrow">Review month</span>
            <input aria-label="Review month" type="month" value={monthKey} onChange={(event) => { initializedMonth.current = null; setMonthKey(event.target.value); setFeedback(""); setPageError(""); }} className="dn-control w-[185px]" />
          </label>
          <label className="grid gap-1.5">
            <span className="dn-eyebrow">Compare against</span>
            <select aria-label="Comparison period" value={comparisonMode} onChange={(event) => setComparisonMode(event.target.value as NotebookComparisonMode)} className="dn-control w-[210px]">
              {COMPARISONS.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {pageError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#e7c9bc] bg-[#fbf1ec] p-4 text-sm text-[#7d4937]">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{pageError}</p>
          <button type="button" aria-label="Dismiss error" onClick={() => setPageError("")} className="rounded p-1 hover:bg-[#f5e4dc]"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      )}
      {feedback && <p role="status" className="flex items-center gap-2 text-sm font-medium text-[#3d7054]"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />{feedback}</p>}

      <section className="dn-panel overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e9f0e8] px-3 py-1 text-xs font-semibold text-[#446650]">{monthLabel(monthKey)}</span>
              <span className="text-xs text-[#819087]">{COMPARISONS.find((mode) => mode.value === comparisonMode)?.detail}</span>
            </div>
            <div className="mt-4 max-w-3xl">
              <h2 className="font-serif text-[26px] leading-tight tracking-[-.02em] text-[#244235] sm:text-[30px]">
                {report ? "Your month, in context." : "Make room for the story behind the numbers."}
              </h2>
              {report ? (
                <p className="mt-3 text-[15px] leading-7 text-[#63736a]">{report.overview}</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#6f7d74]">
                  Generate a saved review using your own recorded sales. Add the details that the ledger can’t show, then turn grounded recommendations into review-only actions.
                </p>
              )}
            </div>
            {report && (
              <p className="mt-4 text-xs text-[#839087]">
                Generated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}
              </p>
            )}
          </div>
          <div className="flex items-center border-t border-[#e3e9e1] bg-[#f4f6f0] p-5 lg:w-[255px] lg:border-l lg:border-t-0 lg:p-7">
            <div className="w-full">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#76857b]"><Sparkles aria-hidden="true" className="h-4 w-4 text-[#a07d42]" />Notebook analysis</div>
              <Button onClick={() => { void createReport(); }} disabled={generateReport.isPending || !entry} className="w-full justify-center bg-[#234b3d] text-white hover:bg-[#2d5c49]">
                {generateReport.isPending ? <><RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" />Building review</> : <><Sparkles aria-hidden="true" className="h-4 w-4" />{report ? "Refresh review" : "Generate review"}</>}
              </Button>
              <p className="mt-3 text-xs leading-5 text-[#7a877f]">Creates or replaces the saved review for this month. Your inventory will not be changed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)]">
        <div className="dn-panel p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="dn-eyebrow">Your margin notes</p><h2 className="mt-1 text-lg font-semibold text-[#244235]">Business context</h2></div>
            <span className="text-xs text-[#829087]">{contextNote.length}/2400</span>
          </div>
          <p className="mb-3 mt-2 text-sm leading-6 text-[#738078]">Anything that shaped this month but won’t appear in a sale record: sourcing constraints, time away, market shifts, or a deliberate change in strategy.</p>
          <textarea
            className="dn-textarea"
            aria-label="Business context note"
            maxLength={2400}
            value={contextNote}
            onChange={(event) => setContextNote(event.target.value)}
            placeholder="Add a private note for this month’s review…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs leading-5 text-[#879189]">This note is saved with the selected month and included when you generate a review.</p>
            <Button variant="outline" onClick={() => { void saveBusinessContext(); }} disabled={saveContext.isPending || !entry} className="border-[#cbd8cd] bg-[#fbfcf8] text-[#315342]">
              {saveContext.isPending ? <><RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" />Saving</> : <><Check aria-hidden="true" className="h-4 w-4" />Save context</>}
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border border-[#d9e4d9] bg-[#edf3ec] p-5 sm:p-6">
          <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9dc] text-[#41634d]"><ShieldCheck aria-hidden="true" className="h-[18px] w-[18px]" /></span><h2 className="font-semibold text-[#294638]">Private by design</h2></div>
          <p className="mt-3 text-sm leading-6 text-[#5f7365]">Gemini receives sales, cost, and watch attributes, plus the business-context note you provide, to prepare the review.</p>
          <div className="mt-3 rounded-lg border border-[#d7e1d5] bg-[#f7f9f4] p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#4f6556]"><LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />Never sent to Gemini</p>
            <p className="mt-1.5 text-xs leading-5 text-[#718078]">Buyer/client contact data, serial numbers, and tracking details.</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#718078]">A generated review is saved for you to inspect. Recommendations are suggestions only; nothing auto-changes inventory.</p>
        </aside>
      </section>

      {report ? (
        <>
          <section aria-label="Monthly sales evidence" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><p className="dn-eyebrow">The recorded picture</p><h2 className="mt-1 text-xl font-semibold text-[#244235]">Sales & comparison</h2></div>
              <p className="text-xs text-[#819087]">Profit shown before VAT</p>
            </div>
            <div className="dn-panel overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-[#385342]">{report.period.label}</p>
                  <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
                    <Metric label="Watches sold" value={String(report.period.salesCount)} />
                    <Metric label="Priced sales" value={String(report.period.pricedSalesCount)} />
                    <Metric label="Revenue" value={money(report.period.revenueCents)} />
                    <Metric label="Recorded profit" value={money(report.period.netProfitCents)} emphasis />
                    <Metric label="Profit margin" value={percent(report.period.marginPercent)} />
                    <Metric label="Median days listed" value={report.period.medianDaysListed == null ? "Not available" : `${report.period.medianDaysListed} days`} />
                  </div>
                </div>
                <div className="border-t border-[#e2e9e1] bg-[#f6f7f2] p-5 sm:p-6 md:border-l md:border-t-0">
                  <p className="text-sm font-semibold text-[#63756a]">{report.comparison.label}</p>
                  <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
                    <Metric label="Watches sold" value={String(report.comparison.salesCount)} />
                    <Metric label="Priced sales" value={String(report.comparison.pricedSalesCount)} />
                    <Metric label="Revenue" value={money(report.comparison.revenueCents)} />
                    <Metric label="Recorded profit" value={money(report.comparison.netProfitCents)} />
                    <Metric label="Profit margin" value={percent(report.comparison.marginPercent)} />
                    <Metric label="Median days listed" value={report.comparison.medianDaysListed == null ? "Not available" : `${report.comparison.medianDaysListed} days`} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#e2e9e1] px-5 py-3 text-xs">
                <Difference label="Profit vs comparison" value={delta(report.period.netProfitCents, report.comparison.netProfitCents)} />
                <Difference label="Revenue vs comparison" value={delta(report.period.revenueCents, report.comparison.revenueCents)} />
                <span className="text-[#7b887f]">Price reductions recorded: {report.period.priceReductionCount} in period / {report.comparison.priceReductionCount} in comparison</span>
              </div>
            </div>
          </section>

          <section className="grid items-start gap-6 lg:grid-cols-2">
            <div className="dn-panel space-y-7 p-5 sm:p-7">
              <InsightSection title="Wins" items={report.wins} evidence={report.evidence} icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />} tone="positive" />
              <div className="border-t border-[#e6ebe4]" />
              <InsightSection title="Challenges" items={report.challenges} evidence={report.evidence} icon={<TrendingDown aria-hidden="true" className="h-4 w-4" />} tone="watch" />
            </div>
            <div className="dn-panel space-y-7 p-5 sm:p-7">
              <InsightSection title="Improvements" items={report.improvements} evidence={report.evidence} icon={<Lightbulb aria-hidden="true" className="h-4 w-4" />} tone="neutral" />
              <div className="border-t border-[#e6ebe4]" />
              <section className="space-y-4">
                <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4efdf] text-[#92743e]"><ChevronRight aria-hidden="true" className="h-4 w-4" /></span><h3 className="text-[17px] font-semibold text-[#20352e]">Recommendations</h3></div>
                {report.recommendations.length ? report.recommendations.map((recommendation) => {
                  const added = savedActions.some((action) => action.title === recommendation.title && action.status !== "dismissed");
                  return (
                    <article key={recommendation.id} className="rounded-xl border border-[#e2e8de] bg-[#fffefa] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold text-[#2b4336]">{recommendation.title}</h4>
                        <Button size="sm" variant="outline" disabled={added || saveActions.isPending} onClick={() => addRecommendation(recommendation)} className="min-h-9 border-[#d4dfd4] text-xs text-[#3b5c47]">
                          {added ? <><Check aria-hidden="true" className="h-3.5 w-3.5" />Added</> : <><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add to actions</>}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#68776e]">{recommendation.action}</p>
                      <p className="mt-2 text-xs leading-5 text-[#89938b]">{recommendation.rationale}</p>
                      <EvidenceList keys={recommendation.evidenceKeys} evidence={report.evidence} />
                      {!!recommendation.relatedWatches.length && <p className="mt-2 text-xs text-[#728078]">Related: {recommendation.relatedWatches.map((watch) => watch.label).join(" · ")}</p>}
                    </article>
                  );
                }) : <p className="rounded-lg bg-[#f3f5f0] px-4 py-3 text-sm text-[#78847c]">No recommendations were returned for this month.</p>}
              </section>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.7fr)]">
            <div className="dn-panel p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><p className="dn-eyebrow">For review, never automatic</p><h2 className="mt-1 text-xl font-semibold text-[#244235]">Your actions</h2></div>
                <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#536a59]">{openActions.length} open</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#738078]">Decide whether to do, dismiss, or keep each step. This list is a private record, not an inventory workflow.</p>
              <div className="mt-5 space-y-3">
                {openActions.length ? openActions.map((action) => (
                  <ActionItem key={action.id} action={action} evidence={report.evidence} busy={saveActions.isPending} onStatus={changeActionStatus} />
                )) : (
                  <div className="rounded-xl border border-dashed border-[#ccd9cd] bg-[#f6f8f2] px-5 py-7 text-center">
                    <CheckCircle2 aria-hidden="true" className="mx-auto h-6 w-6 text-[#6d8a70]" />
                    <p className="mt-2 font-semibold text-[#385342]">Nothing open for this month</p>
                    <p className="mt-1 text-sm text-[#7a877f]">Add a recommendation to make a review action.</p>
                  </div>
                )}
              </div>
              {resolvedActions.length > 0 && (
                <details className="mt-5 border-t border-[#e6ebe4] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#64766b]">Completed or dismissed ({resolvedActions.length})</summary>
                  <div className="mt-3 space-y-2">{resolvedActions.map((action) => <ActionItem key={action.id} action={action} evidence={report.evidence} busy={saveActions.isPending} onStatus={changeActionStatus} />)}</div>
                </details>
              )}
            </div>

            <div className="space-y-5">
              <CurrentStock currentStock={report.currentStock} />
              <DataCaveats caveats={report.dataCaveats} />
            </div>
          </section>

          {Object.keys(report.evidence).length > 0 && (
            <details className="dn-panel p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#40594a]"><Info aria-hidden="true" className="h-4 w-4" />Evidence key <span className="text-xs font-normal text-[#879189]">({Object.keys(report.evidence).length} sources)</span></summary>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(report.evidence).map(([key, value]) => <div key={key} className="rounded-lg bg-[#f2f5ef] p-3"><dt className="text-xs font-semibold text-[#526b59]">{key}</dt><dd className="mt-1 text-sm leading-5 text-[#748078]">{value}</dd></div>)}
              </dl>
            </details>
          )}
        </>
      ) : (
        <section className="dn-panel px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-center">
            <div>
              <p className="dn-eyebrow">A saved review for {monthLabel(monthKey)}</p>
              <h2 className="mt-2 max-w-xl font-serif text-2xl leading-tight tracking-tight text-[#244235] sm:text-[30px]">The clearest next step starts with your own records.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#708077]">This report will compare the recorded month against {COMPARISONS.find((mode) => mode.value === comparisonMode)?.label.toLowerCase()}. Once generated, its summaries, confidence, evidence, and review actions stay here.</p>
              <div className="mt-5 flex items-center gap-2 text-xs leading-5 text-[#879189]"><Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />Reports are based on saved sale records, not estimates.</div>
            </div>
            <div className="rounded-xl border border-[#e2e9df] bg-[#f5f7f1] p-5">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#718078]">Before you begin</p>
              <ul className="mt-3 space-y-3 text-sm leading-5 text-[#65766b]">
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#63866c]" />Recorded profit is before VAT.</li>
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#63866c]" />Current stock describes today’s snapshot.</li>
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#63866c]" />Nothing in a report changes your inventory.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[#e1e7df] bg-[#f4f6f0] p-4 sm:px-5">
        <div className="flex items-start gap-3">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#718477]" />
          <p className="text-xs leading-5 text-[#728078]"><strong className="font-semibold text-[#52675a]">How to read this:</strong> profit is calculated from recorded sale price less recorded costs, before VAT. Current-stock details are a snapshot of today and are not historical month-end stock. AI findings are decision support, with evidence and confidence shown where available.</p>
        </div>
      </section>

      <section className="dn-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="dn-eyebrow">Carry-over</p><h2 className="mt-1 text-lg font-semibold text-[#244235]">Previous month’s actions</h2></div>
          {notebook.data?.previousMonthKey && <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#536a59]">{monthLabel(notebook.data.previousMonthKey)}</span>}
        </div>
        {previousActions.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {previousActions.map((action) => (
              <div key={action.id} className="flex items-start gap-3 rounded-lg border border-[#e3e9e1] bg-[#fbfcf7] p-3.5">
                {action.status === "done" ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#64866b]" /> : action.status === "dismissed" ? <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#9a8175]" /> : <CircleDot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#b18b4d]" />}
                <div className="min-w-0"><p className="text-sm font-medium text-[#44594b]">{action.title}</p><p className="mt-1 text-xs text-[#879189]">{action.status === "done" ? "Done" : action.status === "dismissed" ? "Dismissed" : "Still open"}</p></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-[#f4f6f0] px-4 py-3 text-sm text-[#7d8980]">No actions were carried forward from the previous month.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><p className="text-xs text-[#839087]">{label}</p><p className={`mt-1 text-base font-semibold tabular-nums ${emphasis ? "text-[#315f43]" : "text-[#344b3d]"}`}>{value}</p></div>;
}

function Difference({ label, value }: { label: string; value: { amount: number; label: string } }) {
  const positive = value.amount >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 font-semibold ${positive ? "text-[#4c7657]" : "text-[#9a674e]"}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{label}: {value.label}</span>;
}

function ActionItem({
  action,
  evidence,
  busy,
  onStatus,
}: {
  action: NotebookAction;
  evidence: Record<string, string>;
  busy: boolean;
  onStatus: (action: NotebookAction, status: "done" | "dismissed" | "open") => void;
}) {
  const isOpen = action.status === "open";
  return (
    <article className={`dn-action ${!isOpen ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2"><CircleDot aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 ${action.status === "done" ? "text-[#62866a]" : action.status === "dismissed" ? "text-[#9b8379]" : "text-[#b28c4f]"}`} /><h3 className="font-semibold leading-snug text-[#344b3d]">{action.title}</h3></div>
          <p className="mt-2 pl-6 text-sm leading-6 text-[#718078]">{action.rationale}</p>
          {!!action.relatedWatches.length && <p className="mt-2 pl-6 text-xs text-[#839087]">Related watches: {action.relatedWatches.map((watch) => watch.label).join(" · ")}</p>}
          <div className="pl-6"><EvidenceList keys={action.evidenceKeys} evidence={evidence} /></div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${action.status === "done" ? "bg-[#e7f0e9] text-[#456a4e]" : action.status === "dismissed" ? "bg-[#f1ece8] text-[#816d62]" : "bg-[#f4efdf] text-[#80652d]"}`}>{action.status === "done" ? "Done" : action.status === "dismissed" ? "Dismissed" : "Open"}</span>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#edf0e9] pt-3">
        {isOpen ? <>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(action, "dismissed")} className="min-h-9 border-[#e0ddd3] bg-[#fffefa] text-xs text-[#796c5e]">Dismiss</Button>
          <Button size="sm" disabled={busy} onClick={() => onStatus(action, "done")} className="min-h-9 bg-[#315e46] text-xs text-white hover:bg-[#3b6d51]"><Check aria-hidden="true" className="h-3.5 w-3.5" />Mark done</Button>
        </> : <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(action, "open")} className="min-h-9 border-[#d7e0d6] bg-[#fffefa] text-xs text-[#49634f]">Reopen</Button>}
      </div>
    </article>
  );
}

function CurrentStock({ currentStock }: { currentStock: { activeListings: number; listedCapitalCents: number; candidates: { id: number; code: string; label: string; brand: string; model: string; daysListed: number; listPriceCents: number; costBasisCents: number }[] } }) {
  return (
    <section className="dn-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="dn-eyebrow">Today’s snapshot</p><h2 className="mt-1 text-lg font-semibold text-[#244235]">Current stock context</h2></div><span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-xs font-semibold text-[#536a59]">{currentStock.activeListings} listed</span></div>
      <div className="mt-4 flex flex-wrap justify-between gap-3 rounded-lg bg-[#f3f6ef] px-4 py-3"><span className="text-xs text-[#7b887f]">Listed capital</span><strong className="text-sm tabular-nums text-[#385342]">{money(currentStock.listedCapitalCents)}</strong></div>
      {currentStock.candidates.length ? (
        <div className="mt-3 divide-y divide-[#edf0e9]">
          {currentStock.candidates.slice(0, 5).map((watch) => (
            <div key={watch.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-[#40594a]">{watch.label}</p><p className="mt-0.5 text-xs text-[#849087]">{watch.daysListed} days listed · cost {money(watch.costBasisCents)}</p></div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-[#455f4b]">{money(watch.listPriceCents)}</span>
            </div>
          ))}
        </div>
      ) : <p className="mt-4 text-sm leading-6 text-[#78847c]">No active, priced listings were available for this snapshot.</p>}
      <p className="mt-3 text-xs leading-5 text-[#859087]">Current stock reflects today, not the selected month’s end.</p>
    </section>
  );
}

function DataCaveats({ caveats }: { caveats: string[] }) {
  return (
    <section className="rounded-2xl border border-[#e5ddc9] bg-[#f8f4e9] p-5 sm:p-6">
      <div className="flex items-center gap-2"><Info aria-hidden="true" className="h-4 w-4 text-[#98783d]" /><h2 className="font-semibold text-[#66552f]">Data notes</h2></div>
      {caveats.length ? <ul className="mt-3 space-y-2">{caveats.map((caveat, index) => <li key={`${index}-${caveat}`} className="text-sm leading-5 text-[#766a4d]">{caveat}</li>)}</ul> : <p className="mt-2 text-sm leading-5 text-[#766a4d]">No additional data caveats were returned. Recorded profit remains before VAT.</p>}
      <p className="mt-3 border-t border-[#e8dfca] pt-3 text-xs leading-5 text-[#867957]">Read findings alongside your records; confidence reflects the available supporting evidence.</p>
    </section>
  );
}
