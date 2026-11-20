import "./_group.css";
import "../wristby-light/_modern.css";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileText,
  Gauge,
  PackageCheck,
  ShieldCheck,
  Watch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shell } from "./Shell";
import { WatchIdentityCard } from "./_source/identity-card";
import { PurchaseInformationCard } from "./_source/purchase-information-card";
import { DealOverviewCard } from "./_source/deal-overview-card";
import {
  BuyerContactCard,
  BuyerDeliveryCard,
  HistoricalSalesCard,
  NotesCard,
  PageHeading,
  PriceHistoryCard,
  QuickEstimateCard,
  SalesHistoryCard,
  ServiceWarrantyCard,
  StatusCard,
  TechnicalCard,
  formatCurrency,
  margin,
  profit,
  salePrice,
  watch,
} from "./WatchDetailsContent";

const tabs = [
  { id: "record", label: "Record", icon: Watch, hint: "Identity & acquisition" },
  { id: "financials", label: "Financials", icon: CircleDollarSign, hint: "Deal economics" },
  { id: "journey", label: "Journey", icon: Activity, hint: "Sale & delivery" },
  { id: "service", label: "Service", icon: ShieldCheck, hint: "Maintenance & history" },
  { id: "listing", label: "Listing", icon: FileText, hint: "Specifications & copy" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function LocalPreviewActions({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
      <Button variant="outline" size="sm" onClick={() => onAction("Edit watch details")}>Edit details</Button>
      <Button variant="outline" size="sm" onClick={() => onAction("Archive preview")}>Archive</Button>
    </div>
  );
}

function PersistentSummaryCard({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="overflow-hidden border-emerald-950/10 bg-white shadow-sm">
      <div className="border-b border-emerald-950/10 bg-[#f1f5f1] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173d31] text-white">
              <Watch className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-900/60">Inventory · #35</p>
              <h2 className="mt-1 truncate text-base font-semibold leading-tight text-slate-900">Rolex Submariner Date</h2>
              <p className="mt-1 text-xs text-slate-500">126610LN <span className="px-1 text-slate-300">/</span> 2022</p>
            </div>
          </div>
          <Badge className="shrink-0 border-emerald-200 bg-white text-emerald-900 hover:bg-white">Sold</Badge>
        </div>
      </div>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Sale price</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#174b3a]">€13.600</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-emerald-800/70">Net profit</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-900">€1.733</p>
          </div>
        </div>
        {!compact && (
          <>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">COGS</span><span className="font-medium tabular-nums text-slate-800">€10.500</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">Listed at</span><span className="font-medium tabular-nums text-slate-800">€14.250</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">Margin</span><span className="font-medium tabular-nums text-emerald-800">12.7%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5">
              <PackageCheck className="h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-950">Return window open</p>
                <p className="text-[11px] text-amber-900/75">Closes 2 Dec · 12 days left</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Excellent</Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Box & papers</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TabContent({ activeTab, onAction }: { activeTab: TabId; onAction: (label: string) => void }) {
  const stopOutbound = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const link = target.closest("a");
    if (link) {
      event.preventDefault();
      onAction("Photo folder preview");
    }
    const button = target.closest("button");
    if (button && !link) {
      onAction(button.textContent?.trim() || "Preview action");
    }
  };

  if (activeTab === "record") {
    return (
      <div className="space-y-5" onClick={stopOutbound}>
        <section className="space-y-4">
          <SectionIntro eyebrow="01 / Record" title="The watch, at a glance" text="Core identity and acquisition details stay together in the permanent record." />
          <WatchIdentityCard item={watch} holdTime={151} daysInService={6} daysListed={145} />
          <PurchaseInformationCard item={watch} formatCurrency={formatCurrency} />
        </section>
      </div>
    );
  }

  if (activeTab === "financials") {
    return (
      <div className="space-y-5" onClick={stopOutbound}>
        <SectionIntro eyebrow="02 / Financials" title="What the deal returned" text="Acquisition, value-add and exit economics for this sale cycle." />
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
          buyerDelivery={<BuyerDeliveryCard />}
        >
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Additional expenses</h3>
              <button className="text-xs font-semibold text-emerald-800" onClick={() => onAction("Add expense")}>+ Add</button>
            </div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Service & polish</span><strong>€420,00</strong></div>
          </div>
        </DealOverviewCard>
        <div className="grid gap-5 xl:grid-cols-2">
          <HistoricalSalesCard />
          <QuickEstimateCard />
        </div>
      </div>
    );
  }

  if (activeTab === "journey") {
    return (
      <div className="space-y-5" onClick={stopOutbound}>
        <SectionIntro eyebrow="03 / Journey" title="Sale, handover & follow-up" text="A sold watch still has an active delivery and return lifecycle." />
        <div className="grid gap-5 xl:grid-cols-2">
          <StatusCard />
          <PriceHistoryCard />
          <SalesHistoryCard />
          <BuyerContactCard />
          <BuyerDeliveryCard />
        </div>
      </div>
    );
  }

  if (activeTab === "service") {
    return (
      <div className="space-y-5" onClick={stopOutbound}>
        <SectionIntro eyebrow="04 / Service" title="Care & recorded history" text="Maintenance work, warranty coverage and comparable reference outcomes." />
        <ServiceWarrantyCard />
        <div className="grid gap-5 xl:grid-cols-2">
          <HistoricalSalesCard />
          <NotesCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" onClick={stopOutbound}>
      <SectionIntro eyebrow="05 / Listing" title="Ready-to-sell record" text="Specifications, supporting materials and the copy used to present this watch." />
      <TechnicalCard />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-800" aria-hidden="true" />
            <h2 className="font-semibold text-slate-900">Listing description</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">A well-kept modern Submariner Date in excellent condition, supplied as a complete set. Recently inspected and ready to enjoy.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onAction("Generate listing copy")}>Generate</Button>
            <Button size="sm" className="bg-[#174b3a] hover:bg-[#103a2d]" onClick={() => onAction("Save listing copy")}>Save copy</Button>
          </div>
        </div>
        <NotesCard />
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#f7f9f7] px-4 py-4 sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">{text}</p>
    </div>
  );
}

export function PersistentSummary() {
  const [activeTab, setActiveTab] = useState<TabId>("record");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const handleAction = (label: string) => {
    setNotice(`${label} · preview only`);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    document.getElementById(`watch-tab-${nextTab.id}`)?.focus();
  };

  return (
    <Shell>
      <div className="min-w-0 text-slate-900">
        <div onClick={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (button) handleAction(button.textContent?.trim() || "Record action");
        }}>
          <PageHeading />
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
          <div className="flex min-w-0 items-center gap-2">
            <Gauge className="h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
            <span className="truncate">Dealer record <span className="px-1 text-slate-300">/</span> Private workspace</span>
          </div>
          <span className="shrink-0 tabular-nums text-slate-500">Updated 18 Nov 2026</span>
        </div>

        <div className="mb-4 lg:hidden">
          <button
            type="button"
            aria-expanded={summaryOpen}
            aria-controls="mobile-watch-summary"
            onClick={() => setSummaryOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">Persistent summary</span>
              <span className="mt-1 block text-sm font-semibold text-slate-900">Sold · €13.600 sale <span className="text-emerald-800">· €1.733 profit</span></span>
            </span>
            {summaryOpen ? <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />}
          </button>
          {summaryOpen && <div id="mobile-watch-summary" className="mt-2"><PersistentSummaryCard /></div>}
          {!summaryOpen && <div id="mobile-watch-summary" className="sr-only"><PersistentSummaryCard compact /></div>}
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[272px_minmax(0,1fr)] xl:gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <PersistentSummaryCard />
              <LocalPreviewActions onAction={handleAction} />
              <div className="rounded-xl border border-slate-200 bg-[#f7f9f7] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Record signals</p>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Hold time</span><strong className="text-slate-800">151 days</strong></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Days listed</span><strong className="text-slate-800">145 days</strong></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Service</span><strong className="text-slate-800">6 days</strong></div>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <div role="tablist" aria-label="Watch record sections" className="grid grid-cols-2 gap-1 sm:grid-cols-5">
                {tabs.map(({ id, label, icon: Icon, hint }) => {
                  const selected = activeTab === id;
                  return (
                    <button
                      key={id}
                      id={`watch-tab-${id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="watch-tab-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveTab(id)}
                      onKeyDown={handleTabKeyDown}
                      className={`flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${selected ? "bg-[#174b3a] text-white shadow-sm" : "text-slate-600 hover:bg-[#f1f5f1] hover:text-slate-900"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold leading-4">{label}</span>
                        <span className={`hidden truncate text-[10px] leading-4 sm:block ${selected ? "text-white/70" : "text-slate-400"}`}>{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              id="watch-tab-panel"
              role="tabpanel"
              aria-labelledby={`watch-tab-${activeTab}`}
              tabIndex={0}
              className="min-w-0 outline-none"
            >
              <TabContent activeTab={activeTab} onAction={handleAction} />
            </div>
          </section>
        </div>
        {notice && (
          <div role="status" className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg bg-[#173d31] px-4 py-3 text-sm font-medium text-white shadow-xl">
            {notice}
          </div>
        )}
      </div>
    </Shell>
  );
}
