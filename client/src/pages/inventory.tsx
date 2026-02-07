import { useInventory, useCreateInventory } from "@/hooks/use-inventory";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2, Watch, Filter, AlertTriangle, Box, FileText, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Calendar, ExternalLink, Info, TrendingUp, Calendar as CalendarIcon, Download } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { differenceInDays, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const WATCH_BRANDS = [
  "Audemars Piguet", "Bell and Ross", "Blancpain", "Breguet", "Breitling",
  "Cartier", "Chopard", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
  "H. Moser and Cie", "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
  "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe", "Parmigiani",
  "Roger Dubuis", "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
  "Vacheron Constantin", "Zenith"
];

const SOLD_ON_OPTIONS = ["Chrono24", "Facebook Marketplace", "OLX", "Reddit", "Website"];
const SHIPPING_PARTNERS = ["DHL", "FedEx", "UPS"];

const PURCHASE_CHANNEL_OPTIONS = ["Dealer", "Chrono24", "Reddit", "eBay", "Private Purchase", "Other"];
const PAID_WITH_OPTIONS = ["Credit", "Debit", "Wire"];

const createFormSchema = z.object({
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

type CreateFormValues = z.infer<typeof createFormSchema>;

type SortField = 'id' | 'brand' | 'model' | 'purchasePrice' | 'holdTime' | 'status';
type SortOrder = 'asc' | 'desc';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val / 100);
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useLocation();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [hasBoxFilter, setHasBoxFilter] = useState<boolean | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get("status");
    if (status) {
      setStatusFilter(status);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location]);
  const [hasPapersFilter, setHasPapersFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { data: inventory, isLoading } = useInventory();
  const { data: clients } = useClients();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddType, setQuickAddType] = useState<string>("dealer");
  const [quickAddPhone, setQuickAddPhone] = useState("");
  const [quickAddCountry, setQuickAddCountry] = useState("");
  const { toast } = useToast();
  const createMutation = useCreateInventory();
  const quickAddClientMutation = useCreateClient();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
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
    },
  });

  const watchedSalePrice = Number(form.watch("salePrice"));
  const watchedSoldPlatform = form.watch("soldPlatform");
  const watchedStatus = form.watch("status");

  useEffect(() => {
    if (watchedSoldPlatform === "Chrono24" && watchedSalePrice > 0) {
      const fee = watchedSalePrice * 0.065;
      form.setValue("platformFees", Number(fee.toFixed(2)));
    }
  }, [watchedSalePrice, watchedSoldPlatform, form]);

  const watchedPurchaseChannel = form.watch("purchasedFrom");
  const showSellerField = watchedPurchaseChannel === "Dealer" || watchedPurchaseChannel === "Private Purchase" || watchedPurchaseChannel === "Other";
  const isSellerRequired = watchedPurchaseChannel === "Dealer";
  const filterDealersOnly = watchedPurchaseChannel === "Dealer";

  useEffect(() => {
    if (watchedPurchaseChannel && !["Dealer", "Private Purchase", "Other"].includes(watchedPurchaseChannel)) {
      form.setValue("clientId", null);
    }
  }, [watchedPurchaseChannel]);

  useEffect(() => {
    if (watchedStatus === "sold") {
      setShowSaleDetails(true);
    }
  }, [watchedStatus]);

  const [isPurchaseDateOpen, setIsPurchaseDateOpen] = useState(false);
  const [isDateReceivedOpen, setIsDateReceivedOpen] = useState(false);
  const [isDateListedOpen, setIsDateListedOpen] = useState(false);
  const [isDateSoldOpen, setIsDateSoldOpen] = useState(false);
  const [isDateSentOpen, setIsDateSentOpen] = useState(false);
  const [isDateReturnedOpen, setIsDateReturnedOpen] = useState(false);

  const onSubmit = (data: CreateFormValues) => {
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
      purchasePrice: Math.round(Number(data.purchasePrice) * 100),
      importFee: Math.round(Number(data.importFee) * 100),
      serviceFee: Math.round(Number(data.serviceFee) * 100),
      polishFee: Math.round(Number(data.polishFee) * 100),
      salePrice: Math.round(Number(data.salePrice) * 100),
      platformFees: Math.round(Number(data.platformFees) * 100),
      shippingFee: Math.round(Number(data.shippingFee) * 100),
      insuranceFee: Math.round(Number(data.insuranceFee) * 100),
      targetSellPrice: Math.round(Number(data.targetSellPrice) * 100),
      dateReceived: data.dateReceived || null,
      purchaseDate: data.purchaseDate || null,
      dateListed: data.dateListed || null,
      dateSold: data.dateSold || null,
      dateSentToService: data.dateSentToService || null,
      dateReturnedFromService: data.dateReturnedFromService || null,
      serviceNotes: data.serviceNotes || null,
    };
    createMutation.mutate(submissionData as any, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Success", description: "Inventory item added" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const brands = useMemo(() => {
    if (!inventory) return [];
    const uniqueBrands = Array.from(new Set(inventory.map(item => item.brand)));
    return uniqueBrands.sort();
  }, [inventory]);

  const metrics = useMemo(() => {
    if (!inventory) return { 
      total: 0, 
      active: 0, 
      atService: 0, 
      capitalDeployed: 0, 
      projectedProfit: 0,
      listedValue: 0,
      serviceValue: 0,
      incomingValue: 0
    };
    
    const total = inventory.length;
    const activeItems = inventory.filter(i => i.status !== 'sold');
    const active = activeItems.length;
    const atService = inventory.filter(i => i.status === 'servicing').length;
    const capitalDeployed = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);
    const projectedProfit = Math.round(capitalDeployed * 0.125);
    
    const listedValue = inventory
      .filter(i => i.status === 'in_stock')
      .reduce((sum, i) => sum + i.purchasePrice, 0);
      
    const serviceValue = inventory
      .filter(i => i.status === 'servicing')
      .reduce((sum, i) => sum + i.purchasePrice, 0);
      
    const incomingValue = inventory
      .filter(i => i.status === 'incoming' || i.status === 'received')
      .reduce((sum, i) => sum + i.purchasePrice, 0);
    
    return { 
      total, 
      active, 
      atService, 
      capitalDeployed, 
      projectedProfit,
      listedValue,
      serviceValue,
      incomingValue
    };
  }, [inventory]);

  const getHoldTime = (item: any) => {
    const purchaseDate = item.purchaseDate ? new Date(item.purchaseDate) : new Date();
    const endDate = item.status === "sold" && item.soldDate ? new Date(item.soldDate) : new Date();
    return Math.max(0, differenceInDays(endDate, purchaseDate));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-emerald-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-emerald-600" />;
  };

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    let result = inventory.filter((item) => {
      const term = search.toLowerCase();
      const matchesSearch = 
        item.brand.toLowerCase().includes(term) ||
        item.model.toLowerCase().includes(term) ||
        item.referenceNumber.toLowerCase().includes(term) ||
        (item.serialNumber?.toLowerCase().includes(term) ?? false);
      
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
      const matchesBox = hasBoxFilter === null || item.box === hasBoxFilter;
      const matchesPapers = hasPapersFilter === null || item.papers === hasPapersFilter;
      
      return matchesSearch && matchesStatus && matchesBrand && matchesBox && matchesPapers;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'brand':
          comparison = a.brand.localeCompare(b.brand);
          break;
        case 'model':
          comparison = a.model.localeCompare(b.model);
          break;
        case 'purchasePrice':
          comparison = a.purchasePrice - b.purchasePrice;
          break;
        case 'holdTime':
          comparison = getHoldTime(a) - getHoldTime(b);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [inventory, search, statusFilter, brandFilter, hasBoxFilter, hasPapersFilter, sortField, sortOrder]);

  const exportToCSV = () => {
    if (!filteredInventory || filteredInventory.length === 0) {
      toast({ title: "No data", description: "No watches to export", variant: "destructive" });
      return;
    }
    
    const headers = [
      "ID", "Brand", "Model", "Reference Number", "Serial Number", "Movement Serial", 
      "Year", "Condition", "Box", "Papers", "Status", "Purchased From", "Paid With",
      "Purchase Price (EUR)", "Import Fee (EUR)", "Watch Register", "Service Fee (EUR)", 
      "Polish Fee (EUR)", "Target Sell Price (EUR)", "Sale Price (EUR)", "Sold Date",
      "Platform Fees (EUR)", "Shipping Fee (EUR)", "Insurance Fee (EUR)", "Margin %",
      "Sold To", "Sold Platform", "Purchase Date", "Date Received", "Date Listed", "Hold Time (Days)",
      "Shipping Partner", "Tracking Number", "Google Drive Link", "Net Profit (EUR)", "Notes"
    ];
    
    const rows = filteredInventory.map((item: any) => {
      const purchasePrice = item.purchasePrice / 100;
      const salePrice = item.salePrice ? item.salePrice / 100 : 0;
      const importFee = item.importFee ? item.importFee / 100 : 0;
      const serviceFee = item.serviceFee ? item.serviceFee / 100 : 0;
      const polishFee = item.polishFee ? item.polishFee / 100 : 0;
      const platformFees = item.platformFees ? item.platformFees / 100 : 0;
      const shippingFee = item.shippingFee ? item.shippingFee / 100 : 0;
      const insuranceFee = item.insuranceFee ? item.insuranceFee / 100 : 0;
      const targetSellPrice = item.targetSellPrice ? item.targetSellPrice / 100 : 0;
      const watchRegisterCost = item.watchRegister ? 6 : 0;
      
      const totalCosts = purchasePrice + importFee + serviceFee + polishFee + watchRegisterCost + platformFees + shippingFee + insuranceFee;
      const profit = salePrice > 0 ? salePrice - totalCosts : 0;
      const margin = salePrice > 0 && totalCosts > 0 ? ((salePrice - totalCosts) / totalCosts * 100).toFixed(1) : "";
      const holdTime = getHoldTime(item);
      
      return [
        item.id,
        `"${item.brand}"`,
        `"${item.model.replace(/"/g, '""')}"`,
        `"${item.referenceNumber}"`,
        `"${item.serialNumber || ""}"`,
        `"${item.internalSerial || ""}"`,
        item.year || "",
        item.condition || "",
        item.box ? "Yes" : "No",
        item.papers ? "Yes" : "No",
        item.status,
        `"${item.purchasedFrom || ""}"`,
        `"${item.paidWith || ""}"`,
        purchasePrice,
        importFee,
        item.watchRegister ? "Yes" : "No",
        serviceFee,
        polishFee,
        targetSellPrice,
        salePrice,
        item.soldDate || item.dateSold ? format(new Date(item.soldDate || item.dateSold), "yyyy-MM-dd") : "",
        platformFees,
        shippingFee,
        insuranceFee,
        margin,
        `"${item.soldTo || ""}"`,
        `"${item.soldPlatform || ""}"`,
        item.purchaseDate ? format(new Date(item.purchaseDate), "yyyy-MM-dd") : "",
        item.dateReceived ? format(new Date(item.dateReceived), "yyyy-MM-dd") : "",
        item.dateListed ? format(new Date(item.dateListed), "yyyy-MM-dd") : "",
        holdTime,
        `"${item.shippingPartner || ""}"`,
        `"${item.trackingNumber || ""}"`,
        `"${item.gdriveLink || ""}"`,
        profit,
        `"${(item.notes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: `Exported ${filteredInventory.length} watches to CSV` });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Listed';
      case 'servicing': return 'In Service';
      case 'incoming': return 'Incoming';
      case 'received': return 'Received';
      case 'sold': return 'Sold';
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'servicing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'incoming': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'received': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'sold': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h2>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
            <span>{metrics.active} active watches</span>
            <span>•</span>
            <span>{formatCurrency(metrics.capitalDeployed)} deployed</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 font-medium">{formatCurrency(metrics.projectedProfit)} projected profit</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based off a 12.5% margin</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            data-testid="button-export-csv"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md" data-testid="button-add-watch">
                <Plus className="w-4 h-4 mr-2" />
                Add Watch
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900">
            <DialogHeader>
              <DialogTitle>Add New Watch</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Watch Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select value={form.watch("brand")} onValueChange={(val) => form.setValue("brand", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {WATCH_BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.brand && <p className="text-red-500 text-xs">{form.formState.errors.brand.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Input {...form.register("model")} className="bg-white border-slate-200" data-testid="input-model" />
                    {form.formState.errors.model && <p className="text-red-500 text-xs">{form.formState.errors.model.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number *</Label>
                    <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" data-testid="input-reference" />
                    {form.formState.errors.referenceNumber && <p className="text-red-500 text-xs">Reference Number is required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Serial #</Label>
                    <Input {...form.register("serialNumber")} className="bg-white border-slate-200" data-testid="input-serial" />
                  </div>
                  <div className="space-y-2">
                    <Label>Movement Serial Number</Label>
                    <Input {...form.register("internalSerial")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...form.register("year")} 
                      className="bg-white border-slate-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={form.watch("condition")} onValueChange={(val) => form.setValue("condition", val as any)}>
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
                      <Checkbox id="box" checked={form.watch("box")} onCheckedChange={(checked) => form.setValue("box", !!checked)} />
                      <Label htmlFor="box" className="cursor-pointer">Box</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="papers" checked={form.watch("papers")} onCheckedChange={(checked) => form.setValue("papers", !!checked)} />
                      <Label htmlFor="papers" className="cursor-pointer">Papers</Label>
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
                    <Input {...form.register("gdriveLink")} className="bg-white border-slate-200" placeholder="https://drive.google.com/..." />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Channel *</Label>
                    <Select value={form.watch("purchasedFrom") || ""} onValueChange={(val) => form.setValue("purchasedFrom", val)}>
                      <SelectTrigger className="bg-white border-slate-200" data-testid="select-purchase-channel">
                        <SelectValue placeholder="Select Channel" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {PURCHASE_CHANNEL_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.purchasedFrom && <p className="text-red-500 text-xs">Purchase channel is required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Paid With *</Label>
                    <Select value={form.watch("paidWith") || ""} onValueChange={(val) => form.setValue("paidWith", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Payment" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {PAID_WITH_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paidWith && <p className="text-red-500 text-xs">Payment method is required</p>}
                  </div>
                  {showSellerField && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 min-h-[1.5rem]">
                        <Label>Seller / Dealer{isSellerRequired ? ' *' : ''}</Label>
                        <Button size="icon" variant="ghost" onClick={() => { setQuickAddType(filterDealersOnly ? "dealer" : "client"); setIsQuickAddClientOpen(true); }} data-testid="button-quick-add-client" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Select value={form.watch("clientId")?.toString() || "none"} onValueChange={(val) => form.setValue("clientId", val === "none" ? null : parseInt(val))}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Select Dealer" />
                        </SelectTrigger>
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
                    <Label>Purchase Price (COGS) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        {...form.register("purchasePrice", {
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
                            form.setValue("purchasePrice", parseFloat(val.toFixed(2)));
                          }
                        }}
                        className="pl-7 bg-white border-slate-200" 
                        data-testid="input-purchase-price" 
                        placeholder="0,00"
                      />
                    </div>
                    {form.formState.errors.purchasePrice && <p className="text-red-500 text-xs">COGS is required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Import Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                      <Input 
                        type="text" 
                        {...form.register("importFee", {
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
                            form.setValue("importFee", parseFloat(val.toFixed(2)));
                          }
                        }}
                        className="pl-7 bg-white border-slate-200" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="watchRegister" checked={form.watch("watchRegister")} onCheckedChange={(checked) => form.setValue("watchRegister", !!checked)} />
                    <Label htmlFor="watchRegister" className="cursor-pointer">Watch Register (€6)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Popover open={isPurchaseDateOpen} onOpenChange={setIsPurchaseDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                            !form.watch("purchaseDate") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("purchaseDate") ? format(new Date(form.watch("purchaseDate")!), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                        <CalendarComponent
                          mode="single"
                          selected={form.watch("purchaseDate") ? new Date(form.watch("purchaseDate")!) : undefined}
                          onSelect={(date) => {
                            form.setValue("purchaseDate", date ? date.toISOString() : null);
                            if (date) form.setValue("status", "incoming");
                            setIsPurchaseDateOpen(false);
                          }}
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
                    <Select value={form.watch("status")} onValueChange={(val) => form.setValue("status", val as any)}>
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
                    <Label>Date Received</Label>
                    <Popover open={isDateReceivedOpen} onOpenChange={setIsDateReceivedOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-900",
                            !form.watch("dateReceived") && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("dateReceived") ? format(new Date(form.watch("dateReceived")!), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                        <CalendarComponent
                          mode="single"
                          selected={form.watch("dateReceived") ? new Date(form.watch("dateReceived")!) : undefined}
                          onSelect={(date) => {
                            form.setValue("dateReceived", date ? date.toISOString() : null);
                            if (date) form.setValue("status", "received");
                            setIsDateReceivedOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Listed</Label>
                    <Popover open={isDateListedOpen} onOpenChange={setIsDateListedOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-slate-200",
                            !form.watch("dateListed") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("dateListed") ? format(new Date(form.watch("dateListed")!), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                        <CalendarComponent
                          mode="single"
                          selected={form.watch("dateListed") ? new Date(form.watch("dateListed")!) : undefined}
                          onSelect={(date) => {
                            form.setValue("dateListed", date ? date.toISOString() : null);
                            if (date) form.setValue("status", "in_stock");
                            setIsDateListedOpen(false);
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
                          {...form.register("salePrice", {
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
                              form.setValue("salePrice", parseFloat(val.toFixed(2)));
                            }
                          }}
                          className="pl-7 bg-white border-slate-200" 
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sold On</Label>
                      <Select value={form.watch("soldPlatform") || ""} onValueChange={(val) => form.setValue("soldPlatform", val)}>
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
                        <Label>Platform Fees</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                          <Input 
                            type="text"
                            {...form.register("platformFees", {
                              setValueAs: (v) => v === "" ? 0 : parseFloat(v)
                            })}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                form.setValue("platformFees", parseFloat(val.toFixed(2)));
                              }
                            }}
                            className="pl-7 bg-white border-slate-200" 
                          />
                        </div>
                      </div>
                    <div className="space-y-2">
                      <Label>Shipping Fee</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                        <Input 
                          type="text" 
                          {...form.register("shippingFee", {
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
                              form.setValue("shippingFee", parseFloat(val.toFixed(2)));
                            }
                          }}
                          className="pl-7 bg-white border-slate-200" 
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance Fee</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                        <Input 
                          type="text" 
                          {...form.register("insuranceFee", {
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
                              form.setValue("insuranceFee", parseFloat(val.toFixed(2)));
                            }
                          }}
                          className="pl-7 bg-white border-slate-200" 
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Buyer Name</Label>
                      <Input {...form.register("soldTo")} className="bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date Sold</Label>
                      <Popover open={isDateSoldOpen} onOpenChange={setIsDateSoldOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white border-slate-200",
                              !form.watch("dateSold") && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("dateSold") ? format(new Date(form.watch("dateSold")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <CalendarComponent
                            mode="single"
                            selected={form.watch("dateSold") ? new Date(form.watch("dateSold")!) : undefined}
                            onSelect={(date) => {
                              form.setValue("dateSold", date ? date.toISOString() : null);
                              if (date) form.setValue("status", "sold");
                              setIsDateSoldOpen(false);
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
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Service & Maintenance</h3>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="showService" className="text-sm font-medium text-slate-500">Show Service Fields</Label>
                    <Switch id="showService" checked={showServiceDetails} onCheckedChange={setShowServiceDetails} />
                  </div>
                </div>
                
                {showServiceDetails && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Sent to Service</Label>
                        <Popover open={isDateSentOpen} onOpenChange={setIsDateSentOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-white border-slate-200",
                                !form.watch("dateSentToService") && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch("dateSentToService") ? format(new Date(form.watch("dateSentToService")!), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                            <CalendarComponent
                              mode="single"
                              selected={form.watch("dateSentToService") ? new Date(form.watch("dateSentToService")!) : undefined}
                              onSelect={(date) => {
                                form.setValue("dateSentToService", date ? date.toISOString() : null);
                                if (date) form.setValue("status", "servicing");
                                setIsDateSentOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Returned</Label>
                        <Popover open={isDateReturnedOpen} onOpenChange={setIsDateReturnedOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-white border-slate-200",
                                !form.watch("dateReturnedFromService") && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch("dateReturnedFromService") ? format(new Date(form.watch("dateReturnedFromService")!), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                            <CalendarComponent
                              mode="single"
                              selected={form.watch("dateReturnedFromService") ? new Date(form.watch("dateReturnedFromService")!) : undefined}
                              onSelect={(date) => {
                                form.setValue("dateReturnedFromService", date ? date.toISOString() : null);
                                setIsDateReturnedOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service Fee</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                          <Input 
                            type="text" 
                            {...form.register("serviceFee", {
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
                                form.setValue("serviceFee", parseFloat(val.toFixed(2)));
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
                            {...form.register("polishFee", {
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
                                form.setValue("polishFee", parseFloat(val.toFixed(2)));
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
                      <Textarea 
                        {...form.register("serviceNotes")} 
                        className="bg-white border-slate-200 min-h-[80px]" 
                        placeholder="Notes about the service work performed..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Notes</h3>
                <Textarea {...form.register("notes")} className="bg-white border-slate-200 min-h-[100px]" placeholder="Add any additional notes about the watch, movement condition, etc." />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Watch
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Listed Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(metrics.listedValue)}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Service Cost</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(metrics.serviceValue)}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <Watch className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Incoming Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(metrics.incomingValue)}
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-full">
                <Box className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search brand, model, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-slate-200 h-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200 h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">Listed</SelectItem>
              <SelectItem value="servicing">In Service</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200 h-10">
              <div className="flex items-center gap-2">
                <Watch className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="All Brands" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[80px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('brand')}>
                <div className="flex items-center">Watch <SortIcon field="brand" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('purchasePrice')}>
                <div className="flex items-center">COGS <SortIcon field="purchasePrice" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('holdTime')}>
                <div className="flex items-center">Hold Time <SortIcon field="holdTime" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status <SortIcon field="status" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading inventory...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <p>No watches found matching your search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setLocation(`/inventory/${item.id}`)}
                >
                  <TableCell className="font-mono text-xs text-slate-500">#{item.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{item.brand}</span>
                      <span className="text-sm text-slate-500">{item.model}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{item.referenceNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{formatCurrency(item.purchasePrice)}</span>
                      {item.purchaseDate && (
                        <span className="text-xs text-slate-400">{format(new Date(item.purchaseDate), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 font-normal">
                      {getHoldTime(item)} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-medium border shadow-none", getStatusStyles(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.gdriveLink && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.gdriveLink!, '_blank');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open Photos (Google Drive)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Link href={`/inventory/${item.id}?edit=true`}>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isQuickAddClientOpen} onOpenChange={setIsQuickAddClientOpen}>
        <DialogContent className="max-w-sm bg-white border-slate-200 text-slate-900" data-testid="dialog-quick-add-client">
          <DialogHeader>
            <DialogTitle>Quick Add {quickAddType === 'dealer' ? 'Dealer' : 'Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={quickAddName} onChange={(e) => setQuickAddName(e.target.value)} className="bg-white border-slate-200" placeholder="Enter name" data-testid="input-quick-add-name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={quickAddType} onValueChange={setQuickAddType}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={quickAddPhone} onChange={(e) => setQuickAddPhone(e.target.value)} className="bg-white border-slate-200" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={quickAddCountry} onChange={(e) => setQuickAddCountry(e.target.value)} className="bg-white border-slate-200" placeholder="Enter country" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsQuickAddClientOpen(false)}>Cancel</Button>
              <Button 
                disabled={!quickAddName.trim() || quickAddClientMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => {
                  quickAddClientMutation.mutate({
                    name: quickAddName,
                    type: quickAddType,
                    phone: quickAddPhone || undefined,
                    country: quickAddCountry || undefined,
                    email: "",
                    socialHandle: "",
                    website: "",
                    notes: "",
                    isVip: false,
                  } as any, {
                    onSuccess: (newClient: any) => {
                      form.setValue("clientId", newClient.id);
                      setIsQuickAddClientOpen(false);
                      setQuickAddName("");
                      setQuickAddType("dealer");
                      setQuickAddPhone("");
                      setQuickAddCountry("");
                      toast({ title: "Success", description: `${quickAddType === 'dealer' ? 'Dealer' : 'Client'} "${quickAddName}" added` });
                      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                    },
                    onError: (err: any) => {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    }
                  });
                }}
                data-testid="button-submit-quick-add"
              >
                {quickAddClientMutation.isPending ? "Adding..." : `Add ${quickAddType === 'dealer' ? 'Dealer' : 'Client'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
