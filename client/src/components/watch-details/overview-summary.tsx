import type { Client, InventoryItem } from "@shared/schema";
import { amsterdamToday, formatDeliveryDate, returnWindow } from "@shared/delivery";
import { getSoldDate } from "@shared/sold-date";
import { getManufacturerWarrantyCoverage, getStoreWarrantyCoverage } from "@shared/warranty";
import { ArrowRight, CalendarDays, Check, ShieldCheck, Watch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeWatchCondition } from "@/lib/watch-condition";

type SectionId = "overview" | "watch" | "financials" | "sale" | "notes" | "ai";

type OverviewSummaryProps = {
  item: InventoryItem;
  buyer?: Client;
  buyerLoading: boolean;
  buyerUnavailable: boolean;
  now: Date;
  salePrice: number;
  profit: number;
  margin: number;
  formatCurrency: (cents: number) => string;
  onOpenSection: (sectionId: SectionId) => void;
};

function formatRecordDate(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : formatDeliveryDate(date.toISOString().slice(0, 10));
}

function statusLabel(status: string) {
  return ({
    in_stock: "Listed",
    servicing: "In Service",
    incoming: "Incoming",
    received: "Received",
    sold: "Sold",
  } as Record<string, string>)[status] ?? status;
}

function warrantyLabel(status: string, daysRemaining: number | null) {
  const label = ({
    not_recorded: "Not recorded",
    none: "No warranty",
    awaiting_delivery: "Awaiting delivery",
    active: "Active",
    expiring: "Expiring soon",
    expired: "Expired",
    end_date_unknown: "End date not recorded",
  } as Record<string, string>)[status] ?? status;
  if (daysRemaining == null) return label;
  if (daysRemaining < 0) return `${label} · expired ${Math.abs(daysRemaining)} days ago`;
  if (daysRemaining === 0) return `${label} · expires today`;
  return `${label} · ${daysRemaining} days remaining`;
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function OverviewSummary({
  item,
  buyer,
  buyerLoading,
  buyerUnavailable,
  now,
  salePrice,
  profit,
  margin,
  formatCurrency,
  onOpenSection,
}: OverviewSummaryProps) {
  const returnState = item.status === "sold" ? returnWindow(item.deliveredDate, now) : null;
  const today = amsterdamToday(now);
  const storeWarranty = getStoreWarrantyCoverage(item.storeWarrantyMonths, item.deliveredDate, today);
  const manufacturerWarranty = getManufacturerWarrantyCoverage(
    item.manufacturerPurchaseDate,
    item.manufacturerWarrantyExpires,
    Boolean(item.manufacturerWarrantyCardPresent),
    item.manufacturerWarrantyDetails,
    today,
  );
  const soldDate = getSoldDate(item);
  const buyerName = buyer?.name ?? item.soldTo ?? (
    item.buyerId && buyerLoading
      ? "Loading buyer…"
      : item.buyerId && buyerUnavailable
        ? "Buyer details unavailable"
        : "Not recorded"
  );
  const askingPrice = item.listPrice != null && item.listPrice > 0 ? item.listPrice : null;
  const isRealizedSale = item.status === "sold" && salePrice > 0;

  return (
    <section
      aria-label="Watch overview"
      className="mb-6 overflow-hidden rounded-2xl border border-[#cad9ce] bg-[#e9f0eb] shadow-sm"
      data-testid="watch-overview-summary"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.65fr)]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-200 bg-white text-emerald-900 hover:bg-white">{statusLabel(item.status)}</Badge>
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-900/65">
              Record #{item.id}
            </span>
            {item.archivedAt && <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">Archived</Badge>}
          </div>
          <h1 className="mt-4 max-w-2xl break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {item.brand} {item.model}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {item.referenceNumber}
            {item.year ? <> <span className="px-1.5 text-slate-400">/</span> {item.year}</> : null}
            {item.condition ? <> <span className="px-1.5 text-slate-400">/</span> {normalizeWatchCondition(item.condition)}</> : null}
            {item.serialNumber ? <> <span className="px-1.5 text-slate-400">/</span> Serial {item.serialNumber}</> : null}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {item.status === "sold"
                ? item.deliveredDate ? `Delivered ${formatRecordDate(item.deliveredDate)}` : "Delivery not confirmed"
                : `Status · ${statusLabel(item.status)}`}
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900" data-testid="watch-return-state">
              {item.status !== "sold" ? "Return window · not applicable" : returnState?.label ?? "Return window · delivery not confirmed"}
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950" data-testid="watch-warranty-state">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Store warranty · {warrantyLabel(storeWarranty.status, storeWarranty.daysRemaining)}
            </span>
            {manufacturerWarranty.status !== "not_recorded" && (
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-emerald-950">
                Manufacturer · {warrantyLabel(manufacturerWarranty.status, manufacturerWarranty.daysRemaining)}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-emerald-900/10 pt-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">
                {isRealizedSale ? "Sale price" : item.status === "sold" ? "Sale price" : "Asking price"}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {isRealizedSale ? formatCurrency(salePrice) : item.status === "sold" ? "Not recorded" : askingPrice ? formatCurrency(askingPrice) : "Not listed"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Net profit</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${isRealizedSale ? profit >= 0 ? "text-emerald-800" : "text-red-700" : "text-slate-500"}`}>
                {isRealizedSale ? <>{formatCurrency(profit)} <span className="text-sm font-medium">· {margin.toFixed(1)}%</span></> : "Not realized"}
              </p>
            </div>
            <Button onClick={() => onOpenSection(item.status === "sold" ? "sale" : "financials")} className="ml-auto h-10 gap-2 bg-emerald-900 text-white hover:bg-emerald-800">
              {item.status === "sold" ? "Review sale record" : "Review financials"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-emerald-900/10 bg-[#dfe9e2] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-900/65">At a glance</p>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
              <Glance label="Purchased" value={formatRecordDate(item.purchaseDate)} />
              <Glance label="Listed" value={formatRecordDate(item.dateListed)} />
              <Glance label="Sold" value={formatRecordDate(soldDate)} />
              <Glance label="Buyer" value={buyerName} />
            </div>
          </div>
          <div className="mt-6 border-t border-emerald-900/10 pt-4">
            <p className="flex items-center gap-2 text-xs text-slate-600">
              <CalendarDays className="h-4 w-4 text-emerald-800" aria-hidden="true" />
              {item.status === "sold" && returnState
                ? `Return window closes ${formatRecordDate(returnState.deadline)}`
                : item.status === "sold"
                  ? "Delivery date needed to calculate the return window"
                  : item.dateReceived
                    ? `Received ${formatRecordDate(item.dateReceived)}`
                    : "Receipt date not recorded"}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <Button variant="ghost" className="h-auto p-0 text-sm text-emerald-900" onClick={() => onOpenSection("watch")}>
                <Watch className="mr-1.5 h-4 w-4" aria-hidden="true" /> Watch details
              </Button>
              <Button variant="ghost" className="h-auto p-0 text-sm text-emerald-900" onClick={() => onOpenSection("sale")}>
                <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden="true" /> Warranty
              </Button>
              <Button variant="ghost" className="h-auto p-0 text-sm text-emerald-900" onClick={() => onOpenSection("ai")}>
                AI tools
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
