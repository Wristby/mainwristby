import type { Client, InventoryItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

type BuyerContactCardProps = {
  item: InventoryItem;
  buyer?: Client;
  isLoading: boolean;
  isUnavailable: boolean;
};

export function BuyerContactCard({ item, buyer, isLoading, isUnavailable }: BuyerContactCardProps) {
  if (!buyer && !item.buyerId && !item.soldTo) return null;

  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-watch-buyer">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900">Buyer information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {buyer ? (
          <>
            <Link href={`/clients/${buyer.id}`} className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline" data-testid="link-watch-buyer-client">
              {buyer.name}
            </Link>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {buyer.email && <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
                <a className="break-words text-slate-700 hover:text-emerald-700 hover:underline" href={`mailto:${buyer.email}`}>{buyer.email}</a>
              </div>}
              {buyer.phone && <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
                <a className="break-words text-slate-700 hover:text-emerald-700 hover:underline" href={`tel:${buyer.phone}`}>{buyer.phone}</a>
              </div>}
              {buyer.country && <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Country</p>
                <p className="break-words text-slate-700">{buyer.country}</p>
              </div>}
            </div>
            {!buyer.email && !buyer.phone && !buyer.country && (
              <p className="text-sm text-slate-500">No additional contact details are saved for this Client.</p>
            )}
            <Link href={`/clients/${buyer.id}`} className="inline-block text-xs font-medium text-emerald-700 hover:underline">View Client profile</Link>
          </>
        ) : item.soldTo ? (
          <>
            <p className="font-semibold text-slate-800">{item.soldTo}</p>
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading buyer contact details…</p>
            ) : isUnavailable ? (
              <p className="text-sm text-red-600">Buyer contact details could not be loaded.</p>
            ) : (
              <p className="text-sm text-slate-500">
                This buyer is not linked to a Client profile yet. <Link href="/clients" className="font-medium text-emerald-700 hover:underline">Review in Clients</Link>
              </p>
            )}
          </>
        ) : isUnavailable ? (
          <p className="text-sm text-red-600">Buyer contact details could not be loaded.</p>
        ) : (
          <p className="text-sm text-slate-500">Loading buyer contact details…</p>
        )}
      </CardContent>
    </Card>
  );
}
