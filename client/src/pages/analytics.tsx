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
  Package,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { differenceInDays, getMonth, getYear, getDaysInMonth, startOfYear, endOfYear } from "date-fns";
import type { InventoryItem } from "@shared/schema";

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

export default function Analytics() {
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [compareMode, setCompareMode] = useState(false);
  const [compareMonthFilter, setCompareMonthFilter] = useState<string>("all");
  const [compareYearFilter, setCompareYearFilter] = useState<string>("all");

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const isLoading = inventoryLoading;

  const years = useMemo(() => {
    if (!inventory) return [];
    const dates = inventory
      .map(i => i.soldDate ? new Date(i.soldDate) : i.purchaseDate ? new Date(i.purchaseDate) : null)
      .filter((d): d is Date => d !== null);
    const uniqueYears = Array.from(new Set(dates.map(d => getYear(d))));
    return uniqueYears.sort((a, b) => b - a);
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => {
      // ONLY filter sold items by the selected period for metrics like revenue/profit
      // Active items shouldn't necessarily be filtered by date if we want a snapshot,
      // but if the user is filtering by "January 2024", they usually want to see 
      // performance FOR that period.
      
      const date = item.status === 'sold' && (item.soldDate || item.dateSold)
        ? new Date(item.soldDate || item.dateSold!) 
        : item.purchaseDate 
          ? new Date(item.purchaseDate) 
          : null;
      
      if (!date) return true;

      const matchesMonth = monthFilter === "all" || getMonth(date).toString() === monthFilter;
      const matchesYear = yearFilter === "all" || getYear(date).toString() === yearFilter;
      
      return matchesMonth && matchesYear;
    });
  }, [inventory, monthFilter, yearFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(val / 100);
  };

  // Helper to calculate total fees for an item
  const getItemFees = (item: InventoryItem) => {
    return (item.serviceFee || 0) + 
           (item.polishFee || 0) + 
           (item.platformFees || 0) + 
           (item.shippingFee || 0) + 
           (item.insuranceFee || 0) +
           (item.watchRegister ? 600 : 0);
  };

  // Calculate metrics (moved before loading check for hook consistency)
  const calculatedMetrics = useMemo(() => {
    const soldItems = filteredInventory.filter((i) => i.status === "sold" && (i.soldDate || i.dateSold));
    const activeItems = filteredInventory.filter((i) => i.status !== "sold");
    const today = new Date();

    const totalRevenue = soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
    const totalCOGS = soldItems.reduce((sum, item) => sum + item.purchasePrice, 0);
    const totalFees = soldItems.reduce((sum, item) => sum + getItemFees(item), 0);
    const totalNetIncome = totalRevenue - totalCOGS - totalFees;
    const averageMargin = totalRevenue > 0 ? ((totalNetIncome / totalRevenue) * 100) : 0;

    const profits = soldItems.map((item) => {
      const revenue = item.salePrice || 0;
      const fees = getItemFees(item);
      const profit = revenue - item.purchasePrice - fees;
      const soldDate = item.soldDate || item.dateSold;
      return {
        ...item,
        profit,
        roi: item.purchasePrice > 0 ? (profit / item.purchasePrice) * 100 : 0,
        daysOnMarket: (soldDate && item.purchaseDate)
          ? differenceInDays(new Date(soldDate), new Date(item.purchaseDate))
          : 0,
      };
    });

    // Capital deployed (COGS of active inventory)
    const capitalDeployed = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);

    return { soldItems, activeItems, today, totalRevenue, totalCOGS, totalFees, totalNetIncome, averageMargin, profits, capitalDeployed };
  }, [filteredInventory]);

  // Comparison period filtered inventory
  const compareFilteredInventory = useMemo(() => {
    if (!inventory || !compareMode) return [];
    return inventory.filter((item) => {
      const date = item.status === 'sold' && (item.soldDate || item.dateSold)
        ? new Date(item.soldDate || item.dateSold!) 
        : item.purchaseDate 
          ? new Date(item.purchaseDate) 
          : null;
      
      if (!date) return true;

      const matchesMonth = compareMonthFilter === "all" || getMonth(date).toString() === compareMonthFilter;
      const matchesYear = compareYearFilter === "all" || getYear(date).toString() === compareYearFilter;
      
      return matchesMonth && matchesYear;
    });
  }, [inventory, compareMode, compareMonthFilter, compareYearFilter]);

  // Comparison metrics calculation
  const compareMetrics = useMemo(() => {
    if (!compareMode) return null;
    
    const soldItems = compareFilteredInventory.filter((i) => i.status === "sold" && (i.soldDate || i.dateSold));
    const activeItems = compareFilteredInventory.filter((i) => i.status !== "sold");
    const today = new Date();

    const totalRevenue = soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
    const totalCOGS = soldItems.reduce((sum, item) => sum + item.purchasePrice, 0);
    const totalFees = soldItems.reduce((sum, item) => sum + getItemFees(item), 0);
    const totalNetIncome = totalRevenue - totalCOGS - totalFees;
    const averageMargin = totalRevenue > 0 ? ((totalNetIncome / totalRevenue) * 100) : 0;
    const capitalDeployed = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);

    // Profit per day for comparison period
    let daysInPeriod = 0;
    let periodLabel = "";
    
    if (compareMonthFilter !== "all" && compareYearFilter !== "all") {
      const selectedMonth = parseInt(compareMonthFilter);
      const selectedYear = parseInt(compareYearFilter);
      daysInPeriod = getDaysInMonth(new Date(selectedYear, selectedMonth));
      const monthName = MONTHS.find(m => m.value === compareMonthFilter)?.label || "";
      periodLabel = `${monthName} ${selectedYear}`;
    } else if (compareMonthFilter !== "all" && compareYearFilter === "all") {
      const selectedMonth = parseInt(compareMonthFilter);
      daysInPeriod = getDaysInMonth(new Date(getYear(today), selectedMonth));
      const monthName = MONTHS.find(m => m.value === compareMonthFilter)?.label || "";
      periodLabel = `${monthName} (All Years)`;
    } else if (compareMonthFilter === "all" && compareYearFilter !== "all") {
      const selectedYear = parseInt(compareYearFilter);
      const start = startOfYear(new Date(selectedYear, 0, 1));
      const end = endOfYear(new Date(selectedYear, 0, 1));
      daysInPeriod = differenceInDays(end, start) + 1;
      periodLabel = compareYearFilter;
    } else {
      if (soldItems.length > 0) {
        const dates = soldItems
          .map(i => new Date(i.soldDate || i.dateSold!).getTime())
          .sort((a, b) => a - b);
        const earliest = new Date(dates[0]);
        daysInPeriod = Math.max(1, differenceInDays(today, earliest) + 1);
      } else {
        daysInPeriod = 365;
      }
      periodLabel = "All Time";
    }
    
    const profitPerDay = daysInPeriod > 0 ? totalNetIncome / daysInPeriod : 0;

    return {
      soldItems,
      activeItems,
      totalRevenue,
      totalCOGS,
      totalFees,
      totalNetIncome,
      averageMargin,
      capitalDeployed,
      profitPerDay,
      daysInPeriod,
      periodLabel,
      watchesSold: soldItems.length
    };
  }, [compareMode, compareFilteredInventory, compareMonthFilter, compareYearFilter]);

  // Profit Per Day Calculation (matching Financials page)
  const profitPerDayData = useMemo(() => {
    const { soldItems, today, totalNetIncome } = calculatedMetrics;
    let daysInPeriod = 0;
    let periodLabel = "";
    
    if (monthFilter !== "all" && yearFilter !== "all") {
      const selectedMonth = parseInt(monthFilter);
      const selectedYear = parseInt(yearFilter);
      daysInPeriod = getDaysInMonth(new Date(selectedYear, selectedMonth));
      const monthName = MONTHS.find(m => m.value === monthFilter)?.label || "";
      periodLabel = `${monthName} ${selectedYear}`;
    } else if (monthFilter !== "all" && yearFilter === "all") {
      const selectedMonth = parseInt(monthFilter);
      daysInPeriod = getDaysInMonth(new Date(getYear(today), selectedMonth));
      const monthName = MONTHS.find(m => m.value === monthFilter)?.label || "";
      periodLabel = `${monthName} (All Years)`;
    } else if (monthFilter === "all" && yearFilter !== "all") {
      const selectedYear = parseInt(yearFilter);
      const start = startOfYear(new Date(selectedYear, 0, 1));
      const end = endOfYear(new Date(selectedYear, 0, 1));
      daysInPeriod = differenceInDays(end, start) + 1;
      periodLabel = yearFilter;
    } else {
      if (soldItems.length > 0) {
        const dates = soldItems
          .map(i => new Date(i.soldDate || i.dateSold!).getTime())
          .sort((a, b) => a - b);
        const earliest = new Date(dates[0]);
        daysInPeriod = Math.max(1, differenceInDays(today, earliest) + 1);
      } else {
        daysInPeriod = 365;
      }
      periodLabel = "All Time";
    }
    
    const profitPerDay = daysInPeriod > 0 ? totalNetIncome / daysInPeriod : 0;
    
    return {
      profitPerDay,
      daysInPeriod,
      periodLabel
    };
  }, [monthFilter, yearFilter, calculatedMetrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-slate-200" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  // Destructure calculated metrics for use in render
  const { soldItems, activeItems, today, totalRevenue, totalCOGS, totalFees, totalNetIncome, averageMargin, profits, capitalDeployed } = calculatedMetrics;

  // Get period label for primary filter
  const getPeriodLabel = (month: string, year: string) => {
    if (month !== "all" && year !== "all") {
      const monthName = MONTHS.find(m => m.value === month)?.label || "";
      return `${monthName} ${year}`;
    } else if (month !== "all") {
      const monthName = MONTHS.find(m => m.value === month)?.label || "";
      return `${monthName} (All Years)`;
    } else if (year !== "all") {
      return year;
    }
    return "All Time";
  };

  const primaryPeriodLabel = getPeriodLabel(monthFilter, yearFilter);
  const comparePeriodLabel = getPeriodLabel(compareMonthFilter, compareYearFilter);

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
  const allWatchesWithHoldTime = (inventory || []).map((item) => {
    const endDate = item.soldDate ? new Date(item.soldDate) : (item.dateSold ? new Date(item.dateSold) : today);
    const startDate = item.purchaseDate ? new Date(item.purchaseDate) : today;
    return {
      ...item,
      holdDays: Math.max(0, differenceInDays(endDate, startDate)),
    };
  });
  const avgHoldTime = allWatchesWithHoldTime.length > 0
    ? allWatchesWithHoldTime.reduce((sum, w) => sum + w.holdDays, 0) / allWatchesWithHoldTime.length
    : 0;

  // Brand stats
  const brandStats: Record<string, { sold: number; revenue: number; profit: number }> = {};
  soldItems.forEach((item) => {
    if (!brandStats[item.brand]) {
      brandStats[item.brand] = { sold: 0, revenue: 0, profit: 0 };
    }
    const revenue = item.salePrice || 0;
    const fees = getItemFees(item);
    const profit = revenue - item.purchasePrice - fees;
    brandStats[item.brand].sold += 1;
    brandStats[item.brand].revenue += revenue;
    brandStats[item.brand].profit += profit;
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
  const averageMovers = profits.filter((p) => p.daysOnMarket >= 15 && p.daysOnMarket <= 45);
  const slowMovers = profits.filter((p) => p.daysOnMarket > 45);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex gap-2 items-center">
              {compareMode && <span className="text-xs text-slate-500 font-medium">Period 1:</span>}
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[130px] bg-white border-slate-200" data-testid="select-month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[100px] bg-white border-slate-200" data-testid="select-year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant={compareMode ? "default" : "outline"} 
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? "bg-emerald-600" : "border-slate-200"}
              data-testid="button-compare-toggle"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
        
        {compareMode && (
          <div className="flex gap-2 items-center justify-end animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xs text-slate-500 font-medium">Period 2:</span>
            <Select value={compareMonthFilter} onValueChange={setCompareMonthFilter}>
              <SelectTrigger className="w-[130px] bg-white border-slate-200" data-testid="select-compare-month">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={compareYearFilter} onValueChange={setCompareYearFilter}>
              <SelectTrigger className="w-[100px] bg-white border-slate-200" data-testid="select-compare-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All Years</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Comparison View */}
      {compareMode && compareMetrics && (
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200" data-testid="card-comparison">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-600" />
              Period Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Metric</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-emerald-600 uppercase">{primaryPeriodLabel}</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-blue-600 uppercase">{comparePeriodLabel}</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow 
                      label="Total Revenue" 
                      value1={totalRevenue} 
                      value2={compareMetrics.totalRevenue} 
                      format="currency" 
                      formatCurrency={formatCurrency}
                    />
                    <ComparisonRow 
                      label="Total Fees" 
                      value1={totalFees} 
                      value2={compareMetrics.totalFees} 
                      format="currency" 
                      formatCurrency={formatCurrency}
                      invertColors
                    />
                    <ComparisonRow 
                      label="Net Income" 
                      value1={totalNetIncome} 
                      value2={compareMetrics.totalNetIncome} 
                      format="currency" 
                      formatCurrency={formatCurrency}
                    />
                    <ComparisonRow 
                      label="Margin %" 
                      value1={averageMargin} 
                      value2={compareMetrics.averageMargin} 
                      format="percent" 
                      formatCurrency={formatCurrency}
                    />
                    <ComparisonRow 
                      label="Watches Sold" 
                      value1={soldItems.length} 
                      value2={compareMetrics.watchesSold} 
                      format="number" 
                      formatCurrency={formatCurrency}
                    />
                    <ComparisonRow 
                      label="Profit Per Day" 
                      value1={profitPerDayData.profitPerDay} 
                      value2={compareMetrics.profitPerDay} 
                      format="currency" 
                      formatCurrency={formatCurrency}
                    />
                    <ComparisonRow 
                      label="Capital Deployed" 
                      value1={capitalDeployed} 
                      value2={compareMetrics.capitalDeployed} 
                      format="currency" 
                      formatCurrency={formatCurrency}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Overall Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-600">Overall Performance</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
            label="TOTAL NET INCOME"
            value={formatCurrency(totalNetIncome)}
            icon={TrendingUp}
            color="emerald"
          />
        </div>
      </div>
      {/* Profit Per Day Card */}
      <Card className="bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-500" data-testid="card-profit-per-day">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-50/90">Profit Per Day</p>
                <p className="text-3xl font-bold text-white tabular-nums">
                  {formatCurrency(profitPerDayData.profitPerDay)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-50/80">{profitPerDayData.periodLabel}</p>
              <p className="text-xs text-emerald-50/60">{profitPerDayData.daysInPeriod} days</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Per-Watch Metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-600">Additional Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Average Profit Per Watch</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">
                    {formatCurrency(avgProfitPerWatch)}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-full">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Highest Profit</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">
                    {highestProfit ? formatCurrency(highestProfit.profit) : "€0"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {highestProfit ? `${highestProfit.brand} ${highestProfit.model}` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Lowest Profit</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1 tabular-nums">
                    {lowestProfit ? formatCurrency(lowestProfit.profit) : "€0"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {lowestProfit ? `${lowestProfit.brand} ${lowestProfit.model}` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-full">
                  <TrendingDown className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Average ROI</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1 tabular-nums">
                    {avgROI.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-full">
                  <Percent className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Days on Market (Sold)</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1 tabular-nums">
                    {Math.round(avgDaysOnMarket)} days
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Average Hold Time</p>
                  <p className="text-3xl font-bold text-cyan-600 mt-1 tabular-nums">
                    {Math.round(avgHoldTime)} days
                  </p>
                  <p className="text-xs text-slate-400 mt-1">All watches</p>
                </div>
                <div className="p-2 bg-cyan-50 rounded-full">
                  <Clock className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">WATCHES SOLD</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                    {soldItems.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Watches sold</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-full">
                  <Watch className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Most Popular Brand</p>
                  <p className="text-3xl font-bold text-pink-600 mt-1">
                    {mostPopularBrand?.brand || "-"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {mostPopularBrand ? `${mostPopularBrand.sold} sold` : "-"}
                  </p>
                </div>
                <div className="p-2 bg-pink-50 rounded-full">
                  <Trophy className="h-5 w-5 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Current COGS of Inventory</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">
                    {formatCurrency(inventory?.filter(i => i.status !== 'sold').reduce((sum, item) => sum + item.purchasePrice, 0) || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{activeItems.length} active watches</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-full">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Top Performers and Underperformers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-slate-900 text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-slate-400 text-sm">No sold watches yet.</p>
            ) : (
              topPerformers.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm border border-amber-100">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-slate-500">{item.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-600 font-semibold tabular-nums">
                      +{formatCurrency(item.profit)}
                    </p>
                    <p className="text-xs text-slate-400">{item.roi.toFixed(1)}% ROI</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <TrendingDown className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-slate-900 text-lg">Underperformers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {underperformers.length === 0 ? (
              <p className="text-slate-400 text-sm">No sold watches yet.</p>
            ) : (
              underperformers.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {item.brand} {item.model}
                      </p>
                      <p className="text-xs text-slate-500">{item.referenceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {item.profit >= 0 ? "+" : ""}{formatCurrency(item.profit)}
                    </p>
                    <p className="text-xs text-slate-400">{item.roi.toFixed(1)}% ROI</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      {/* Brand Performance */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <BarChart3 className="h-5 w-5 text-slate-400" />
          <CardTitle className="text-slate-900 text-lg">Brand Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {brandList.length === 0 ? (
            <p className="text-slate-400 text-sm">No sold watches yet.</p>
          ) : (
            <div className="space-y-4">
              {brandList.map((brand) => (
                <div
                  key={brand.brand}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{brand.brand}</span>
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                        {brand.sold}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Revenue</p>
                      <p className="text-slate-900 font-medium tabular-nums">{formatCurrency(brand.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Profit</p>
                      <p className="text-emerald-600 font-medium tabular-nums">{formatCurrency(brand.profit)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg/Watch</p>
                      <p className="text-emerald-600 font-medium tabular-nums">{formatCurrency(brand.avgPerWatch)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Hold Time Analysis */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Clock className="h-5 w-5 text-slate-400" />
          <CardTitle className="text-slate-900 text-lg">Hold Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-emerald-600 mb-3">Quick Movers (&lt; 15 days)</h3>
              {quickMovers.length === 0 ? (
                <p className="text-slate-400 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {quickMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-sm text-slate-900">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-900 tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-600 tabular-nums">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-amber-600 mb-3">Average (15-45 days)</h3>
              {averageMovers.length === 0 ? (
                <p className="text-slate-400 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {averageMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-sm text-slate-900">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-900 tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-600 tabular-nums">{formatCurrency(item.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-red-600 mb-3">Slow Movers (&gt; 45 days)</h3>
              {slowMovers.length === 0 ? (
                <p className="text-slate-400 text-sm">None</p>
              ) : (
                <div className="space-y-2">
                  {slowMovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-sm text-slate-900">{item.brand}</p>
                        <p className="text-xs text-slate-500">{item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-900 tabular-nums">{item.daysOnMarket} days</p>
                        <p className="text-xs text-emerald-600 tabular-nums">{formatCurrency(item.profit)}</p>
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
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const valueColors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    orange: "text-orange-600",
    slate: "text-slate-900",
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md border ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({ 
  label, 
  value1, 
  value2, 
  format, 
  formatCurrency,
  invertColors = false
}: { 
  label: string; 
  value1: number; 
  value2: number; 
  format: "currency" | "percent" | "number";
  formatCurrency: (val: number) => string;
  invertColors?: boolean;
}) {
  const diff = value1 - value2;
  const rawPercentChange = value2 !== 0 ? ((value1 - value2) / Math.abs(value2)) * 100 : (value1 > 0 ? 100 : 0);
  // For inverted metrics (fees), a negative diff is actually an improvement
  const displayPercentChange = invertColors ? -rawPercentChange : rawPercentChange;
  
  const formatValue = (val: number) => {
    if (format === "currency") return formatCurrency(val);
    if (format === "percent") return `${val.toFixed(2)}%`;
    return val.toString();
  };
  
  const formatDiff = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    if (format === "currency") return `${sign}${formatCurrency(val)}`;
    if (format === "percent") return `${sign}${val.toFixed(2)}%`;
    return `${sign}${val}`;
  };
  
  // For fees, lower is better (invertColors)
  const isPositive = invertColors ? diff < 0 : diff > 0;
  const isNegative = invertColors ? diff > 0 : diff < 0;
  
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-slate-700">{label}</td>
      <td className="py-3 px-4 text-sm font-semibold text-right tabular-nums text-emerald-600">
        {formatValue(value1)}
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-right tabular-nums text-blue-600">
        {formatValue(value2)}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {diff !== 0 && (
            isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )
          )}
          <span className={`text-sm font-medium tabular-nums ${
            isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-slate-500"
          }`}>
            {formatDiff(diff)}
          </span>
        </div>
        <p className={`text-xs tabular-nums ${displayPercentChange >= 0 ? "text-emerald-500" : "text-red-400"}`}>
          {displayPercentChange >= 0 ? "+" : ""}{displayPercentChange.toFixed(1)}% {invertColors ? "saved" : ""}
        </p>
      </td>
    </tr>
  );
}
