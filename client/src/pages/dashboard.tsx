import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Calendar as CalendarIcon
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
  { value: "other", label: "Other" },
];

export default function Dashboard() {
  const [isAddWatchOpen, setIsAddWatchOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
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
  const { data: clients } = useQuery({ queryKey: ["/api/clients"] });

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

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="w-full h-14 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-4 text-lg font-semibold shadow-sm"
          variant="outline"
          onClick={() => setIsAddWatchOpen(true)}
          data-testid="button-quick-add-watch"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
            <Plus className="h-5 w-5 text-emerald-600" />
          </div>
          Add Watch
        </Button>
        <Button 
          className="w-full h-14 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-4 text-lg font-semibold shadow-sm"
          variant="outline"
          onClick={() => setIsAddExpenseOpen(true)}
          data-testid="button-quick-add-expense"
        >
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3">
            <Receipt className="h-5 w-5 text-red-600" />
          </div>
          Add Expense
        </Button>
        <Button 
          className="w-full h-14 bg-white border-slate-200 text-slate-900 hover-elevate justify-start px-4 text-lg font-semibold shadow-sm"
          variant="outline"
          onClick={() => setIsAddClientOpen(true)}
          data-testid="button-quick-add-client"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          Add Client
        </Button>
      </div>

      {/* Add Watch Dialog */}
      <Dialog open={isAddWatchOpen} onOpenChange={setIsAddWatchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Add New Watch</DialogTitle>
          </DialogHeader>
          <form onSubmit={watchForm.handleSubmit(onWatchSubmit)} className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Watch Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Select value={watchForm.watch("brand")} onValueChange={(val) => watchForm.setValue("brand", val)}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {WATCH_BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watchForm.formState.errors.brand && <p className="text-red-500 text-xs">{watchForm.formState.errors.brand.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input {...watchForm.register("model")} className="bg-white border-slate-200" data-testid="input-model" />
                  {watchForm.formState.errors.model && <p className="text-red-500 text-xs">{watchForm.formState.errors.model.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Reference Number *</Label>
                  <Input {...watchForm.register("referenceNumber")} className="bg-white border-slate-200" data-testid="input-reference" />
                  {watchForm.formState.errors.referenceNumber && <p className="text-red-500 text-xs">Reference Number is required</p>}
                </div>
                <div className="space-y-2">
                  <Label>Serial #</Label>
                  <Input {...watchForm.register("serialNumber")} className="bg-white border-slate-200" data-testid="input-serial" />
                </div>
                <div className="space-y-2">
                  <Label>Movement Serial Number</Label>
                  <Input {...watchForm.register("internalSerial")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    {...watchForm.register("year")} 
                    className="bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={watchForm.watch("condition")} onValueChange={(val) => watchForm.setValue("condition", val as any)}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Condition" />
                    </SelectTrigger>
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
                    <Checkbox id="box" checked={watchForm.watch("box")} onCheckedChange={(checked) => watchForm.setValue("box", !!checked)} />
                    <Label htmlFor="box" className="cursor-pointer">Box</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="papers" checked={watchForm.watch("papers")} onCheckedChange={(checked) => watchForm.setValue("papers", !!checked)} />
                    <Label htmlFor="papers" className="cursor-pointer">Papers</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Google Drive Link</Label>
                  <Input {...watchForm.register("gdriveLink")} className="bg-white border-slate-200" placeholder="https://drive.google.com/..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Purchase From *</Label>
                  <Select value={watchForm.watch("purchasedFrom") || ""} onValueChange={(val) => watchForm.setValue("purchasedFrom", val)}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {PURCHASE_FROM_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watchForm.formState.errors.purchasedFrom && <p className="text-red-500 text-xs">Purchase source is required</p>}
                </div>
                <div className="space-y-2">
                  <Label>Paid With *</Label>
                  <Select value={watchForm.watch("paidWith") || ""} onValueChange={(val) => watchForm.setValue("paidWith", val)}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Payment" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {PAID_WITH_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {watchForm.formState.errors.paidWith && <p className="text-red-500 text-xs">Payment method is required</p>}
                </div>
                <div className="space-y-2">
                  <Label>Seller / Dealer</Label>
                  <Select value={watchForm.watch("clientId")?.toString() || "none"} onValueChange={(val) => watchForm.setValue("clientId", val === "none" ? null : parseInt(val))}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Dealer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="none">None</SelectItem>
                      {clients?.filter(c => c.type === 'dealer').map(client => (
                        <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price (COGS) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...watchForm.register("purchasePrice")} 
                      className="pl-7 bg-white border-slate-200" 
                      data-testid="input-purchase-price" 
                    />
                  </div>
                  {watchForm.formState.errors.purchasePrice && <p className="text-red-500 text-xs">COGS is required</p>}
                </div>
                <div className="space-y-2">
                  <Label>Import Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...watchForm.register("importFee")} 
                      className="pl-7 bg-white border-slate-200" 
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox id="watchRegister" checked={watchForm.watch("watchRegister")} onCheckedChange={(checked) => watchForm.setValue("watchRegister", !!checked)} />
                  <Label htmlFor="watchRegister" className="cursor-pointer">Watch Register (€6)</Label>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-slate-200",
                          !watchForm.watch("purchaseDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchForm.watch("purchaseDate") ? format(new Date(watchForm.watch("purchaseDate")!), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar
                        mode="single"
                        selected={watchForm.watch("purchaseDate") ? new Date(watchForm.watch("purchaseDate")!) : undefined}
                        onSelect={(date) => watchForm.setValue("purchaseDate", date ? date.toISOString() : null)}
                        initialFocus
                      />
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
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
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
                  <Label>Target Sell Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...watchForm.register("targetSellPrice")} 
                      className="pl-7 bg-white border-slate-200" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date Listed</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-slate-200",
                          !watchForm.watch("dateListed") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchForm.watch("dateListed") ? format(new Date(watchForm.watch("dateListed")!), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar
                        mode="single"
                        selected={watchForm.watch("dateListed") ? new Date(watchForm.watch("dateListed")!) : undefined}
                        onSelect={(date) => {
                          watchForm.setValue("dateListed", date ? date.toISOString() : null);
                          if (date && watchForm.getValues("status") === "incoming") {
                            watchForm.setValue("status", "in_stock");
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sale Details</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="showSale" className="text-sm font-medium text-slate-500">Show Sale Fields</Label>
                  <Switch id="showSale" checked={showSaleDetails} onCheckedChange={setShowSaleDetails} />
                </div>
              </div>
              
              {showSaleDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label>Sold Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...watchForm.register("salePrice")} 
                        className="pl-7 bg-white border-slate-200" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Fees</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...watchForm.register("platformFees")} 
                        className="pl-7 bg-white border-slate-200" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sold On</Label>
                    <Select value={watchForm.watch("soldPlatform") || ""} onValueChange={(val) => watchForm.setValue("soldPlatform", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {SOLD_ON_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...watchForm.register("shippingFee")} 
                        className="pl-7 bg-white border-slate-200" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...watchForm.register("insuranceFee")} 
                        className="pl-7 bg-white border-slate-200" 
                      />
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
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                            !watchForm.watch("dateSold") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {watchForm.watch("dateSold") ? format(new Date(watchForm.watch("dateSold")!), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                        <Calendar
                          mode="single"
                          selected={watchForm.watch("dateSold") ? new Date(watchForm.watch("dateSold")!) : undefined}
                          onSelect={(date) => {
                            watchForm.setValue("dateSold", date ? date.toISOString() : null);
                            if (date) watchForm.setValue("status", "sold");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Service & Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...watchForm.register("serviceFee")} 
                      className="pl-7 bg-white border-slate-200" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Polish Fee</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...watchForm.register("polishFee")} 
                      className="pl-7 bg-white border-slate-200" 
                    />
                  </div>
                </div>
              </div>
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

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...expenseForm.register("description")} className="bg-white border-slate-200" placeholder="Monthly subscription..." data-testid="input-description" />
            </div>
            <div className="space-y-2">
              <Label>Amount (€)</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                {...expenseForm.register("amount")} 
                className="bg-white border-slate-200" 
                placeholder="10" 
                data-testid="input-amount" 
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select onValueChange={(val) => expenseForm.setValue("category", val as any)} defaultValue="other">
                <SelectTrigger className="bg-white border-slate-200" data-testid="select-category-form">
                  <SelectValue />
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
                    {expenseForm.watch("date") ? format(new Date(expenseForm.watch("date")!), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                  <Calendar
                    mode="single"
                    selected={expenseForm.watch("date") || new Date()}
                    onSelect={(date) => expenseForm.setValue("date", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Recurring Expense</Label>
                <p className="text-xs text-slate-500">Enable for monthly repeating costs</p>
              </div>
              <Switch
                checked={expenseForm.watch("isRecurring")}
                onCheckedChange={(checked) => expenseForm.setValue("isRecurring", checked)}
                data-testid="switch-recurring"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpenseMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-expense">
                {createExpenseMutation.isPending ? "Saving..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...clientForm.register("name")} className="bg-white border-slate-200" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  {...clientForm.register("type")} 
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
                <Input {...clientForm.register("email")} className="bg-white border-slate-200" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...clientForm.register("phone")} className="bg-white border-slate-200" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isVip"
                control={clientForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="isVip-dashboard"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-slate-300 data-[state=checked]:bg-emerald-600"
                  />
                )}
              />
              <Label htmlFor="isVip-dashboard" className="text-sm font-medium leading-none cursor-pointer">VIP Client</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createClientMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {createClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
