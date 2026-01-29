import { useInventory, useCreateInventory } from "@/hooks/use-inventory";
import { useClients } from "@/hooks/use-clients";
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
import { Search, Plus, Loader2, Watch, Filter, AlertTriangle, Box, FileText, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { differenceInDays } from "date-fns";

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

const PURCHASE_FROM_OPTIONS = ["Chrono24", "Eni Dealer", "Ayhan Dealer", "IPLAYWATCH Dealer"];
const PAID_WITH_OPTIONS = ["Credit", "Debit", "Wire"];

const createFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  
  purchasedFrom: z.string().optional().nullable(),
  paidWith: z.string().optional().nullable(),
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
  status: z.enum(["in_stock", "sold", "incoming", "servicing", "received"]).default("incoming"),
  condition: z.enum(["New", "Mint", "Used", "Damaged"]).default("Used"),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  soldPlatform: z.string().optional().nullable(),
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [hasBoxFilter, setHasBoxFilter] = useState<boolean | null>(null);
  const [hasPapersFilter, setHasPapersFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { data: inventory, isLoading } = useInventory();
  const { data: clients } = useClients();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateInventory();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      referenceNumber: "",
      serialNumber: "",
      internalSerial: "",
      year: new Date().getFullYear(),
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
      notes: "",
      shippingPartner: "",
      trackingNumber: "",
      soldPlatform: "",
    },
  });

  const onSubmit = (data: CreateFormValues) => {
    const submissionData = {
      ...data,
      purchasePrice: Math.round(data.purchasePrice * 100),
      importFee: Math.round(data.importFee * 100),
      serviceFee: Math.round(data.serviceFee * 100),
      polishFee: Math.round(data.polishFee * 100),
      salePrice: Math.round(data.salePrice * 100),
      platformFees: Math.round(data.platformFees * 100),
      shippingFee: Math.round(data.shippingFee * 100),
      insuranceFee: Math.round(data.insuranceFee * 100),
      targetSellPrice: Math.round(data.targetSellPrice * 100),
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      dateListed: data.dateListed ? new Date(data.dateListed) : null,
      dateSold: data.dateSold ? new Date(data.dateSold) : (data.status === 'sold' ? new Date() : null),
      soldDate: data.dateSold ? new Date(data.dateSold) : (data.status === 'sold' ? new Date() : null),
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

  // Get unique brands for filter
  const brands = useMemo(() => {
    if (!inventory) return [];
    const uniqueBrands = Array.from(new Set(inventory.map(item => item.brand)));
    return uniqueBrands.sort();
  }, [inventory]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!inventory) return { total: 0, active: 0, atService: 0, capitalDeployed: 0 };
    
    const total = inventory.length;
    const activeItems = inventory.filter(i => i.status !== 'sold');
    const active = activeItems.length;
    const atService = inventory.filter(i => i.status === 'servicing').length;
    const capitalDeployed = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);
    
    return { total, active, atService, capitalDeployed };
  }, [inventory]);

  // Calculate hold time for each item
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
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-emerald-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-emerald-600" />;
  };

  // Filter and Sort inventory
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

    // Apply sorting
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
          <p className="text-slate-500 mt-1">
            {metrics.active} active watches • {formatCurrency(metrics.capitalDeployed)} deployed
          </p>
        </div>
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
                    <Input {...form.register("model")} className="bg-white border-slate-200" placeholder="Submariner" data-testid="input-model" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference *</Label>
                    <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" placeholder="124060" data-testid="input-reference" />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial #</Label>
                    <Input {...form.register("serialNumber")} className="bg-white border-slate-200" data-testid="input-serial" />
                  </div>
                  <div className="space-y-2">
                    <Label>Movement Serial Number</Label>
                    <Input {...form.register("internalSerial")} className="bg-white border-slate-200" placeholder="Movement serial" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" {...form.register("year")} className="bg-white border-slate-200" placeholder="2023" />
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
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase From</Label>
                    <Select value={form.watch("purchasedFrom") || ""} onValueChange={(val) => form.setValue("purchasedFrom", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Source" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {PURCHASE_FROM_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Paid With</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>COGS (€) *</Label>
                    <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" data-testid="input-price" />
                    {form.formState.errors.purchasePrice && <p className="text-red-500 text-xs">{form.formState.errors.purchasePrice.message}</p>}
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox 
                      id="watchRegister" 
                      checked={form.watch("watchRegister")} 
                      onCheckedChange={(checked) => form.setValue("watchRegister", !!checked)} 
                    />
                    <Label htmlFor="watchRegister" className="cursor-pointer">Watch Register Check (€6)</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Status & Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.watch("status")} onValueChange={(val) => form.setValue("status", val as any)}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          <SelectItem value="incoming">Incoming</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="in_stock">Listed</SelectItem>
                          <SelectItem value="servicing">In Service</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Received</Label>
                      <Input 
                        type="date" 
                        {...form.register("purchaseDate")} 
                        className="bg-white border-slate-200" 
                        onChange={(e) => {
                          form.setValue("purchaseDate", e.target.value);
                          if (e.target.value) {
                            form.setValue("status", "received");
                          }
                        }}
                      />
                    </div>
                  <div className="space-y-2">
                    <Label>Date Listed</Label>
                    <Input type="date" {...form.register("dateListed")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Sold</Label>
                    <Input type="date" {...form.register("dateSold")} className="bg-white border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Costs & Fees (€)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Fee</Label>
                    <Input type="number" {...form.register("serviceFee")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Polish Fee</Label>
                    <Input type="number" {...form.register("polishFee")} className="bg-white border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Sale Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label>Sale Price (€) *</Label>
                    <Input type="number" {...form.register("salePrice")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Fees (€)</Label>
                    <Input type="number" {...form.register("platformFees")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Fee (€)</Label>
                    <Input type="number" {...form.register("shippingFee")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Fee (€)</Label>
                    <Input type="number" {...form.register("insuranceFee")} className="bg-white border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Shipping & Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shipper</Label>
                    <Select value={form.watch("shippingPartner") || ""} onValueChange={(val) => form.setValue("shippingPartner", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Shipper" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {SHIPPING_PARTNERS.map(shipper => (
                          <SelectItem key={shipper} value={shipper}>{shipper}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking #</Label>
                    <Input {...form.register("trackingNumber")} className="bg-white border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input {...form.register("notes")} className="bg-white border-slate-200" placeholder="Additional details..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-watch">
                  {createMutation.isPending ? "Adding..." : "Add Watch"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search brand, model, reference..." 
            className="pl-10 bg-white border-slate-200 text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200 text-slate-900">
              <Filter className="w-3 h-3 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">Listed</SelectItem>
              <SelectItem value="servicing">In Service</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200 text-slate-900">
              <Watch className="w-3 h-3 mr-2 text-slate-400" />
              <SelectValue placeholder="Brand" />
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

      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead onClick={() => handleSort('brand')} className="cursor-pointer font-semibold text-slate-900 h-12 hover:text-emerald-600 transition-colors">
                <div className="flex items-center">
                  Brand <SortIcon field="brand" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('model')} className="cursor-pointer font-semibold text-slate-900 h-12 hover:text-emerald-600 transition-colors">
                <div className="flex items-center">
                  Model <SortIcon field="model" />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-900 h-12">Ref.</TableHead>
              <TableHead onClick={() => handleSort('purchasePrice')} className="cursor-pointer font-semibold text-slate-900 h-12 hover:text-emerald-600 transition-colors">
                <div className="flex items-center">
                  Cost <SortIcon field="purchasePrice" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('holdTime')} className="cursor-pointer font-semibold text-slate-900 h-12 hover:text-emerald-600 transition-colors">
                <div className="flex items-center">
                  Hold Time <SortIcon field="holdTime" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('status')} className="cursor-pointer font-semibold text-slate-900 h-12 hover:text-emerald-600 transition-colors">
                <div className="flex items-center">
                  Status <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="w-[80px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-500 font-medium">
                  No watches found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer border-slate-100">
                  <TableCell className="font-medium text-slate-900 py-4">
                    <Link href={`/inventory/${item.id}`} className="block w-full h-full">
                      {item.brand}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600 py-4">
                    <Link href={`/inventory/${item.id}`} className="block w-full h-full">
                      {item.model}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/inventory/${item.id}`} className="block w-full h-full">
                      <Badge variant="outline" className="font-mono text-slate-500 border-slate-200 font-normal">
                        {item.referenceNumber}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 py-4">
                    {formatCurrency(item.purchasePrice)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center text-slate-500">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      {getHoldTime(item)} days
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={`border px-2.5 py-0.5 rounded-full font-medium ${getStatusStyles(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Link href={`/inventory/${item.id}`}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
