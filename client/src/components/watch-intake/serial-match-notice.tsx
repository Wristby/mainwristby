import { AlertTriangle, ExternalLink } from "lucide-react";
import type { InventoryItem } from "@shared/schema";
import type { WatchSerialField } from "@shared/serial-match";

export type InventorySerialMatch = Pick<
  InventoryItem,
  "id" | "brand" | "model" | "referenceNumber" | "serialNumber" | "internalSerial" | "status" | "dateSold" | "soldDate" | "archivedAt"
> & { matchedFields: WatchSerialField[] };

function formattedStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formattedDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SerialMatchNotice({
  matches,
  loading = false,
  error = false,
}: {
  matches: InventorySerialMatch[];
  loading?: boolean;
  error?: boolean;
}) {
  if (loading) {
    return <p role="status" className="text-xs text-slate-500 sm:col-span-2">Checking saved watch records for a serial match…</p>;
  }
  if (error) {
    return <p role="status" className="text-xs text-amber-800 sm:col-span-2">Could not check saved serial numbers. You can still add this watch.</p>;
  }
  if (!matches.length) return null;

  return <section role="status" aria-live="polite" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:col-span-2">
    <div className="flex items-start gap-2">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/>
      <div>
        <h4 className="text-sm font-semibold text-amber-950">Possible repeat watch</h4>
        <p className="mt-0.5 text-xs leading-5 text-amber-900">
          {matches.length === 1 ? "This serial matches a watch already in your records." : `These serials match ${matches.length} watches already in your records.`}
          {" "}Review the match before adding; this does not prevent saving.
        </p>
      </div>
    </div>
    <ul className="space-y-2">
      {matches.map((watch) => {
        const saleDate = formattedDate(watch.dateSold ?? watch.soldDate);
        return <li key={watch.id} className="rounded-md border border-amber-200 bg-white/80 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{watch.brand} {watch.model}</p>
              <p className="mt-0.5 text-xs text-slate-600">
                Ref. {watch.referenceNumber} <span className="mx-1 text-slate-300">·</span> Record #{watch.id}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
              {formattedStatus(watch.status)}{watch.archivedAt ? " · Archived" : ""}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {watch.matchedFields.includes("serialNumber") && watch.serialNumber && <span>Serial: <span className="font-mono text-slate-800">{watch.serialNumber}</span></span>}
            {watch.matchedFields.includes("internalSerial") && watch.internalSerial && <span>Movement / internal: <span className="font-mono text-slate-800">{watch.internalSerial}</span></span>}
            {saleDate && <span>Sold {saleDate}</span>}
          </div>
          <a href={`/inventory/${watch.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline">
            Open matching watch <ExternalLink aria-hidden="true" className="h-3 w-3"/>
          </a>
        </li>;
      })}
    </ul>
  </section>;
}
