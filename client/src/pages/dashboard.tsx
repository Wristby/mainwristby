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
  "Cartier", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
  "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
  "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe",
  "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
  "Vacheron Constantin", "Zenith"
];

const createInventoryFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  purchasedFrom: z.string().min(1, "Purchase channel is required"),
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
  dateReceived: z.string().optional().nullable(),
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
  dateSentToService: z.string().optional().nullable(),
  dateReturnedFromService: z.string().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
});

type CreateInventoryFormValues = z.infer<typeof createInventoryFormSchema>;

const createExpenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number(),
  date: z.coerce.date(),
});

type CreateExpenseFormValues = z.infer<typeof createExpenseFormSchema>;

const SOLD_ON_OPTIONS = ["Chrono24", "Facebook Marketplace", "OLX", "Reddit", "Website"];
const SHIPPING_PARTNERS = ["DHL", "FedEx", "UPS"];
const PURCHASE_CHANNEL_OPTIONS = ["Dealer", "Chrono24", "Reddit", "eBay", "Private Purchase", "Other"];
const PAID_WITH_OPTIONS = ["Credit", "Debit", "Wire"];

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
  const [kpiView, setKpiView] = useState<"month" | "ytd">("month");
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [demandPrice, setDemandPrice] = useState<string>("");
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
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
      dateReceived: null,
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
      dateSentToService: null,
      dateReturnedFromService: null,
      serviceNotes: "",
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
      socialHandle: "",
      website: "",
      country: "",
      type: "client",
      notes: "",
      isVip: false,
    }
  });

  const quickClientForm = useForm({
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

  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const { data: clients } = useQuery<Array<{ id: number; name: string; type: string }>>({ queryKey: ["/api/clients"] });

  // Watch for changes to salePrice and soldPlatform to auto-calculate platformFees
  const watchedSalePrice = watchForm.watch("salePrice");
  const watchedSoldPlatform = watchForm.watch("soldPlatform");

  const watchedStatus = watchForm.watch("status");
  const watchedPurchaseChannel = watchForm.watch("purchasedFrom");
  const showSellerField = watchedPurchaseChannel === "Dealer" || watchedPurchaseChannel === "Private Purchase" || watchedPurchaseChannel === "Other";
  const isSellerRequired = watchedPurchaseChannel === "Dealer";
  const filterDealersOnly = watchedPurchaseChannel === "Dealer";

  useEffect(() => {
    const channel = watchForm.watch("purchasedFrom");
    if (channel && !["Dealer", "Private Purchase", "Other"].includes(channel)) {
      watchForm.setValue("clientId", null);
    }
  }, [watchedPurchaseChannel]);

  useEffect(() => {
    if (watchedSoldPlatform === "Chrono24" && (watchedSalePrice || 0) > 0) {
      const fee = Math.round((watchedSalePrice || 0) * 0.065);
      watchForm.setValue("platformFees", fee);
    }
  }, [watchedSalePrice, watchedSoldPlatform, watchForm]);

  useEffect(() => {
    if (watchedStatus === "sold") {
      setShowSaleDetails(true);
    }
    if (watchedStatus === "servicing") {
      setShowServiceDetails(true);
    }
  }, [watchedStatus]);

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
      dateReceived: data.dateReceived || null,
      purchaseDate: data.purchaseDate || null,
      dateListed: data.dateListed || null,
      dateSold: data.dateSold || null,
      soldDate: data.dateSold || null,
      dateSentToService: data.dateSentToService || null,
      dateReturnedFromService: data.dateReturnedFromService || null,
      serviceNotes: data.serviceNotes || null,
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const soldInventory = inventory?.filter((item) => item.status === "sold") || [];

  const calcProfit = (item: InventoryItem) => {
    const revenue = item.salePrice || 0;
    const totalCost = item.purchasePrice + 
                      (item.importFee || 0) + 
                      (item.serviceFee || 0) + 
                      (item.polishFee || 0) + 
                      (item.platformFees || 0) + 
                      (item.shippingFee || 0) + 
                      (item.insuranceFee || 0) +
                      (item.watchRegister ? 600 : 0);
    return revenue - totalCost;
  };

  const calcMargin = (item: InventoryItem) => {
    const revenue = item.salePrice || 0;
    const profit = calcProfit(item);
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  };

  const { currentMonthProfit, ytdProfit, monthMargin, ytdMargin } = useMemo(() => {
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
    };
  }, [soldInventory]);

  const displayedProfit = kpiView === "month" ? currentMonthProfit : ytdProfit;
  const displayedMargin = kpiView === "month" ? monthMargin : ytdMargin;

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
      {/* KPI Cards Row - Top */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
      {/* Quick Actions Card - Below KPIs */}
      <Card className="bg-white border-slate-200">
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
      </Card>
      {/* Monthly Goal Progress Bar - Below Quick Actions */}
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
                <span className="text-emerald-600 font-medium">Fuck Yeah!</span>
              ) : (
                <span>{formatCurrency(monthlyGoal - currentMonthProfit)} to go</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Status - Moved here above Aging Inventory */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 text-lg">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/inventory?status=incoming">
                <div className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Incoming</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">{statusCounts.incoming}</span>
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

          <div className="grid gap-6 md:grid-cols-1">
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

            {/* Meet in the Middle Calculator */}
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

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <QuickEstimate />
        </div>
      </div>
      {/* Add Watch Dialog - Full Form */}
      <Dialog open={isAddWatchOpen} onOpenChange={(open) => {
        setIsAddWatchOpen(open);
        if (!open) {
          watchForm.reset({
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
            dateReceived: null,
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
            dateSentToService: null,
            dateReturnedFromService: null,
            serviceNotes: "",
          });
          setShowSaleDetails(false);
          setShowServiceDetails(false);
          setShowShippingDetails(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900">
          <DialogHeader><DialogTitle>Add New Watch</DialogTitle></DialogHeader>
          <form onSubmit={watchForm.handleSubmit(onWatchSubmit)} className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Watch Details</h3>
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
                  <Label>Reference Number *</Label>
                  <Input {...watchForm.register("referenceNumber")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Serial #</Label>
                  <Input {...watchForm.register("serialNumber")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Movement Serial Number</Label>
                  <Input {...watchForm.register("internalSerial")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("year")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={watchForm.watch("condition")} onValueChange={(val) => watchForm.setValue("condition", val as any)}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Condition" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Mint">Mint</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dash-box" checked={watchForm.watch("box")} onCheckedChange={(checked) => watchForm.setValue("box", !!checked)} />
                    <Label htmlFor="dash-box" className="cursor-pointer">Box</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dash-papers" checked={watchForm.watch("papers")} onCheckedChange={(checked) => watchForm.setValue("papers", !!checked)} />
                    <Label htmlFor="dash-papers" className="cursor-pointer">Papers</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Google Drive Link</Label>
                    <a 
                      href="https://drive.google.com/drive/u/1/folders/19gIwCa7aNqQk1s00gmkCWWzFC_dfL4sG" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      Open Folder <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input {...watchForm.register("gdriveLink")} className="bg-white border-slate-200" placeholder="https://drive.google.com/..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Channel *</Label>
                  <Select value={watchForm.watch("purchasedFrom") || ""} onValueChange={(val) => watchForm.setValue("purchasedFrom", val)} data-testid="select-purchase-channel">
                    <SelectTrigger className="bg-white border-slate-200" data-testid="select-purchase-channel"><SelectValue placeholder="Select Channel" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {PURCHASE_CHANNEL_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {showSellerField && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 min-h-[1.5rem]">
                      <Label>Seller / Dealer{isSellerRequired ? ' *' : ''}</Label>
                      <Button size="icon" variant="ghost" onClick={() => { quickClientForm.setValue("type", filterDealersOnly ? "dealer" : "client"); setIsQuickAddClientOpen(true); }} data-testid="button-quick-add-client" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Select value={watchForm.watch("clientId")?.toString() || "none"} onValueChange={(val) => watchForm.setValue("clientId", val === "none" ? null : parseInt(val))}>
                      <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Dealer" /></SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="none">None</SelectItem>
                        {clients?.filter((c: any) => filterDealersOnly ? c.type === 'dealer' : true).map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Paid With *</Label>
                  <Select value={watchForm.watch("paidWith") || ""} onValueChange={(val) => watchForm.setValue("paidWith", val)}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Payment" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {PAID_WITH_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price (COGS) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("purchasePrice")} className="pl-7 bg-white border-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Import Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("importFee")} className="pl-7 bg-white border-slate-200" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox id="dash-watchRegister" checked={watchForm.watch("watchRegister")} onCheckedChange={(checked) => watchForm.setValue("watchRegister", !!checked)} />
                  <Label htmlFor="dash-watchRegister" className="cursor-pointer">Watch Register (€6)</Label>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !watchForm.watch("purchaseDate") && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchForm.watch("purchaseDate") ? format(new Date(watchForm.watch("purchaseDate")!), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar mode="single" selected={watchForm.watch("purchaseDate") ? new Date(watchForm.watch("purchaseDate")!) : undefined} onSelect={(date) => { watchForm.setValue("purchaseDate", date ? date.toISOString() : null); if (date) watchForm.setValue("status", "incoming"); }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Status & Listing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Current Status *</Label>
                  <Select value={watchForm.watch("status")} onValueChange={(val) => watchForm.setValue("status", val as any)}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="servicing">In Service</SelectItem>
                      <SelectItem value="in_stock">Listed</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Received</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-900", !watchForm.watch("dateReceived") && "text-slate-500")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchForm.watch("dateReceived") ? format(new Date(watchForm.watch("dateReceived")!), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar mode="single" selected={watchForm.watch("dateReceived") ? new Date(watchForm.watch("dateReceived")!) : undefined} onSelect={(date) => { watchForm.setValue("dateReceived", date ? date.toISOString() : null); if (date) watchForm.setValue("status", "received"); }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Date Listed</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !watchForm.watch("dateListed") && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchForm.watch("dateListed") ? format(new Date(watchForm.watch("dateListed")!), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar mode="single" selected={watchForm.watch("dateListed") ? new Date(watchForm.watch("dateListed")!) : undefined} onSelect={(date) => { watchForm.setValue("dateListed", date ? date.toISOString() : null); if (date) watchForm.setValue("status", "in_stock"); }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sale Details</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="dash-showSale" className="text-sm font-medium text-slate-500">Show Sale Fields</Label>
                  <Switch id="dash-showSale" checked={showSaleDetails} onCheckedChange={setShowSaleDetails} />
                </div>
              </div>
              {showSaleDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label>Sold Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("salePrice")} className="pl-7 bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Fees</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("platformFees")} className="pl-7 bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sold On</Label>
                    <Select value={watchForm.watch("soldPlatform") || ""} onValueChange={(val) => watchForm.setValue("soldPlatform", val)}>
                      <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Platform" /></SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {SOLD_ON_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("shippingFee")} className="pl-7 bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" {...watchForm.register("insuranceFee")} className="pl-7 bg-white border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Buyer Name</Label>
                    <Input {...watchForm.register("soldTo")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Sold</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !watchForm.watch("dateSold") && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {watchForm.watch("dateSold") ? format(new Date(watchForm.watch("dateSold")!), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                        <Calendar mode="single" selected={watchForm.watch("dateSold") ? new Date(watchForm.watch("dateSold")!) : undefined} onSelect={(date) => { watchForm.setValue("dateSold", date ? date.toISOString() : null); if (date) watchForm.setValue("status", "sold"); }} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Service & Maintenance</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="dash-showService" className="text-sm font-medium text-slate-500">Show Service Fields</Label>
                  <Switch id="dash-showService" checked={showServiceDetails} onCheckedChange={setShowServiceDetails} />
                </div>
              </div>
              {showServiceDetails && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Sent to Service</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !watchForm.watch("dateSentToService") && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {watchForm.watch("dateSentToService") ? format(new Date(watchForm.watch("dateSentToService")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <Calendar mode="single" selected={watchForm.watch("dateSentToService") ? new Date(watchForm.watch("dateSentToService")!) : undefined} onSelect={(date) => { watchForm.setValue("dateSentToService", date ? date.toISOString() : null); if (date) watchForm.setValue("status", "servicing"); }} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Returned</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !watchForm.watch("dateReturnedFromService") && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {watchForm.watch("dateReturnedFromService") ? format(new Date(watchForm.watch("dateReturnedFromService")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <Calendar mode="single" selected={watchForm.watch("dateReturnedFromService") ? new Date(watchForm.watch("dateReturnedFromService")!) : undefined} onSelect={(date) => watchForm.setValue("dateReturnedFromService", date ? date.toISOString() : null)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  <div className="space-y-2">
                    <Label>Service Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        {...watchForm.register("serviceFee", {
                          setValueAs: (v) => {
                            if (v === "" || v === undefined || v === null) return 0;
                            const normalized = v.toString().replace(",", ".");
                            const parsed = parseFloat(normalized);
                            return isNaN(parsed) ? 0 : parsed;
                          }
                        })}
                        onBlur={(e) => {
                          const normalized = e.target.value.replace(",", ".");
                          const val = parseFloat(normalized);
                          if (!isNaN(val)) {
                            watchForm.setValue("serviceFee", parseFloat(val.toFixed(2)));
                          }
                        }}
                        className="pl-7 bg-white border-slate-200" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Polish Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        {...watchForm.register("polishFee", {
                          setValueAs: (v) => {
                            if (v === "" || v === undefined || v === null) return 0;
                            const normalized = v.toString().replace(",", ".");
                            const parsed = parseFloat(normalized);
                            return isNaN(parsed) ? 0 : parsed;
                          }
                        })}
                        onBlur={(e) => {
                          const normalized = e.target.value.replace(",", ".");
                          const val = parseFloat(normalized);
                          if (!isNaN(val)) {
                            watchForm.setValue("polishFee", parseFloat(val.toFixed(2)));
                          }
                        }}
                        className="pl-7 bg-white border-slate-200" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Notes</Label>
                    <Textarea {...watchForm.register("serviceNotes")} className="bg-white border-slate-200 min-h-[80px]" placeholder="Notes about service work performed..." />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Shipping & Tracking</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="dash-showShipping" className="text-sm font-medium text-slate-500">Show Shipping Fields</Label>
                  <Switch id="dash-showShipping" checked={showShippingDetails} onCheckedChange={setShowShippingDetails} />
                </div>
              </div>
              
              {showShippingDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label>Shipping Partner</Label>
                    <Select value={watchForm.watch("shippingPartner") || ""} onValueChange={(val) => watchForm.setValue("shippingPartner", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Partner" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input {...watchForm.register("trackingNumber")} className="bg-white border-slate-200" placeholder="Enter tracking number" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Notes</h3>
              <Textarea {...watchForm.register("notes")} className="bg-white border-slate-200 min-h-[100px]" placeholder="Add any additional notes about the watch, movement condition, etc." />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsAddWatchOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createWatchMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]">
                {createWatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Watch
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isQuickAddClientOpen} onOpenChange={(open) => { setIsQuickAddClientOpen(open); if (!open) quickClientForm.reset(); }}>
        <DialogContent className="bg-white border-slate-200 text-slate-900" data-testid="dialog-quick-add-client">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={quickClientForm.handleSubmit((data) => {
            createClientMutation.mutate(data, {
              onSuccess: (newClient: any) => {
                watchForm.setValue("clientId", newClient.id);
                setIsQuickAddClientOpen(false);
                quickClientForm.reset();
                toast({ title: "Success", description: `${data.type === 'dealer' ? 'Dealer' : 'Client'} "${data.name}" added` });
                queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
              },
              onError: (err: any) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            });
          })} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...quickClientForm.register("name")} className="bg-white border-slate-200" placeholder="John Doe" data-testid="input-quick-add-name" />
                {quickClientForm.formState.errors.name && <p className="text-red-500 text-xs">{quickClientForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  {...quickClientForm.register("type")} 
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="client">Client</option>
                  <option value="dealer">Dealer</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...quickClientForm.register("email")} className="bg-white border-slate-200" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...quickClientForm.register("phone")} className="bg-white border-slate-200" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Social Media Handle</Label>
              <Input {...quickClientForm.register("socialHandle")} className="bg-white border-slate-200" placeholder="@username" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input {...quickClientForm.register("website")} className="bg-white border-slate-200" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <select 
                {...quickClientForm.register("country")} 
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...quickClientForm.register("notes")} className="bg-white border-slate-200" placeholder="Special requirements or preferences..." />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isVip"
                control={quickClientForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="quickAddIsVip"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-slate-300 data-[state=checked]:bg-emerald-600"
                  />
                )}
              />
              <Label htmlFor="quickAddIsVip" className="text-sm font-medium leading-none cursor-pointer">VIP Client</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsQuickAddClientOpen(false); quickClientForm.reset(); }} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
              <Button type="submit" disabled={createClientMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-quick-add">
                {createClientMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Expense Dialog - Full Form */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900">
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input {...expenseForm.register("description")} className="bg-white border-slate-200" placeholder="Enter expense description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (€) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                  <Input 
                    type="text" 
                    {...expenseForm.register("amount", {
                      setValueAs: (v) => {
                        if (v === "") return 0;
                        const normalized = v.toString().replace(",", ".");
                        return parseFloat(normalized);
                      }
                    })}
                    onBlur={(e) => {
                      const normalized = e.target.value.replace(",", ".");
                      const val = parseFloat(normalized);
                      if (!isNaN(val)) {
                        expenseForm.setValue("amount", parseFloat(val.toFixed(2)));
                      }
                    }}
                    className="pl-7 bg-white border-slate-200" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={expenseForm.watch("category") as string} onValueChange={(val) => expenseForm.setValue("category", val as any)}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !expenseForm.watch("date") && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseForm.watch("date") ? format(new Date(expenseForm.watch("date") as Date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                  <Calendar mode="single" selected={expenseForm.watch("date") ? new Date(expenseForm.watch("date") as Date) : undefined} onSelect={(date) => expenseForm.setValue("date", date || new Date())} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="dash-isRecurring" checked={expenseForm.watch("isRecurring")} onCheckedChange={(checked) => expenseForm.setValue("isRecurring", !!checked)} />
              <Label htmlFor="dash-isRecurring" className="cursor-pointer">Recurring Expense</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpenseMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
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
