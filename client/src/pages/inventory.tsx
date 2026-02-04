import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  AlertTriangle,
  Download,
  Info,
  TrendingUp,
  Watch,
  Box,
  ExternalLink,
  Pencil,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWatchSchema, WATCH_BRANDS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";

type SortField = 'id' | 'brand' | 'model' | 'purchasePrice' | 'holdTime' | 'status';
type SortOrder = 'asc' | 'desc';

const SOLD_ON_OPTIONS = ["Chrono24", "eBay", "WhatsApp", "Instagram", "Dealer", "Other"];
const PURCHASE_FROM_OPTIONS = ["Dealer", "Private", "Auction", "Other"];
const PAID_WITH_OPTIONS = ["Wire", "Cash", "Crypto", "Other"];

export default function Inventory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [hasBoxFilter, setHasBoxFilter] = useState<boolean | null>(null);
  const [hasPapersFilter, setHasPapersFilter] = useState<boolean | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: inventory, isLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm({
    resolver: zodResolver(insertWatchSchema),
    defaultValues: {
      brand: "",
      model: "",
      referenceNumber: "",
      serialNumber: "",
      internalSerial: "",
      year: "",
      condition: "Used",
      box: false,
      papers: false,
      purchasePrice: 0,
      importFee: 0,
      purchaseDate: null,
      status: "incoming",
      dateReceived: null,
      dateListed: null,
      salePrice: 0,
      soldPlatform: "",
      platformFees: 0,
      shippingFee: 0,
      insuranceFee: 0,
      soldTo: "",
      dateSold: null,
      serviceFee: 0,
      polishFee: 0,
      dateSentToService: null,
      dateReturnedFromService: null,
      serviceNotes: "",
      notes: "",
      googleDriveLink: "",
      watchRegister: false,
      purchasedFrom: "Dealer",
      paidWith: "Wire",
      clientId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        purchasePrice: Math.round(Number(data.purchasePrice) * 100),
        importFee: Math.round(Number(data.importFee || 0) * 100),
        salePrice: data.salePrice ? Math.round(Number(data.salePrice) * 100) : 0,
        platformFees: data.platformFees ? Math.round(Number(data.platformFees) * 100) : 0,
        shippingFee: data.shippingFee ? Math.round(Number(data.shippingFee) * 100) : 0,
        insuranceFee: data.insuranceFee ? Math.round(Number(data.insuranceFee) * 100) : 0,
        serviceFee: data.serviceFee ? Math.round(Number(data.serviceFee) * 100) : 0,
        polishFee: data.polishFee ? Math.round(Number(data.polishFee) * 100) : 0,
      };
      const res = await apiRequest("POST", "/api/inventory", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Watch added to inventory" });
    },
  });

  const onSubmit = (data: any) => {
    // Ensure all numeric fields are properly handled as numbers
    const processedData = {
      ...data,
      purchasePrice: Number(data.purchasePrice) || 0,
      importFee: Number(data.importFee) || 0,
      salePrice: Number(data.salePrice) || 0,
      platformFees: Number(data.platformFees) || 0,
      shippingFee: Number(data.shippingFee) || 0,
      insuranceFee: Number(data.insuranceFee) || 0,
      serviceFee: Number(data.serviceFee) || 0,
      polishFee: Number(data.polishFee) || 0,
      year: data.year ? Number(data.year) : null,
    };
    createMutation.mutate(processedData);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const exportToCSV = () => {
    if (!filteredInventory) return;
    
    const headers = [
      "ID", "Brand", "Model", "Reference", "Serial #", "Movement Serial", 
      "Condition", "Status", "Box", "Papers", "Purchase Date", "COGS", 
      "Import Fee", "Service Fee", "Polish Fee", "Target Sell", "Sold Date", "Sold Price", "Margin %"
    ];
    
    const rows = filteredInventory.map(item => {
      const margin = item.salePrice ? 
        Math.round(((item.salePrice - (item.purchasePrice + (item.importFee || 0) + (item.serviceFee || 0) + (item.polishFee || 0))) / item.salePrice) * 100) : 0;
      
      return [
        item.id,
        item.brand,
        item.model,
        item.referenceNumber,
        item.serialNumber || "",
        item.internalSerial || "",
        item.condition,
        item.status,
        item.box ? "Yes" : "No",
        item.papers ? "Yes" : "No",
        item.purchaseDate ? format(new Date(item.purchaseDate), "yyyy-MM-dd") : "",
        (item.purchasePrice / 100).toFixed(0),
        ((item.importFee || 0) / 100).toFixed(0),
        ((item.serviceFee || 0) / 100).toFixed(0),
        ((item.polishFee || 0) / 100).toFixed(0),
        (Math.round(item.purchasePrice * 1.125) / 100).toFixed(0),
        item.dateSold ? format(new Date(item.dateSold), "yyyy-MM-dd") : "",
        item.salePrice ? (item.salePrice / 100).toFixed(0) : "",
        item.salePrice ? `${margin}%` : ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `chronos_inventory_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
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
                    </div>
                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Input {...form.register("model")} className="bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number *</Label>
                      <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Price (COGS) *</Label>
                      <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status *</Label>
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
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Add Watch</Button>
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
                <p className="text-sm font-medium text-slate-500">Service Value</p>
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
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[80px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">ID <SortIcon field="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('brand')}>
                <div className="flex items-center gap-1">Watch <SortIcon field="brand" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('purchasePrice')}>
                <div className="flex items-center gap-1">COGS <SortIcon field="purchasePrice" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('holdTime')}>
                <div className="flex items-center gap-1">Hold Time <SortIcon field="holdTime" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
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
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/inventory/${item.id}`)}
                >
                  <TableCell className="font-mono text-xs text-slate-500">#{item.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{item.brand}</span>
                      <span className="text-sm text-slate-500">{item.model}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                  <TableCell>{getHoldTime(item)} days</TableCell>
                  <TableCell>
                    <Badge className={cn("font-medium", getStatusStyles(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
