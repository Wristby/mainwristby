import { Link } from "wouter";
import { ArrowUpRight, CircleDollarSign, RotateCcw, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReturnCaseDialog } from "@/components/return-case-dialog";
import { useWatchSales, returnStatusLabels } from "@/hooks/use-sales";
import { getReturnAdjustmentCents, getSaleCycleNetProfitCents } from "@shared/sales-lifecycle";
import type { InventoryItem } from "@shared/schema";
import { formatDeliveryDate } from "@shared/delivery";

const formatMoney = (cents: number) => new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
}).format(cents / 100);

function formatDate(value: Date | string | null) {
  if (!value) return "Not recorded";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : formatDeliveryDate(date.toISOString().slice(0, 10));
}

export function SalesHistoryCard({ item }: { item: InventoryItem }) {
  const { data: sales = [], isLoading, isError } = useWatchSales(item.id);
  if (!isLoading && !isError && sales.length === 0) return null;
  const latestSale = sales.reduce<typeof sales[number] | null>((latest, sale) =>
    !latest || sale.cycleNumber > latest.cycleNumber ? sale : latest, null);

  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-sales-history">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <RotateCcw className="h-4 w-4 text-emerald-700" /> Sales & returns
          </CardTitle>
          <Link href="/returns" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline">
            Returns <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading sale history…</p>
        ) : isError ? (
          <p className="text-sm text-red-700">Could not load sale history.</p>
        ) : (
          <div className="space-y-4">
            {sales.slice().sort((a, b) => a.cycleNumber - b.cycleNumber).map((sale) => {
              const adjustment = getReturnAdjustmentCents(sale, sale.returns);
              const net = getSaleCycleNetProfitCents(sale);
              const hasActiveReturn = sale.returns.some(record => !["cancelled", "declined"].includes(record.status));
              const returns = sale.returns.slice().sort((a, b) => a.requestDate.localeCompare(b.requestDate));
              return (
                <section key={sale.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sale cycle {sale.cycleNumber}</p>
                      <p className="mt-1 text-sm text-slate-700">{formatDate(sale.soldDate)}</p>
                    </div>
                    {latestSale?.id === sale.id && item.status === "sold" && !hasActiveReturn && (
                      <ReturnCaseDialog sale={sale} />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Sale price</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{formatMoney(sale.salePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Profit when sold</p>
                      <p className={`mt-0.5 font-semibold ${sale.profitAtSaleCents < 0 ? "text-red-700" : "text-emerald-800"}`}>
                        {formatMoney(sale.profitAtSaleCents)}
                      </p>
                    </div>
                  </div>
                  {sale.soldTo && <p className="mt-2 text-xs text-slate-600">Buyer: {sale.soldTo}</p>}
                  {returns.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {returns.map(record => (
                        <div key={record.id} className="rounded-md bg-white p-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{returnStatusLabels[record.status]}</span>
                            <span className="text-slate-500">Requested {formatDate(record.requestDate)}</span>
                          </div>
                          {record.receivedDate && <p className="mt-1 text-slate-600">Watch received {formatDate(record.receivedDate)}</p>}
                          {record.refundAmountCents > 0 && <p className="mt-1 text-slate-600">Refund: {formatMoney(record.refundAmountCents)}</p>}
                          {record.reason && <p className="mt-1 whitespace-pre-wrap text-slate-600">{record.reason}</p>}
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <p className="text-slate-500"><CircleDollarSign className="mr-1 inline h-3.5 w-3.5" />Return adjustment <strong className={adjustment < 0 ? "text-red-700" : "text-emerald-700"}>{adjustment > 0 ? "+" : ""}{formatMoney(adjustment)}</strong></p>
                        <p className="text-slate-500"><Wallet className="mr-1 inline h-3.5 w-3.5" />Net outcome <strong className={net < 0 ? "text-red-700" : "text-emerald-700"}>{formatMoney(net)}</strong></p>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
        {sales.length > 1 && <p className="mt-3 text-xs text-slate-500">Each resale is recorded as a new sale cycle. The watch’s purchase cost stays unchanged.</p>}
      </CardContent>
    </Card>
  );
}
