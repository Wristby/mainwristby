import type { Client, InventoryItem } from "@shared/schema";
import { Check, ExternalLink } from "lucide-react";
import { DeliveryStatus } from "@/components/delivery-status";
import { Separator } from "@/components/ui/separator";
import { getTrackingUrl } from "@/lib/tracking-url";
import { WatchWarrantySummary } from "./warranty-summary";
import { Link } from "wouter";

type BuyerDeliverySummaryProps = {
  item: InventoryItem;
  buyer?: Client;
  clientsUnavailable: boolean;
};

export function BuyerDeliverySummary({ item, buyer, clientsUnavailable }: BuyerDeliverySummaryProps) {
  return (
    <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Buyer &amp; Delivery</h4>
      <p className="text-xs text-slate-400 mb-4">Buyer contact, shipment, and return-window details</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Sold To</span>
          {buyer ? <Link href={`/clients/${buyer.id}`} className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:underline">
            <Check className="h-3 w-3" aria-hidden="true"/>{buyer.name}
          </Link> : <span className="font-medium">{item.soldTo || "N/A"}</span>}
        </div>
        {buyer && ([
          ["Email", buyer.email], ["Phone", buyer.phone], ["Country", buyer.country],
        ] as const).map(([label, value]) => value && (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="shrink-0 text-slate-500">{label}</span>
            <span className="min-w-0 break-words text-right font-medium">{value}</span>
          </div>
        ))}
        {item.buyerId && clientsUnavailable && <p className="text-xs text-red-600">Buyer contact details could not be loaded.</p>}
        <Separator className="my-3" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Shipper</span>
          <span className="font-medium">{item.shippingPartner || "N/A"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tracking #</span>
          {item.trackingNumber ? (
            getTrackingUrl(item.shippingPartner, item.trackingNumber) ? (
              <a href={getTrackingUrl(item.shippingPartner, item.trackingNumber)!} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 hover:underline inline-flex items-center gap-1" data-testid="link-tracking-transaction">
                {item.trackingNumber} <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="font-medium">{item.trackingNumber}</span>
            )
          ) : (
            <span className="font-medium">N/A</span>
          )}
        </div>
        {item.chrono24CertificationSent && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Chrono24 Certification</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />Sent
            </span>
          </div>
        )}
        <DeliveryStatus key={item.id} id={item.id} deliveredDate={item.deliveredDate} />
        <WatchWarrantySummary item={item} />
      </div>
    </div>
  );
}
