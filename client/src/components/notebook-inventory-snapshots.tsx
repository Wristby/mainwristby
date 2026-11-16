import { Button } from "@/components/ui/button";
import { notebookMonthKey, type NotebookInventorySnapshot } from "@shared/dealers-notebook";

const money = (cents: number) => new Intl.NumberFormat("en-GB", {
  style: "currency", currency: "EUR", minimumFractionDigits: 2,
}).format(cents / 100);
const monthLabel = (key: string) => new Intl.DateTimeFormat("en-GB", {
  month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${key}-15T12:00:00Z`));
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "long", timeZone: "Europe/Amsterdam",
}).format(new Date(value));

export function NotebookInventorySnapshots({
  monthKey, snapshot, comparisonSnapshots, canCapture, busy, onCapture,
}: {
  monthKey: string;
  snapshot: NotebookInventorySnapshot | null;
  comparisonSnapshots: Array<{ monthKey: string; snapshot: NotebookInventorySnapshot | null }>;
  canCapture: boolean;
  busy: boolean;
  onCapture: () => void;
}) {
  const isOpen = monthKey >= (notebookMonthKey(new Date()) ?? "");
  return (
    <section aria-label="Month-end inventory snapshots" className="dn-panel p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="dn-eyebrow">Saved separately from live inventory</p>
          <h2 className="mt-1 text-xl font-semibold text-[#244235]">Month-end inventory</h2>
        </div>
        <span className="rounded-full bg-[#edf2eb] px-3 py-1 text-xs font-semibold text-[#536a59]">
          {snapshot ? "Saved capture" : isOpen ? "Month still open" : "Not captured"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#738078]">
        Compare recorded sales with the watches, costs and asking prices saved on each month’s final day.
        Saved captures never change when watches are edited, sold, archived or deleted.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
          <thead className="border-b border-[#dce5da] text-xs text-[#738078]">
            <tr>
              <th scope="col" className="py-3 pr-4">Month</th>
              <th scope="col" className="px-2 py-3">Active watches</th>
              <th scope="col" className="px-2 py-3">Cost basis</th>
              <th scope="col" className="px-2 py-3">Priced listings</th>
              <th scope="col" className="py-3 pl-2">Asking total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6ebe4] text-[#385342]">
            {[{ monthKey, snapshot }, ...comparisonSnapshots].map((item, index) => (
              <tr key={item.monthKey}>
                <th scope="row" className="py-3 pr-4 font-medium">
                  {monthLabel(item.monthKey)}
                  <span className="block text-xs font-normal text-[#7b887f]">{index === 0 ? "Review month" : "Comparison month"}</span>
                </th>
                {item.snapshot ? <>
                  <td className="px-2 py-3">{item.snapshot.activeWatchCount}</td>
                  <td className="px-2 py-3">{money(item.snapshot.costBasisCents)}</td>
                  <td className="px-2 py-3">{item.snapshot.listedWatchCount}</td>
                  <td className="py-3 pl-2">{money(item.snapshot.listingValueCents)}</td>
                </> : <td colSpan={4} className="px-2 py-3 text-[#7b887f]">No saved snapshot — historical inventory is unknown.</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {snapshot ? (
        <>
          <p className="mt-4 text-xs leading-5 text-[#738078]">Captured {dateLabel(snapshot.savedAt)} in Europe/Amsterdam. Refreshing the review does not replace this inventory capture.</p>
          <details className="mt-4 rounded-lg border border-[#dce5da] p-3">
            <summary className="cursor-pointer text-sm font-medium text-[#385342]">Saved watches and listing prices ({snapshot.watches.length})</summary>
            {snapshot.watches.length ? (
              <ul className="mt-3 max-h-64 divide-y divide-[#e6ebe4] overflow-y-auto">
                {snapshot.watches.map((watch, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-2 py-3 text-sm text-[#40594a]">
                    <span>{watch.brand} {watch.model}<span className="block text-xs text-[#7b887f]">{watch.condition} · {watch.isListed ? "Listed" : "Not listed"} · cost {money(watch.costBasisCents)}</span></span>
                    <span>{watch.listPriceCents == null ? "Price not recorded" : money(watch.listPriceCents)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-[#738078]">No active watches were recorded at capture time.</p>}
            <ul className="mt-3 space-y-2 border-t border-[#e6ebe4] pt-3">{snapshot.dataCaveats.map(note => <li key={note} className="text-xs leading-5 text-[#738078]">{note}</li>)}</ul>
          </details>
        </>
      ) : (
        <div className="mt-4 space-y-3 rounded-lg bg-[#f3f6ef] p-4">
          <p className="text-sm leading-6 text-[#63756a]">
            {isOpen
              ? "Automatic capture runs one second before month-end in Europe/Amsterdam while the server is running. You can also save a one-time capture on the month's final day."
              : "No inventory was captured for this month. A past month cannot be reconstructed reliably from today's watches; refreshing the review will not fabricate a snapshot."}
          </p>
          {canCapture && <>
            <p className="text-xs leading-5 text-[#738078]">Saving now freezes the inventory at this moment. It cannot be replaced by a later or automatic capture.</p>
            <Button disabled={busy} onClick={onCapture} className="bg-[#234b3d] text-white hover:bg-[#2d5c49]">
              {busy ? "Saving inventory" : "Save month-end inventory"}
            </Button>
          </>}
        </div>
      )}
    </section>
  );
}
