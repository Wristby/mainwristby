import { WatchIntake } from "@/components/watch-intake/watch-intake";
import { useInventory } from "@/hooks/use-inventory";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Loader2, Watch, Filter, AlertTriangle, Box, FileText, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Calendar, ExternalLink, Info, TrendingUp, Calendar as CalendarIcon, Download, Check, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { compareSoldDates, getSoldDate } from "@/lib/sold-date";
import { RowLink } from "@/components/row-link";
import { differenceInDays, endOfDay, endOfMonth, format, startOfDay, startOfMonth, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, parsePriceInput } from "@/lib/utils";
import { useSettings, useUpdateSetting } from "@/hooks/use-settings";
import { useAmsterdamClock } from "@/hooks/use-amsterdam-clock";
import { compareReturnDeadlines, matchesReturnWindowFilter, type ReturnWindowFilter } from "@/lib/sold-return";
import { SoldReturnSummary } from "@/components/sold-return-summary";

type SortField = 'id' | 'brand' | 'model' | 'purchasePrice' | 'holdTime' | 'status' | 'soldDate' | 'returnDeadline';
type SortOrder = 'asc' | 'desc';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val / 100);
};

const getServiceDurationDays = (item: any) => {
  const start = item.serviceStartDate ? new Date(item.serviceStartDate) : null;
  if (!start || Number.isNaN(start.getTime())) return null;
  const end = item.dateReturnedFromService || item.status !== "servicing" ? item.dateReturnedFromService : null;
  const effectiveEnd = end ? new Date(end) : new Date();
  if (Number.isNaN(effectiveEnd.getTime())) return null;
  return Math.max(0, differenceInDays(effectiveEnd, start));
};


export default function Inventory() {
  const now = useAmsterdamClock();
  const [search, setSearch] = useState("");
  const [location] = useLocation();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [hasBoxFilter, setHasBoxFilter] = useState<boolean | null>(null);
  const [returnWindowFilter, setReturnWindowFilter] = useState<ReturnWindowFilter>("all");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get("status");
    if (status) {
      setStatusFilter(status);
      if (status === "sold") {
        setSortField("soldDate");
        setSortOrder("desc");
      } else {
        setReturnWindowFilter("all");
        setSortField("id");
        setSortOrder("desc");
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location]);
  const [hasPapersFilter, setHasPapersFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { data: inventory, isLoading } = useInventory();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();
  const updateSettingMutation = useUpdateSetting();
  const [marginRate, setMarginRate] = useState<number>(settings.default_margin_rate);
  const [isEditingMarginRate, setIsEditingMarginRate] = useState(false);
  const [marginRateInput, setMarginRateInput] = useState("");

  useEffect(() => {
    setMarginRate(settings.default_margin_rate);
  }, [settings.default_margin_rate]);

  const brands = useMemo(() => {
    if (!inventory) return [];
    const uniqueBrands = Array.from(new Set(inventory.map(item => item.brand)));
    return uniqueBrands.sort();
  }, [inventory]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = startOfMonth(subMonths(new Date(), index));
      return {
        value: format(month, "yyyy-MM"),
        label: format(month, "MMMM yyyy"),
        from: startOfMonth(month),
        to: endOfMonth(month),
      };
    });
  }, []);

  const dateFilterLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Purchase Date";

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
    const projectedProfit = Math.round(capitalDeployed * marginRate / 100);
    
    const listedValue = inventory
      .filter(i => i.status === 'in_stock')
      .reduce((sum, i) => sum + i.purchasePrice, 0);
      
    const serviceValue = inventory
      .filter(i => i.status === 'servicing')
      .reduce((sum, i) => sum + ((i as any).serviceFee || 0) + ((i as any).polishFee || 0), 0);
      
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
  }, [inventory, marginRate]);

  const getHoldTime = (item: any) => {
    const startDate = item.dateReceived ? new Date(item.dateReceived) : null;
    if (!startDate) return 0;
    const endDate = item.status === "sold" && item.soldDate ? new Date(item.soldDate) : new Date();
    return Math.max(0, differenceInDays(endDate, startDate));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeadlineSort = () => {
    if (sortField === "returnDeadline") {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField("returnDeadline");
      setSortOrder("asc");
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
      const matchesReturnWindow = statusFilter !== "sold" || matchesReturnWindowFilter(item, returnWindowFilter, now);
      const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
      const purchaseDate = item.purchaseDate ? new Date(item.purchaseDate) : null;
      const rangeStart = dateRange?.from ? startOfDay(dateRange.from) : null;
      const rangeEnd = dateRange?.to ? endOfDay(dateRange.to) : rangeStart ? endOfDay(rangeStart) : null;
      const matchesDate = !rangeStart || !rangeEnd
        ? !rangeStart
        : !!purchaseDate && purchaseDate >= rangeStart && purchaseDate <= rangeEnd;
      const matchesBox = hasBoxFilter === null || item.box === hasBoxFilter;
      const matchesPapers = hasPapersFilter === null || item.papers === hasPapersFilter;
      
      return matchesSearch && matchesStatus && matchesReturnWindow && matchesBrand && matchesDate && matchesBox && matchesPapers;
    });

    result.sort((a, b) => {
      if (statusFilter === "sold" && sortField === "returnDeadline") {
        return compareReturnDeadlines(a, b, sortOrder, now);
      }
      if (sortField === "soldDate") return compareSoldDates(a, b, sortOrder);
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
  }, [inventory, search, statusFilter, brandFilter, dateRange, hasBoxFilter, hasPapersFilter, sortField, sortOrder, returnWindowFilter, now]);

  const exportToCSV = () => {
    if (!filteredInventory || filteredInventory.length === 0) {
      toast({ title: "No data", description: "No watches to export", variant: "destructive" });
      return;
    }
    
    const allHeaders = [
      "ID", "Brand", "Model", "Reference Number", "Serial Number", "Movement Serial", 
      "Year", "Condition", "Box", "Papers", "Status", "Purchased From", "Paid With",
      "Purchase Price (EUR)", "Import Fee (EUR)", "Watch Register", "Service Fee (EUR)", 
      "Polish Fee (EUR)", "Target Sell Price (EUR)", "Sale Price (EUR)", "Sold Date",
      "Platform Fees (EUR)", "Shipping Fee (EUR)", "Insurance Fee (EUR)", "Margin %",
      "Sold To", "Sold Platform", "Purchase Date", "Date Received", "Date Listed", "Hold Time (Days)",
      "Shipping Partner", "Tracking Number", "Google Drive Link", "Net Profit (EUR)", "Notes",
      "Service Start Date"
    ];
    const enabledCols = settings.inventory_export_columns as string[];
    const colIndices = allHeaders.map((h, i) => ({ header: h, index: i })).filter(c => !enabledCols.length || enabledCols.includes(c.header));
    const headers = colIndices.map(c => c.header);
    
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
      const wrFeeSnapshot = (item as any).watchRegisterFeeSnapshot ?? settings.watch_register_fee;
      const watchRegisterCost = item.watchRegister ? wrFeeSnapshot / 100 : 0;
      
      const totalCosts = purchasePrice + importFee + serviceFee + polishFee + watchRegisterCost + platformFees + shippingFee + insuranceFee;
      const profit = salePrice > 0 ? salePrice - totalCosts : 0;
      const margin = salePrice > 0 && totalCosts > 0 ? ((salePrice - totalCosts) / totalCosts * 100).toFixed(1) : "";
      const holdTime = getHoldTime(item);
      
      const allValues = [
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
        `"${(item.notes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        item.serviceStartDate ? format(new Date(item.serviceStartDate), "yyyy-MM-dd") : ""
      ];
      return colIndices.map(c => allValues[c.index]);
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
              {isEditingMarginRate ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={marginRateInput}
                    onChange={e => setMarginRateInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const parsed = parseFloat(marginRateInput);
                        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                          setMarginRate(parsed);
                          updateSettingMutation.mutate({ key: "default_margin_rate", value: parsed });
                          setIsEditingMarginRate(false);
                        }
                      }
                      if (e.key === "Escape") setIsEditingMarginRate(false);
                    }}
                    className="w-14 h-5 text-xs border border-slate-300 rounded px-1 text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    autoFocus
                  />
                  <span className="text-xs text-slate-400">%</span>
                  <button
                    onClick={() => {
                      const parsed = parseFloat(marginRateInput);
                      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                        setMarginRate(parsed);
                        updateSettingMutation.mutate({ key: "default_margin_rate", value: parsed });
                        setIsEditingMarginRate(false);
                      }
                    }}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setIsEditingMarginRate(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setMarginRateInput(String(marginRate)); setIsEditingMarginRate(true); }}
                        className="inline-flex items-center"
                        data-testid="button-edit-margin-rate"
                      >
                        <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based off a {marginRate}% margin — click to edit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            data-testid="button-export-csv"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md" data-testid="button-add-watch">
            <Plus className="w-4 h-4 mr-2" />Add Watch
          </Button>
          <WatchIntake open={isCreateOpen} onOpenChange={setIsCreateOpen} />
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
                <p className="text-sm font-medium text-slate-500">Incoming/Received Value</p>
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
          <Select value={statusFilter} onValueChange={(status) => {
            setStatusFilter(status);
            if (status === "sold") {
              setReturnWindowFilter("all");
              setSortField("soldDate");
              setSortOrder("desc");
            } else {
              setReturnWindowFilter("all");
              if (sortField === "soldDate" || sortField === "returnDeadline") {
                setSortField("id");
                setSortOrder("desc");
              }
            }
          }}>
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

          {statusFilter === "sold" && (
            <Select value={returnWindowFilter} onValueChange={(value) => setReturnWindowFilter(value as ReturnWindowFilter)}>
              <SelectTrigger className="w-[170px] bg-white border-slate-200 h-10" aria-label="Filter sold watches by return window">
                <SelectValue placeholder="All delivery states" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All delivery states</SelectItem>
                <SelectItem value="unconfirmed">Delivery unconfirmed</SelectItem>
                <SelectItem value="active">Active return window</SelectItem>
              </SelectContent>
            </Select>
          )}

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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[210px] justify-start bg-white border-slate-200 h-10 font-normal",
                  dateRange?.from && "text-slate-900"
                )}
                data-testid="button-purchase-date-filter"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{dateFilterLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-white border-slate-200" align="end">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Purchase Date</p>
                  <p className="text-xs text-slate-500 mt-1">Choose a month or select a custom range.</p>
                </div>
                <Select
                  value={selectedMonth}
                  onValueChange={(value) => {
                    setSelectedMonth(value);
                    if (value === "all") {
                      setDateRange(undefined);
                    } else if (value !== "custom") {
                      const month = monthOptions.find((option) => option.value === value);
                      if (month) setDateRange({ from: month.from, to: month.to });
                    }
                  }}
                >
                  <SelectTrigger className="w-[240px] bg-white border-slate-200">
                    <SelectValue placeholder="Quick month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="all">All purchase dates</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setSelectedMonth(range?.from ? "custom" : "all");
                  }}
                  numberOfMonths={1}
                  initialFocus
                />
                {dateRange?.from && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-900"
                    onClick={() => {
                      setDateRange(undefined);
                      setSelectedMonth("all");
                    }}
                  >
                    Clear date filter
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
              <TableHead>Listed At</TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('holdTime')}>
                <div className="flex items-center">Since Received <SortIcon field="holdTime" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status <SortIcon field="status" /></div>
              </TableHead>
              {statusFilter === "sold" && (
                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('soldDate')}>
                  <div className="flex items-center whitespace-nowrap">Date Sold <SortIcon field="soldDate" /></div>
                </TableHead>
              )}
              {statusFilter === "sold" && (
                <TableHead aria-sort={sortField === "returnDeadline" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    onClick={handleDeadlineSort}
                    className="inline-flex min-h-10 items-center rounded-sm text-left font-medium text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    aria-label={`Sort by return deadline${sortField === "returnDeadline" ? `, currently ${sortOrder === "asc" ? "earliest first" : "latest first"}` : ""}`}
                  >
                    Return window
                    {sortField === "returnDeadline"
                      ? sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4 text-emerald-600" /> : <ArrowDown className="ml-2 h-4 w-4 text-emerald-600" />
                      : <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />}
                  </button>
                </TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={statusFilter === "sold" ? 9 : 7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading inventory...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={statusFilter === "sold" ? 9 : 7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <p>No watches found matching your search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const serviceDurationDays = getServiceDurationDays(item);
                const isLongService = item.status === "servicing" && serviceDurationDays !== null && serviceDurationDays > 30;
                return (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "relative hover:bg-slate-50/50 transition-colors group cursor-pointer",
                    isLongService && "bg-amber-50/50"
                  )}
                >
                  <TableCell className="font-mono text-xs text-slate-500">
                    <RowLink
                      href={`/inventory/${item.id}`}
                      label={`Open ${item.brand} ${item.model}`}
                    />
                    #{item.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.brand}</span>
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
                      {item.status === "servicing" && serviceDurationDays !== null && (
                        <span className={cn(
                          "mt-1 inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          isLongService ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"
                        )}>
                          {`In service for ${serviceDurationDays} days`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700" data-testid={`text-list-price-${item.id}`}>
                    {item.listPrice != null && item.listPrice > 0 ? formatCurrency(item.listPrice) : <span className="text-slate-300">—</span>}
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
                  {statusFilter === "sold" && (
                    <TableCell className="whitespace-nowrap text-slate-700" data-testid={`text-sold-date-${item.id}`}>
                      {getSoldDate(item) ? format(getSoldDate(item)!, "MMM d, yyyy") : "—"}
                    </TableCell>
                  )}
                  {statusFilter === "sold" && (
                    <TableCell className="min-w-[190px] whitespace-nowrap">
                      <SoldReturnSummary deliveredDate={(item as any).deliveredDate} now={now} />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="relative z-10 flex justify-end gap-2">
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {statusFilter === "sold" && (
        <p className="text-xs text-slate-500">
          Return-window dates are an operational reminder, not a legal determination. Without a confirmed delivery date, the countdown has not started.
        </p>
      )}

    </div>
  );
}
