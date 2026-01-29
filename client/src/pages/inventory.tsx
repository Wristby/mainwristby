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
import { Search, Plus, Loader2, Watch, Filter, AlertTriangle, Box, FileText, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { differenceInDays } from "date-fns";

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
  watchRegister: z.string().optional().nullable(),
  
  servicePolishFee: z.coerce.number().optional().default(0),
  
  salePrice: z.coerce.number().optional().default(0),
  soldTo: z.string().optional().nullable(),
  platformFees: z.coerce.number().optional().default(0),
  shippingFee: z.coerce.number().optional().default(0),
  insuranceFee: z.coerce.number().optional().default(0),
  
  purchaseDate: z.string().optional().nullable(),
  dateListed: z.string().optional().nullable(),
  dateSold: z.string().optional().nullable(),
  
  targetSellPrice: z.coerce.number().optional().default(0),
  status: z.enum(["in_stock", "sold", "incoming", "servicing"]).default("incoming"),
  condition: z.enum(["New", "Mint", "Used", "Damaged"]).default("Used"),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  soldPlatform: z.string().optional().nullable(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val / 100);
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [hasBoxFilter, setHasBoxFilter] = useState<boolean | null>(null);
  const [hasPapersFilter, setHasPapersFilter] = useState<boolean | null>(null);
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
      year: undefined,
      purchasedFrom: "",
      paidWith: "",
      clientId: undefined,
      purchasePrice: 0,
      importFee: 0,
      watchRegister: "",
      servicePolishFee: 0,
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
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      dateListed: data.dateListed ? new Date(data.dateListed) : null,
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

  // Filter inventory
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    return inventory.filter((item) => {
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
  }, [inventory, search, statusFilter, brandFilter]);

  // Calculate hold time for each item
  const getHoldTime = (item: any) => {
    const purchaseDate = new Date(item.purchaseDate);
    const endDate = item.soldDate ? new Date(item.soldDate) : new Date();
    return differenceInDays(endDate, purchaseDate);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Listed';
      case 'servicing': return 'In Service';
      case 'incoming': return 'Incoming';
      case 'sold': return 'Sold';
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'servicing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'incoming': return 'bg-amber-50 text-amber-600 border-amber-100';
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
                    <Input {...form.register("brand")} className="bg-white border-slate-200" placeholder="Rolex" data-testid="input-brand" />
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
                    <Label>Internal Serial</Label>
                    <Input {...form.register("internalSerial")} className="bg-white border-slate-200" placeholder="Your internal ref" />
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
                    <Label>Purchased From</Label>
                    <Input {...form.register("purchasedFrom")} className="bg-white border-slate-200" placeholder="Chrono24, eBay, Dealer..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Paid With</Label>
                    <Select value={form.watch("paidWith") || ""} onValueChange={(val) => form.setValue("paidWith", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Euro">Euro</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source (Client/Dealer)</Label>
                    <Select onValueChange={(val) => form.setValue("clientId", parseInt(val))}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Source" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>COGS (cents) *</Label>
                    <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" data-testid="input-price" />
                    {form.formState.errors.purchasePrice && <p className="text-red-500 text-xs">{form.formState.errors.purchasePrice.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Import Fee (cents)</Label>
                    <Input type="number" {...form.register("importFee")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Watch Register</Label>
                    <Input {...form.register("watchRegister")} className="bg-white border-slate-200" />
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
                        <SelectItem value="in_stock">Listed</SelectItem>
                        <SelectItem value="servicing">In Service</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Received</Label>
                    <Input type="date" {...form.register("purchaseDate")} className="bg-white border-slate-200" />
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
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Costs & Fees (cents)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Service/Polish Fee</Label>
                    <Input type="number" {...form.register("servicePolishFee")} className="bg-white border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Sale Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sold To / Platform</Label>
                    <Input {...form.register("soldTo")} className="bg-white border-slate-200" placeholder="Buyer or Platform name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sold Platform</Label>
                    <Input {...form.register("soldPlatform")} className="bg-white border-slate-200" placeholder="Chrono24, eBay..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price (cents)</Label>
                    <Input type="number" {...form.register("salePrice")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Fees (cents)</Label>
                    <Input type="number" {...form.register("platformFees")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Fee (cents)</Label>
                    <Input type="number" {...form.register("shippingFee")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Fee (cents)</Label>
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
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="Ferrari">Ferrari Express</SelectItem>
                        <SelectItem value="Malca-Amit">Malca-Amit</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
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
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium text-slate-500">Total Watches</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{metrics.total}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium text-slate-500">Active Inventory</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{metrics.active}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium text-slate-500">At Service</p>
            <p className="text-3xl font-bold text-blue-600 mt-1 tabular-nums">{metrics.atService}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium text-slate-500">Capital Deployed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(metrics.capitalDeployed)}</p>
          </CardContent>
        </Card>
      </div>
      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by brand, model, reference, or serial..." 
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-emerald-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <div className="flex gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200" data-testid="select-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_stock">Listed</SelectItem>
                <SelectItem value="servicing">In Service</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200" data-testid="select-brand">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-box" 
                  checked={hasBoxFilter === true} 
                  onCheckedChange={(checked) => setHasBoxFilter(checked === true ? true : null)}
                />
                <Label htmlFor="filter-box" className="text-sm text-slate-600 cursor-pointer">Box</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="filter-papers" 
                  checked={hasPapersFilter === true} 
                  onCheckedChange={(checked) => setHasPapersFilter(checked === true ? true : null)}
                />
                <Label htmlFor="filter-papers" className="text-sm text-slate-600 cursor-pointer">Papers</Label>
              </div>
            </div>
            
            <span className="text-sm text-slate-500 ml-2">{filteredInventory.length} watches</span>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-500">Watch</TableHead>
                <TableHead className="text-slate-500">Reference</TableHead>
                <TableHead className="text-slate-500">Cost</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500 text-right">Hold Time</TableHead>
                <TableHead className="text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => {
                  const holdTime = getHoldTime(item);
                  const isAging = holdTime > 30 && item.status !== 'sold';
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      className="border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors"
                      data-testid={`inventory-row-${item.id}`}
                    >
                      <TableCell>
                        <Link href={`/inventory/${item.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                              <Watch className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-emerald-600">{item.brand}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-500">{item.model}</p>
                                {item.box && <Box className="w-3 h-3 text-emerald-600" />}
                                {item.papers && <FileText className="w-3 h-3 text-emerald-600" />}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm text-slate-900">{item.referenceNumber}</p>
                          {item.serialNumber && (
                            <p className="font-mono text-xs text-slate-400">{item.serialNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900 font-medium tabular-nums">
                        {formatCurrency(item.purchasePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusStyles(item.status)}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAging && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <span className={`tabular-nums ${isAging ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            {holdTime} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inventory/${item.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                            <Pencil className="h-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
