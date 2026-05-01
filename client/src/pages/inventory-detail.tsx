import { useInventoryItem, useInventory, useUpdateInventory, useDeleteInventory } from "@/hooks/use-inventory";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { insertClientSchema, insertExpenseSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Loader2, ArrowLeft, Trash2, Pencil, Calendar as CalendarIcon, Box, FileText, Check, ExternalLink, Wrench, Plus, Sparkles, Copy, ChevronDown } from "lucide-react";
import { differenceInDays, format, startOfDay, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, parsePriceInput } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

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

const getTrackingUrl = (partner: string | null | undefined, trackingNumber: string | null | undefined): string | null => {
  if (!partner || !trackingNumber) return null;
  switch (partner) {
    case "UPS": return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
    case "FedEx": return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
    case "DHL": return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`;
    default: return null;
  }
};

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
  
  serviceStartDate: z.string().optional().nullable(),
  dateSentToService: z.string().optional().nullable(),
  dateReturnedFromService: z.string().optional().nullable(),
  serviceFee: z.coerce.number().optional().default(0),
  polishFee: z.coerce.number().optional().default(0),
  serviceNotes: z.string().optional().nullable(),
  
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  targetSellPrice: z.coerce.number().optional().default(0),
  listPrice: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type EditFormValues = z.infer<typeof editFormSchema>;


const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().min(0.01, "Amount is required"),
  date: z.coerce.date(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function InventoryDetail() {
  const [match, params] = useRoute("/inventory/:id");
  const id = params ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  const { data: item, isLoading } = useInventoryItem(id);
  const { data: allInventory } = useInventory();
  const { data: clients } = useClients();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const quickAddClientMutation = useCreateClient();
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const { toast } = useToast();
  const { settings } = useSettings();
  const WATCH_BRANDS = settings.watch_brands;
  const SOLD_ON_OPTIONS = settings.sales_platforms;
  const SHIPPING_PARTNERS = settings.shipping_partners;
  const PURCHASE_CHANNEL_OPTIONS = settings.purchase_channels;
  const EXPENSE_CATEGORIES = settings.expense_categories;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [scrollToSaleOnOpen, setScrollToSaleOnOpen] = useState(false);
  const salesSectionRef = useRef<HTMLDivElement>(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "other",
      date: new Date(),
      isRecurring: false,
      inventoryId: id,
    },
  });

  const onExpenseSubmit = (data: ExpenseFormValues) => {
    const submitData = {
      ...data,
      amount: Math.round(data.amount * 100),
      inventoryId: id,
      date: data.date instanceof Date ? data.date : new Date(data.date),
    };
    createExpenseMutation.mutate(submitData, {
      onSuccess: () => {
        setIsAddExpenseOpen(false);
        expenseForm.reset({ description: "", amount: 0, category: "other", date: new Date(), isRecurring: false, inventoryId: id });
        queryClient.invalidateQueries({ queryKey: ["/api/inventory", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        toast({ title: "Success", description: "Expense added to this watch" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleDeleteExpense = (expenseId: number) => {
    deleteExpenseMutation.mutate(expenseId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/inventory", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        toast({ title: "Success", description: "Expense removed" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

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
      serviceStartDate: "",
      dateSentToService: "",
      dateReturnedFromService: "",
      serviceFee: 0,
      polishFee: 0,
      serviceNotes: "",
      shippingPartner: "",
      trackingNumber: "",
      targetSellPrice: 0,
      listPrice: null,
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
      const fee = watchedSalePrice * (settings.chrono24_commission / 100);
      form.setValue("platformFees", Number(fee.toFixed(2)));
    }
  }, [watchedSalePrice, watchedSoldPlatform, form.setValue, settings.chrono24_commission]);

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
      const hasServiceData = (item as any).serviceFee > 0 || (item as any).polishFee > 0 || (item as any).dateSentToService || (item as any).serviceStartDate;
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
        serviceStartDate: (item as any).serviceStartDate ? new Date((item as any).serviceStartDate).toISOString() : "",
        dateSentToService: (item as any).dateSentToService ? new Date((item as any).dateSentToService).toISOString() : "",
        dateReturnedFromService: (item as any).dateReturnedFromService ? new Date((item as any).dateReturnedFromService).toISOString() : "",
        serviceFee: ((item as any).serviceFee || 0) / 100,
        polishFee: ((item as any).polishFee || 0) / 100,
        serviceNotes: (item as any).serviceNotes || "",
        shippingPartner: item.shippingPartner || "",
        trackingNumber: item.trackingNumber || "",
        targetSellPrice: (item.targetSellPrice || 0) / 100,
        listPrice: item.listPrice ? item.listPrice / 100 : null,
        notes: item.notes || "",
      });
    }
  }, [item, form.reset]);

  const [isPurchaseDateOpen, setIsPurchaseDateOpen] = useState(false);
  const [isDateReceivedOpen, setIsDateReceivedOpen] = useState(false);
  const [isDateListedOpen, setIsDateListedOpen] = useState(false);
  const [isDateSoldOpen, setIsDateSoldOpen] = useState(false);
  const [isDateServiceStartOpen, setIsDateServiceStartOpen] = useState(false);
  const [isDateSentOpen, setIsDateSentOpen] = useState(false);
  const [isDateReturnedOpen, setIsDateReturnedOpen] = useState(false);

  const [descriptionValue, setDescriptionValue] = useState((item as any)?.description || "");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captionValue, setCaptionValue] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [movementSpecs, setMovementSpecs] = useState<Record<string, string> | null>(null);
  const [isLookingUpSpecs, setIsLookingUpSpecs] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusPickerStep, setStatusPickerStep] = useState<"select" | "date">("select");
  const [statusPickerDate, setStatusPickerDate] = useState<Date | undefined>(new Date());
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusPickerListPrice, setStatusPickerListPrice] = useState<string>("");

  useEffect(() => {
    if (item) {
      setDescriptionValue((item as any).description || "");
      setCaptionValue((item as any).instagramCaption || "");
      setMovementSpecs((item as any).movementSpecs || null);
      setNotesValue(item.notes || "");
    }
  }, [item]);

  useEffect(() => {
    if (isEditOpen && scrollToSaleOnOpen && salesSectionRef.current) {
      const timer = setTimeout(() => {
        salesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
    if (!isEditOpen) {
      setScrollToSaleOnOpen(false);
    }
  }, [isEditOpen, scrollToSaleOnOpen]);

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      await apiRequest("PUT", `/api/inventory/${id}`, { description: descriptionValue });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", id] });
      toast({ title: "Saved", description: "Listing description saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!item) return;
    setIsGenerating(true);
    try {
      const result = await apiRequest("POST", "/api/ai/generate-description", {
        brand: item.brand,
        model: item.model,
        referenceNumber: item.referenceNumber,
        year: item.year,
        condition: item.condition,
        box: item.box,
        papers: item.papers,
      });
      const data = await result.json();
      if (data.description) {
        setDescriptionValue(data.description);
      } else {
        toast({ title: "Error", description: data.message || "No description generated.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!item) return;
    setIsGeneratingCaption(true);
    try {
      const result = await apiRequest("POST", "/api/ai/generate-caption", {
        brand: item.brand,
        model: item.model,
        referenceNumber: item.referenceNumber,
        year: item.year,
        condition: item.condition,
        listPrice: item.listPrice ?? null,
      });
      const data = await result.json();
      if (data.caption) {
        setCaptionValue(data.caption);
      } else {
        toast({ title: "Error", description: data.message || "No caption generated.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleSaveCaption = async () => {
    setIsSavingCaption(true);
    try {
      await apiRequest("PUT", `/api/inventory/${id}`, { instagramCaption: captionValue });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", id] });
      toast({ title: "Saved", description: "Instagram caption saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingCaption(false);
    }
  };

  const handleLookupSpecs = async () => {
    if (!item) return;
    setIsLookingUpSpecs(true);
    try {
      const result = await apiRequest("POST", "/api/ai/movement-specs", {
        brand: item.brand,
        referenceNumber: item.referenceNumber,
        inventoryId: id,
      });
      const contentType = result.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Movement Specs endpoint not found on this server. Pull the latest app code and restart the server.");
      }
      const data = await result.json();
      if (data.specs) {
        setMovementSpecs(data.specs);
        queryClient.invalidateQueries({ queryKey: ["/api/inventory", id] });
      } else {
        toast({ title: "Error", description: data.message || "No specs returned.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLookingUpSpecs(false);
    }
  };

  const handleSaveNotes = async () => {
    if (isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      await apiRequest("PUT", `/api/inventory/${id}`, { notes: notesValue });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/:id", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsEditingNotes(false);
      toast({ title: "Notes saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const DATE_STATUSES = ["incoming", "received", "servicing", "in_stock"];

  const resetStatusPopover = () => {
    setStatusPickerStep("select");
    setPendingStatus(null);
    setStatusPickerDate(new Date());
    setStatusPickerListPrice("");
    setIsStatusPopoverOpen(false);
  };

  const handleQuickStatusChange = (newStatus: string) => {
    if (isSavingStatus) return;
    if (newStatus === item?.status) {
      resetStatusPopover();
      return;
    }
    if (newStatus === "sold") {
      resetStatusPopover();
      setShowSaleDetails(true);
      setScrollToSaleOnOpen(true);
      form.setValue("status", "sold");
      setIsEditOpen(true);
      return;
    }
    if (DATE_STATUSES.includes(newStatus)) {
      setPendingStatus(newStatus);
      setStatusPickerDate(new Date());
      setStatusPickerStep("date");
      return;
    }
    saveStatus(newStatus, undefined);
  };

  const handleConfirmStatusWithDate = () => {
    if (!pendingStatus) return;
    saveStatus(pendingStatus, statusPickerDate, pendingStatus === "in_stock" ? statusPickerListPrice : "");
  };

  const saveStatus = async (newStatus: string, date: Date | undefined, listPriceStr?: string) => {
    setIsSavingStatus(true);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (date) {
        if (newStatus === "servicing") {
          payload.serviceStartDate = date.toISOString();
        } else if (newStatus === "in_stock") {
          payload.dateListed = date.toISOString();
        } else {
          payload.purchaseDate = date.toISOString();
        }
      }
      if (newStatus === "in_stock" && listPriceStr && listPriceStr.trim() !== "") {
        const parsed = parseFloat(listPriceStr.replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          payload.listPrice = Math.round(parsed * 100);
        }
      }
      await apiRequest("PUT", `/api/inventory/${id}`, payload);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/:id", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      resetStatusPopover();
      toast({ title: "Status updated", description: `Status changed to ${getStatusLabel(newStatus)}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingStatus(false);
    }
  };

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
    const userChangedStatus = data.status !== item?.status;
    let finalStatus = data.status;
    if (!userChangedStatus) {
      if (data.dateSold) {
        finalStatus = "sold";
      } else if (data.dateReturnedFromService && finalStatus === "servicing") {
        finalStatus = "received";
      } else if (data.dateListed && finalStatus !== "sold" && finalStatus !== "servicing") {
        finalStatus = "in_stock";
      } else if (data.dateReceived && finalStatus === "incoming") {
        finalStatus = "received";
      }
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
      listPrice: data.listPrice != null && !isNaN(Number(data.listPrice)) && Number(data.listPrice) > 0 ? Math.round(Number(data.listPrice) * 100) : null,
      dateReceived: data.dateReceived || null,
      purchaseDate: data.purchaseDate || null,
      dateListed: data.dateListed || null,
      soldDate: data.dateSold || (finalStatus === 'sold' ? new Date().toISOString() : null),
      serviceStartDate: data.serviceStartDate || null,
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
    ((item as any).watchRegister ? settings.watch_register_fee : 0);
  
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
  
  const holdTime = item.dateReceived 
    ? Math.max(0, differenceInDays(
        getEndDate(),
        startOfDay(typeof item.dateReceived === 'string' ? parseISO(item.dateReceived) : new Date(item.dateReceived))
      )) 
    : 0;
  const calcHistoricalProfit = (h: any) => {
    const revenue = h.salePrice || 0;
    const cost = h.purchasePrice +
      (h.importFee || 0) +
      (h.serviceFee || 0) +
      (h.polishFee || 0) +
      (h.platformFees || 0) +
      (h.shippingFee || 0) +
      (h.insuranceFee || 0) +
      (h.watchRegister ? settings.watch_register_fee : 0);
    return revenue - cost;
  };

  const historicals = (allInventory || [])
    .filter((h) => h.referenceNumber === item.referenceNumber && h.status === "sold" && h.id !== item.id)
    .map((h) => {
      const soldDateStr = (h as any).soldDate || (h as any).dateSold;
      const daysToSell =
        soldDateStr && h.purchaseDate
          ? Math.max(0, differenceInDays(new Date(soldDateStr), new Date(h.purchaseDate)))
          : null;
      const histProfit = calcHistoricalProfit(h);
      const histRevenue = (h as any).salePrice || 0;
      const histMargin = histRevenue > 0 ? (histProfit / histRevenue) * 100 : 0;
      return { ...h, soldDateStr, daysToSell, histProfit, histMargin };
    })
    .sort((a, b) => {
      const ta = a.soldDateStr ? new Date(a.soldDateStr).getTime() : 0;
      const tb = b.soldDateStr ? new Date(b.soldDateStr).getTime() : 0;
      return tb - ta;
    });

  const avgHistProfit =
    historicals.length > 0
      ? historicals.reduce((s, h) => s + h.histProfit, 0) / historicals.length
      : 0;

  const daysInStock = item.dateReceived
    ? Math.max(0, differenceInDays(
        getEndDate(),
        startOfDay(typeof item.dateReceived === 'string' ? parseISO(item.dateReceived) : new Date(item.dateReceived))
      ))
    : 0;
  const totalFees = ((item as any).platformFees || 0) + ((item as any).shippingFee || 0) + ((item as any).insuranceFee || 0);

  const _soldDateRaw = (item as any).dateSold || (item as any).soldDate;
  const daysListed = (item as any).dateListed
    ? Math.max(0, differenceInDays(
        item.status === "sold" && _soldDateRaw
          ? startOfDay(typeof _soldDateRaw === 'string' ? parseISO(_soldDateRaw) : new Date(_soldDateRaw))
          : startOfDay(new Date()),
        startOfDay(typeof (item as any).dateListed === 'string' ? parseISO((item as any).dateListed) : new Date((item as any).dateListed))
      ))
    : null;

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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                        <Input 
                          type="text" 
                          {...form.register("purchasePrice", { setValueAs: parsePriceInput })}
                          onBlur={(e) => {
                            const val = parsePriceInput(e.target.value);
                            form.setValue("purchasePrice", parseFloat(val.toFixed(2)));
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
                          {...form.register("importFee", { setValueAs: parsePriceInput })}
                          onBlur={(e) => {
                            const val = parsePriceInput(e.target.value);
                            form.setValue("importFee", parseFloat(val.toFixed(2)));
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
                    <div className="space-y-2">
                      <Label>Price Listed At</Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">€</span>
                        <Input
                          type="text"
                          {...form.register("listPrice", { setValueAs: (v) => v === "" || v === null ? null : parsePriceInput(v) })}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === "" || val === null) { form.setValue("listPrice", null); return; }
                            const parsed = parsePriceInput(val);
                            form.setValue("listPrice", parsed > 0 ? parseFloat(parsed.toFixed(2)) : null);
                          }}
                          className="pl-7 bg-white border-slate-200"
                          data-testid="edit-input-list-price"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4" ref={salesSectionRef}>
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
                            {...form.register("salePrice", { setValueAs: parsePriceInput })}
                            onBlur={(e) => {
                              const val = parsePriceInput(e.target.value);
                              form.setValue("salePrice", parseFloat(val.toFixed(2)));
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
                            {...form.register("platformFees", { setValueAs: parsePriceInput })}
                            onBlur={(e) => {
                              const val = parsePriceInput(e.target.value);
                              form.setValue("platformFees", parseFloat(val.toFixed(2)));
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
                            {...form.register("shippingFee", { setValueAs: parsePriceInput })}
                            onBlur={(e) => {
                              const val = parsePriceInput(e.target.value);
                              form.setValue("shippingFee", parseFloat(val.toFixed(2)));
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
                            {...form.register("insuranceFee", { setValueAs: parsePriceInput })}
                            onBlur={(e) => {
                              const val = parsePriceInput(e.target.value);
                              form.setValue("insuranceFee", parseFloat(val.toFixed(2)));
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
                          <Label>Service Start Date</Label>
                          <Popover open={isDateServiceStartOpen} onOpenChange={setIsDateServiceStartOpen}>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("serviceStartDate") && "text-muted-foreground")} data-testid="button-service-start-date">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.watch("serviceStartDate") ? format(new Date(form.watch("serviceStartDate")!), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                              <Calendar mode="single" selected={form.watch("serviceStartDate") ? new Date(form.watch("serviceStartDate")!) : undefined} onSelect={(date) => { form.setValue("serviceStartDate", date ? date.toISOString() : null); if (date) form.setValue("status", "servicing"); setIsDateServiceStartOpen(false); }} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
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
                              {...form.register("serviceFee", { setValueAs: parsePriceInput })}
                              onBlur={(e) => {
                                const val = parsePriceInput(e.target.value);
                                form.setValue("serviceFee", parseFloat(val.toFixed(2)));
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
                              {...form.register("polishFee", { setValueAs: parsePriceInput })}
                              onBlur={(e) => {
                                const val = parsePriceInput(e.target.value);
                                form.setValue("polishFee", parseFloat(val.toFixed(2)));
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
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Hold Time</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{holdTime} days</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Days Listed</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">
                    {daysListed !== null ? `${daysListed} days` : "—"}
                  </p>
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
                {item.listPrice != null && item.listPrice > 0 && (
                  <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                    <p className="text-xs font-medium text-violet-500 uppercase tracking-wider mb-1">Price Listed At</p>
                    <p className="text-xl font-bold text-violet-700">{formatCurrency(item.listPrice)}</p>
                  </div>
                )}
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
                      <span className="font-medium">{formatCurrency((item as any).watchRegister ? settings.watch_register_fee : 0)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">Total Sourcing</span>
                      <span className="text-slate-900">{formatCurrency(item.purchasePrice + ((item as any).importFee || 0) + ((item as any).watchRegister ? settings.watch_register_fee : 0))}</span>
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
                        {item.trackingNumber ? (
                          getTrackingUrl(item.shippingPartner, item.trackingNumber) ? (
                            <a href={getTrackingUrl(item.shippingPartner, item.trackingNumber)!} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 hover:underline inline-flex items-center gap-1" data-testid="link-tracking-transaction">
                              {item.trackingNumber} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="font-medium">{item.trackingNumber}</span>
                          )
                        ) : (
                          <span className="font-medium">N/A</span>
                        )}
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
                      {item.trackingNumber ? (
                        getTrackingUrl(item.shippingPartner, item.trackingNumber) ? (
                          <a href={getTrackingUrl(item.shippingPartner, item.trackingNumber)!} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 hover:underline inline-flex items-center gap-1" data-testid="link-tracking-shipping">
                            {item.trackingNumber} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-medium">{item.trackingNumber}</span>
                        )
                      ) : (
                        <span className="font-medium">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Expenses Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Additional Expenses</h4>
                  <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-slate-200 text-slate-600" data-testid="button-add-watch-expense">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
                      <DialogHeader>
                        <DialogTitle>Add Expense to {item.brand} {item.model}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input {...expenseForm.register("description")} className="bg-white border-slate-200" placeholder="Strap replacement, polishing..." data-testid="input-expense-description" />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="text"
                            {...expenseForm.register("amount", {
                              setValueAs: (v) => {
                                if (v === "") return 0;
                                const normalized = v.toString().replace(",", ".");
                                return parseFloat(normalized);
                              }
                            })}
                            className="bg-white border-slate-200"
                            placeholder="10,00"
                            data-testid="input-expense-amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select onValueChange={(val) => expenseForm.setValue("category", val as any)} defaultValue="other">
                            <SelectTrigger className="bg-white border-slate-200" data-testid="select-expense-category">
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
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !expenseForm.watch("date") && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expenseForm.watch("date") ? format(new Date(expenseForm.watch("date")!), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                              <Calendar mode="single" selected={expenseForm.watch("date") || new Date()} onSelect={(date) => expenseForm.setValue("date", date || new Date())} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)} className="border-slate-200 text-slate-600">Cancel</Button>
                          <Button type="submit" disabled={createExpenseMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-watch-expense">
                            {createExpenseMutation.isPending ? "Saving..." : "Add Expense"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {(item as any).expenses && (item as any).expenses.length > 0 ? (
                    (item as any).expenses.map((expense: any) => (
                      <div key={expense.id} className="flex items-center justify-between text-sm gap-4">
                        <span className="text-slate-500 line-clamp-2">{expense.description}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-medium">{formatCurrency(expense.amount)}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteExpense(expense.id)} data-testid={`button-delete-expense-${expense.id}`}>
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
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
                    <Popover open={isStatusPopoverOpen} onOpenChange={(open) => {
                      if (!open) resetStatusPopover();
                      else setIsStatusPopoverOpen(true);
                    }}>
                      <PopoverTrigger asChild>
                        <button
                          data-testid="button-status-badge"
                          disabled={isSavingStatus}
                          className={cn(
                            "inline-flex items-center gap-1.5 font-medium px-3 py-1 rounded-full border text-sm cursor-pointer transition-opacity hover:opacity-80",
                            getStatusStyles(item.status),
                            isSavingStatus && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isSavingStatus ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              {getStatusLabel(item.status)}
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className={statusPickerStep === "date" ? "w-auto p-2" : "w-44 p-1"} align="start">
                        {statusPickerStep === "select" ? (
                          <>
                            {[
                              { value: "incoming", label: "Incoming" },
                              { value: "in_stock", label: "Listed" },
                              { value: "servicing", label: "In Service" },
                              { value: "received", label: "Received" },
                              { value: "sold", label: "Sold" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                data-testid={`status-option-${option.value}`}
                                onClick={() => handleQuickStatusChange(option.value)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-slate-50 transition-colors",
                                  item.status === option.value ? "font-medium text-emerald-600" : "text-slate-700"
                                )}
                              >
                                {option.label}
                                {item.status === option.value && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Date for {getStatusLabel(pendingStatus || "")}
                              </span>
                              <button
                                onClick={() => { setStatusPickerStep("select"); setPendingStatus(null); }}
                                className="text-xs text-slate-400 hover:text-slate-600"
                                data-testid="button-status-date-back"
                              >
                                ← Back
                              </button>
                            </div>
                            <Calendar
                              mode="single"
                              selected={statusPickerDate}
                              onSelect={(date) => setStatusPickerDate(date ?? new Date())}
                              initialFocus
                            />
                            {pendingStatus === "in_stock" && (
                              <div className="px-1 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Price Listed At (optional)</label>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm">€</span>
                                  <input
                                    type="text"
                                    value={statusPickerListPrice}
                                    onChange={(e) => setStatusPickerListPrice(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    data-testid="input-status-list-price"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 px-1">
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleConfirmStatusWithDate}
                                disabled={isSavingStatus}
                                data-testid="button-status-date-confirm"
                              >
                                {isSavingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={resetStatusPopover}
                                data-testid="button-status-date-cancel"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
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
                {item.listPrice != null && item.listPrice > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Price Listed At</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <span className="text-sm font-medium" data-testid="text-list-price">{formatCurrency(item.listPrice)}</span>
                    </div>
                  </div>
                )}
                
                {(item as any).serviceStartDate && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Service Start</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Wrench className="w-4 h-4" />
                      <span className="text-sm font-medium" data-testid="text-service-start-date">{format(new Date((item as any).serviceStartDate), 'M/d/yyyy')}</span>
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

                {(item as any).serviceStartDate && (() => {
                  const startDate = startOfDay(new Date((item as any).serviceStartDate));
                  if ((item as any).dateReturnedFromService) {
                    const endDate = startOfDay(new Date((item as any).dateReturnedFromService));
                    const days = Math.max(0, differenceInDays(endDate, startDate));
                    return (
                      <div>
                        <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Service Duration</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full" data-testid="text-service-duration">
                            <Wrench className="w-3.5 h-3.5 text-slate-500" />
                            {days} {days === 1 ? 'day' : 'days'} total
                          </span>
                        </div>
                      </div>
                    );
                  } else if (item.status === 'servicing') {
                    const days = Math.max(0, differenceInDays(startOfDay(new Date()), startDate));
                    return (
                      <div>
                        <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Service Duration</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200" data-testid="text-service-duration">
                            <Wrench className="w-3.5 h-3.5 text-amber-500" />
                            In service for {days} {days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {(item.soldDate || (item as any).dateSold) && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Sold</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">{format(new Date(item.soldDate || (item as any).dateSold || ""), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}

                {(item as any).dateShipped && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Shipped</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Box className="w-4 h-4" />
                      <span className="text-sm font-medium">{format(new Date((item as any).dateShipped), 'M/d/yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">Notes</CardTitle>
                {!isEditingNotes && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingNotes(true)}
                    data-testid="button-edit-notes"
                    className="text-slate-400 hover:text-emerald-700 h-7 w-7 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setIsEditingNotes(false); setNotesValue(item.notes || ""); }
                      if (e.key === "Enter" && e.ctrlKey) handleSaveNotes();
                    }}
                    className="bg-white border-slate-200 min-h-[6rem] text-sm resize-none"
                    placeholder="Add any notes about this watch…"
                    autoFocus
                    data-testid="textarea-notes-inline"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsEditingNotes(false); setNotesValue(item.notes || ""); }}
                      disabled={isSavingNotes}
                      data-testid="button-cancel-notes"
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      data-testid="button-save-notes"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-slate-600 whitespace-pre-wrap min-h-[4rem] cursor-pointer rounded-md hover:bg-slate-50 p-1 -m-1 transition-colors"
                  onClick={() => setIsEditingNotes(true)}
                  data-testid="text-notes-display"
                >
                  {item.notes || <span className="text-slate-400 italic">Click to add a note…</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movement Specs Card */}
          <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-movement-specs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">Movement Specs</CardTitle>
                {movementSpecs && !isLookingUpSpecs ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLookupSpecs}
                    data-testid="button-relookup-movement-specs"
                    className="text-slate-400 hover:text-emerald-700 gap-1.5 text-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    Re-look up
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLookupSpecs}
                    disabled={isLookingUpSpecs}
                    data-testid="button-lookup-movement-specs"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                  >
                    {isLookingUpSpecs ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isLookingUpSpecs ? "Looking up..." : "Look up"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {movementSpecs ? (
                movementSpecs.raw ? (
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 border border-slate-100">{movementSpecs.raw}</pre>
                ) : (
                  <div className="grid grid-cols-2 gap-3" data-testid="movement-specs-grid">
                    {[
                      { key: "caliber", label: "Caliber" },
                      { key: "lift_angle", label: "Lift Angle" },
                      { key: "amplitude", label: "Amplitude" },
                      { key: "beat_error", label: "Beat Error" },
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-100" data-testid={`spec-tile-${key}`}>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-semibold text-slate-900">{movementSpecs[key] || "N/A"}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-slate-400">
                  Look up the caliber, lift angle, amplitude, and beat error targets for this reference.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Listing Description Card */}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">Listing Description</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                  data-testid="button-generate-description"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Write or generate a listing description for this watch..."
                className="bg-white border-slate-200 min-h-[160px] text-sm text-slate-700 resize-y"
                data-testid="textarea-listing-description"
              />
              <div className="flex items-center justify-between gap-2">
                {descriptionValue && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(descriptionValue);
                      toast({ title: "Copied", description: "Description copied to clipboard." });
                    }}
                    className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs"
                    data-testid="button-copy-description"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={isSavingDescription}
                  data-testid="button-save-description"
                  className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSavingDescription ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Caption Card */}
          <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-instagram-caption">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900">Instagram Caption</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  data-testid="button-generate-caption"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                >
                  {isGeneratingCaption ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingCaption ? "Generating..." : "Generate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={captionValue}
                onChange={(e) => setCaptionValue(e.target.value)}
                placeholder="Write or generate an Instagram caption for this watch..."
                className="bg-white border-slate-200 min-h-[140px] text-sm text-slate-700 resize-y"
                data-testid="textarea-instagram-caption"
              />
              <div className="flex items-center justify-between gap-2">
                {captionValue && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(captionValue);
                      toast({ title: "Copied", description: "Caption copied to clipboard." });
                    }}
                    className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs"
                    data-testid="button-copy-caption"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveCaption}
                  disabled={isSavingCaption}
                  data-testid="button-save-caption"
                  className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSavingCaption ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historicals Section */}
      {historicals.length > 0 && (
        <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-historicals">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900">Historicals</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{historicals.length} previous {historicals.length === 1 ? "sale" : "sales"} of this reference</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    avgHistProfit >= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}
                  data-testid="badge-historicals-avg-profit"
                >
                  Avg profit: {formatCurrency(avgHistProfit)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Watch</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Sold</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Purchase</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Sale</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Profit</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Margin</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 pr-6">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicals.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/inventory/${h.id}`)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/inventory/${h.id}`); }}
                      data-testid={`row-historical-${h.id}`}
                    >
                      <td className="px-6 py-3">
                        <span className="font-medium text-slate-900 hover:text-emerald-600 transition-colors">
                          {h.brand} {h.model}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">#{h.id}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {h.soldDateStr ? format(new Date(h.soldDateStr), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(h.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {h.salePrice ? formatCurrency(h.salePrice) : "—"}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-semibold", h.histProfit >= 0 ? "text-emerald-600" : "text-red-500")}
                        data-testid={`text-historical-profit-${h.id}`}>
                        {formatCurrency(h.histProfit)}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-medium", h.histMargin >= 0 ? "text-emerald-600" : "text-red-500")}
                        data-testid={`text-historical-margin-${h.id}`}>
                        {h.histMargin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 pr-6 text-right text-slate-500" data-testid={`text-historical-days-${h.id}`}>
                        {h.daysToSell !== null ? `${h.daysToSell}d` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
