import { useDashboardStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, Package, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-emerald-950/30 transition-colors">
          <Icon className="h-4 w-4 text-emerald-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white tracking-tight">
          {value}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-slate-900 rounded-xl" />
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val / 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-slate-400 mt-1">Overview of your inventory performance.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats?.totalInventoryValue || 0)}
          icon={DollarSignIcon}
          description="Cost basis of active stock"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={TrendingUp}
          description="Realized gains from sales"
        />
        <StatCard
          title="Active Inventory"
          value={stats?.activeInventoryCount || 0}
          icon={Package}
          description="Watches currently in stock"
        />
        <StatCard
          title="Turn Rate"
          value={`${Math.round(stats?.turnRate || 0)} days`}
          icon={Clock}
          description="Average time to sell"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm italic">
                No recent activity recorded.
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-slate-900 border-slate-800 shadow-xl">
           <CardHeader>
            <CardTitle className="text-white">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-300">New Arrivals (30d)</span>
                  </div>
                  <span className="text-sm font-bold text-white">4</span>
                </div>
                 <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-slate-300">Aging Stock (90d+)</span>
                  </div>
                  <span className="text-sm font-bold text-white">2</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DollarSignIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
