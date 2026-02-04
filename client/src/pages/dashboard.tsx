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
  X
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
import { cn } from "@/lib/utils";
import { QuickEstimate } from "@/components/quick-estimate";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema, insertExpenseSchema, insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateInventory } from "@/hooks/use-inventory";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useCreateClient } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const WATCH_BRANDS = [
  "Audemars Piguet", "Bell and Ross", "Blancpain", "Breguet", "Breitling",
  "Cartier", "Chopard", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
  "H. Moser and Cie", "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
  "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe", "Parmigiani",
  "Roger Dubuis", "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
  "Vacheron Constantin", "Zenith"
];

const createInventoryFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  purchasedFrom: z.string().min(1, "Purchased from is required"),
  paidWith: z.string().min(1, "Paid with is required"),
  clientId: z.coerce.number().optional().nullable(),
  purchasePrice: z.coerce.number().min(1, "COGS is required"),
  importFee: z.coerce.number().optional().default(0),
  watchRegister: z.boolean().default(false),
  serviceFee: z.coerce.number().optional().default(0),
  polishFee: z.coerce.number().optional().default(0),
  salePrice: z.coerce.number().optional().default(0),
  soldTo: z.string().optional().nullable(),
  platformFees: z.coerce.number().optional().default(0),
  shippingFee: z.coerce.number().optional().default(0),
  insuranceFee: z.coerce.number().optional().default(0),
  purchaseDate: z.string().optional().nullable(),
  dateListed: z.string().optional().nullable(),
  dateSold: z.string().optional().nullable(),
  targetSellPrice: z.coerce.number().optional().default(0),
  status: z.enum(["in_stock", "sold", "incoming", "servicing", "received"], {
    required_error: "Status is required",
  }),
  condition: z.enum(["New", "Mint", "Used", "Damaged"]).default("Used"),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  gdriveLink: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  soldPlatform: z.string().optional().nullable(),
});

type CreateInventoryFormValues = z.infer<typeof createInventoryFormSchema>;

const createExpenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number(),
});

type CreateExpenseFormValues = z.infer<typeof createExpenseFormSchema>;

const SOLD_ON_OPTIONS = ["Chrono24", "Facebook Marketplace", "OLX", "Reddit", "Website"];
const SHIPPING_PARTNERS = ["DHL", "FedEx", "UPS"];
const PURCHASE_FROM_OPTIONS = ["Chrono24", "Eni Dealer", "Ayhan Dealer", "IPLAYWATCH Dealer"];
const PAID_WITH_OPTIONS = ["Credit", "Debit", "Wire"];
const EXPENSE_CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "rent_storage", label: "Rent/Storage" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "tools", label: "Tools" },
  { value: "insurance", label: "Insurance" },
  { value: "service", label: "Service" },
  { value: "shipping", label: "Shipping" },
  { value: "parts", label: "Parts" },
  { value: "platform_fees", label: "Platform Fees" },
  { value: "other", label: "Other" },
];

export default function Dashboard() {
  const [isAddWatchOpen, setIsAddWatchOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const saved = localStorage.getItem("monthlyProfitGoal");
    return saved ? parseInt(saved, 10) : 200000; // Default €2,000 (stored in cents)
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState("");
  const { toast } = useToast();

  const createWatchMutation = useCreateInventory();
  const createExpenseMutation = useCreateExpense();
  const createClientMutation = useCreateClient();

  const watchForm = useForm<CreateInventoryFormValues>({
    resolver: zodResolver(createInventoryFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      referenceNumber: "",
      serialNumber: "",
      internalSerial: "",
      year: null,
      purchasedFrom: "",
      paidWith: "",
      clientId: undefined,
      purchasePrice: 0,
      importFee: 0,
      watchRegister: false,
      serviceFee: 0,
      polishFee: 0,
      salePrice: 0,
      soldTo: "",
      platformFees: 0,
      shippingFee: 0,
      insuranceFee: 0,
      targetSellPrice: 0,
      purchaseDate: null,
      dateListed: null,
      dateSold: null,
      status: "incoming",
      condition: "Used",
      box: false,
      papers: false,
      gdriveLink: "",
      notes: "",
      shippingPartner: "",
      trackingNumber: "",
      soldPlatform: "",
    }
  });

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
      type: "client",
      notes: "",
      isVip: false,
    }
  });

  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const { data: clients } = useQuery<Array<{ id: number; name: string; type: string }>>({ queryKey: ["/api/clients"] });

  // Watch for changes to salePrice and soldPlatform to auto-calculate platformFees
  const watchedSalePrice = watchForm.watch("salePrice");
  const watchedSoldPlatform = watchForm.watch("soldPlatform");

  useEffect(() => {
    if (watchedSoldPlatform === "Chrono24" && (watchedSalePrice || 0) > 0) {
      const fee = Math.round((watchedSalePrice || 0) * 0.065);
      watchForm.setValue("platformFees", fee);
    }
  }, [watchedSalePrice, watchedSoldPlatform, watchForm]);

  const onWatchSubmit = (data: CreateInventoryFormValues) => {
    let finalStatus = data.status;
    if (data.dateSold) {
      finalStatus = "sold";
    } else if (data.dateListed && finalStatus !== "sold" && finalStatus !== "servicing") {
      finalStatus = "in_stock";
    } else if (data.purchaseDate && finalStatus === "incoming") {
      finalStatus = "received";
    }

    const submissionData = {
      ...data,
      status: finalStatus,
      purchasePrice: Math.round(data.purchasePrice * 100),
      importFee: Math.round((data.importFee || 0) * 100),
      serviceFee: Math.round((data.serviceFee || 0) * 100),
      polishFee: Math.round((data.polishFee || 0) * 100),
      salePrice: Math.round((data.salePrice || 0) * 100),
      platformFees: Math.round((data.platformFees || 0) * 100),
      shippingFee: Math.round((data.shippingFee || 0) * 100),
      insuranceFee: Math.round((data.insuranceFee || 0) * 100),
      targetSellPrice: Math.round((data.targetSellPrice || 0) * 100),
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      dateListed: data.dateListed ? new Date(data.dateListed) : null,
      dateSold: data.dateSold ? new Date(data.dateSold) : (finalStatus === 'sold' ? new Date() : null),
      soldDate: data.dateSold ? new Date(data.dateSold) : (finalStatus === 'sold' ? new Date() : null),
    };

    createWatchMutation.mutate(submissionData as any, {
      onSuccess: () => {
        setIsAddWatchOpen(false);
        watchForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
        toast({ title: "Success", description: "Watch added" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

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

  // Calculate current month's net profit
  const currentMonthProfit = useMemo(() => {
    const now = new Date();
    // Use the start of the current month in the current year
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const thisMonthSales = soldInventory.filter(item => {
      const dateValue = item.soldDate || item.dateSold;
      if (!dateValue) return false;
      const soldDate = new Date(dateValue);
      return soldDate >= startOfCurrentMonth && soldDate <= endOfCurrentMonth;
    });
    
    return thisMonthSales.reduce((sum, item) => {
      const revenue = item.salePrice || 0;
      const totalCost = item.purchasePrice + 
                        (item.importFee || 0) + 
                        (item.serviceFee || 0) + 
                        (item.polishFee || 0) + 
                        (item.platformFees || 0) + 
                        (item.shippingFee || 0) + 
                        (item.insuranceFee || 0) +
                        (item.watchRegister ? 600 : 0);
      return sum + (revenue - totalCost);
    }, 0);
  }, [soldInventory]);

  const goalProgress = monthlyGoal > 0 ? Math.min((currentMonthProfit / monthlyGoal) * 100, 100) : 0;

  const handleGoalEdit = () => {
    setGoalInputValue((monthlyGoal / 100).toString());
    setIsEditingGoal(true);
  };

  const handleGoalSave = () => {
    const newGoal = Math.round(parseFloat(goalInputValue || "0") * 100);
    if (newGoal > 0) {
      setMonthlyGoal(newGoal);
      localStorage.setItem("monthlyProfitGoal", newGoal.toString());
      toast({ title: "Goal Updated", description: `Monthly goal set to €${(newGoal / 100).toLocaleString()}` });
    }
    setIsEditingGoal(false);
  };

  const handleGoalCancel = () => {
    setIsEditingGoal(false);
  };
  
  const averageMargin = useMemo(() => {
    if (soldInventory.length === 0) return 0;
    
    const margins = soldInventory.map(item => {
      const revenue = item.salePrice || 0;
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
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">{formattedDate}</p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Monthly Goal Progress Bar */}
        <Card className="bg-white border-slate-200 shadow-sm">
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
              <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                <span>{goalProgress.toFixed(0)}% of goal</span>
                {currentMonthProfit >= monthlyGoal ? (
                  <span className="text-emerald-600 font-medium">Goal reached!</span>
                ) : (
                  <span>{formatCurrency(monthlyGoal - currentMonthProfit)} to go</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Aging Inventory */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-slate-900 text-lg">Aging Inventory</CardTitle>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                {agingInventory.length} watches
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {agingInventory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No aging inventory.</div>
              ) : (
                agingInventory.slice(0, 5).map((item) => (
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

          {/* Recent Additions */}
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
        </div>
      </div>

      {/* Sidebar - Column 3 */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        {/* Quick Actions Card */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
              variant="outline"
              onClick={() => setIsAddWatchOpen(true)}
            >
              <Plus className="h-4 w-4 mr-3 text-emerald-600" /> Add Watch
            </Button>
            <Button 
              className="w-full h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
              variant="outline"
              onClick={() => setIsAddExpenseOpen(true)}
            >
              <Receipt className="h-4 w-4 mr-3 text-red-600" /> Add Expense
            </Button>
            <Button 
              className="w-full h-12 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-3 text-base font-semibold shadow-sm"
              variant="outline"
              onClick={() => setIsAddClientOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-3 text-blue-600" /> Add Client
            </Button>
          </CardContent>
        </Card>

        {/* Quick Estimate Widget */}
        <QuickEstimate />

        {/* Inventory Status */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 text-lg">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/inventory?status=incoming">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer px-2 rounded-md">
                <span className="text-sm text-slate-500">Incoming</span>
                <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.incoming}</span>
              </div>
            </Link>
            <Link href="/inventory?status=servicing">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer px-2 rounded-md">
                <span className="text-sm text-slate-500">In Service</span>
                <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.inService}</span>
              </div>
            </Link>
            <Link href="/inventory?status=in_stock">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer px-2 rounded-md">
                <span className="text-sm text-slate-500">Listed</span>
                <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.listed}</span>
              </div>
            </Link>
            <Link href="/inventory?status=sold">
              <div className="flex items-center justify-between py-2 hover:bg-slate-50 cursor-pointer px-2 rounded-md">
                <span className="text-sm text-slate-500">Sold</span>
                <span className="font-semibold text-slate-900 tabular-nums">{statusCounts.sold}</span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Add Watch Dialog */}
      <Dialog open={isAddWatchOpen} onOpenChange={setIsAddWatchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader><DialogTitle>Add New Watch</DialogTitle></DialogHeader>
          <form onSubmit={watchForm.handleSubmit(onWatchSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Select value={watchForm.watch("brand")} onValueChange={(val) => watchForm.setValue("brand", val)}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {WATCH_BRANDS.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input {...watchForm.register("model")} className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Reference *</Label>
                <Input {...watchForm.register("referenceNumber")} className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>COGS *</Label>
                <Input {...watchForm.register("purchasePrice")} className="bg-white border-slate-200" type="number" />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={watchForm.watch("status")} onValueChange={(val) => watchForm.setValue("status", val as any)}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="in_stock">Listed</SelectItem>
                    <SelectItem value="servicing">In Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsAddWatchOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 text-white">Add Watch</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...expenseForm.register("description")} className="bg-white border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label>Amount (€)</Label>
              <Input {...expenseForm.register("amount")} type="number" className="bg-white border-slate-200" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 text-white">Add Expense</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...clientForm.register("name")} className="bg-white border-slate-200" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 text-white">Add Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
