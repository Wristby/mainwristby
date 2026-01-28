import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  Receipt, 
  Percent, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Trophy, 
  TrendingDown,
  BarChart3,
  Watch,
  Package
} from "lucide-react";
import { differenceInDays } from "date-fns";
import type { InventoryItem, Expense } from "@shared/schema";

export default function Analytics() {
  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const isLoading = inventoryLoading;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-slate-800" />
        <div className="grid gap-4 grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  const soldItems = inventory?.filter((i) => i.status === "sold") || [];
  const activeItems = inventory?.filter((i) => i.status !== "sold") || [];
  const today = new Date();

  // Overall Performance Metrics
  const totalRevenue = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);
  const totalCOGS = soldItems.reduce((sum, item) => sum + item.purchasePrice, 0);
  const totalNetIncome = totalRevenue - totalCOGS;
  const totalFees = 0; // Would need expense tracking per item
  const averageMargin = totalRevenue > 0 ? ((totalNetIncome / totalRevenue) * 100) : 0;

  // Per-Watch Metrics
  const profits = soldItems.map((item) => ({
    ...item,
    profit: (item.soldPrice || 0) - item.purchasePrice,
    roi: item.purchasePrice > 0 ? (((item.soldPrice || 0) - item.purchasePrice) / item.purchasePrice) * 100 : 0,
    daysOnMarket: item.soldDate && item.purchaseDate
      ? differenceInDays(new Date(item.soldDate), new Date(item.purchaseDate))
      : 0,
  }));

  const avgProfitPerWatch = soldItems.length > 0
    ? profits.reduce((sum, p) => sum + p.profit, 0) / soldItems.length
    : 0;

  const sortedByProfit = [...profits].sort((a, b) => b.profit - a.profit);
  const highestProfit = sortedByProfit[0];
  const lowestProfit = sortedByProfit[sortedByProfit.length - 1];

  const avgROI = soldItems.length > 0
    ? profits.reduce((sum, p) => sum + p.roi, 0) / soldItems.length
    : 0;

  const avgDaysOnMarket = soldItems.length > 0
    ? profits.reduce((sum, p) => sum + p.daysOnMarket, 0) / soldItems.length
    : 0;

  // All watches hold time
  const allWatchesWithHoldTime = (inventory || []).map((item) => ({
    ...item,
    holdDays: differenceInDays(
      item.soldDate ? new Date(item.soldDate) : today,
      new Date(item.purchaseDate)
    ),
  }));
  const avgHoldTime = allWatchesWithHoldTime.length > 0
    ? allWatchesWithHoldTime.reduce((sum, w) => sum + w.holdDays, 0) / allWatchesWithHoldTime.length
    : 0;

  // Brand stats
  const brandStats: Record<string, { sold: number; revenue: number; profit: number }> = {};
  soldItems.forEach((item) => {
    if (!brandStats[item.brand]) {
      brandStats[item.brand] = { sold: 0, revenue: 0, profit: 0 };
    }
    brandStats[item.brand].sold += 1;
    brandStats[item.brand].revenue += item.soldPrice || 0;
    brandStats[item.brand].profit += (item.soldPrice || 0) - item.purchasePrice;
  });

  const brandList = Object.entries(brandStats)
    .map(([brand, stats]) => ({
      brand,
      ...stats,
      avgPerWatch: stats.sold > 0 ? stats.profit / stats.sold : 0,
    }))
    .sort((a, b) => b.sold - a.sold);

  const mostPopularBrand = brandList[0];

  // Current inventory COGS
  const currentCOGS = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);

  // Top performers and underperformers
  const topPerformers = [...profits].sort((a, b) => b.profit - a.profit).slice(0, 3);
  const underperformers = [...profits].sort((a, b) => a.profit - b.profit).slice(0, 3);

  // Hold time analysis
  const quickMovers = profits.filter((p) => p.daysOnMarket < 15);
  const averageMovers = profits.filter((p) => p.daysOnMarket >= 15 && p.daysOnMarket <= 30);
  const slowMovers = profits.filter((p) => p.daysOnMarket > 30);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>

      {/* Overall Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">Overall Performance</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <MetricCard
            label="TOTAL REVENUE"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            color="emerald"
          />
          <MetricCard
            label="TOTAL FEES"
            value={formatCurrency(totalFees)}
            icon={Receipt}
            color="amber"
          />
          <MetricCard
            label="AVERAGE MARGIN"
            value={`${averageMargin.toFixed(2)}%`}
            icon={Percent}
            color="slate"
          />
          <MetricCard
            label="TOTAL COGS"
            value={formatCurrency(totalCOGS)}
            icon={ShoppingCart}
            color="orange"
          />
          <MetricCard
            label="TOTAL NET INCOME"
            value={formatCurrency(totalNetIncome)}
            icon={TrendingUp}
            color="emerald"
          />
        </div>
      </div>

      {/* Per-Watch Metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">Per-Watch Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Average Profit Per Watch</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {formatCurrency(avgProfitPerWatch)}
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-full">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Highest Profit</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {highestProfit ? formatCurrency(highestProfit.profit) : "$0"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {highestProfit ? `${highestProfit.brand} ${highestProfit.model}` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Lowest Profit</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1 tabular-nums">
                    {lowestProfit ? formatCurrency(lowestProfit.profit) : "$0"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lowestProfit ? `${lowestProfit.brand} ${lowestProfit.model}` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <TrendingDown className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Average ROI</p>
                  <p className="text-3xl font-bold text-amber-400 mt-1 tabular-nums">
                    {avgROI.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-amber-500/20 rounded-full">
                  <Percent className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Days on Market (Sold)</p>
                  <p className="text-3xl font-bold text-blue-400 mt-1 tabular-nums">
                    {Math.round(avgDaysOnMarket)} days
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Average Hold Time</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-1 tabular-nums">
                    {Math.round(avgHoldTime)} days
                  </p>
                  <p className="text-xs text-slate-500 mt-1">All watches</p>
                </div>
                <div className="p-2 bg-cyan-500/20 rounded-full">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Gross Income</p>
                  <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                    {soldItems.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Watches sold</p>
                </div>
                <div className="p-2 bg-slate-700 rounded-full">
                  <Watch className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Most Popular Brand</p>
                  <p className="text-3xl font-bold text-pink-400 mt-1">
                    {mostPopularBrand?.brand || "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {mostPopularBrand ? `${mostPopularBrand.sold} sold` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-pink-500/20 rounded-full">
                  <Trophy className="h-5 w-5 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Current COGS of Inventory</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {formatCurrency(currentCOGS)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{activeItems.length} active watches</p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-full">
                  <Package className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Performers and Underperformers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Trophy className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-white text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-slate-500 text-sm">No sold watches yet.</p>
            ) : (
              topPerformers.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-slate-500">{item.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold tabular-nums">
                      +{formatCurrency(item.profit)}
                    </p>
                    <p className="text-xs text-slate-500">{item.roi.toFixed(1)}% ROI</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <TrendingDown className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-white text-lg">Underperformers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {underperformers.length === 0 ? (
              <p className="text-slate-500 text-sm">No sold watches yet.</p>
            ) : (
              underperformers.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-slate-500">{item.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${item.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {item.profit >= 0 ? "+" : ""}{formatCurrency(item.profit)}
                    </p>
                    <p className="text-xs text-slate-500">{item.roi.toFixed(1)}% ROI</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Brand Performance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          <CardTitle className="text-white text-lg">Brand Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {brandList.length === 0 ? (
            <p className="text-slate-500 text-sm">No sold watches yet.</p>
          ) : (
            <div className="space-y-4">
              {brandList.map((brand) => (
                <div
                  key={brand.brand}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{brand.brand}</span>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {brand.sold}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Revenue</p>
                      <p className="text-white font-medium tabular-nums">{formatCurrency(brand.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Profit</p>
                      <p className="text-emerald-400 font-medium tabular-nums">{formatCurrency(brand.profit)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg/Watch</p>
                      <p className="text-emerald-400 font-medium tabular-nums">{formatCurrency(brand.avgPerWatch)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hold Time Analysis */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Clock className="h-5 w-5 text-slate-400" />
          <CardTitle className="text-white text-lg">Hold Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-emerald-400 mb-3">Quick Movers (&lt; 15 days)</h3>
              {quickMovers.length === 0 ? (
                <p className="text-slate-500 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {quickMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-sm text-white">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-400 tabular-nums">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-amber-400 mb-3">Average (15-30 days)</h3>
              {averageMovers.length === 0 ? (
                <p className="text-slate-500 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {averageMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-sm text-white">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-400 tabular-nums">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-red-400 mb-3">Slow Movers (&gt; 30 days)</h3>
              {slowMovers.length === 0 ? (
                <p className="text-slate-500 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {slowMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-sm text-white">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-400 tabular-nums">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: "emerald" | "amber" | "orange" | "slate";
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    orange: "bg-orange-500/20 text-orange-400",
    slate: "bg-slate-700 text-slate-400",
  };

  const valueColors = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    orange: "text-orange-400",
    slate: "text-white",
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
