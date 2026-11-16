import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Search, ShieldCheck, Watch } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useClients } from "@/hooks/use-clients";
import { useAmsterdamClock } from "@/hooks/use-amsterdam-clock";
import { amsterdamToday, formatDeliveryDate } from "@shared/delivery";
import { getManufacturerWarrantyCoverage, getStoreWarrantyCoverage } from "@shared/warranty";
import { getSoldDate } from "@shared/sold-date";
import type { InventoryItem } from "@shared/schema";

type WarrantyFilter = "all" | "active" | "expiring" | "expired" | "awaiting" | "none";

const storeStatusLabels = {
  not_recorded: "Not recorded",
  none: "No store warranty",
  awaiting_delivery: "Awaiting delivery",
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
} as const;

const manufacturerStatusLabels = {
  not_recorded: "Not recorded",
  end_date_unknown: "End date not recorded",
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
} as const;

function termLabel(months: number | null) {
  if (months == null) return "Term not recorded";
  if (months === 0) return "No store warranty";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  return `${months} months`;
}

function remainingLabel(days: number | null) {
  if (days == null) return "Remaining time unavailable";
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
  return days === 0 ? "Expires today" : `${days} ${days === 1 ? "day" : "days"} remaining`;
}

function statusClass(status: string) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "expiring") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "expired" || status === "none") return "border-slate-200 bg-slate-100 text-slate-600";
  if (status === "awaiting_delivery") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-white text-slate-500";
}

function CoverageMeter({
  title,
  status,
  label,
  startDate,
  endDate,
  daysRemaining,
  percentRemaining,
  description,
}: {
  title: string;
  status: string;
  label: string;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining: number | null;
  percentRemaining: number | null;
  description?: string | null;
}) {
  const showMeter = percentRemaining !== null && (status === "active" || status === "expiring" || status === "expired");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{title}</p>
          <p className="mt-1 font-semibold text-slate-900">{label}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{title === "Store warranty"
          ? storeStatusLabels[status as keyof typeof storeStatusLabels]
          : manufacturerStatusLabels[status as keyof typeof manufacturerStatusLabels]}</span>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
        {startDate && <p>Starts: <strong className="font-medium text-slate-800">{formatDeliveryDate(startDate)}</strong></p>}
        {endDate && <p>Ends: <strong className="font-medium text-slate-800">{formatDeliveryDate(endDate)}</strong></p>}
        {startDate && !endDate && <p className="sm:col-span-2">End date not recorded</p>}
        {!startDate && status === "awaiting_delivery" && <p className="sm:col-span-2">Starts when customer delivery is recorded.</p>}
        {!startDate && status === "end_date_unknown" && <p className="sm:col-span-2">Enter the card’s coverage end date to track remaining time.</p>}
        {daysRemaining !== null && <p className="sm:col-span-2 font-medium">{remainingLabel(daysRemaining)}</p>}
      </div>
      {showMeter && (
        <div className="mt-3" role="progressbar" aria-label={`${title} time remaining`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentRemaining!)}>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${status === "expiring" ? "bg-amber-500" : status === "expired" ? "bg-slate-400" : "bg-emerald-600"}`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">{Math.round(percentRemaining!)}% remaining</p>
        </div>
      )}
      {description && <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">{description}</p>}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof ShieldCheck; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" aria-hidden="true"/></span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function Warranties() {
  const now = useAmsterdamClock();
  const today = amsterdamToday(now);
  const { data: inventory = [], isLoading, isError, error, refetch } = useInventory("sold", true);
  const { data: clients = [] } = useClients();
  const [filter, setFilter] = useState<WarrantyFilter>("all");
  const [search, setSearch] = useState("");

  const sold = useMemo(() => inventory.filter(item => item.status === "sold"), [inventory]);
  const summaries = useMemo(() => sold.map(item => ({
    item,
    store: getStoreWarrantyCoverage(item.storeWarrantyMonths, item.deliveredDate, today),
    manufacturer: getManufacturerWarrantyCoverage(
      item.manufacturerPurchaseDate,
      item.manufacturerWarrantyExpires,
      item.manufacturerWarrantyCardPresent,
      item.manufacturerWarrantyDetails,
      today,
    ),
    buyer: clients.find(client => client.id === item.buyerId)?.name || item.soldTo || "",
  })), [sold, clients, today]);

  const activeStoreCount = summaries.filter(({ store }) => store.status === "active" || store.status === "expiring").length;
  const expiringCount = summaries.filter(({ store, manufacturer }) => store.status === "expiring" || manufacturer.status === "expiring").length;
  const awaitingDeliveryCount = summaries.filter(({ store }) => store.status === "awaiting_delivery").length;
  const activeManufacturerCount = summaries.filter(({ manufacturer }) => manufacturer.status === "active" || manufacturer.status === "expiring").length;
  const filtered = summaries.filter(({ item, store, manufacturer, buyer }) => {
    const text = [item.brand, item.model, item.referenceNumber, item.serialNumber, buyer].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !search.trim() || text.includes(search.trim().toLowerCase());
    const matchesFilter = filter === "all"
      || (filter === "active" && (store.status === "active" || store.status === "expiring" || manufacturer.status === "active" || manufacturer.status === "expiring"))
      || (filter === "expiring" && (store.status === "expiring" || manufacturer.status === "expiring"))
      || (filter === "expired" && (store.status === "expired" || manufacturer.status === "expired"))
      || (filter === "awaiting" && store.status === "awaiting_delivery")
      || (filter === "none" && (store.status === "none" || store.status === "not_recorded"));
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-800">After-sale tracking</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900"><ShieldCheck className="h-7 w-7 text-emerald-700"/>Warranties</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Review store and manufacturer coverage for sold watches. Store coverage starts on the delivery date you record.</p>
        </div>
        <Link href="/inventory" className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto"><Watch className="h-4 w-4"/>Inventory</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Warranty summary">
        <SummaryCard label="Sold watches" value={sold.length} icon={Watch} tone="bg-slate-100 text-slate-600"/>
        <SummaryCard label="Active store coverage" value={activeStoreCount} icon={ShieldCheck} tone="bg-emerald-50 text-emerald-700"/>
        <SummaryCard label="Coverage expiring soon" value={expiringCount} icon={AlertTriangle} tone="bg-amber-50 text-amber-700"/>
        <SummaryCard label="Awaiting delivery date" value={awaitingDeliveryCount} icon={CalendarClock} tone="bg-sky-50 text-sky-700"/>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sold watch coverage</h2>
            <p className="mt-1 text-sm text-slate-500">{activeManufacturerCount} with active manufacturer coverage · {summaries.length} sold watches including archived records</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_220px] lg:w-[520px]">
            <label className="relative">
              <span className="sr-only">Search sold watches</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search brand, reference, serial, buyer" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"/>
            </label>
            <label>
              <span className="sr-only">Filter warranties</span>
              <select value={filter} onChange={event => setFilter(event.target.value as WarrantyFilter)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800">
                <option value="all">All sold watches</option>
                <option value="active">Active coverage</option>
                <option value="expiring">Expiring within 30 days</option>
                <option value="expired">Expired coverage</option>
                <option value="awaiting">Awaiting delivery date</option>
                <option value="none">No / unrecorded store warranty</option>
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-5 grid gap-3">{[0,1,2].map(value => <div key={value} className="h-36 animate-pulse rounded-xl bg-slate-100"/>)}</div>
        ) : isError ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            Could not load sold watches: {error instanceof Error ? error.message : "Please try again."}
            <button type="button" className="ml-2 font-semibold underline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-slate-400"/>
            <p className="mt-2 font-medium text-slate-800">{sold.length === 0 ? "No sold watches yet" : "No watches match this search"}</p>
            <p className="mt-1 text-sm text-slate-500">{sold.length === 0 ? "Sold watches will appear here so you can track their coverage." : "Try another search or warranty filter."}</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filtered.map(({ item, store, manufacturer, buyer }) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5" data-testid={`warranty-watch-${item.id}`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/inventory/${item.id}`} className="text-lg font-semibold text-slate-900 hover:text-emerald-800 hover:underline">{item.brand} {item.model}</Link>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span>Ref. {item.referenceNumber}</span>
                      {item.serialNumber && <span>Serial {item.serialNumber}</span>}
                      {buyer && <span>Buyer {buyer}</span>}
                      {getSoldDate(item) && <span>Sold {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(getSoldDate(item)!)}</span>}
                    </p>
                  </div>
                  <Link href={`/inventory/${item.id}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800">Open watch details <span aria-hidden="true">→</span></Link>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <CoverageMeter
                    title="Store warranty"
                    status={store.status}
                    label={termLabel(item.storeWarrantyMonths)}
                    startDate={store.startDate}
                    endDate={store.endDate}
                    daysRemaining={store.daysRemaining}
                    percentRemaining={store.percentRemaining}
                  />
                  <CoverageMeter
                    title="Manufacturer warranty"
                    status={manufacturer.status}
                    label={item.manufacturerWarrantyCardPresent ? "Warranty card on file" : manufacturer.status === "not_recorded" ? "No manufacturer details" : "Coverage details recorded"}
                    startDate={item.manufacturerPurchaseDate}
                    endDate={item.manufacturerWarrantyExpires}
                    daysRemaining={manufacturer.daysRemaining}
                    percentRemaining={manufacturer.percentRemaining}
                    description={item.manufacturerWarrantyDetails}
                  />
                </div>
                {item.manufacturerWarrantyCardPresent && <p className="mt-2 text-xs text-emerald-800"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5"/>Manufacturer warranty card marked as present</p>}
              </article>
            ))}
          </div>
        )}
        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Dates and countdowns are tracking aids only; they do not determine statutory rights or warranty-claim eligibility.</p>
      </section>
    </main>
  );
}
