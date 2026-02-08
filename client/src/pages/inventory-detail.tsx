import { useInventoryItem, useUpdateInventory, useDeleteInventory } from "@/hooks/use-inventory";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { insertClientSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, ArrowLeft, Trash2, Pencil, Calendar as CalendarIcon, Box, FileText, Check, ExternalLink, Wrench, Plus } from "lucide-react";
import { differenceInDays, format, startOfDay, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

const WATCH_BRANDS = [
  "Audemars Piguet", "Bell and Ross", "Blancpain", "Breguet", "Breitling",
  "Cartier", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
  "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
  "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe",
  "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
  "Vacheron Constantin", "Zenith"
];

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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val / 100);
};

const editFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  condition: z.enum(["New", "Mint", "Used", "Damaged"]).optional(),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  gdriveLink: z.string().optional().nullable(),
  
  purchasedFrom: z.string().optional().nullable(),
  paidWith: z.string().optional().nullable(),
  clientId: z.coerce.number().optional().nullable(),
  purchasePrice: z.coerce.number().min(1, "COGS is required"),
  importFee: z.coerce.number().optional().default(0),
  watchRegister: z.boolean().default(false),
  purchaseDate: z.string().optional().nullable(),
  
  status: z.enum(["in_stock", "sold", "incoming", "servicing", "received"]),
  dateReceived: z.string().optional().nullable(),
  dateListed: z.string().optional().nullable(),
  
  salePrice: z.coerce.number().optional().default(0),
  platformFees: z.coerce.number().optional().default(0),
  soldPlatform: z.string().optional().nullable(),
  shippingFee: z.coerce.number().optional().default(0),
  insuranceFee: z.coerce.number().optional().default(0),
  soldTo: z.string().optional().nullable(),
  dateSold: z.string().optional().nullable(),
  
  dateSentToService: z.string().optional().nullable(),
  dateReturnedFromService: z.string().optional().nullable(),
  serviceFee: z.coerce.number().optional().default(0),
  polishFee: z.coerce.number().optional().default(0),
  serviceNotes: z.string().optional().nullable(),
  
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  targetSellPrice: z.coerce.number().optional().default(0),
  notes: z.string().optional().nullable(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

export default function InventoryDetail() {
  const [match, params] = useRoute("/inventory/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: item, isLoading } = useInventoryItem(id);
  const { data: clients } = useClients();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const quickAddClientMutation = useCreateClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);

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

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      referenceNumber: "",
      serialNumber: "",
      internalSerial: "",
      year: undefined,
      condition: "Used",
      box: false,
      papers: false,
      gdriveLink: "",
      purchasedFrom: "",
      paidWith: "",
      clientId: undefined,
      purchasePrice: 0,
      importFee: 0,
      watchRegister: false,
      purchaseDate: "",
      status: "in_stock",
      dateReceived: "",
      dateListed: "",
      salePrice: 0,
      platformFees: 0,
      soldPlatform: "",
      shippingFee: 0,
      insuranceFee: 0,
      soldTo: "",
      dateSold: "",
      dateSentToService: "",
      dateReturnedFromService: "",
      serviceFee: 0,
      polishFee: 0,
      serviceNotes: "",
      shippingPartner: "",
      trackingNumber: "",
      targetSellPrice: 0,
      notes: "",
    },
  });

  const watchedStatus = form.watch("status");
  const watchedSalePrice = Number(form.watch("salePrice"));
  const watchedSoldPlatform = form.watch("soldPlatform");

  useEffect(() => {
    if (watchedStatus === "sold") {
      setShowSaleDetails(true);
    }
    if (watchedStatus === "servicing") {
      setShowServiceDetails(true);
    }
  }, [watchedStatus]);

  useEffect(() => {
    if (watchedSoldPlatform === "Chrono24" && watchedSalePrice > 0) {
      const fee = watchedSalePrice * 0.065;
      form.setValue("platformFees", Number(fee.toFixed(2)));
    }
  }, [watchedSalePrice, watchedSoldPlatform, form.setValue]);

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
    if (item) {
      const hasSaleData = (item as any).salePrice > 0 || item.soldDate || (item as any).dateSold;
      const hasServiceData = (item as any).serviceFee > 0 || (item as any).polishFee > 0 || (item as any).dateSentToService;
      const hasShippingData = item.shippingPartner || item.trackingNumber;
      setShowSaleDetails(hasSaleData);
      setShowServiceDetails(hasServiceData);
      setShowShippingDetails(!!hasShippingData);
      
      form.reset({
        brand: item.brand,
        model: item.model,
        referenceNumber: item.referenceNumber,
        serialNumber: item.serialNumber || "",
        internalSerial: (item as any).internalSerial || "",
        year: item.year || undefined,
        condition: (item.condition as "New" | "Mint" | "Used" | "Damaged") || "Used",
        box: item.box || false,
        papers: item.papers || false,
        gdriveLink: item.gdriveLink || "",
        purchasedFrom: (item as any).purchasedFrom || "",
        paidWith: (item as any).paidWith || "",
        clientId: item.clientId || undefined,
        purchasePrice: item.purchasePrice / 100,
        importFee: ((item as any).importFee || 0) / 100,
        watchRegister: !!(item as any).watchRegister,
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString() : "",
        status: item.status as "in_stock" | "sold" | "incoming" | "servicing" | "received",
        dateReceived: (item as any).dateReceived ? new Date((item as any).dateReceived).toISOString() : "",
        dateListed: item.dateListed ? new Date(item.dateListed).toISOString() : "",
        salePrice: ((item as any).salePrice || 0) / 100,
        platformFees: ((item as any).platformFees || 0) / 100,
        soldPlatform: item.soldPlatform || "",
        shippingFee: ((item as any).shippingFee || 0) / 100,
        insuranceFee: ((item as any).insuranceFee || 0) / 100,
        soldTo: (item as any).soldTo || "",
        dateSold: (item.soldDate || (item as any).dateSold) ? new Date((item.soldDate || (item as any).dateSold)).toISOString() : "",
        dateSentToService: (item as any).dateSentToService ? new Date((item as any).dateSentToService).toISOString() : "",
        dateReturnedFromService: (item as any).dateReturnedFromService ? new Date((item as any).dateReturnedFromService).toISOString() : "",
        serviceFee: ((item as any).serviceFee || 0) / 100,
        polishFee: ((item as any).polishFee || 0) / 100,
        serviceNotes: (item as any).serviceNotes || "",
        shippingPartner: item.shippingPartner || "",
        trackingNumber: item.trackingNumber || "",
        targetSellPrice: (item.targetSellPrice || 0) / 100,
        notes: item.notes || "",
      });
    }
  }, [item, form.reset]);

  const [isPurchaseDateOpen, setIsPurchaseDateOpen] = useState(false);
  const [isDateReceivedOpen, setIsDateReceivedOpen] = useState(false);
  const [isDateListedOpen, setIsDateListedOpen] = useState(false);
  const [isDateSoldOpen, setIsDateSoldOpen] = useState(false);
  const [isDateSentOpen, setIsDateSentOpen] = useState(false);
  const [isDateReturnedOpen, setIsDateReturnedOpen] = useState(false);

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!item) return <div className="text-slate-600">Item not found</div>;

  const handleDelete = () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          window.location.href = "/inventory";
        }
      });
    }
  };

  const onSubmitEdit = (data: EditFormValues) => {
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
      soldDate: data.dateSold || (finalStatus === 'sold' ? new Date().toISOString() : null),
      dateSentToService: data.dateSentToService || null,
      dateReturnedFromService: data.dateReturnedFromService || null,
      serviceNotes: data.serviceNotes || null,
    };
    updateMutation.mutate(
      { id, ...submissionData as any },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          toast({ title: "Success", description: "Watch updated successfully" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
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
      case 'in_stock': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'servicing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'incoming': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'received': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'sold': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const totalCosts = item.purchasePrice + 
    ((item as any).importFee || 0) + 
    ((item as any).serviceFee || 0) + 
    ((item as any).polishFee || 0) +
    ((item as any).platformFees || 0) + 
    ((item as any).shippingFee || 0) + 
    ((item as any).insuranceFee || 0) +
    ((item as any).watchRegister ? 600 : 0);
  
  const salePrice = (item as any).salePrice || 0;
  const profit = salePrice > 0 ? salePrice - totalCosts : 0;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
  
  const getEndDate = () => {
    if (item.status === 'sold' && (item.soldDate || (item as any).dateSold || item.dateSold)) {
      const soldDateStr = item.soldDate || (item as any).dateSold || item.dateSold;
      return startOfDay(typeof soldDateStr === 'string' ? parseISO(soldDateStr) : new Date(soldDateStr));
    }
    return startOfDay(new Date());
  };
  
  const holdTime = item.purchaseDate 
    ? Math.max(0, differenceInDays(
        getEndDate(),
        startOfDay(typeof item.purchaseDate === 'string' ? parseISO(item.purchaseDate) : new Date(item.purchaseDate))
      )) 
    : 0;
  const daysInStock = item.dateReceived
    ? Math.max(0, differenceInDays(
        getEndDate(),
        startOfDay(typeof item.dateReceived === 'string' ? parseISO(item.dateReceived) : new Date(item.dateReceived))
      ))
    : 0;
  const totalFees = ((item as any).platformFees || 0) + ((item as any).shippingFee || 0) + ((item as any).insuranceFee || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {item.brand} {item.model}
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
              {item.referenceNumber}
            </Badge>
          </h1>
          <p className="text-slate-500 text-sm mt-1">ID: #{item.id} • Serial: {item.serialNumber || 'N/A'}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50" data-testid="button-edit-watch">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900">
              <DialogHeader>
                <DialogTitle>Edit Watch</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-6 mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Watch Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Brand *</Label>
                      <Select value={form.watch("brand")} onValueChange={(val) => form.setValue("brand", val)}>
                        <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          {WATCH_BRANDS.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Input {...form.register("model")} className="bg-white border-slate-200" data-testid="edit-input-model" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number *</Label>
                      <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" data-testid="edit-input-reference" />
                    </div>
                    <div className="space-y-2">
                      <Label>Serial #</Label>
                      <Input {...form.register("serialNumber")} className="bg-white border-slate-200" data-testid="edit-input-serial" />
                    </div>
                    <div className="space-y-2">
                      <Label>Movement Serial Number</Label>
                      <Input {...form.register("internalSerial")} className="bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" {...form.register("year")} className="bg-white border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={form.watch("condition")} onValueChange={(val) => form.setValue("condition", val as any)}>
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
                        <Checkbox id="edit-box" checked={form.watch("box")} onCheckedChange={(checked) => form.setValue("box", !!checked)} />
                        <Label htmlFor="edit-box" className="cursor-pointer">Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit-papers" checked={form.watch("papers")} onCheckedChange={(checked) => form.setValue("papers", !!checked)} />
                        <Label htmlFor="edit-papers" className="cursor-pointer">Papers</Label>
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
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-purchase-channel"><SelectValue placeholder="Select Channel" /></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          {PURCHASE_CHANNEL_OPTIONS.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {showSellerField && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 min-h-[1.5rem]">
                          <Label>Seller / Dealer{isSellerRequired ? ' *' : ''}</Label>
                          <Button size="icon" variant="ghost" onClick={() => { quickClientForm.setValue("type", filterDealersOnly ? "dealer" : "client"); setIsQuickAddClientOpen(true); }} data-testid="button-quick-add-client" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
                        </div>
                        <Select value={form.watch("clientId")?.toString() || "none"} onValueChange={(val) => form.setValue("clientId", val === "none" ? null : parseInt(val))}>
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
                      <Select value={form.watch("paidWith") || ""} onValueChange={(val) => form.setValue("paidWith", val)}>
                        <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Payment" /></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                          {PAID_WITH_OPTIONS.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
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
                          data-testid="edit-input-price" 
                          placeholder="0,00"
                        />
                      </div>
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
                      <Checkbox id="edit-watchRegister" checked={form.watch("watchRegister")} onCheckedChange={(checked) => form.setValue("watchRegister", !!checked)} />
                      <Label htmlFor="edit-watchRegister" className="cursor-pointer">Watch Register (€6)</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Date</Label>
                      <Popover open={isPurchaseDateOpen} onOpenChange={setIsPurchaseDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("purchaseDate") && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("purchaseDate") ? format(new Date(form.watch("purchaseDate")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <Calendar mode="single" selected={form.watch("purchaseDate") ? new Date(form.watch("purchaseDate")!) : undefined} onSelect={(date) => { form.setValue("purchaseDate", date ? date.toISOString() : null); if (date) form.setValue("status", "incoming"); setIsPurchaseDateOpen(false); }} initialFocus />
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
                      <Popover open={isDateReceivedOpen} onOpenChange={setIsDateReceivedOpen}>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-900", !form.watch("dateReceived") && "text-slate-500")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("dateReceived") ? format(new Date(form.watch("dateReceived")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <Calendar mode="single" selected={form.watch("dateReceived") ? new Date(form.watch("dateReceived")!) : undefined} onSelect={(date) => { form.setValue("dateReceived", date ? date.toISOString() : null); if (date) form.setValue("status", "received"); setIsDateReceivedOpen(false); }} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Listed</Label>
                      <Popover open={isDateListedOpen} onOpenChange={setIsDateListedOpen}>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateListed") && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("dateListed") ? format(new Date(form.watch("dateListed")!), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                          <Calendar mode="single" selected={form.watch("dateListed") ? new Date(form.watch("dateListed")!) : undefined} onSelect={(date) => { form.setValue("dateListed", date ? date.toISOString() : null); if (date) form.setValue("status", "in_stock"); setIsDateListedOpen(false); }} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sale Details</h3>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="edit-showSale" className="text-sm font-medium text-slate-500">Show Sale Fields</Label>
                      <Switch id="edit-showSale" checked={showSaleDetails} onCheckedChange={setShowSaleDetails} />
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
                          <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Platform" /></SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-slate-900">
                            {SOLD_ON_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateSold") && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch("dateSold") ? format(new Date(form.watch("dateSold")!), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                            <Calendar mode="single" selected={form.watch("dateSold") ? new Date(form.watch("dateSold")!) : undefined} onSelect={(date) => { form.setValue("dateSold", date ? date.toISOString() : null); if (date) form.setValue("status", "sold"); setIsDateSoldOpen(false); }} initialFocus />
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
                      <Label htmlFor="edit-showService" className="text-sm font-medium text-slate-500">Show Service Fields</Label>
                      <Switch id="edit-showService" checked={showServiceDetails} onCheckedChange={setShowServiceDetails} />
                    </div>
                  </div>
                  {showServiceDetails && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date Sent to Service</Label>
                          <Popover open={isDateSentOpen} onOpenChange={setIsDateSentOpen}>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateSentToService") && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.watch("dateSentToService") ? format(new Date(form.watch("dateSentToService")!), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                              <Calendar mode="single" selected={form.watch("dateSentToService") ? new Date(form.watch("dateSentToService")!) : undefined} onSelect={(date) => { form.setValue("dateSentToService", date ? date.toISOString() : null); if (date) form.setValue("status", "servicing"); setIsDateSentOpen(false); }} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Date Returned</Label>
                          <Popover open={isDateReturnedOpen} onOpenChange={setIsDateReturnedOpen}>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateReturnedFromService") && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.watch("dateReturnedFromService") ? format(new Date(form.watch("dateReturnedFromService")!), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                              <Calendar mode="single" selected={form.watch("dateReturnedFromService") ? new Date(form.watch("dateReturnedFromService")!) : undefined} onSelect={(date) => { form.setValue("dateReturnedFromService", date ? date.toISOString() : null); setIsDateReturnedOpen(false); }} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Service Fee</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                            <Input 
                              type="text" 
                              {...form.register("serviceFee", {
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
                        <Textarea {...form.register("serviceNotes")} className="bg-white border-slate-200 min-h-[80px]" placeholder="Notes about service work performed..." />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Shipping & Tracking</h3>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="edit-showShipping" className="text-sm font-medium text-slate-500">Show Shipping Fields</Label>
                      <Switch id="edit-showShipping" checked={showShippingDetails} onCheckedChange={setShowShippingDetails} />
                    </div>
                  </div>
                  
                  {showShippingDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label>Shipping Partner</Label>
                        <Select value={form.watch("shippingPartner") || ""} onValueChange={(val) => form.setValue("shippingPartner", val)}>
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
                        <Input {...form.register("trackingNumber")} className="bg-white border-slate-200" placeholder="Enter tracking number" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Notes</h3>
                  <Textarea {...form.register("notes")} className="bg-white border-slate-200 min-h-[100px]" placeholder="Add any additional notes about the watch, movement condition, etc." />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]">
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} data-testid="button-delete-watch">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Watch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Brand</p>
                  <p className="text-slate-900 font-medium mt-1">{item.brand}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Model</p>
                  <p className="text-slate-900 font-medium mt-1">{item.model}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</p>
                  <p className="text-slate-900 font-medium mt-1">{item.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Serial #</p>
                  <p className="text-slate-900 font-medium mt-1">{item.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Movement Serial Number</p>
                  <p className="text-slate-900 font-medium mt-1">{(item as any).internalSerial || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Year</p>
                  <p className="text-slate-900 font-medium mt-1">{item.year || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Condition</p>
                  <p className="text-slate-900 font-medium mt-1">{item.condition}</p>
                </div>
                {item.gdriveLink && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Google Drive Link</p>
                    <a 
                      href={item.gdriveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
                    >
                      View Photos <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Includes</p>
                  <div className="flex gap-2 mt-1">
                    {item.box && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Box</Badge>}
                    {item.papers && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Papers</Badge>}
                    {!item.box && !item.papers && <span className="text-slate-400 text-sm">Watch only</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Purchase Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Purchase Channel</span>
                  <span className="text-sm font-medium text-slate-900">{(item as any).purchasedFrom || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Paid With</span>
                  <span className="text-sm font-medium text-slate-900">{(item as any).paidWith || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">COGS</span>
                  <span className="text-sm font-medium text-slate-900 font-mono">{formatCurrency(item.purchasePrice)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Import Fee</span>
                  <span className="text-sm font-medium text-slate-900 font-mono">{formatCurrency((item as any).importFee || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Watch Register Check</span>
                  <span className="text-sm font-medium text-slate-900">{(item as any).watchRegister ? 'Yes (€6.00)' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">COGS</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(item.purchasePrice)}</p>
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Sale Price</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(salePrice)}</p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Net Profit</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(profit)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Margin</p>
                  <p className="text-xl font-bold text-emerald-600">{margin.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Hold Time</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{holdTime} days</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Fees</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(totalFees)}</p>
                </div>
              </div>

              {/* Financial Pillars - 2 Row Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pillar A: Investment (Procurement) */}
                <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">The Investment</h4>
                  <p className="text-xs text-slate-400 mb-4">Procurement costs to acquire the watch</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Purchase Price</span>
                      <span className="font-medium">{formatCurrency(item.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Import/Customs Fee</span>
                      <span className="font-medium">{formatCurrency((item as any).importFee || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Watch Register</span>
                      <span className="font-medium">{formatCurrency((item as any).watchRegister ? 600 : 0)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">Total Sourcing</span>
                      <span className="text-slate-900">{formatCurrency(item.purchasePrice + ((item as any).importFee || 0) + ((item as any).watchRegister ? 600 : 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Pillar B: Value-Add (Maintenance) */}
                <div className="p-5 bg-amber-50/30 rounded-xl border border-amber-100/50">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-4">Value-Add</h4>
                  <p className="text-xs text-slate-400 mb-4">Costs to make the watch retail-ready</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Service Fee</span>
                      <span className="font-medium">{formatCurrency((item as any).serviceFee || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Polish Fee</span>
                      <span className="font-medium">{formatCurrency((item as any).polishFee || 0)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-amber-700">Total Value-Add</span>
                      <span className="text-amber-900">{formatCurrency(((item as any).serviceFee || 0) + ((item as any).polishFee || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Pillar C: Transaction (Exit) - Shown on second row if sold */}
                {item.status === 'sold' && (
                  <div className="p-5 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">The Transaction</h4>
                    <p className="text-xs text-slate-400 mb-4">Exit details and final outcome</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Sale Price</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(salePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Platform Fees</span>
                        <span className="font-medium text-red-500">-{formatCurrency((item as any).platformFees || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Shipping Fee</span>
                        <span className="font-medium text-red-500">-{formatCurrency((item as any).shippingFee || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Insurance Fee</span>
                        <span className="font-medium text-red-500">-{formatCurrency((item as any).insuranceFee || 0)}</span>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-emerald-700">Net Profit</span>
                        <span className={profit >= 0 ? "text-emerald-600" : "text-red-600"}>{formatCurrency(profit)}</span>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Sold To</span>
                        <span className="font-medium">{(item as any).soldTo || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Shipper</span>
                        <span className="font-medium">{item.shippingPartner || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tracking #</span>
                        <span className="font-medium">{item.trackingNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Details - shows when info exists and item is not sold (sold items show in Transaction pillar) */}
              {item.status !== 'sold' && (item.shippingPartner || item.trackingNumber) && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Shipping Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Shipper</span>
                      <span className="font-medium">{item.shippingPartner || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tracking #</span>
                      <span className="font-medium">{item.trackingNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Expenses Section */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Additional Expenses</h4>
                <div className="space-y-2">
                  {(item as any).expenses && (item as any).expenses.length > 0 ? (
                    (item as any).expenses.map((expense: any) => (
                      <div key={expense.id} className="flex justify-between text-sm gap-4">
                        <span className="text-slate-500 line-clamp-2">{expense.description}</span>
                        <span className="font-medium shrink-0">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No additional expenses recorded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current State</Label>
                  <div className="mt-2 flex">
                    <Badge variant="outline" className={cn("font-medium px-3 py-1", getStatusStyles(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>

                {item.purchaseDate && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Purchased</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date(item.purchaseDate), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}
                
                {item.dateReceived && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Received</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date(item.dateReceived), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}
                {item.dateListed && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Listed</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date(item.dateListed), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}
                
                {(item as any).dateSentToService && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sent to Service</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Wrench className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date((item as any).dateSentToService), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}

                {(item as any).dateReturnedFromService && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Returned from Service</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date((item as any).dateReturnedFromService), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}

                {(item as any).dateShipped && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Shipped</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date((item as any).dateShipped), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}

                {(item.soldDate || (item as any).dateSold) && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Sold</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">{format(new Date(item.soldDate || (item as any).dateSold || ""), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isQuickAddClientOpen} onOpenChange={(open) => { setIsQuickAddClientOpen(open); if (!open) quickClientForm.reset(); }}>
        <DialogContent className="bg-white border-slate-200 text-slate-900" data-testid="dialog-quick-add-client">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={quickClientForm.handleSubmit((data) => {
            quickAddClientMutation.mutate(data, {
              onSuccess: (newClient: any) => {
                form.setValue("clientId", newClient.id);
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
              <Button type="submit" disabled={quickAddClientMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-quick-add">
                {quickAddClientMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
