import type { InventoryItem } from "@shared/schema";
import { formatDeliveryDate } from "@shared/delivery";
import { getManufacturerWarrantyCoverage, getStoreWarrantyCoverage } from "@shared/warranty";
import { Separator } from "@/components/ui/separator";

export function WatchWarrantySummary({ item }: { item: InventoryItem }) {
  const store = getStoreWarrantyCoverage(item.storeWarrantyMonths, item.deliveredDate);
  const manufacturer = getManufacturerWarrantyCoverage(
    item.manufacturerPurchaseDate,
    item.manufacturerWarrantyExpires,
    item.manufacturerWarrantyCardPresent,
    item.manufacturerWarrantyDetails,
  );
  const term = item.storeWarrantyMonths == null
    ? "Term not recorded"
    : item.storeWarrantyMonths === 0
      ? "No store warranty"
      : `${item.storeWarrantyMonths} months`;
  const storeStatus = {
    not_recorded: "Not recorded",
    none: "No warranty",
    awaiting_delivery: "Awaiting delivery",
    active: "Active",
    expiring: "Expiring soon",
    expired: "Expired",
  }[store.status];
  const manufacturerStatus = {
    not_recorded: "Not recorded",
    end_date_unknown: "End date not recorded",
    active: "Active",
    expiring: "Expiring soon",
    expired: "Expired",
  }[manufacturer.status];
  const remaining = (days: number | null) => days == null ? "" : days < 0
    ? ` · expired ${Math.abs(days)} days ago`
    : days === 0 ? " · expires today" : ` · ${days} days remaining`;

  return (
    <section className="mt-4 border-t border-slate-100 pt-4" data-testid="watch-warranty-summary">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Warranty Coverage</h4>
      <div className="space-y-2 text-sm">
        <p className="flex flex-wrap justify-between gap-x-4 gap-y-1"><span className="text-slate-500">Store warranty</span><strong>{term} · {storeStatus}{remaining(store.daysRemaining)}</strong></p>
        {store.startDate && <p className="text-xs text-slate-500">Delivery {formatDeliveryDate(store.startDate)} · Ends {formatDeliveryDate(store.endDate!)}</p>}
        {store.status === "awaiting_delivery" && <p className="text-xs text-slate-500">Countdown begins when the customer delivery date is recorded.</p>}
        <Separator className="my-2"/>
        <p className="flex flex-wrap justify-between gap-x-4 gap-y-1"><span className="text-slate-500">Manufacturer</span><strong>{manufacturerStatus}{remaining(manufacturer.daysRemaining)}</strong></p>
        {item.manufacturerPurchaseDate && <p className="text-xs text-slate-500">Original purchase {formatDeliveryDate(item.manufacturerPurchaseDate)}</p>}
        {item.manufacturerWarrantyExpires && <p className="text-xs text-slate-500">Coverage ends {formatDeliveryDate(item.manufacturerWarrantyExpires)}</p>}
        {item.manufacturerWarrantyCardPresent && <p className="text-xs text-emerald-800">Warranty card marked as present</p>}
        {item.manufacturerWarrantyDetails && <p className="whitespace-pre-wrap text-xs text-slate-600">{item.manufacturerWarrantyDetails}</p>}
      </div>
    </section>
  );
}
