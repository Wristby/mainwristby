import { WatchIntake } from "@/components/watch-intake/watch-intake";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Watch, 
  AlertTriangle, 
  Eye, 
  Plus, 
  Receipt, 
  UserPlus,
  Loader2,
  Calendar as CalendarIcon,
  Target,
  Pencil,
  Check,
  X,
  Scale,
  ExternalLink
} from "lucide-react";
import { format, differenceInDays, startOfDay } from "date-fns";
import { Link } from "wouter";
import type { InventoryItem, DashboardStats } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, parsePriceInput } from "@/lib/utils";
import { QuickEstimate } from "@/components/quick-estimate";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useCreateClient } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useUpdateSetting } from "@/hooks/use-settings";
import { useAmsterdamClock } from "@/hooks/use-amsterdam-clock";
import { RecentlySold } from "@/components/recently-sold";

const createExpenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number(),
  date: z.coerce.date(),
});

type CreateExpenseFormValues = z.infer<typeof createExpenseFormSchema>;

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];


export default function Dashboard() {
  const [isAddWatchOpen, setIsAddWatchOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { settings } = useSettings();
  const updateSettingMutation = useUpdateSetting();
  const monthlyGoal = settings.monthly_profit_goal;
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState("");
  const [kpiView, setKpiView] = useState<"month" | "ytd">("month");
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [demandPrice, setDemandPrice] = useState<string>("");
  const { toast } = useToast();
  const EXPENSE_CATEGORIES = settings.expense_categories;

  const createExpenseMutation = useCreateExpense();
  const createClientMutation = useCreateClient();

  const expenseForm = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "other",
      date: new Date(),
      isRecurring: false,
    }
  });

  const clientForm = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      socialHandle: "",
      website: "",
      country: "",
      type: "client",
      notes: "",
      isVip: false,
    }
  });

  const onExpenseSubmit = (data: CreateExpenseFormValues) => {
    const submitData = {
      ...data,
      amount: Math.round(data.amount * 100),
      date: data.date instanceof Date ? data.date : (data.date ? new Date(data.date) : new Date()),
    };
    createExpenseMutation.mutate(submitData, {
      onSuccess: () => {
        setIsAddExpenseOpen(false);
        expenseForm.reset();
        toast({ title: "Success", description: "Expense added" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const onClientSubmit = (data: any) => {
    createClientMutation.mutate(data, {
      onSuccess: () => {
        setIsAddClientOpen(false);
        clientForm.reset();
        toast({ title: "Success", description: "Client added" });
      }
    });
  };
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val / 100);
  };

  const today = useAmsterdamClock();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  // Active inventory is used for stock value and listing-based aging.
  const activeInventory = inventory?.filter(
    (item) => item.status !== "sold"
  ) || [];

  const agingListedInventory = activeInventory
    .filter((item) => item.status === "in_stock" && item.dateListed)
    .map((item) => ({
      ...item,
      daysHeld: differenceInDays(today, startOfDay(new Date(item.dateListed!))),
    }))
    .filter((item) => item.daysHeld > settings.aging_threshold_days)
    .sort((a, b) => b.daysHeld - a.daysHeld);

  // Inventory status counts
  const statusCounts = {
    incoming: inventory?.filter((i) => i.status === "incoming").length || 0,
    received: inventory?.filter((i) => i.status === "received").length || 0,
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

  const soldInventory = inventory?.filter((item) => item.status === "sold") || [];

  const calcProfit = (item: InventoryItem) => {
    const revenue = item.salePrice || 0;
    const wrFee = (item as any).watchRegisterFeeSnapshot ?? settings.watch_register_fee;
    const totalCost = item.purchasePrice + 
                      (item.importFee || 0) + 
                      (item.serviceFee || 0) + 
                      (item.polishFee || 0) + 
                      (item.platformFees || 0) + 
                      (item.shippingFee || 0) + 
                      (item.insuranceFee || 0) +
                      (item.watchRegister ? wrFee : 0);
    return revenue - totalCost;
  };

  const calcMargin = (item: InventoryItem) => {
    const revenue = item.salePrice || 0;
    const profit = calcProfit(item);
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  };

  const { currentMonthProfit, ytdProfit, monthMargin, ytdMargin, monthSoldCount, ytdSoldCount } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filterByDateRange = (start: Date, end: Date) =>
      soldInventory.filter(item => {
        const dateValue = item.soldDate || item.dateSold;
        if (!dateValue) return false;
        const d = new Date(dateValue);
        return d >= start && d <= end;
      });

    const monthSales = filterByDateRange(startOfMonth, endOfMonth);
    const ytdSales = filterByDateRange(startOfYear, endOfMonth);

    const sumProfit = (items: InventoryItem[]) =>
      items.reduce((sum, item) => sum + calcProfit(item), 0);

    const avgMargin = (items: InventoryItem[]) => {
      if (items.length === 0) return 0;
      return items.reduce((sum, item) => sum + calcMargin(item), 0) / items.length;
    };

    return {
      currentMonthProfit: sumProfit(monthSales),
      ytdProfit: sumProfit(ytdSales),
      monthMargin: avgMargin(monthSales),
      ytdMargin: avgMargin(ytdSales),
      monthSoldCount: monthSales.length,
      ytdSoldCount: ytdSales.length,
    };
  }, [soldInventory]);

  const displayedProfit = kpiView === "month" ? currentMonthProfit : ytdProfit;
  const displayedMargin = kpiView === "month" ? monthMargin : ytdMargin;
  const displayedSoldCount = kpiView === "month" ? monthSoldCount : ytdSoldCount;

  const goalProgress = monthlyGoal > 0 ? Math.min((currentMonthProfit / monthlyGoal) * 100, 100) : 0;

  const handleGoalEdit = () => {
    setGoalInputValue((monthlyGoal / 100).toString());
    setIsEditingGoal(true);
  };

  const handleGoalSave = () => {
    const newGoal = Math.round(parseFloat(goalInputValue || "0") * 100);
    if (newGoal > 0) {
      updateSettingMutation.mutate({ key: "monthly_profit_goal", value: newGoal });
      toast({ title: "Goal Updated", description: `Monthly goal set to €${(newGoal / 100).toLocaleString()}` });
    }
    setIsEditingGoal(false);
  };

  const handleGoalCancel = () => {
    setIsEditingGoal(false);
  };
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

  const dashSections = settings.dashboard_sections as Record<string, { order: number; visible: boolean }>;
  const isSectionVisible = (key: string) => dashSections?.[key]?.visible !== false;
  const getOrder = (key: string) => dashSections?.[key]?.order ?? 99;

  return (
    <div className="flex flex-col gap-6">
      {/* Header - always first */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2" data-testid="kpi-view-toggle">
          <span className={cn("text-sm font-medium", kpiView === "month" ? "text-slate-900" : "text-slate-400")}>This Month</span>
          <Switch
            checked={kpiView === "ytd"}
            onCheckedChange={(checked) => setKpiView(checked ? "ytd" : "month")}
            data-testid="toggle-kpi-view"
          />
          <span className={cn("text-sm font-medium", kpiView === "ytd" ? "text-slate-900" : "text-slate-400")}>YTD</span>
        </div>
      </div>
      {isSectionVisible("kpi_cards") && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-600 border-emerald-500 relative overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-50/90">Capital Deployed</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                  {formatCurrency(activeInventory.reduce((sum, item) => sum + item.purchasePrice, 0))}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-full">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-10">
                  <p className="text-sm font-medium text-slate-500">
                    Net Profit{" "}
                    <span className="text-xs text-slate-400">({kpiView === "month" ? "This Month" : "YTD"})</span>
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(displayedProfit)}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-10">
                  <p className="text-sm font-medium text-slate-500">
                    Average Margin{" "}
                    <span className="text-xs text-slate-400">({kpiView === "month" ? "This Month" : "YTD"})</span>
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {displayedMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>}
      {isSectionVisible("quick_actions") && <Card className="bg-white border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Button 
            className="flex-1 h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
            variant="outline"
            onClick={() => setIsAddWatchOpen(true)}
          >
            <Plus className="h-4 w-4 mr-3 text-emerald-600" /> Add Watch
          </Button>
          <Button 
            className="flex-1 h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
            variant="outline"
            onClick={() => setIsAddExpenseOpen(true)}
          >
            <Receipt className="h-4 w-4 mr-3 text-red-600" /> Add Expense
          </Button>
          <Button 
            className="flex-1 h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
            variant="outline"
            onClick={() => setIsAddClientOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-3 text-blue-600" /> Add Client
          </Button>
        </CardContent>
      </Card>}
      {isSectionVisible("monthly_profit_goal") && <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-semibold text-slate-900">Monthly Goal</span>
              <span className="text-sm text-slate-500">({format(new Date(), "MMMM yyyy")})</span>
            </div>
            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">€</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={goalInputValue}
                    onChange={(e) => setGoalInputValue(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-24 h-8 bg-white border-slate-200 text-right"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGoalSave();
                      if (e.key === "Escape") handleGoalCancel();
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleGoalSave} className="h-8 w-8">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleGoalCancel} className="h-8 w-8">
                    <X className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatCurrency(currentMonthProfit)} / {formatCurrency(monthlyGoal)}
                  </span>
                  <Button size="icon" variant="ghost" onClick={handleGoalEdit} className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="relative pt-4">
            <Progress 
              value={goalProgress} 
              className={cn(
                "h-4",
                goalProgress >= 100 ? "[&>div]:bg-emerald-500" : 
                goalProgress >= 75 ? "[&>div]:bg-emerald-400" :
                goalProgress >= 50 ? "[&>div]:bg-amber-400" :
                "[&>div]:bg-slate-300"
              )}
            />
            <div 
              className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${Math.max(5, Math.min(95, goalProgress))}%` }}
            >
              <div className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm mb-1 whitespace-nowrap">
                {formatCurrency(currentMonthProfit)}
              </div>
              <div className="w-0.5 h-4 bg-slate-900/20" />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-[14px] mb-[14px] pt-[0px] pb-[0px]">
              <span>{goalProgress.toFixed(0)}% of goal</span>
              {currentMonthProfit >= monthlyGoal ? (
                <span className="text-emerald-600 font-medium">Fuck Yeah!</span>
              ) : (
                <span>{formatCurrency(monthlyGoal - currentMonthProfit)} to go</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column: stacked sections */}
        <div className="flex flex-col gap-6">
          {isSectionVisible("inventory_status") && (
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 text-lg">Inventory Status</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Link href="/inventory?status=incoming">
                  <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Incoming</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.incoming}</span>
                  </div>
                </Link>
                <Link href="/inventory?status=received">
                  <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-500 uppercase font-semibold">NEED TO LIST</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.received}</span>
                  </div>
                </Link>
                <Link href="/inventory?status=servicing">
                  <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-500 uppercase font-semibold">In Service</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.inService}</span>
                  </div>
                </Link>
                <Link href="/inventory?status=in_stock">
                  <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Listed</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.listed}</span>
                  </div>
                </Link>
                <Link href="/inventory?status=sold">
                  <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Sold</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.sold}</span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
          {isSectionVisible("recently_sold") && (
            <RecentlySold watches={soldInventory} now={today} calcProfit={calcProfit} formatCurrency={formatCurrency} />
          )}
          {isSectionVisible("aging_listed_inventory") && (
            <Card className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <CardTitle className="text-slate-900 text-lg">Aging Listed Inventory</CardTitle>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                  {agingListedInventory.length} watches
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {agingListedInventory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No aging listed inventory.</div>
                ) : (
                  agingListedInventory.slice(0, 5).map((item) => (
                    <Link key={item.id} href={`/inventory/${item.id}`}>
                      <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <Watch className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{item.brand} {item.model}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(item.purchasePrice)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-600">{item.daysHeld} days</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Scale className="w-5 h-5 text-blue-600" />
                Meet in the Middle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Their Offer</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      placeholder="0"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="pl-7 bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Your Demand</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      placeholder="0"
                      value={demandPrice}
                      onChange={(e) => setDemandPrice(e.target.value)}
                      className="pl-7 bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Middle Point</p>
                <p className="text-3xl font-bold text-blue-700 tabular-nums">
                  €{(() => {
                    const offer = parseFloat(offerPrice || "0");
                    const demand = parseFloat(demandPrice || "0");
                    if (offer === 0 && demand === 0) return "0";
                    const middle = (offer + demand) / 2;
                    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(middle);
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right column: Quick Estimate */}
        {isSectionVisible("quick_estimate") && (
          <div className="lg:sticky lg:top-6">
            <QuickEstimate />
          </div>
        )}
      </div>
      {isSectionVisible("recent_additions") && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Additions</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentAdditions.map((item) => (
              <Link key={item.id} href={`/inventory/${item.id}`}>
                <Card className="min-w-[160px] bg-white border-slate-200 cursor-pointer hover-elevate transition-colors">
                  <CardContent className="p-3">
                    <p className="font-medium text-slate-900 text-sm truncate">{item.brand}</p>
                    <p className="text-xs text-slate-500 truncate">{item.model}</p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      {item.status.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
      <WatchIntake open={isAddWatchOpen} onOpenChange={setIsAddWatchOpen} />
      {/* Add Expense Dialog - Full Form */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...expenseForm.register("description")} className="bg-white border-slate-200" placeholder="Monthly subscription..." data-testid="input-description" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input 
                type="text" 
                {...expenseForm.register("amount", { setValueAs: parsePriceInput })}
                onBlur={(e) => {
                  const val = parsePriceInput(e.target.value);
                  expenseForm.setValue("amount", parseFloat(val.toFixed(2)));
                }}
                className="bg-white border-slate-200" 
                placeholder="10,00" 
                data-testid="input-amount" 
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={expenseForm.watch("category") as string} onValueChange={(val) => expenseForm.setValue("category", val as any)}>
                <SelectTrigger className="bg-white border-slate-200" data-testid="select-category-form">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-slate-200",
                      !expenseForm.watch("date") && "text-muted-foreground"
                    )}
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseForm.watch("date") ? format(new Date(expenseForm.watch("date") as Date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                  <Calendar
                    mode="single"
                    selected={expenseForm.watch("date") ? new Date(expenseForm.watch("date") as Date) : undefined}
                    onSelect={(date) => expenseForm.setValue("date", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Link to Watch (Optional)</Label>
              <Select
                value={expenseForm.watch("inventoryId")?.toString() || "none"}
                onValueChange={(val) => expenseForm.setValue("inventoryId", val === "none" ? null : parseInt(val))}
              >
                <SelectTrigger className="bg-white border-slate-200" data-testid="select-watch-expense">
                  <SelectValue placeholder="No watch linked" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-60">
                  <SelectItem value="none">No watch linked</SelectItem>
                  {inventory?.filter((w: any) => w.status !== "sold").map((w: any) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      #{w.id} — {w.brand} {w.model} — {w.referenceNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="dash-isRecurring" checked={expenseForm.watch("isRecurring")} onCheckedChange={(checked) => expenseForm.setValue("isRecurring", !!checked)} />
              <Label htmlFor="dash-isRecurring" className="cursor-pointer">Recurring Expense</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpenseMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-expense">
                {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Client Dialog - Full Form */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...clientForm.register("name")} className="bg-white border-slate-200" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={clientForm.watch("type") as string} onValueChange={(val) => clientForm.setValue("type", val as any)}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...clientForm.register("email")} className="bg-white border-slate-200" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...clientForm.register("phone")} className="bg-white border-slate-200" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Social Media Handle</Label>
              <Input {...clientForm.register("socialHandle")} className="bg-white border-slate-200" placeholder="@username" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input {...clientForm.register("website")} className="bg-white border-slate-200" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={clientForm.watch("country") as string || "none"} onValueChange={(val) => clientForm.setValue("country", val === "none" ? "" : val)}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-[200px]">
                  <SelectItem value="none">None</SelectItem>
                  {["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"].map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...clientForm.register("notes")} className="bg-white border-slate-200" placeholder="Special requirements or preferences..." />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="dash-isVip" checked={clientForm.watch("isVip")} onCheckedChange={(checked) => clientForm.setValue("isVip", !!checked)} />
              <Label htmlFor="dash-isVip" className="cursor-pointer">VIP Client</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createClientMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {createClientMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
