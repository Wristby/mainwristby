import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  History,
  PackageCheck,
  Pencil,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { InventoryItem } from "./_source/types";

export const watch: InventoryItem = {
  id: 35,
  brand: "Rolex",
  model: "Submariner Date",
  referenceNumber: "126610LN",
  serialNumber: "62M4X932",
  internalSerial: "3235-88317",
  year: 2022,
  condition: "Excellent",
  linkCount: 12,
  gdriveLink: "https://drive.google.com",
  box: true,
  papers: true,
  purchasedFrom: "Chrono24",
  paidWith: "Bunq",
  purchasePrice: 1_050_000,
  importFee: 18_000,
  watchRegister: true,
  watchRegisterFeeSnapshot: 600,
  status: "sold",
  listPrice: 1_425_000,
  serviceFee: 35_000,
  polishFee: 7_000,
  platformFees: 88_400,
  shippingFee: 3_900,
  insuranceFee: 2_400,
  dateReturnedFromService: "2026-08-12",
  serviceStartDate: "2026-08-06",
};

export const salePrice = 1_360_000;
export const profit = 173_300;
export const margin = (profit / salePrice) * 100;
export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);

export function PageHeading() {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Inventory / Watch 35</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{watch.brand} {watch.model}</h1>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">126610LN</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">Serial 62M4X932 <span className="px-1.5 text-slate-300">·</span> SKU #35</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button className="!opacity-100 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium !text-slate-700"><Pencil className="h-4 w-4" />Edit</button>
        <button className="!opacity-100 inline-flex min-h-10 items-center rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium !text-emerald-800">Archive</button>
      </div>
    </header>
  );
}

export function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function StatusCard() {
  return (
    <Panel title="Status" subtitle="Current status and key dates">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2.5">
        <span className="text-sm text-slate-600">Current status</span>
        <Badge className="border-emerald-200 bg-white text-emerald-800 hover:bg-white">Sold</Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <KeyValue label="Purchased" value="12 Jun 2026" />
        <KeyValue label="Received" value="18 Jun 2026" />
        <KeyValue label="Listed" value="24 Jun 2026" />
        <KeyValue label="Sold" value="16 Nov 2026" />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Held 151 days</Badge>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Listed 145 days</Badge>
      </div>
    </Panel>
  );
}

export function PriceHistoryCard() {
  const entries = [
    { date: "16 Nov 2026", price: "€13.600", change: "Sale price" },
    { date: "18 Oct 2026", price: "€14.250", change: "Reduced from €14.500" },
    { date: "24 Jun 2026", price: "€14.500", change: "Initial listing" },
  ];
  return (
    <Panel title="Pricing History" subtitle="Price changes since listing began">
      <div className="space-y-0">
        {entries.map((entry, index) => (
          <div key={entry.date} className="flex items-start gap-3 border-l border-slate-200 py-2 pl-4 first:pt-0 last:border-transparent last:pb-0">
            <span className={`-ml-[21px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${index === 0 ? "bg-emerald-600" : "bg-slate-300"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-slate-500">{entry.date}</span>
                <strong className="text-sm text-slate-900">{entry.price}</strong>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{entry.change}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function BuyerDeliveryCard() {
  return (
    <Panel title="Buyer & Delivery" subtitle="Shipment, return window, and warranty">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Buyer</p>
          <p className="mt-1 font-medium text-slate-900">Alexandra de Vries</p>
          <p className="mt-1 text-xs text-slate-500">alexandra@example.com · Netherlands</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Shipment</p>
          <p className="mt-1 font-medium text-slate-900">UPS · 1Z84 2X6 03 915</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><PackageCheck className="h-3.5 w-3.5" />Delivered 18 Nov 2026</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-medium text-amber-900">Return window closes 2 Dec</span>
        </div>
        <Badge className="border-amber-200 bg-white text-amber-800 hover:bg-white">12 days left</Badge>
      </div>
      <div className="rounded-lg border border-slate-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-800">Store warranty</span>
          <span className="text-sm font-semibold text-emerald-700">12 months · Active</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400" />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Through 18 Nov 2027 · Manufacturer coverage until 14 Mar 2027</p>
      </div>
    </Panel>
  );
}

export function BuyerContactCard() {
  return (
    <Panel title="Buyer information">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Alexandra de Vries</p>
          <p className="mt-1 text-sm text-slate-600">alexandra@example.com</p>
          <p className="text-sm text-slate-600">+31 6 1234 5678 · Netherlands</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">View client</Button>
      </div>
    </Panel>
  );
}

export function SalesHistoryCard() {
  return (
    <Panel title="Sales & returns" subtitle="One watch, multiple sale cycles" action={<Button variant="ghost" size="sm" className="h-7 text-emerald-800">View all</Button>}>
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Sale cycle 1</Badge>
              <p className="mt-1 text-xs text-slate-500">Sold 16 Nov 2026 · Chrono24</p>
            </div>
            <span className="font-semibold text-slate-900">€13.600</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-2 text-sm">
            <div><p className="text-xs text-slate-500">Profit at sale</p><p className="font-semibold text-emerald-800">€1.733</p></div>
            <div><p className="text-xs text-slate-500">Return adjustment</p><p className="font-semibold text-slate-700">None</p></div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ServiceWarrantyCard() {
  return (
    <Panel title="Service & Warranty" subtitle="Maintenance and coverage details">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <KeyValue label="Service started" value="6 Aug 2026" />
        <KeyValue label="Completed" value="12 Aug 2026" />
        <KeyValue label="Service duration" value="6 days" />
        <KeyValue label="Service cost" value="€350" />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <KeyValue label="Store warranty" value="12 months from delivery" />
        <KeyValue label="Manufacturer warranty" value="Until 14 Mar 2027" />
      </div>
    </Panel>
  );
}

export function NotesCard() {
  return (
    <Panel title="Notes" action={<Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500"><Pencil className="h-3.5 w-3.5" /></Button>}>
      <p className="text-sm leading-6 text-slate-600">Full set. Light desk wear on the clasp, polished in-house before listing. Buyer confirmed receipt in good condition.</p>
    </Panel>
  );
}

export function TechnicalCard() {
  return (
    <Panel title="Watch & listing details" subtitle="Reference, condition, specs, and sales content">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <KeyValue label="Reference" value="126610LN" />
        <KeyValue label="Serial" value="62M4X932" />
        <KeyValue label="Year" value="2022" />
        <KeyValue label="Condition" value="Excellent" />
        <KeyValue label="Movement" value="Calibre 3235" />
        <KeyValue label="Power reserve" value="~70 hours" />
      </div>
      <Separator />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Box</Badge>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Papers</Badge>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">12 links</Badge>
        <a href="https://drive.google.com" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline">Watch photos <ExternalLink className="h-3 w-3" /></a>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium text-slate-500">Listing title</p>
          <p className="mt-1 text-sm font-medium text-slate-800">Rolex Submariner Date 126610LN Full Set</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium text-slate-500">Listing description</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">Excellent example of the modern Submariner Date, supplied as a complete set with box and papers.</p>
        </div>
      </div>
    </Panel>
  );
}

export function QuickEstimateCard() {
  return (
    <Panel title="Quick Estimate" subtitle="Indicative, not saved to this watch">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["10%", "€12.450"],
          ["15%", "€13.050"],
          ["20%", "€13.700"],
        ].map(([label, amount]) => (
          <div key={label} className="rounded-lg bg-emerald-50 px-2 py-3">
            <p className="text-xs text-slate-500">{label} margin</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">{amount}</p>
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full border-slate-200 text-slate-700">Open estimate</Button>
    </Panel>
  );
}

export function HistoricalSalesCard() {
  return (
    <Panel title="Reference historics" subtitle="Other recorded 126610LN sales" action={<History className="h-4 w-4 text-slate-400" />}>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Sold</span><span>Purchase</span><span>Sale</span><span>Profit</span>
        </div>
        <div className="grid grid-cols-4 px-3 py-2.5 text-xs text-slate-700">
          <span>Sep 2026</span><span>€10.2k</span><span>€13.1k</span><span className="font-semibold text-emerald-800">€1.9k</span>
        </div>
        <div className="grid grid-cols-4 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-700">
          <span>May 2026</span><span>€9.8k</span><span>€12.5k</span><span className="font-semibold text-emerald-800">€1.6k</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">Average profit on this reference: €1.750</p>
    </Panel>
  );
}

export function FinancialSnapshot() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Snapshot label="COGS" value="€10.500" />
      <Snapshot label="Listed at" value="€14.250" tone="violet" />
      <Snapshot label="Sale price" value="€13.600" tone="green" />
      <Snapshot label="Net profit" value="€1.733" tone="green" />
    </div>
  );
}

function Snapshot({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "green" | "violet" }) {
  const tones = {
    slate: "bg-slate-50 border-slate-100 text-slate-900",
    green: "bg-emerald-50/70 border-emerald-100 text-emerald-800",
    violet: "bg-violet-50/70 border-violet-100 text-violet-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function LifecycleStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
      {[
        ["Purchased", "12 Jun"],
        ["Received", "18 Jun"],
        ["Serviced", "12 Aug"],
        ["Listed", "24 Jun"],
        ["Sold", "16 Nov"],
        ["Delivered", "18 Nov"],
      ].map(([label, date], index) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${index === 5 ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800"}`}>
            {index === 5 ? <Check className="h-3.5 w-3.5" /> : <CalendarDays className="h-3 w-3" />}
          </span>
          <span><strong className="block text-slate-800">{label}</strong><span className="text-slate-500">{date}</span></span>
          {index < 5 && <span className="mx-1 text-slate-300">→</span>}
        </div>
      ))}
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function OfferSignals() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
        <p className="text-xs font-medium text-emerald-900">Price vs. list</p>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-800"><ArrowDownRight className="h-4 w-4" />4.6% below ask</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-medium text-slate-600">Recent activity</p>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800"><ArrowUpRight className="h-4 w-4 text-emerald-700" />Price held steady</p>
      </div>
    </div>
  );
}

export function SectionTag({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-emerald-700" />{children}</div>;
}

export function MaintenanceBadge() {
  return <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"><Wrench className="h-3.5 w-3.5" />Serviced · 12 Aug 2026</div>;
}

export function DocsBadge() {
  return <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"><FileText className="h-3.5 w-3.5" />Full set documentation</div>;
}

export function InventoryBadge() {
  return <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"><Box className="h-3.5 w-3.5" />Box and papers</div>;
}
