import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, TrendingUp, Percent, Wallet } from "lucide-react";
import { useSettings, type QuickEstimatePlatformFee } from "@/hooks/use-settings";
import { calculateWatchFinancials, calculateSaleFeeCents } from "@shared/watch-financials";

type QuickEstimateProps = {
  /** Optional saved COGS value in cents, used to prefill the estimate's Buy Price. */
  initialBuyPriceCents?: number;
};

type QuickEstimateCalculationInput = {
  buyPrice: number;
  serviceCost: number;
  salePrice: number;
  shipping: number;
  selectedPlatform: QuickEstimatePlatformFee | null;
  watchRegister: boolean;
  watchRegisterFeeCents: number;
  vatRate: number;
};

export function calculateQuickEstimate({
  buyPrice,
  serviceCost,
  salePrice,
  shipping,
  selectedPlatform,
  watchRegister,
  watchRegisterFeeCents,
  vatRate,
}: QuickEstimateCalculationInput) {
  const salePriceCents = Math.round(salePrice * 100);
  let platformFeeCents = 0;
  if (selectedPlatform) {
    platformFeeCents = selectedPlatform.type === "percentage"
      ? calculateSaleFeeCents(salePriceCents, selectedPlatform.amount)
      : Math.round(selectedPlatform.amount);
  }

  const financials = calculateWatchFinancials({
    purchasePrice: Math.round(buyPrice * 100),
    serviceFee: Math.round(serviceCost * 100),
    shippingFee: Math.round(shipping * 100),
    platformFees: platformFeeCents,
    watchRegister,
    watchRegisterFeeSnapshot: watchRegisterFeeCents,
  }, salePriceCents, vatRate);

  return {
    profitBeforeVat: financials.profitCents / 100,
    vatAmount: financials.vatAmountCents / 100,
    netAfterVat: financials.netAfterVatCents / 100,
    margin: financials.marginPercent,
    roi: financials.roiPercent,
    platformFee: platformFeeCents / 100,
  };
}

export function QuickEstimate({ initialBuyPriceCents }: QuickEstimateProps) {
  const { settings } = useSettings();
  const [buyPrice, setBuyPrice] = useState<string>(() =>
    initialBuyPriceCents !== undefined && Number.isFinite(initialBuyPriceCents)
      ? (initialBuyPriceCents / 100).toFixed(2)
      : ""
  );
  const [serviceCost, setServiceCost] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [platformId, setPlatformId] = useState<string>("none");
  const [watchRegister, setWatchRegister] = useState(false);
  const [shipping, setShipping] = useState<string>("");

  useEffect(() => {
    if (initialBuyPriceCents !== undefined && Number.isFinite(initialBuyPriceCents)) {
      setBuyPrice((initialBuyPriceCents / 100).toFixed(2));
    }
  }, [initialBuyPriceCents]);

  const platformFees: QuickEstimatePlatformFee[] = settings.quick_estimate_platform_fees;

  const selectedPlatform = platformFees.find((p) => p.id === platformId) ?? null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatPlatformFeeLabel = (fee: QuickEstimatePlatformFee) => {
    if (fee.type === "percentage") {
      return `${fee.label} (${fee.amount}%)`;
    }
    return `${fee.label} (€${(fee.amount / 100).toLocaleString("de-DE")})`;
  };

  const calculate = useMemo(() => {
    const buy = parseFloat(buyPrice || "0");
    const service = parseFloat(serviceCost || "0");
    const sale = parseFloat(salePrice || "0");
    const ship = parseFloat(shipping || "0");
    return calculateQuickEstimate({
      buyPrice: buy,
      serviceCost: service,
      salePrice: sale,
      shipping: ship,
      selectedPlatform,
      watchRegister,
      watchRegisterFeeCents: settings.watch_register_fee,
      vatRate: settings.vat_rate,
    });
  }, [buyPrice, serviceCost, salePrice, platformId, watchRegister, shipping, selectedPlatform, settings.watch_register_fee, settings.vat_rate]);

  const platformFeeLabel = selectedPlatform
    ? selectedPlatform.type === "percentage"
      ? `${selectedPlatform.label} Fee (${selectedPlatform.amount}%)`
      : `${selectedPlatform.label} Fee (flat)`
    : "Platform Fee";

  return (
    <Card className="bg-white border-slate-200 text-slate-900 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          Quick Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Basis</p>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Buy Price</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">€</span>
                <Input
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="h-7 pl-5 text-right bg-white border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Service Cost</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">€</span>
                <Input
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  className="h-7 pl-5 text-right bg-white border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Shipping Cost</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">€</span>
                <Input
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="h-7 pl-5 text-right bg-white border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 mt-1">
              <span className="text-sm font-medium text-slate-700">Sale Price</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">€</span>
                <Input
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="h-7 pl-5 text-right bg-white border-slate-200 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/50 mt-1">
              <Checkbox
                id="wr"
                checked={watchRegister}
                onCheckedChange={(checked) => setWatchRegister(!!checked)}
                className="h-4 w-4 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <Label htmlFor="wr" className="text-xs text-slate-600 cursor-pointer">
                Watch Register Fee (€{(settings.watch_register_fee / 100).toLocaleString("de-DE")})
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Platform Fee</Label>
            <Select value={platformId} onValueChange={setPlatformId}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="none">None (Direct Sale)</SelectItem>
                {platformFees.map((fee) => (
                  <SelectItem key={fee.id} value={fee.id}>
                    {formatPlatformFeeLabel(fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-3 mt-4 border border-slate-100">
          {selectedPlatform && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-slate-600">{platformFeeLabel}</span>
              </div>
              <span className="text-lg font-bold text-red-500 tabular-nums">
                -{formatCurrency(calculate.platformFee)}
              </span>
            </div>
          )}
          <div className={selectedPlatform ? "flex justify-between items-center border-t border-slate-200 pt-2" : "flex justify-between items-center"}>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-600">Profit Before VAT</span>
            </div>
            <span data-testid="estimate-profit-before-vat" className="text-lg font-bold text-emerald-600 tabular-nums">
              {formatCurrency(calculate.profitBeforeVat)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-600">Estimated VAT ({settings.vat_rate}%)</span>
            </div>
            <span data-testid="estimate-vat" className="text-lg font-bold text-amber-700 tabular-nums">
              {formatCurrency(calculate.vatAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-medium text-slate-600">Net After VAT</span>
            </div>
            <span data-testid="estimate-net-after-vat" className="text-lg font-bold text-emerald-700 tabular-nums">
              {formatCurrency(calculate.netAfterVat)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-600">ROI Before VAT</span>
            </div>
            <span className="text-lg font-bold text-emerald-600 tabular-nums">
              {calculate.roi.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-600">Margin Before VAT</span>
            </div>
            <span className="text-lg font-bold text-emerald-600 tabular-nums">
              {calculate.margin.toFixed(1)}%
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
