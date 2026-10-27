import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { InventoryItem } from "@shared/schema";
import { findReferenceMatches, type ReferenceWatch } from "@/lib/reference-search";
import {
  findNaturalInventoryMatches,
  getNaturalInventoryAggregate,
  naturalInventoryGroupBySchema,
  type NaturalInventoryAggregate,
  type NaturalInventoryFilters,
  type NaturalInventoryGroupBy,
} from "@shared/natural-inventory-search";

export function DashboardReferenceSearch({ watches, unavailable = false }: { watches: InventoryItem[]; unavailable?: boolean }) {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "natural">("keyword");
  const [naturalFilters, setNaturalFilters] = useState<NaturalInventoryFilters | null>(null);
  const [naturalAggregate, setNaturalAggregate] = useState<NaturalInventoryAggregate | null>(null);
  const [naturalGroupBy, setNaturalGroupBy] = useState<NaturalInventoryGroupBy | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const [, setLocation] = useLocation();
  const matches = useMemo(
    () => searchMode === "natural" && naturalFilters
      ? findNaturalInventoryMatches(watches, naturalFilters)
      : findReferenceMatches(watches, query),
    [watches, query, searchMode, naturalFilters],
  );
  const aggregateResult = useMemo(
    () => searchMode === "natural" && naturalFilters && naturalAggregate && !unavailable
      ? getNaturalInventoryAggregate(watches, naturalFilters, naturalAggregate, naturalGroupBy ?? undefined)
      : null,
    [watches, searchMode, naturalFilters, naturalAggregate, naturalGroupBy, unavailable],
  );
  const hasQuery = query.trim().length > 0;
  const resultsVisible = hasQuery && !dismissed;

  const navigateTo = (watch: ReferenceWatch) => {
    setLocation(`/inventory/${watch.id}`);
  };

  const selectActiveOrOnlyMatch = () => {
    if (matches.length === 1) navigateTo(matches[0]);
  };

  const focusMatch = (index: number) => {
    setActiveIndex(index);
    requestAnimationFrame(() => resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a")[index]?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (resultsVisible) {
        event.preventDefault();
        setDismissed(true);
        setActiveIndex(-1);
        inputRef.current?.focus();
      }
      return;
    }

    if (!resultsVisible || matches.length === 0) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMatch(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMatch(matches.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectActiveOrOnlyMatch();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    selectActiveOrOnlyMatch();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSearchMode("keyword");
    setNaturalFilters(null);
    setNaturalAggregate(null);
    setNaturalGroupBy(null);
    setAiError("");
    setActiveIndex(-1);
    setDismissed(false);
  };

  const askAiToSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isAiSearching) return;
    setIsAiSearching(true);
    setAiError("");
    setActiveIndex(-1);
    setDismissed(false);
    try {
      const response = await fetch("/api/ai/inventory-search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "AI search failed.");
      setNaturalFilters(payload.filters);
      setNaturalAggregate(payload.aggregate === "count" || payload.aggregate === "asking_price_total" ? payload.aggregate : null);
      const groupBy = naturalInventoryGroupBySchema.safeParse(payload.groupBy);
      setNaturalGroupBy(groupBy.success ? groupBy.data : null);
      setSearchMode("natural");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI search failed. Please try again.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const naturalFilterLabels = naturalFilters ? [
    naturalFilters.brand && `Brand: ${naturalFilters.brand}`,
    naturalFilters.model && `Model: ${naturalFilters.model}`,
    naturalFilters.referenceNumber && `Reference: ${naturalFilters.referenceNumber}`,
    naturalFilters.serialNumber && `Serial: ${naturalFilters.serialNumber}`,
    naturalFilters.status && `Status: ${naturalFilters.status.replace(/_/g, " ")}`,
    naturalFilters.condition && `Condition: ${naturalFilters.condition}`,
    naturalFilters.minYear !== undefined && `Year from ${naturalFilters.minYear}`,
    naturalFilters.maxYear !== undefined && `Year to ${naturalFilters.maxYear}`,
    naturalFilters.soldYear !== undefined && `Sold in ${naturalFilters.soldYear}`,
    naturalFilters.minPriceEuro !== undefined && `From €${naturalFilters.minPriceEuro}`,
    naturalFilters.maxPriceEuro !== undefined && `Up to €${naturalFilters.maxPriceEuro}`,
    (naturalFilters.minPriceEuro !== undefined || naturalFilters.maxPriceEuro !== undefined)
      && `Price type: ${(naturalFilters.priceField || "listPrice").replace(/([A-Z])/g, " $1").toLowerCase()}`,
    naturalFilters.box !== undefined && `Box: ${naturalFilters.box ? "yes" : "no"}`,
    naturalFilters.papers !== undefined && `Papers: ${naturalFilters.papers ? "yes" : "no"}`,
  ].filter(Boolean) as string[] : [];

  const resultMessage = unavailable
    ? "Inventory could not be loaded. Refresh the page to try again."
    : isAiSearching
      ? "Understanding your inventory question…"
      : aiError
        ? aiError
    : !hasQuery
    ? "Search by keyword, or ask a question like “Which Rolex watches are in stock?”"
    : aggregateResult
      ? aggregateResult.type === "count"
        ? "Verified total calculated from matching inventory records."
          : aggregateResult.type === "grouped_count"
            ? "Verified group totals calculated from matching inventory records."
            : "Asking-price total calculated from matching inventory records."
      : matches.length === 0
      ? `No watches found for “${query.trim()}”.`
      : `${matches.length} ${matches.length === 1 ? "watch" : "watches"} found${searchMode === "natural" ? " from your AI filters" : ""}.`;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="reference-search-title">
      <div className="mb-3">
        <h2 id="reference-search-title" className="text-base font-semibold tracking-tight text-slate-900">
          Inventory search
        </h2>
        <p className="mt-1 text-sm text-slate-500">Find a watch by keyword, or ask a question about your inventory.</p>
      </div>

      <form onSubmit={handleSubmit} role="search" className="relative">
        <label htmlFor="dashboard-reference-search" className="sr-only">
          Search inventory by brand, model, reference, or serial number
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
          >
            <circle cx="8.8" cy="8.8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            id="dashboard-reference-search"
            type="search"
            autoComplete="off"
            disabled={unavailable || isAiSearching}
            aria-describedby="reference-search-message"
            value={query}
            onChange={(event) => handleQueryChange(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-11 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 md:text-sm"
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Clear inventory search"
              onClick={() => {
                handleQueryChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={askAiToSearch}
            disabled={unavailable || !hasQuery || isAiSearching}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            {isAiSearching ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Sparkles aria-hidden="true" className="h-4 w-4" />}
            {isAiSearching ? "Searching…" : "Ask AI"}
          </button>
        </div>
      </form>

      <p id="reference-search-message" className="mt-2 min-h-5 text-xs text-slate-500" aria-live="polite" aria-atomic="true">
        {resultMessage}
      </p>

      {resultsVisible && aggregateResult && (
        <section className="mb-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3" aria-label="Verified inventory summary">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {aggregateResult.type === "count"
              ? "Verified inventory total"
              : aggregateResult.type === "grouped_count"
                ? `Inventory count by ${aggregateResult.field}`
                : "Total asking price"}
          </p>
          {aggregateResult.type === "grouped_count" ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {aggregateResult.total} {aggregateResult.total === 1 ? "watch" : "watches"} across {aggregateResult.groups.length} {aggregateResult.groups.length === 1 ? "group" : "groups"}
              </p>
              {aggregateResult.groups.length > 0 ? (
                <ul className="mt-2 divide-y divide-emerald-100" aria-label={`Watch counts by ${aggregateResult.field}`}>
                  {aggregateResult.groups.map((group) => (
                    <li key={group.label} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span className="truncate text-slate-700">{group.label}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900">{group.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No matching watches.</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {aggregateResult.type === "count"
                ? `${aggregateResult.value} ${aggregateResult.value === 1 ? "watch" : "watches"}`
                : aggregateResult.pricedCount === 0 && matches.length > 0
                  ? "No asking prices recorded"
                  : new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(aggregateResult.valueInCents / 100)}
            </p>
          )}
          {aggregateResult.type === "asking_price_total" && (
            <p className="mt-1 text-xs text-slate-600">
              {matches.length === 0
                ? "No matching watches."
                : `Based on ${aggregateResult.pricedCount} of ${matches.length} matching ${matches.length === 1 ? "watch" : "watches"} with a recorded asking price.`}
              {aggregateResult.missingPriceCount > 0 && ` Excludes ${aggregateResult.missingPriceCount} without a recorded asking price.`}
            </p>
          )}
        </section>
      )}

      {searchMode === "natural" && naturalFilterLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5" aria-label="AI interpreted filters">
          <span className="text-xs font-medium text-slate-500">Filters:</span>
          {naturalFilterLabels.map((label) => (
            <span key={label} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
              {label}
            </span>
          ))}
        </div>
      )}

      {resultsVisible && matches.length > 0 && (
        <div>
          {(aggregateResult || naturalGroupBy) && <h3 className="mb-1 text-xs font-semibold text-slate-600">Matching watches ({matches.length})</h3>}
          <ul ref={resultsRef} aria-label="Matching watches" className="mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white shadow-sm">
            {matches.map((watch, index) => (
              <li key={`${watch.id}-${watch.referenceNumber}`}>
                <Link
                  href={`/inventory/${watch.id}`}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setDismissed(true);
                      setActiveIndex(-1);
                      inputRef.current?.focus();
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault();
                      focusMatch((index + 1) % matches.length);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      if (index === 0) { setActiveIndex(-1); inputRef.current?.focus(); }
                      else focusMatch(index - 1);
                    } else if (event.key === "Home" || event.key === "End") {
                      event.preventDefault();
                      focusMatch(event.key === "Home" ? 0 : matches.length - 1);
                    }
                  }}
                  className={`block min-h-14 border-b border-slate-100 px-3 py-3 last:border-b-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 ${
                    activeIndex === index ? "bg-emerald-50/70" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-slate-900">
                      {watch.brand} <span className="font-medium">{watch.model}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        watch.status?.toLowerCase() === "sold"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {watch.status?.replace(/_/g, " ") || "Status unavailable"}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs leading-4 text-slate-500">
                    <span className="min-w-0 break-all">
                      Ref. <span className="font-mono font-medium text-slate-700">{watch.referenceNumber}</span>
                    </span>
                    {watch.serialNumber && (
                      <span className="break-all">
                        Serial <span className="font-mono text-slate-600">{watch.serialNumber}</span>
                      </span>
                    )}
                    {watch.internalSerial && (
                      <span className="break-all">
                        Internal <span className="font-mono text-slate-600">{watch.internalSerial}</span>
                      </span>
                    )}
                    {watch.year && <span>{watch.year}</span>}
                    <span className="font-mono text-slate-400">Record #{watch.id}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
