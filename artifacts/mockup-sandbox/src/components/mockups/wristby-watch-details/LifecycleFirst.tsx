import "./_group.css";
import "../wristby-light/_modern.css";
import { useState, type KeyboardEvent } from "react";
import { Shell } from "./Shell";
import { WatchIdentityCard } from "./_source/identity-card";
import { PurchaseInformationCard } from "./_source/purchase-information-card";
import { DealOverviewCard } from "./_source/deal-overview-card";
import {
  BuyerContactCard,
  BuyerDeliveryCard,
  HistoricalSalesCard,
  KeyValue,
  Panel,
  PriceHistoryCard,
  QuickEstimateCard,
  SalesHistoryCard,
  ServiceWarrantyCard,
  StatusCard,
  formatCurrency,
  margin,
  profit,
  salePrice,
  watch,
} from "./WatchDetailsContent";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileText,
  PackageCheck,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

type TabId = "journey" | "reference" | "deal" | "aftercare";

const tabs: { id: TabId; label: string; eyebrow: string }[] = [
  { id: "journey", label: "Journey", eyebrow: "01" },
  { id: "reference", label: "Watch record", eyebrow: "02" },
  { id: "deal", label: "Deal & pricing", eyebrow: "03" },
  { id: "aftercare", label: "Delivery & cover", eyebrow: "04" },
];

const events: { date: string; title: string; detail: string; icon: typeof CircleDollarSign; kind: TabId | "purchase" }[] = [
  { date: "12 Jun 2026", title: "Acquired", detail: "Chrono24 · Bunq", icon: CircleDollarSign, kind: "purchase" },
  { date: "18 Jun 2026", title: "Received & checked", detail: "Full set · Register clear", icon: Box, kind: "reference" as TabId },
  { date: "24 Jun 2026", title: "Listed", detail: "Initial ask €14.500", icon: FileText, kind: "deal" as TabId },
  { date: "12 Aug 2026", title: "Service completed", detail: "6 days · €350", icon: Wrench, kind: "aftercare" as TabId },
  { date: "16 Nov 2026", title: "Sold · cycle 1", detail: "€13.600 · Chrono24", icon: Check, kind: "deal" as TabId },
  { date: "18 Nov 2026", title: "Delivered", detail: "UPS · Netherlands", icon: PackageCheck, kind: "aftercare" as TabId },
];

export function LifecycleFirst() {
  const [activeTab, setActiveTab] = useState<TabId>("journey");
  const [activeEvent, setActiveEvent] = useState<number | null>(null);
  const [archived, setArchived] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [clientPeekOpen, setClientPeekOpen] = useState(false);

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(tabs[nextIndex].id);
      document.getElementById(`watch-tab-${tabs[nextIndex].id}`)?.focus();
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] space-y-6 text-slate-900">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Inventory <span className="text-slate-300">/</span> Watch 35 <span className="text-slate-300">/</span> Lifecycle
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-[clamp(1.55rem,3vw,2.1rem)] font-semibold tracking-tight text-slate-900">{watch.brand} {watch.model}</h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-emerald-800">{watch.referenceNumber}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Sold · follow-up
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Serial {watch.serialNumber} <span className="px-1.5 text-slate-300">·</span> One record, every handoff</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setNotesOpen((open) => !open)} className="!opacity-100 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium !text-slate-700 transition-colors hover:bg-slate-50">
              <Pencil className="h-4 w-4" /> {notesOpen ? "Close note" : "Edit record"}
            </button>
            <button type="button" onClick={() => setArchived((value) => !value)} className="!opacity-100 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 text-sm font-medium !text-emerald-900 transition-colors hover:bg-emerald-50">
              {archived ? <Check className="h-4 w-4" /> : null}{archived ? "Archived" : "Archive"}
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="timeline-heading">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Record timeline <span className="ml-1 text-slate-400">· 2026</span></p>
              <h2 id="timeline-heading" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">From sourcing to aftercare</h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-emerald-700" />Held 151 days</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-emerald-700" />Listed 145 days</span>
              <span className="inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5 text-amber-700" />Return window open</span>
            </div>
          </div>
          <div className="overflow-x-auto px-5 py-6 sm:px-7">
            <div className="relative grid min-w-[730px] grid-cols-6 gap-3">
              <div className="absolute left-[7%] right-[7%] top-[14px] h-px bg-slate-200" aria-hidden="true" />
              {events.map((item, index) => {
                const Icon = item.icon;
                const isSelected = activeEvent === index;
                return (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => {
                      setActiveEvent(index);
                      setActiveTab(item.kind === "purchase" ? "reference" : item.kind);
                    }}
                    aria-pressed={isSelected}
                    className="group relative z-10 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4"
                  >
                    <span className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white ring-1 transition-colors ${index === events.length - 1 ? "bg-emerald-700 text-white ring-emerald-700" : isSelected ? "bg-emerald-700 text-white ring-emerald-700" : "bg-emerald-100 text-emerald-800 ring-emerald-200 group-hover:bg-emerald-700 group-hover:text-white"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className={`block text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "text-emerald-800" : "text-slate-400"}`}>{item.date}</span>
                    <span className="mt-1 block text-xs font-semibold leading-4 text-slate-800">{item.title}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">{item.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-amber-200 bg-amber-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <p className="text-sm text-amber-950"><strong>Return window closes 2 Dec 2026.</strong> 12 days remain from delivery.</p>
            </div>
            <button type="button" onClick={() => setActiveTab("aftercare")} className="inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline">Review aftercare <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-w-0">
            <div role="tablist" aria-label="Watch record sections" className="mb-5 flex max-w-full gap-1 overflow-x-auto border-b border-slate-200">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  id={`watch-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`watch-panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`relative -mb-px inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors sm:px-4 ${activeTab === tab.id ? "border-emerald-700 text-emerald-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  <span className="font-mono text-[10px] text-slate-400">{tab.eyebrow}</span>{tab.label}
                </button>
              ))}
            </div>

            <div id={`watch-panel-${activeTab}`} role="tabpanel" aria-labelledby={`watch-tab-${activeTab}`} className="min-w-0 space-y-5">
              {activeTab === "journey" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sale cycle 1</p><p className="mt-1 text-sm font-semibold text-slate-900">Closed · no return adjustment</p></div>
                        <span className="rounded-full bg-emerald-50 p-2 text-emerald-800"><Check className="h-4 w-4" /></span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <KeyValue label="Sold" value="16 Nov 2026 · Chrono24" />
                        <KeyValue label="Sale price" value="€13.600,00" />
                        <KeyValue label="Profit at sale" value="€1.733,00" />
                        <KeyValue label="Adjustment" value="None" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="rounded-lg bg-white p-2 text-amber-800"><RotateCcw className="h-4 w-4" /></span>
                        <div><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Current follow-up</p><p className="mt-1 text-sm font-semibold text-slate-900">Buyer return window</p><p className="mt-1 text-xs leading-5 text-slate-600">Delivery confirmed 18 Nov. Window ends 2 Dec; no return recorded.</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <PriceHistoryCard />
                    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button")) setSalesExpanded((open) => !open); }}>
                      <SalesHistoryCard />
                      {salesExpanded && <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">Showing 1 recorded sale cycle for this watch.</p>}
                    </div>
                  </div>
                  <HistoricalSalesCard />
                  <div className="grid gap-5 lg:grid-cols-2">
                    <ServiceWarrantyCard />
                    <RecordNotes notesOpen={notesOpen} onToggle={() => setNotesOpen((open) => !open)} />
                  </div>
                </>
              )}
              {activeTab === "reference" && (
                <>
                  <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}>
                    <WatchIdentityCard item={watch} holdTime={151} daysInService={6} daysListed={145} />
                  </div>
                  <PurchaseInformationCard item={watch} formatCurrency={formatCurrency} />
                  <ReferenceDetails />
                  <RecordNotes notesOpen={notesOpen} onToggle={() => setNotesOpen((open) => !open)} />
                </>
              )}
              {activeTab === "deal" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Metric label="COGS" value="€10.500,00" />
                    <Metric label="Listed at" value="€14.250,00" tone="sage" />
                    <Metric label="Sale price" value="€13.600,00" tone="green" />
                    <Metric label="Net profit" value="€1.733,00" tone="green" />
                  </div>
                  <DealOverviewCard item={watch} salePrice={salePrice} profit={profit} margin={margin} totalFees={94_700} netAfterVat={138_634} vatAmount={34_666} effectiveRegisterFee={600} chrono24Commission={6.5} formatCurrency={formatCurrency}>
                    <div className="rounded-lg border border-slate-100 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Additional expenses</h3><span className="text-xs text-emerald-800">Recorded</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Service & polish</span><strong>€420,00</strong></div>
                    </div>
                  </DealOverviewCard>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button")) setEstimateOpen((open) => !open); }}>
                      <QuickEstimateCard />
                      {estimateOpen && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">Indicative estimate only; no values are saved to this watch.</p>}
                    </div>
                    <HistoricalSalesCard />
                  </div>
                </>
              )}
              {activeTab === "aftercare" && (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <BuyerDeliveryCard />
                    <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button")) setClientPeekOpen((open) => !open); }}>
                      <BuyerContactCard />
                      {clientPeekOpen && <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">Synthetic client details shown for this private preview.</p>}
                    </div>
                  </div>
                  <ServiceWarrantyCard />
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                      <div className="flex items-center gap-2 text-amber-900"><RotateCcw className="h-4 w-4" /><h2 className="text-sm font-semibold">Return follow-up</h2></div>
                      <p className="mt-3 text-lg font-semibold text-slate-900">12 days remaining</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Return window closes 2 Dec 2026. Buyer confirmed the watch arrived in good condition.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                      <div className="flex items-center gap-2 text-emerald-900"><ShieldCheck className="h-4 w-4" /><h2 className="text-sm font-semibold">Coverage at a glance</h2></div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">Store warranty · active for 12 months</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Through 18 Nov 2027. Manufacturer coverage remains active until 14 Mar 2027.</p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-[92%] rounded-full bg-emerald-700" /></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="space-y-4 xl:pt-[4.1rem]">
            <div className="rounded-xl border border-emerald-900/10 bg-[#edf3ee] p-4">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">Live status</span><BadgeCheck className="h-4 w-4 text-emerald-800" /></div>
              <p className="mt-2 text-lg font-semibold text-slate-900">Sold</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Delivered · return period active</p>
              <button type="button" onClick={() => setActiveTab("journey")} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline">See full journey <ArrowRight className="h-3 w-3" /></button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">At a glance</p>
              <div className="mt-4 space-y-3">
                <Glance label="Acquired" value="12 Jun 2026" />
                <Glance label="Listed" value="24 Jun 2026" />
                <Glance label="Sold" value="16 Nov 2026" />
                <Glance label="Delivered" value="18 Nov 2026" />
                <div className="border-t border-slate-100 pt-3"><Glance label="Sale price" value="€13.600,00" strong /></div>
              </div>
            </div>
            {activeEvent !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected event</p><button type="button" aria-label="Clear selected event" onClick={() => setActiveEvent(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronDown className="h-4 w-4" /></button></div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{events[activeEvent].title}</p>
                <p className="mt-1 text-xs text-slate-500">{events[activeEvent].date} · {events[activeEvent].detail}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "sage" | "green" }) {
  const styles = {
    slate: "border-slate-200 bg-white",
    sage: "border-emerald-100 bg-[#edf3ee]",
    green: "border-emerald-100 bg-emerald-50",
  };
  return <div className={`rounded-xl border p-3 ${styles[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-base font-bold tabular-nums text-slate-900">{value}</p></div>;
}

function Glance({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-baseline justify-between gap-3"><span className="text-xs text-slate-500">{label}</span><span className={`text-xs tabular-nums ${strong ? "font-bold text-emerald-900" : "font-medium text-slate-800"}`}>{value}</span></div>;
}

function ReferenceDetails() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Technical specification" subtitle="Inspection and listing reference">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <KeyValue label="Reference" value="126610LN" /><KeyValue label="Serial" value="62M4X932" /><KeyValue label="Movement serial" value="3235-88317" />
          <KeyValue label="Year" value="2022" /><KeyValue label="Condition" value="Excellent" /><KeyValue label="Movement" value="Calibre 3235" />
          <KeyValue label="Power reserve" value="~70 hours" /><KeyValue label="Links" value="12" />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"><Box className="h-3 w-3" />Box</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"><FileText className="h-3 w-3" />Papers</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"><FileText className="h-3 w-3" />12 watch links</span>
        </div>
      </Panel>
      <Panel title="Listing copy" subtitle="Saved listing content">
        <div className="space-y-4">
          <div><p className="text-xs font-medium text-slate-500">Title</p><p className="mt-1 text-sm font-semibold text-slate-900">Rolex Submariner Date 126610LN Full Set</p></div>
          <div className="border-t border-slate-100 pt-3"><p className="text-xs font-medium text-slate-500">Description</p><p className="mt-1 text-sm leading-6 text-slate-600">Excellent example of the modern Submariner Date, supplied as a complete set with box and papers.</p></div>
          <p className="border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">A well-kept modern Submariner Date in excellent condition, supplied as a complete set. Recently inspected and ready to enjoy.</p>
        </div>
      </Panel>
    </div>
  );
}

function RecordNotes({ notesOpen, onToggle }: { notesOpen: boolean; onToggle: () => void }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold text-slate-900">Record notes</h2><p className="mt-1 text-xs text-slate-500">Internal · last updated before listing</p></div>
        <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"><Pencil className="h-3.5 w-3.5" />{notesOpen ? "Done" : "Edit notes"}</button>
      </div>
      {notesOpen ? (
        <textarea aria-label="Internal watch notes" defaultValue="Full set. Light desk wear on the clasp, polished in-house before listing. Buyer confirmed receipt in good condition." className="mt-4 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      ) : <p className="mt-4 text-sm leading-6 text-slate-600">Full set. Light desk wear on the clasp, polished in-house before listing. Buyer confirmed receipt in good condition.</p>}
    </section>
  );
}
