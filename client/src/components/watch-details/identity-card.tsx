import type { InventoryItem } from "@shared/schema";
import { normalizeWatchCondition } from "@/lib/watch-condition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { safeExternalUrl } from "@/lib/safe-external-url";

type WatchIdentityCardProps = {
  item: InventoryItem;
  holdTime: number;
  daysInService: number | null;
  daysListed: number | null;
};

export function WatchIdentityCard({ item, holdTime, daysInService, daysListed }: WatchIdentityCardProps) {
  const photoUrl = safeExternalUrl(item.gdriveLink);
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Watch Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Brand</p>
            <p className="text-slate-900 font-medium mt-1">{item.brand}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Model</p>
            <p className="text-slate-900 font-medium mt-1">{item.model}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</p>
            <p className="text-slate-900 font-medium mt-1">{item.referenceNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Serial #</p>
            <p className="text-slate-900 font-medium mt-1">{item.serialNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Movement Serial Number</p>
            <p className="text-slate-900 font-medium mt-1">{(item as any).internalSerial || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Year</p>
            <p className="text-slate-900 font-medium mt-1">{item.year || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Condition</p>
            <p className="text-slate-900 font-medium mt-1">{normalizeWatchCondition(item.condition)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Link Count</p>
            <p className="text-slate-900 font-medium mt-1">{(item as any).linkCount ?? "N/A"}</p>
          </div>
          {item.gdriveLink && (
            <div className="col-span-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Google Drive Link</p>
              {photoUrl ? <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
              >
                View Photos <ExternalLink className="w-3 h-3" />
              </a> : <p className="mt-1 text-sm text-slate-500">Enter a valid HTTP or HTTPS link to open photos.</p>}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Includes</p>
            <div className="flex gap-2 mt-1">
              {item.box && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Box</Badge>}
              {item.papers && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Papers</Badge>}
              {!item.box && !item.papers && <span className="text-slate-400 text-sm">Watch only</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Hold Time</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{holdTime} days</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Days In Service</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {daysInService !== null ? (
                <>
                  {daysInService} days
                  {!item.dateReturnedFromService && item.serviceStartDate && (
                    <span className="ml-2 text-xs font-normal text-amber-500">ongoing</span>
                  )}
                </>
              ) : "—"}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Days Listed</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {daysListed !== null ? `${daysListed} days` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
