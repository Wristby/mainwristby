import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { Client, InventoryItem } from "@shared/schema";
import { findReferenceMatches, type ReferenceWatch } from "@/lib/reference-search";
import { useClients } from "@/hooks/use-clients";
import {
  findNaturalClientMatches,
  findNaturalInventoryMatches,
  buildLocalClientSearchFilters,
  getNaturalInventoryAggregate,
  naturalInventoryGroupBySchema,
  type NaturalInventoryAggregate,
  type NaturalInventoryFilters,
  type NaturalInventoryGroupBy,
  type NaturalSearchEntity,
} from "@shared/natural-inventory-search";

export function DashboardReferenceSearch({ watches, unavailable = false }: { watches: InventoryItem[]; unavailable?: boolean }) {
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<NaturalSearchEntity>("watches");
  const [searchMode, setSearchMode] = useState<"keyword" | "natural">("keyword");
  const [naturalEntity, setNaturalEntity] = useState<NaturalSearchEntity>("watches");
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
  const isClientScope = searchScope === "clients";
  const { data: clients = [], isLoading: clientsLoading, isError: clientsUnavailable } = useClients({ enabled: isClientScope });
  const matches = useMemo(
    () => isClientScope
      ? []
      : searchMode === "natural" && naturalFilters
        ? findNaturalInventoryMatches(watches, naturalFilters)
        : findReferenceMatches(watches, query),
    [watches, query, searchMode, naturalFilters, isClientScope],
  );
  const clientMatches = useMemo(
    () => isClientScope && query.trim()
      ? findNaturalClientMatches(clients, buildLocalClientSearchFilters(query))
      : [],
    [clients, isClientScope, query],
  );
  const resultCount = isClientScope ? clientMatches.length : matches.length;
  const aggregateResult = useMemo(
    () => searchMode === "natural" && naturalEntity === "watches" && naturalFilters && naturalAggregate && !unavailable
      ? getNaturalInventoryAggregate(watches, naturalFilters, naturalAggregate, naturalGroupBy ?? undefined)
      : null,
    [watches, searchMode, naturalEntity, naturalFilters, naturalAggregate, naturalGroupBy, unavailable],
  );
  const hasQuery = query.trim().length > 0;
  const resultsVisible = hasQuery && !dismissed;

  const navigateTo = (watch: ReferenceWatch) => {
    setLocation(`/inventory/${watch.id}`);
  };

  const navigateToClient = (client: Pick<Client, "id">) => {
    setLocation(`/clients/${client.id}`);
  };

  const selectActiveOrOnlyMatch = () => {
    if (resultCount !== 1) return;
    if (isClientScope) navigateToClient(clientMatches[0]);
    else navigateTo(matches[0]);
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

    if (!resultsVisible || resultCount === 0) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMatch(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMatch(resultCount - 1);
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
    setNaturalEntity("watches");
    setNaturalFilters(null);
    setNaturalAggregate(null);
    setNaturalGroupBy(null);
    setAiError("");
    setActiveIndex(-1);
    setDismissed(false);
  };

  const handleScopeChange = (scope: NaturalSearchEntity) => {
    setSearchScope(scope);
    setSearchMode("keyword");
    setNaturalEntity(scope);
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
      setNaturalEntity("watches");
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

  const aggregateGroupByLabel = aggregateResult?.type === "grouped_count" || aggregateResult?.type === "grouped_asking_price_total"
    ? aggregateResult.field === "year" ? "production year" : aggregateResult.field
    : null;

  const resultMessage = unavailable && !isClientScope
    ? "Inventory could not be loaded. Refresh the page to try again."
    : isAiSearching
      ? "Understanding your search…"
      : aiError
        ? aiError
        : isClientScope && clientsLoading
          ? "Loading client records…"
          : isClientScope && clientsUnavailable
            ? "Client records could not be loaded. Refresh the page to try again."
    : !hasQuery
      ? isClientScope ? "Type to search saved client records." : "Search watches by keyword, or choose Clients to search client records."
    : isClientScope
      ? clientMatches.length === 0
        ? `No clients found for “${query.trim()}”.`
        : `${clientMatches.length} ${clientMatches.length === 1 ? "client" : "clients"} found.`
    : aggregateResult
      ? aggregateResult.type === "count"
        ? "Verified total calculated from matching inventory records."
        : aggregateResult.type === "grouped_count"
          ? "Verified group totals calculated from matching inventory records."
          : aggregateResult.type === "grouped_asking_price_total"
            ? "Asking-price totals by group calculated from matching inventory records."
            : "Asking-price total calculated from matching inventory records."
      : matches.length === 0
      ? `No watches found for “${query.trim()}”.`
      : `${matches.length} ${matches.length === 1 ? "watch" : "watches"} found${searchMode === "natural" ? " from your AI filters" : ""}.`;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="reference-search-title">
      <div className="mb-3">
        <h2 id="reference-search-title" className="text-base font-semibold tracking-tight text-slate-900">
          Inventory & client search
        </h2>
        <p className="mt-1 text-sm text-slate-500">Search watches by keyword or ask AI about inventory. Client search updates as you type.</p>
      </div>

      <div className="mb-3 flex gap-2" role="group" aria-label="Search category">
        {(["watches", "clients"] as const).map((scope) => (
          <button
            key={scope}
            type="button"
            aria-pressed={searchScope === scope}
            onClick={() => handleScopeChange(scope)}
            className={`min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              searchScope === scope
                ? "bg-emerald-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {scope === "watches" ? "Watches" : "Clients"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} role="search" className="relative">
        <label htmlFor="dashboard-reference-search" className="sr-only">
          {searchScope === "clients" ? "Search clients by any saved detail" : "Search watches by brand, model, reference, or serial number"}
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
            disabled={isAiSearching}
            aria-describedby="reference-search-message"
            value={query}
            onChange={(event) => handleQueryChange(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-11 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 md:text-sm"
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
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
        {searchScope === "watches" && <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={askAiToSearch}
            disabled={!hasQuery || isAiSearching}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            {isAiSearching ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Sparkles aria-hidden="true" className="h-4 w-4" />}
            {isAiSearching ? "Searching…" : "Ask AI"}
          </button>
        </div>}
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
                ? `Inventory count by ${aggregateGroupByLabel}`
                : aggregateResult.type === "grouped_asking_price_total"
                  ? `Asking-price total by ${aggregateGroupByLabel}`
                : "Total asking price"}
          </p>
          {aggregateResult.type === "grouped_count" ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {aggregateResult.total} {aggregateResult.total === 1 ? "watch" : "watches"} across {aggregateResult.groups.length} {aggregateResult.groups.length === 1 ? "group" : "groups"}
              </p>
              {aggregateResult.groups.length > 0 ? (
                <ul className="mt-2 divide-y divide-emerald-100" aria-label={`Watch counts by ${aggregateGroupByLabel}`}>
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
          ) : aggregateResult.type === "grouped_asking_price_total" ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                Totals across {aggregateResult.total} matching {aggregateResult.total === 1 ? "watch" : "watches"}
              </p>
              {aggregateResult.groups.length > 0 ? (
                <ul className="mt-2 divide-y divide-emerald-100" aria-label={`Asking-price totals by ${aggregateGroupByLabel}`}>
                  {aggregateResult.groups.map((group) => (
                    <li key={group.label} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-slate-700">{group.label}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                          {group.pricedCount === 0
                            ? "No asking prices recorded"
                            : new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(group.valueInCents / 100)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Based on {group.pricedCount} of {group.watchCount} watches with a recorded asking price.
                        {group.missingPriceCount > 0 && ` Excludes ${group.missingPriceCount} without a recorded asking price.`}
                      </p>
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

      {resultsVisible && isClientScope && !clientsLoading && !clientsUnavailable && clientMatches.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold text-slate-600">Matching clients ({clientMatches.length})</h3>
          <ul ref={resultsRef} aria-label="Matching clients" className="mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white shadow-sm">
            {clientMatches.map((client, index) => {
              const contactDetails = [client.email, client.phone, client.country].filter(Boolean);
              return (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setDismissed(true);
                        setActiveIndex(-1);
                        inputRef.current?.focus();
                      } else if (event.key === "ArrowDown") {
                        event.preventDefault();
                        focusMatch((index + 1) % clientMatches.length);
                      } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        if (index === 0) { setActiveIndex(-1); inputRef.current?.focus(); }
                        else focusMatch(index - 1);
                      } else if (event.key === "Home" || event.key === "End") {
                        event.preventDefault();
                        focusMatch(event.key === "Home" ? 0 : clientMatches.length - 1);
                      }
                    }}
                    className={`block min-h-14 border-b border-slate-100 px-3 py-3 last:border-b-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 ${
                      activeIndex === index ? "bg-emerald-50/70" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <span className="break-words text-sm font-semibold text-slate-900">{client.name}</span>
                      <span className="flex items-center gap-2">
                        {client.isVip && <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">VIP</span>}
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{client.type}</span>
                      </span>
                    </div>
                    {contactDetails.length > 0 && (
                      <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs leading-4 text-slate-500">
                        {contactDetails.map((detail) => <span key={detail} className="break-all">{detail}</span>)}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
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
