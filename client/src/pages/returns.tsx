import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Box, CalendarClock, CheckCircle2, CircleDollarSign, Download, PackageCheck, RotateCcw, Search, Truck, Watch } from "lucide-react";
import { useSales, returnNextActionLabels, returnStatusLabels } from "@/hooks/use-sales";
import type { InventoryReturn } from "@shared/schema";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";
import { buildReturnReconciliationCsv, getReturnAdjustmentCents, getSaleCycleNetProfitCents } from "@shared/sales-lifecycle";
import { api } from "@shared/routes";
import { apiJson, queryClient } from "@/lib/queryClient";
import { salesQueryKey } from "@/hooks/use-sales";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDeliveryDate } from "@shared/delivery";

type Filter = "open" | "received" | "completed" | "all";
type ReturnUpdate = Partial<Omit<InventoryReturn, "id" | "saleId" | "createdAt" | "updatedAt" | "cogsRestoredCents" | "completedDate">>;

const money = (cents: number) => new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
}).format(cents / 100);

function dateLabel(value: string | Date | null | undefined) {
  if (!value) return "Not recorded";
  const day = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  return formatDeliveryDate(day);
}

function toEuroInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function fromEuroInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
}

function statusTone(status: string) {
  if (status === "completed" || status === "inspected") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "received") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "cancelled" || status === "declined") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function SummaryCard({ label, value, icon: Icon, tone }: {
  label: string;
  value: string | number;
  icon: typeof RotateCcw;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function ReturnEditor({ item, sale }: { item: InventoryReturn; sale: InventorySaleWithReturns }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(item.status);
  const [requestDate, setRequestDate] = useState(item.requestDate ?? "");
  const [reason, setReason] = useState(item.reason ?? "");
  const [returnShippedDate, setReturnShippedDate] = useState(item.returnShippedDate ?? "");
  const [receivedDate, setReceivedDate] = useState(item.receivedDate ?? "");
  const [carrier, setCarrier] = useState(item.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(item.trackingNumber ?? "");
  const [shippingCost, setShippingCost] = useState(toEuroInput(item.shippingCostCents));
  const [shippingPayer, setShippingPayer] = useState(item.shippingPayer);
  const [refundAmount, setRefundAmount] = useState(toEuroInput(item.refundAmountCents));
  const [refundDate, setRefundDate] = useState(item.refundDate ?? "");
  const [inspectionCondition, setInspectionCondition] = useState(item.inspectionCondition ?? "");
  const [missingItems, setMissingItems] = useState(item.missingItems ?? "");
  const [inspectionNotes, setInspectionNotes] = useState(item.inspectionNotes ?? "");
  const [inspectionCost, setInspectionCost] = useState(toEuroInput(item.inspectionCostCents));
  const [nextAction, setNextAction] = useState(item.nextAction);
  const [platformFeeRefunded, setPlatformFeeRefunded] = useState(item.platformFeeRefunded);

  async function save() {
    setSaving(true);
    try {
      const path = api.returns.update.path.replace(":id", String(item.id));
      const body: ReturnUpdate = {
        status,
        requestDate: requestDate || item.requestDate,
        reason,
        returnShippedDate: returnShippedDate || null,
        receivedDate: receivedDate || null,
        carrier: carrier.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        shippingCostCents: fromEuroInput(shippingCost),
        shippingPayer,
        refundAmountCents: fromEuroInput(refundAmount),
        refundDate: refundDate || null,
        inspectionCondition: inspectionCondition.trim() || null,
        missingItems: missingItems.trim() || null,
        inspectionNotes: inspectionNotes.trim() || null,
        inspectionCostCents: fromEuroInput(inspectionCost),
        nextAction,
        platformFeeRefunded,
      };
      const saved = await apiJson<InventoryReturn>("PATCH", path, body);
      setStatus(saved.status);
      setRequestDate(saved.requestDate);
      setReason(saved.reason ?? "");
      setReturnShippedDate(saved.returnShippedDate ?? "");
      setReceivedDate(saved.receivedDate ?? "");
      setCarrier(saved.carrier ?? "");
      setTrackingNumber(saved.trackingNumber ?? "");
      setShippingCost(toEuroInput(saved.shippingCostCents));
      setShippingPayer(saved.shippingPayer);
      setRefundAmount(toEuroInput(saved.refundAmountCents));
      setRefundDate(saved.refundDate ?? "");
      setInspectionCondition(saved.inspectionCondition ?? "");
      setMissingItems(saved.missingItems ?? "");
      setInspectionNotes(saved.inspectionNotes ?? "");
      setInspectionCost(toEuroInput(saved.inspectionCostCents));
      setNextAction(saved.nextAction);
      setPlatformFeeRefunded(saved.platformFeeRefunded);
      await queryClient.invalidateQueries({ queryKey: [...salesQueryKey] });
      if (sale.inventoryId != null) {
        await queryClient.invalidateQueries({ queryKey: [`/api/inventory/${sale.inventoryId}/sales`] });
        await queryClient.invalidateQueries({ queryKey: [api.inventory.get.path, sale.inventoryId] });
        await queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      }
      toast({ title: "Return updated" });
    } catch (error) {
      toast({
        title: "Could not update return",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "min-h-10";
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`return-status-${item.id}`}>Return status</Label>
          <select id={`return-status-${item.id}`} className={`w-full rounded-md border border-slate-300 bg-white px-3 ${inputClass}`} value={status} onChange={e => setStatus(e.target.value as InventoryReturn["status"])}>
            {Object.entries(returnStatusLabels).map(([value, label]) => (
              <option key={value} value={value} disabled={Boolean(item.receivedDate) && ["cancelled", "declined"].includes(value)}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-request-date-edit-${item.id}`}>Request date</Label>
          <Input id={`return-request-date-edit-${item.id}`} type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-shipped-date-${item.id}`}>Return shipped</Label>
          <Input id={`return-shipped-date-${item.id}`} type="date" value={returnShippedDate} onChange={e => setReturnShippedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-received-date-${item.id}`}>Watch received</Label>
          <Input id={`return-received-date-${item.id}`} type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-carrier-${item.id}`}>Return carrier</Label>
          <Input id={`return-carrier-${item.id}`} value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="UPS, DHL…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-tracking-${item.id}`}>Return tracking number</Label>
          <Input id={`return-tracking-${item.id}`} value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-shipping-cost-${item.id}`}>Return shipping cost (€)</Label>
          <Input id={`return-shipping-cost-${item.id}`} type="number" min="0" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-shipping-payer-${item.id}`}>Who paid return shipping?</Label>
          <select id={`return-shipping-payer-${item.id}`} className={`w-full rounded-md border border-slate-300 bg-white px-3 ${inputClass}`} value={shippingPayer} onChange={e => setShippingPayer(e.target.value as InventoryReturn["shippingPayer"])}>
            <option value="seller">I paid</option>
            <option value="buyer">Buyer paid</option>
            <option value="marketplace">Marketplace paid</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-refund-${item.id}`}>Actual refund (€)</Label>
          <Input id={`return-refund-${item.id}`} type="number" min="0" step="0.01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-refund-date-${item.id}`}>Refund date</Label>
          <Input id={`return-refund-date-${item.id}`} type="date" value={refundDate} onChange={e => setRefundDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-condition-${item.id}`}>Condition on return</Label>
          <Input id={`return-condition-${item.id}`} value={inspectionCondition} onChange={e => setInspectionCondition(e.target.value)} placeholder="Condition after inspection" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`return-inspection-cost-${item.id}`}>Inspection / repair cost (€)</Label>
          <Input id={`return-inspection-cost-${item.id}`} type="number" min="0" step="0.01" value={inspectionCost} onChange={e => setInspectionCost(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`return-next-action-${item.id}`}>What happens next?</Label>
          <select id={`return-next-action-${item.id}`} className={`w-full rounded-md border border-slate-300 bg-white px-3 ${inputClass}`} value={nextAction} onChange={e => setNextAction(e.target.value as InventoryReturn["nextAction"])}>
            {Object.entries(returnNextActionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`return-missing-${item.id}`}>Missing items or accessories</Label>
          <Textarea id={`return-missing-${item.id}`} value={missingItems} onChange={e => setMissingItems(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`return-notes-${item.id}`}>Inspection notes</Label>
          <Textarea id={`return-notes-${item.id}`} value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} rows={3} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={platformFeeRefunded} onChange={e => setPlatformFeeRefunded(e.target.checked)} className="h-4 w-4 accent-emerald-700" />
          Platform fee refunded
          {item.status === "completed" && /chrono\s*24/i.test(sale.soldPlatform ?? "") && (
            <span className="text-xs text-slate-500">— automatically recorded on completed Chrono24 returns</span>
          )}
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save return details"}</Button>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const { data: sales = [], isLoading, isError, error } = useSales();
  const [filter, setFilter] = useState<Filter>(() => {
    if (typeof window === "undefined") return "open";
    return new URLSearchParams(window.location.search).has("returnId") ? "all" : "open";
  });
  const [search, setSearch] = useState("");
  const [editingReturnId, setEditingReturnId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const id = Number(new URLSearchParams(window.location.search).get("returnId"));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  });

  const allReturns = useMemo(() => sales.flatMap(sale =>
    sale.returns.map(record => ({ sale, record })),
  ), [sales]);
  const openCount = allReturns.filter(({ record }) =>
    !["completed", "cancelled", "declined"].includes(record.status),
  ).length;
  const receivedCount = allReturns.filter(({ record }) => Boolean(record.receivedDate)).length;
  const completedCount = allReturns.filter(({ record }) => record.status === "completed").length;

  function downloadReturnReport() {
    const blob = new Blob([`\uFEFF${buildReturnReconciliationCsv(sales)}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wristby-return-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const filtered = allReturns.filter(({ sale, record }) => {
    const matchesFilter = filter === "all"
      || (filter === "open" && !["completed", "cancelled", "declined"].includes(record.status))
      || (filter === "received" && Boolean(record.receivedDate))
      || (filter === "completed" && record.status === "completed");
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      sale.brandSnapshot, sale.modelSnapshot, sale.referenceNumberSnapshot, sale.serialNumberSnapshot,
      sale.soldTo, record.carrier, record.trackingNumber, record.reason,
    ].some(value => value?.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => b.record.requestDate.localeCompare(a.record.requestDate));

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-800">After-sale tracking</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900">
            <RotateCcw className="h-7 w-7 text-emerald-700" /> Returns
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Keep the original sale record and track each return, refund, shipment, and inspection separately.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadReturnReport} disabled={isLoading || isError}>
            <Download className="mr-2 h-4 w-4" /> Download return report
          </Button>
          <Link href="/inventory" className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto">
            <Watch className="h-4 w-4" /> Inventory <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Return summary">
        <SummaryCard label="Open return cases" value={openCount} icon={RotateCcw} tone="bg-amber-50 text-amber-700" />
        <SummaryCard label="Received for inspection" value={receivedCount} icon={PackageCheck} tone="bg-sky-50 text-sky-700" />
        <SummaryCard label="Completed returns" value={completedCount} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Return cases</h2>
            <p className="mt-1 text-sm text-slate-500">The return rate counts a sale only after its watch is physically received.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 sm:w-64" placeholder="Search watch or tracking" aria-label="Search return cases" />
            </label>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={filter} onChange={e => setFilter(e.target.value as Filter)} aria-label="Filter return cases">
              <option value="open">Open cases</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="all">All returns</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">Loading return history…</div>
        ) : isError ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error instanceof Error ? error.message : "Could not load return history."}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Box className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-800">{allReturns.length ? "No matching return cases" : "No returns logged yet"}</p>
            <p className="mt-1 text-sm text-slate-500">Open a sold watch and choose “Log return” when a buyer requests one.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filtered.map(({ sale, record }) => {
              const adjustment = getReturnAdjustmentCents(sale, [record]);
              const net = getSaleCycleNetProfitCents({ ...sale, returns: [record] });
              return (
                <article id={`return-${record.id}`} key={record.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(record.status)}`}>
                          {returnStatusLabels[record.status]}
                        </span>
                        <span className="text-xs text-slate-500">Sale cycle {sale.cycleNumber}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {sale.brandSnapshot} {sale.modelSnapshot}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Ref. {sale.referenceNumberSnapshot}
                        {sale.serialNumberSnapshot && <> · Serial {sale.serialNumberSnapshot}</>}
                        {sale.soldTo && <> · Buyer {sale.soldTo}</>}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span><CalendarClock className="mr-1 inline h-4 w-4 text-slate-400" />Requested {dateLabel(record.requestDate)}</span>
                        <span><Truck className="mr-1 inline h-4 w-4 text-slate-400" />{record.carrier || "Carrier not set"}{record.trackingNumber ? ` · ${record.trackingNumber}` : ""}</span>
                        <span><CircleDollarSign className="mr-1 inline h-4 w-4 text-slate-400" />Refund {money(record.refundAmountCents)}</span>
                      </div>
                      {record.reason && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{record.reason}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {sale.inventoryId != null && (
                        <Link href={`/inventory/${sale.inventoryId}`} className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          Watch details
                        </Link>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingReturnId(editingReturnId === record.id ? null : record.id)}>
                        {editingReturnId === record.id ? "Close editor" : "Update return"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
                    <div><p className="text-xs text-slate-500">Profit when sold</p><p className="mt-1 font-semibold text-slate-800">{money(sale.profitAtSaleCents)}</p></div>
                    <div><p className="text-xs text-slate-500">Return adjustment</p><p className={`mt-1 font-semibold ${adjustment < 0 ? "text-red-700" : "text-emerald-700"}`}>{adjustment > 0 ? "+" : ""}{money(adjustment)}</p></div>
                    <div><p className="text-xs text-slate-500">Net after return</p><p className={`mt-1 font-semibold ${net < 0 ? "text-red-700" : "text-emerald-700"}`}>{money(net)}</p></div>
                  </div>
                  {record.receivedDate && (
                    <p className="mt-3 text-xs text-slate-500">
                      Received {dateLabel(record.receivedDate)} · {returnNextActionLabels[record.nextAction]}
                      {record.missingItems ? ` · Missing: ${record.missingItems}` : ""}
                    </p>
                  )}
                  {editingReturnId === record.id && <ReturnEditor item={record} sale={sale} />}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
