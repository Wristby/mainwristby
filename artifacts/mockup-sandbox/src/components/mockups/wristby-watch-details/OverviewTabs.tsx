import { useId, useRef, useState, type KeyboardEvent } from "react";
import "./_group.css";
import "../wristby-light/_modern.css";
import { Shell } from "./Shell";
import { WatchIdentityCard } from "./_source/identity-card";
import { PurchaseInformationCard } from "./_source/purchase-information-card";
import { DealOverviewCard } from "./_source/deal-overview-card";
import {
  BuyerContactCard,
  BuyerDeliveryCard,
  HistoricalSalesCard,
  LifecycleStrip,
  NotesCard,
  Panel,
  PriceHistoryCard,
  QuickEstimateCard,
  SalesHistoryCard,
  ServiceWarrantyCard,
  StatusCard,
  TechnicalCard,
  FinancialSnapshot,
  OfferSignals,
  formatCurrency,
  margin,
  profit,
  salePrice,
  watch,
} from "./WatchDetailsContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, ClipboardList, Coins, FileText, ShieldCheck, Watch } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: Watch },
  { id: "watch", label: "Watch details", icon: ClipboardList },
  { id: "financials", label: "Financials", icon: Coins },
  { id: "sale", label: "Sale & coverage", icon: ShieldCheck },
  { id: "notes", label: "Notes & tools", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function OverviewTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [headerMessage, setHeaderMessage] = useState("");
  const tablistId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectTab = (id: TabId) => setActiveTab(id);
  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <Shell>
      <div
        className="min-w-0 text-slate-900"
        onClickCapture={(event) => {
          const link = (event.target as HTMLElement).closest("a");
          if (link) event.preventDefault();
        }}
      >
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Inventory / Watch 35</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{watch.brand} {watch.model}</h1>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">{watch.referenceNumber}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">Serial {watch.serialNumber} <span className="px-1.5 text-slate-300">·</span> SKU #35</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" style={{ color: "#334155", opacity: 1 }} className="bg-white" onClick={() => setHeaderMessage("Edit mode is a visual preview only.")}>Edit</Button>
            <Button variant="outline" style={{ color: "#065f46", opacity: 1 }} className="border-emerald-200 bg-white" onClick={() => setHeaderMessage("Archive is a visual preview only.")}>Archive</Button>
          </div>
          {headerMessage && <span role="status" className="sr-only">{headerMessage}</span>}
        </header>
        <section aria-label="Watch overview" className="mb-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#e9f0eb]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.65fr)]">
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-200 bg-white text-emerald-900 hover:bg-white">Sold</Badge>
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-900/60">Record #35 · updated 18 Nov 2026</span>
              </div>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Rolex Submariner Date</h2>
              <p className="mt-1 text-sm text-slate-600">126610LN <span className="px-1.5 text-slate-300">/</span> 2022 <span className="px-1.5 text-slate-300">/</span> Excellent condition</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950"><Check className="h-3.5 w-3.5" />Delivered 18 Nov</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">Return window · 12 days left</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950">Warranty active through Nov 2027</span>
              </div>
              <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-emerald-900/10 pt-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Sale price</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">€13.600</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Net profit</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-800">€1.733 <span className="text-sm font-medium">· {margin.toFixed(1)}%</span></p>
                </div>
                <Button onClick={() => selectTab("sale")} className="ml-auto h-10 gap-2 bg-emerald-900 text-white hover:bg-emerald-800">
                  Review sale record <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-between border-t border-emerald-900/10 bg-[#dfe9e2] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-900/60">At a glance</p>
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                  <Glance label="Purchased" value="12 Jun 2026" />
                  <Glance label="Listed" value="24 Jun 2026" />
                  <Glance label="Hold time" value="151 days" />
                  <Glance label="Buyer" value="Alexandra de Vries" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-emerald-900/10 pt-4">
                <div>
                  <p className="text-xs text-slate-500">Next operational check</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Return window closes 2 Dec</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-900"><ChevronRight className="h-4 w-4" /></span>
              </div>
            </div>
          </div>
        </section>

        <div
          id={tablistId}
          role="tablist"
          aria-label="Watch record sections"
          onKeyDown={onTabKeyDown}
          className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`${tablistId}-${id}-tab`}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${tablistId}-${id}-panel`}
              tabIndex={activeTab === id ? 0 : -1}
              onClick={() => selectTab(id)}
              className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-emerald-800 text-emerald-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`${tablistId}-${activeTab}-panel`}
          aria-labelledby={`${tablistId}-${activeTab}-tab`}
          tabIndex={0}
          className="min-w-0 outline-none"
        >
          {activeTab === "overview" && <OverviewPanel onOpen={selectTab} />}
          {activeTab === "watch" && <WatchPanel />}
          {activeTab === "financials" && <FinancialPanel />}
          {activeTab === "sale" && <SalePanel />}
          {activeTab === "notes" && <NotesPanel />}
        </div>
      </div>
    </Shell>
  );
}

function OverviewPanel({ onOpen }: { onOpen: (id: TabId) => void }) {
  return (
    <div className="space-y-6">
      <LifecycleStrip />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
        <div className="space-y-6">
          <StatusCard />
          <Panel title="Current deal" subtitle="A quick read of the completed transaction">
            <FinancialSnapshot />
            <OfferSignals />
            <Button variant="outline" className="w-full justify-between border-slate-200 bg-white text-slate-700" onClick={() => onOpen("financials")}>
              Open financial breakdown <ChevronRight className="h-4 w-4" />
            </Button>
          </Panel>
        </div>
        <div className="space-y-6">
          <BuyerDeliveryCard />
          <PriceHistoryCard />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <ServiceWarrantyCard />
            <NotesCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function WatchPanel() {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
      <div className="space-y-6">
        <WatchIdentityCard item={watch} holdTime={151} daysInService={6} daysListed={145} />
        <TechnicalCard />
      </div>
      <div className="space-y-6">
        <PurchaseInformationCard item={watch} formatCurrency={formatCurrency} />
        <PriceHistoryCard />
      </div>
    </div>
  );
}

function FinancialPanel() {
  return (
    <div className="space-y-6">
      <DealOverviewCard
        item={watch}
        salePrice={salePrice}
        profit={profit}
        margin={margin}
        totalFees={94_700}
        netAfterVat={138_634}
        vatAmount={34_666}
        effectiveRegisterFee={600}
        chrono24Commission={6.5}
        formatCurrency={formatCurrency}
      >
        <div className="rounded-lg border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Additional Expenses</h3>
            <span className="text-xs text-emerald-800">+ Add</span>
          </div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Service & polish</span><strong>€420,00</strong></div>
        </div>
      </DealOverviewCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <PurchaseInformationCard item={watch} formatCurrency={formatCurrency} />
        <QuickEstimateCard />
      </div>
      <HistoricalSalesCard />
    </div>
  );
}

function SalePanel() {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
      <div className="space-y-6">
        <BuyerDeliveryCard />
        <SalesHistoryCard />
        <HistoricalSalesCard />
      </div>
      <div className="space-y-6">
        <StatusCard />
        <ServiceWarrantyCard />
        <BuyerContactCard />
      </div>
    </div>
  );
}

function NotesPanel() {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
      <div className="space-y-6">
        <NotesCard />
        <TechnicalCard />
        <ListingCard />
      </div>
      <div className="space-y-6">
        <QuickEstimateCard />
        <PriceHistoryCard />
      </div>
    </div>
  );
}

function ListingCard() {
  const [message, setMessage] = useState("");
  return (
    <Panel title="Listing copy" subtitle="Content used on the sales listing">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing description</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">A well-kept modern Submariner Date in excellent condition, supplied as a complete set. Recently inspected and ready to enjoy.</p>
      </div>
      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing title</p>
        <p className="mt-1 text-sm font-medium text-slate-800">Rolex Submariner Date 126610LN Full Set</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setMessage("Listing copy refreshed for this preview.")}>Generate</Button>
        <Button variant="outline" size="sm" onClick={() => setMessage("Listing copy saved locally for this preview.")}>Save copy</Button>
      </div>
      {message && <p role="status" className="text-xs text-emerald-800">{message}</p>}
    </Panel>
  );
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default OverviewTabs;
