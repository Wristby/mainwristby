import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, TrendingUp, Percent, Wallet } from "lucide-react";

export function QuickEstimate() {
  const [buyPrice, setBuyPrice] = useState<string>("");
  const [serviceCost, setServiceCost] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [platform, setPlatform] = useState<string>("none");
  const [watchRegister, setWatchRegister] = useState(false);
  const [shipping, setShipping] = useState<string>("");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(val);
  };

  const calculate = useMemo(() => {
    const buy = parseFloat(buyPrice || "0");
    const service = parseFloat(serviceCost || "0");
    const sale = parseFloat(salePrice || "0");
    const ship = parseFloat(shipping || "0");
    
    let platformFee = 0;
    if (platform === "chrono24") {
      platformFee = sale * 0.065;
    }

    const wrFee = watchRegister ? 6 : 0;
    
    const totalCost = buy + service + platformFee + ship + wrFee;
    const netProfit = sale > 0 ? sale - totalCost : 0;
    const margin = sale > 0 ? (netProfit / sale) * 100 : 0;
    const roi = buy > 0 ? (netProfit / buy) * 100 : 0;

    return {
      netProfit,
      margin,
      roi
    };
  }, [buyPrice, serviceCost, salePrice, platform, watchRegister, shipping]);

  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          Quick Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="bg-slate-800/50 p-3 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Basis</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Buy Price</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-500">€</span>
                <Input 
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="h-7 pl-5 text-right bg-slate-800 border-slate-700 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Service Cost</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1.5 text-xs text-slate-500">€</span>
                <Input 
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  className="h-7 pl-5 text-right bg-slate-800 border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-400 uppercase">Trial Sale Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">€</span>
              <Input 
                placeholder="Enter sale price"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="pl-7 bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-400 uppercase">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="none">Choose an option...</SelectItem>
                <SelectItem value="chrono24">Chrono24 (6.5%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-400 uppercase">Shipping Estimate</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">€</span>
              <Input 
                placeholder="Optional"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="pl-7 bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox 
              id="wr" 
              checked={watchRegister} 
              onCheckedChange={(checked) => setWatchRegister(!!checked)}
              className="border-slate-600 data-[state=checked]:bg-emerald-500"
            />
            <Label htmlFor="wr" className="text-sm text-slate-300 cursor-pointer">Watch Register Fee (€6)</Label>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Net Profit</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">
              {formatCurrency(calculate.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">ROI</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">
              {calculate.roi.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Margin</span>
            </div>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">
              {calculate.margin.toFixed(1)}%
            </span>
          </div>
        </div>

        <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold h-12 rounded-xl mt-2">
          Calculate Estimate
        </Button>
      </CardContent>
    </Card>
  );
}
