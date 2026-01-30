import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Percent, Watch, AlertTriangle, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Link } from "wouter";
import type { InventoryItem, DashboardStats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const isLoading = statsLoading || inventoryLoading;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val / 100);
  };

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  // Calculate aging inventory (held > 45 days, only active items)
  const activeInventory = inventory?.filter(
    (item) => item.status !== "sold"
  ) || [];

  const agingInventory = activeInventory
    .map((item) => ({
      ...item,
      daysHeld: differenceInDays(today, item.purchaseDate ? new Date(item.purchaseDate) : today),
    }))
    .filter((item) => item.daysHeld > 45)
    .sort((a, b) => b.daysHeld - a.daysHeld);

  // Inventory status counts
  const statusCounts = {
    incoming: inventory?.filter((i) => i.status === "incoming").length || 0,
    inService: inventory?.filter((i) => i.status === "servicing").length || 0,
    listed: inventory?.filter((i) => i.status === "in_stock").length || 0,
    sold: inventory?.filter((i) => i.status === "sold").length || 0,
  };

  // Recent additions (last 5 items by purchase date)
  const recentAdditions = [...(inventory || [])]
    .sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Calculate projected profit and ROI
  const projectedProfit = activeInventory.reduce(
    (sum, item) => sum + (item.targetSellPrice - item.purchasePrice),
    0
  );

  const soldInventory = inventory?.filter((item) => item.status === "sold") || [];
  
  const averageMargin = useMemo(() => {
    if (soldInventory.length === 0) return 0;
    
    const margins = soldInventory.map(item => {
      const revenue = item.salePrice;
      const totalCost = item.purchasePrice + 
                        (item.importFee || 0) + 
                        (item.serviceFee || 0) + 
                        (item.polishFee || 0) + 
                        (item.platformFees || 0) + 
                        (item.shippingFee || 0) + 
                        (item.insuranceFee || 0) +
                        (item.watchRegister ? 600 : 0);
      
      const profit = revenue - totalCost;
      return revenue > 0 ? (profit / revenue) * 100 : 0;
    });
    
    return margins.reduce((a, b) => a + b, 0) / margins.length;
  }, [soldInventory]);
  const watchesAtPolisher = statusCounts.inService;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">{formattedDate}</p>
      </div>
      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Capital Deployed - Green */}
        <Card className="bg-emerald-600 border-emerald-500 relative overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-50/90">Capital Deployed</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                  {formatCurrency(stats?.totalInventoryValue || 0)}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projected Net Profit */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Net Profit</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(stats?.totalProfit || 0)}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Margin */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Average Margin</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {averageMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Watches at Service - Green */}
        <Card className="bg-emerald-600 border-emerald-500">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-50/90">Watches at Service</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                  {watchesAtPolisher}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <Watch className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aging Inventory - Left Side (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-slate-900 text-lg">Aging Inventory</CardTitle>
                  <p className="text-sm text-slate-500">Watches held for more than 45 days</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                {agingInventory.length} watches
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {agingInventory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No aging inventory. Great work!
                </div>
              ) : (
                agingInventory.slice(0, 6).map((item) => (
                  <Link key={item.id} href={`/inventory/${item.id}`}>
                    <div
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                      data-testid={`aging-item-${item.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                          <Watch className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.brand} {item.model}
                          </p>
                          <p className="text-sm text-slate-500 tabular-nums">
                            {formatCurrency(item.purchasePrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-amber-600 tabular-nums">
                          {item.daysHeld} days
                        </p>
                        <p className="text-xs text-slate-400">held</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Status - Right Side (1 col) */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 text-lg">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/inventory?status=incoming">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors px-2 -mx-2 rounded-md">
                  <span className="text-slate-500">Incoming</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.incoming}</span>
                </div>
              </Link>
              <Link href="/inventory?status=servicing">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors px-2 -mx-2 rounded-md">
                  <span className="text-slate-500">In Service</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.inService}</span>
                </div>
              </Link>
              <Link href="/inventory?status=in_stock">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors px-2 -mx-2 rounded-md">
                  <span className="text-slate-500">Listed</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.listed}</span>
                </div>
              </Link>
              <Link href="/inventory?status=sold">
                <div className="flex items-center justify-between py-2 hover:bg-slate-50 cursor-pointer transition-colors px-2 -mx-2 rounded-md">
                  <span className="text-slate-500">Sold</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.sold}</span>
                </div>
              </Link>
            </CardContent>
            <div className="px-6 pb-5">
              <Link href="/inventory">
                <Button
                  variant="outline"
                  className="w-full bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  data-testid="button-view-inventory"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Inventory
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
      {/* Recent Additions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Recent Additions</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentAdditions.map((item) => (
            <Link key={item.id} href={`/inventory/${item.id}`}>
              <Card
                className="min-w-[200px] max-w-[200px] bg-white border-slate-200 cursor-pointer hover:border-slate-300 transition-colors flex-shrink-0"
                data-testid={`recent-item-${item.id}`}
              >
                <div className="aspect-square bg-slate-50 rounded-t-lg flex items-center justify-center">
                  <Watch className="h-12 w-12 text-slate-300" />
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-slate-900 text-sm">{item.brand}</p>
                  <p className="text-xs text-slate-500 truncate">{item.model}</p>
                  <Badge
                    variant="secondary"
                    className={`mt-2 text-xs ${
                      item.status === "in_stock"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : item.status === "servicing"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : item.status === "incoming"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status === "in_stock"
                      ? "Listed"
                      : item.status === "servicing"
                      ? "In Service"
                      : item.status === "incoming"
                      ? "Incoming"
                      : "Sold"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
          {recentAdditions.length === 0 && (
            <div className="flex-1 text-center py-12 text-slate-400">
              No watches in inventory yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
