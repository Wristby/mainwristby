import type { InventoryItem } from "./types";
import type { ReactNode } from "react";
import { calculateCogsMarginTargetPrice, COGS_MARGIN_TARGETS } from "./margin-presets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type DealOverviewCardProps = {
  item: InventoryItem;
  salePrice: number;
  profit: number;
  margin: number;
  totalFees: number;
  netAfterVat: number;
  vatAmount: number;
  effectiveRegisterFee: number;
  chrono24Commission: number;
  formatCurrency: (cents: number) => string;
  buyerDelivery?: ReactNode;
  children?: ReactNode;
};

export function DealOverviewCard({
  item,
  salePrice,
  profit,
  margin,
  totalFees,
  netAfterVat,
  vatAmount,
  effectiveRegisterFee,
  chrono24Commission,
  formatCurrency,
  buyerDelivery,
  children,
}: DealOverviewCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Deal Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">COGS</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(item.purchasePrice)}</p>
          </div>
          {item.listPrice != null && item.listPrice > 0 && (
            <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
              <p className="text-xs font-medium text-violet-500 uppercase tracking-wider mb-1">Price Listed At</p>
              <p className="text-xl font-bold text-violet-700">{formatCurrency(item.listPrice)}</p>
            </div>
          )}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Sale Price</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(salePrice)}</p>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Net Profit</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(profit)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Margin</p>
            <p className="text-xl font-bold text-emerald-600">{margin.toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Fees</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalFees)}</p>
          </div>
          <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
            <p className="text-xs font-medium text-violet-500 uppercase tracking-wider mb-1">Net After VAT</p>
            <p className={`text-xl font-bold ${netAfterVat >= 0 ? "text-violet-700" : "text-red-600"}`}>
              {formatCurrency(netAfterVat)}
            </p>
          </div>
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">VAT Amount</p>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(vatAmount)}</p>
          </div>
        </div>

        <section
          className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4"
          aria-labelledby="cogs-margin-presets-title"
          data-testid="cogs-margin-presets"
        >
          <div className="mb-3">
            <h3 id="cogs-margin-presets-title" className="text-sm font-semibold text-slate-800">Target Sale Price by Margin</h3>
            <p className="mt-1 text-xs text-slate-500">
              Based on COGS and includes a {chrono24Commission.toFixed(1)}% Chrono24 fee; other fees and expenses are excluded.
            </p>
          </div>
          {item.purchasePrice > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {COGS_MARGIN_TARGETS.map((targetMargin) => {
                const targetPrice = calculateCogsMarginTargetPrice(item.purchasePrice, targetMargin, chrono24Commission);
                return (
                  <div key={targetMargin} className="rounded-lg border border-white bg-white/80 px-3 py-3" data-testid={`cogs-margin-target-${targetMargin}`}>
                    <p className="text-xs font-medium text-slate-500">{targetMargin}% margin</p>
                    <p className="mt-1 text-lg font-bold text-emerald-700">
                      {targetPrice === null ? "—" : formatCurrency(targetPrice)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Add a COGS amount to see target prices.</p>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">The Investment</h4>
            <p className="text-xs text-slate-400 mb-4">Procurement costs to acquire the watch</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Purchase Price</span><span className="font-medium">{formatCurrency(item.purchasePrice)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Import/Customs Fee</span><span className="font-medium">{formatCurrency((item as any).importFee || 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Watch Register</span><span className="font-medium">{formatCurrency((item as any).watchRegister ? effectiveRegisterFee : 0)}</span></div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-700">Total Sourcing</span>
                <span className="text-slate-900">{formatCurrency(item.purchasePrice + ((item as any).importFee || 0) + ((item as any).watchRegister ? effectiveRegisterFee : 0))}</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50/30 rounded-xl border border-amber-100/50">
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-4">Value-Add</h4>
            <p className="text-xs text-slate-400 mb-4">Costs to make the watch retail-ready</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Service Fee</span><span className="font-medium">{formatCurrency((item as any).serviceFee || 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Polish Fee</span><span className="font-medium">{formatCurrency((item as any).polishFee || 0)}</span></div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-amber-700">Total Value-Add</span>
                <span className="text-amber-900">{formatCurrency(((item as any).serviceFee || 0) + ((item as any).polishFee || 0))}</span>
              </div>
            </div>
          </div>

          {item.status === "sold" && (
            <div className="p-5 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">The Transaction</h4>
              <p className="text-xs text-slate-400 mb-4">Exit details and final outcome</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Sale Price</span><span className="font-medium text-emerald-600">{formatCurrency(salePrice)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Platform Fees</span><span className="font-medium text-red-500">-{formatCurrency((item as any).platformFees || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Shipping Fee</span><span className="font-medium text-red-500">-{formatCurrency((item as any).shippingFee || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Insurance Fee</span><span className="font-medium text-red-500">-{formatCurrency((item as any).insuranceFee || 0)}</span></div>
                <Separator className="my-3" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-emerald-700">Net Profit</span>
                  <span className={profit >= 0 ? "text-emerald-600" : "text-red-600"}>{formatCurrency(profit)}</span>
                </div>
              </div>
            </div>
          )}
          {item.status === "sold" && buyerDelivery}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
