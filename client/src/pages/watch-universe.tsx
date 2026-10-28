import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { AlertCircle, ArrowUpRight, CircleHelp, Orbit, Search, SlidersHorizontal, Watch } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { useAmsterdamClock } from "@/hooks/use-amsterdam-clock";
import { calculateWatchUniverse, type WatchUniversePoint } from "@/lib/watch-universe";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fullCurrency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const marginFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const statusLabels: Record<string, string> = {
  in_stock: "In stock", incoming: "Incoming", received: "Received", servicing: "Servicing",
};

function marginAxisDomain([dataMin, dataMax]: [number, number]): [number, number] {
  const minimum = Math.min(0, dataMin);
  const maximum = Math.max(0, dataMax);
  return minimum === maximum ? [-5, 5] : [minimum, maximum];
}

function WatchTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WatchUniversePoint }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-60 rounded-xl border border-[#d7e2da] bg-[#fffefa] p-4 shadow-xl">
      <div className="mb-3 border-b border-[#e7ece6] pb-3">
        <div className="text-xs font-semibold uppercase tracking-[.14em] text-[#75847a]">{point.brand}</div>
        <div className="mt-1 font-semibold text-[#183d33]">{point.model}</div>
        <div className="mt-1 font-mono text-xs text-[#68786f]">{point.referenceNumber}</div>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Listed for</dt><dd className="font-medium text-[#233a31]">{point.daysListed} days</dd></div>
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Current list price</dt><dd className="font-medium text-[#233a31]">{fullCurrency.format(point.listPriceCents / 100)}</dd></div>
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Cost basis</dt><dd className="font-medium text-[#233a31]">{fullCurrency.format(point.costBasisCents / 100)}</dd></div>
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Est. profit</dt><dd className={`font-semibold ${point.estimatedProfitCents < 0 ? "text-[#a44f45]" : "text-[#26745b]"}`}>{fullCurrency.format(point.estimatedProfitCents / 100)}</dd></div>
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Est. margin</dt><dd className={`font-semibold ${point.estimatedMarginPercent < 0 ? "text-[#a44f45]" : "text-[#26745b]"}`}>{marginFormatter.format(point.estimatedMarginPercent)}%</dd></div>
        <div className="flex justify-between gap-5"><dt className="text-[#718077]">Chrono24 fee</dt><dd className="font-medium text-[#233a31]">{marginFormatter.format(point.chrono24FeePercent)}%</dd></div>
      </dl>
      <div className="mt-3 border-t border-[#e7ece6] pt-2 text-xs text-[#718077]">Open watch details</div>
    </div>
  );
}

export default function WatchUniverse() {
  const [, setLocation] = useLocation();
  const inventoryQuery = useInventory(undefined, false);
  const settingsQuery = useSettings();
  const now = useAmsterdamClock();
  const { settings } = settingsQuery;
  const [status, setStatus] = useState("all");
  const [brand, setBrand] = useState("all");
  const [search, setSearch] = useState("");

  const universe = useMemo(() => calculateWatchUniverse(inventoryQuery.data ?? [], {
    chrono24CommissionPercent: settings.chrono24_commission,
    watchRegisterFeeCents: settings.watch_register_fee,
  }, now), [inventoryQuery.data, settings.chrono24_commission, settings.watch_register_fee, now]);

  const brands = useMemo(() => Array.from(new Set(universe.points.map((point) => point.brand))).sort((a, b) => a.localeCompare(b)), [universe.points]);
  const filteredPoints = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return universe.points.filter((point) => (
      (status === "all" || point.status === status)
      && (brand === "all" || point.brand === brand)
      && (!term || `${point.brand} ${point.model} ${point.referenceNumber}`.toLocaleLowerCase().includes(term))
    ));
  }, [universe.points, status, brand, search]);

  const exclusions = useMemo(() => {
    const active = (inventoryQuery.data ?? []).filter((watch) => !watch.archivedAt && watch.status !== "sold");
    return {
      missingDate: active.filter((watch) => !watch.dateListed || Number.isNaN(new Date(watch.dateListed).getTime())).length,
      missingPrice: active.filter((watch) => !watch.listPrice || watch.listPrice <= 0).length,
      missingCost: active.filter((watch) => watch.purchasePrice <= 0).length,
    };
  }, [inventoryQuery.data]);

  const isLoading = inventoryQuery.isLoading || settingsQuery.isLoading;
  const hasError = inventoryQuery.isError || settingsQuery.isError;
  const retry = () => {
    void inventoryQuery.refetch();
    void settingsQuery.refetch();
  };

  if (isLoading) {
    return <div className="space-y-6" aria-label="Loading Watch Universe">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-[#e5ebe5]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-[#dce5dd] bg-[#fbfcf8]" />)}</div>
      <div className="h-[430px] animate-pulse rounded-2xl border border-[#dce5dd] bg-[#fbfcf8]" />
    </div>;
  }

  if (hasError) {
    return <section className="rounded-2xl border border-[#e5d7cf] bg-[#fffaf6] p-8" role="alert">
      <AlertCircle className="mb-4 h-6 w-6 text-[#a65c4b]" />
      <h1 className="text-2xl font-semibold">Watch Universe could not load</h1>
      <p className="mt-2 text-sm text-[#68786f]">Inventory or fee settings are temporarily unavailable.</p>
      <button type="button" onClick={retry} className="mt-5 rounded-lg bg-[#173c32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245444]">Try again</button>
    </section>;
  }

  const portfolioMargin = filteredPoints.length
    ? filteredPoints.reduce((sum, point) => sum + point.estimatedProfitCents, 0)
      / filteredPoints.reduce((sum, point) => sum + point.listPriceCents, 0) * 100
    : 0;
  const totalCostBasis = filteredPoints.reduce((sum, point) => sum + point.costBasisCents, 0);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.19em] text-[#79877d]"><Orbit className="h-4 w-4 text-[#b38b4c]" /> Inventory intelligence</div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#173c32]">Watch Universe</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68786f]">A current view of listing age, estimated margin and capital tied up across your active stock.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#dce5dd] bg-[#fbfcf8] px-3 py-2 text-xs text-[#68786f]">
          <CircleHelp className="h-4 w-4 shrink-0 text-[#a27e43]" />
          <span>Estimate only · Chrono24 fee applied · future sale costs excluded</span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Universe summary">
        <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
          <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Eligible watches</div>
          <div className="mt-2 flex items-end gap-2"><span className="font-mono text-3xl font-semibold tracking-tight text-[#183d33]">{filteredPoints.length}</span><span className="mb-1 text-xs text-[#7b897f]">of {universe.activeWatchCount} active</span></div>
        </div>
        <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
          <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Portfolio estimated margin</div>
          <div className={`mt-2 font-mono text-3xl font-semibold tracking-tight ${portfolioMargin < 0 ? "text-[#a44f45]" : "text-[#26745b]"}`}>{marginFormatter.format(portfolioMargin)}%</div>
        </div>
        <div className="rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-5">
          <div className="text-xs font-semibold uppercase tracking-[.13em] text-[#7b897f]">Capital represented</div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#183d33]">{currency.format(totalCostBasis / 100)}</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dce5dd] bg-[#fbfcf8] shadow-[0_3px_12px_rgba(24,50,40,.04)]">
        <div className="flex flex-col gap-4 border-b border-[#e5ebe5] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#183d33]">Current stock position</h2>
            <p className="mt-1 text-sm text-[#75847a]">Each bubble is a watch. Larger bubbles represent higher cost basis.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-48">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#849188]" />
              <input aria-label="Search brand, model, or reference" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Brand, model, reference" className="w-full rounded-lg border border-[#d8e2dc] bg-[#fffefa] py-2.5 pl-9 pr-3 text-sm text-[#233a31] outline-none focus:border-[#799b88] focus:ring-2 focus:ring-[#dce9de]" />
            </label>
            <label className="relative">
              <span className="sr-only">Filter by brand</span>
              <select aria-label="Filter by brand" value={brand} onChange={(event) => setBrand(event.target.value)} className="w-full appearance-none rounded-lg border border-[#d8e2dc] bg-[#fffefa] px-3 py-2.5 pr-8 text-sm text-[#31483d] sm:w-44">
                <option value="all">All brands</option>{brands.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="relative">
              <span className="sr-only">Filter by status</span>
              <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full appearance-none rounded-lg border border-[#d8e2dc] bg-[#fffefa] px-3 py-2.5 pr-8 text-sm text-[#31483d] sm:w-40">
                <option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {filteredPoints.length ? (
          <>
            <div className="h-[360px] w-full px-1 py-5 sm:h-[440px] sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 14, right: 22, bottom: 16, left: 0 }}>
                  <CartesianGrid stroke="#e9eee8" vertical={false} />
                  <XAxis type="number" dataKey="daysListed" name="Days listed" tickLine={false} axisLine={{ stroke: "#cfd9d0" }} tick={{ fill: "#78867d", fontSize: 12 }} tickFormatter={(value) => `${value}d`} label={{ value: "Days listed", position: "insideBottom", offset: -8, fill: "#78867d", fontSize: 12 }} />
                  <YAxis type="number" dataKey="estimatedMarginPercent" name="Estimated margin" domain={marginAxisDomain} tickLine={false} axisLine={false} tick={{ fill: "#78867d", fontSize: 12 }} tickFormatter={(value) => `${marginFormatter.format(value)}%`} width={58} />
                  <ZAxis type="number" dataKey="costBasisCents" range={[64, 256]} />
                  <ReferenceLine y={0} stroke="#adbbb0" strokeDasharray="4 5" />
                  <Tooltip cursor={{ stroke: "#b9c9bd", strokeDasharray: "4 4" }} content={<WatchTooltip />} />
                  <Scatter
                    data={filteredPoints.filter((point) => point.estimatedMarginPercent >= 0)}
                    fill="#5f9878"
                    fillOpacity={0.82}
                    stroke="#fbfcf8"
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={(entry: WatchUniversePoint) => setLocation(`/inventory/${entry.id}`)}
                  />
                  <Scatter
                    data={filteredPoints.filter((point) => point.estimatedMarginPercent < 0)}
                    fill="#c18173"
                    fillOpacity={0.82}
                    stroke="#fbfcf8"
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={(entry: WatchUniversePoint) => setLocation(`/inventory/${entry.id}`)}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ece6] px-5 py-3 text-xs text-[#75847a] sm:px-6">
              <div className="flex items-center gap-2"><span className="inline-block h-px w-6 border-t border-dashed border-[#8c9b90]" />Zero margin</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-[#5e8a70] bg-[#8ab29b]" />Positive <span className="ml-2 h-3 w-3 rounded-full border border-[#a76a5d] bg-[#d5a59a]" />Negative margin</div>
              <span>Select a bubble or use the accessible watch list below</span>
            </div>
          </>
        ) : (
          <div className="px-6 py-14 text-center">
            <SlidersHorizontal className="mx-auto h-7 w-7 text-[#a4b1a6]" />
            <h3 className="mt-4 font-semibold text-[#294238]">{universe.points.length ? "No watches match these filters" : "No eligible watches yet"}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#718077]">{universe.points.length ? "Adjust the brand, status or search filters to see current stock." : "Active, unsold watches appear once they have a valid listing date, a positive list price and a positive purchase cost."}</p>
            {universe.points.length > 0 && <button type="button" onClick={() => { setStatus("all"); setBrand("all"); setSearch(""); }} className="mt-4 rounded-lg border border-[#d8e2dc] px-4 py-2 text-sm font-semibold text-[#315747] hover:bg-[#f0f4ef]">Clear filters</button>}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#dce5dd] bg-[#fbfcf8]">
          <div className="flex items-center justify-between border-b border-[#e7ece6] px-5 py-4">
            <div><h2 className="font-semibold text-[#183d33]">Watches in view</h2><p className="mt-1 text-xs text-[#75847a]">Keyboard-accessible detail links</p></div>
            <span className="font-mono text-sm text-[#718077]">{filteredPoints.length}</span>
          </div>
          {filteredPoints.length ? <div className="max-h-[390px] divide-y divide-[#edf0eb] overflow-auto">
            {filteredPoints.map((point) => <Link key={point.id} href={`/inventory/${point.id}`} className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#f2f6f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b38b4c]">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${point.estimatedMarginPercent < 0 ? "bg-[#f3e8e4] text-[#a45f52]" : "bg-[#e7f0e8] text-[#34745b]"}`}><Watch className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#294238]">{point.brand} {point.model}</span><span className="mt-0.5 block truncate font-mono text-xs text-[#829087]">{point.referenceNumber} · {point.daysListed} days listed</span></span>
              </div>
              <span className="flex shrink-0 items-center gap-3"><span className={`font-mono text-sm font-semibold ${point.estimatedMarginPercent < 0 ? "text-[#a45f52]" : "text-[#34745b]"}`}>{marginFormatter.format(point.estimatedMarginPercent)}%</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[#97a59a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
            </Link>)}
          </div> : <div className="p-5 text-sm text-[#718077]">No matching watches.</div>}
        </div>

        <aside className="rounded-2xl border border-[#dce5dd] bg-[#f1f5ef] p-5 sm:p-6">
          <div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-[#a27e43]" /><h2 className="font-semibold text-[#294238]">How to read this view</h2></div>
          <p className="mt-3 text-sm leading-6 text-[#68786f]">The horizontal position is days since listing. Vertical position is estimated margin against today’s asking price. Bubble size represents total watch-level cost basis.</p>
          <div className="mt-5 rounded-xl border border-[#dce5dd] bg-[#fbfcf8] p-4">
            <div className="text-xs font-semibold uppercase tracking-[.12em] text-[#78867d]">Eligibility check</div>
            <p className="mt-2 text-sm leading-5 text-[#68786f]">{universe.excludedWatchCount} active {universe.excludedWatchCount === 1 ? "watch is" : "watches are"} excluded because a listing date, positive list price or positive purchase cost is missing.</p>
            <div className="mt-3 space-y-1.5 text-xs text-[#76847b]">
              <div className="flex justify-between"><span>Missing / invalid listing date</span><span className="font-mono">{exclusions.missingDate}</span></div>
              <div className="flex justify-between"><span>Missing / non-positive list price</span><span className="font-mono">{exclusions.missingPrice}</span></div>
              <div className="flex justify-between"><span>Missing / non-positive purchase cost</span><span className="font-mono">{exclusions.missingCost}</span></div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#7a887f]">Margin deducts the watch-level cost basis and the watch’s Chrono24 fee rate, or the app default when no individual rate is set. Estimates are not predictions; future sale costs are not included. Overlap between missing-data counts is possible.</p>
        </aside>
      </section>
    </div>
  );
}
