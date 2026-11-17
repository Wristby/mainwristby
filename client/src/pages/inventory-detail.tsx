import { useInventoryItem, useInventory, useUpdateInventory, useDeleteInventory, useArchiveInventory, useInventorySerialMatches, useInventoryPriceHistory, useUpdateInventoryPriceHistory } from "@/hooks/use-inventory";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { insertClientSchema, insertExpenseSchema, type InventoryItem } from "@shared/schema";
import { queryClient, apiRequest, apiJson, readApiJson } from "@/lib/queryClient";
import { refreshData } from "@/lib/refresh-data";
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
import { Loader2, ArrowLeft, Trash2, Pencil, Archive, Calendar as CalendarIcon, Box, FileText, Check, ExternalLink, Wrench, Plus, Sparkles, Copy, ChevronDown } from "lucide-react";
import { differenceInDays, format, startOfDay, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { RowLink } from "@/components/row-link";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, parsePriceInput } from "@/lib/utils";
import { calculateWatchFinancials } from "@shared/watch-financials";
import { getSoldDate } from "@shared/sold-date";
import { useSettings } from "@/hooks/use-settings";
import { QuickEstimate } from "@/components/quick-estimate";
import { buildSaleBuyerInput, emptySaleBuyer, type SaleBuyerDraft, type SaleBuyerInput } from "@shared/sale-buyer";
import { COUNTRIES } from "@/lib/countries";
import { normalizeWatchSerial } from "@shared/serial-match";
import { SerialMatchNotice } from "@/components/watch-intake/serial-match-notice";
import { PriceHistoryCard } from "@/components/price-history-card";
import { normalizeWatchCondition } from "@/lib/watch-condition";
import { getTrackingUrl } from "@/lib/tracking-url";
import { WatchIdentityCard } from "@/components/watch-details/identity-card";
import { PurchaseInformationCard } from "@/components/watch-details/purchase-information-card";
import { DealOverviewCard } from "@/components/watch-details/deal-overview-card";
import { BuyerDeliverySummary } from "@/components/watch-details/buyer-delivery-summary";
import { BuyerContactCard } from "@/components/watch-details/buyer-contact-card";
import {
  PurchaseAndPreparationFields,
  SaleDetailsFields,
  ServiceMaintenanceFields,
  ShippingFields,
  StatusAndListingFields,
  WatchIdentityFields,
  WatchNotesFields,
  WarrantyFields,
} from "@/components/watch-details/watch-edit-fields";
import {
  buildWatchEditPayload,
  watchEditFormDefaults,
  watchEditFormSchema,
  type WatchEditFormValues,
} from "@/lib/watch-form-contract";

const PAID_WITH_OPTIONS_DEFAULT = ["Credit", "Debit", "Wire"];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val / 100);
};

const editFormSchema = watchEditFormSchema;
type EditFormValues = WatchEditFormValues;


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
  const priceHistoryQuery = useInventoryPriceHistory(id);
  const { data: allInventory } = useInventory(undefined, true);
  const { data: clients, isLoading: clientsLoading, isError: clientsUnavailable } = useClients();
  const [buyerDraft, setBuyerDraft] = useState<SaleBuyerDraft>(emptySaleBuyer);
  const [buyerDirty, setBuyerDirty] = useState(false);
  const [buyerError, setBuyerError] = useState("");
  const linkedBuyer = clients?.find(client => client.id === item?.buyerId);
  const updateMutation = useUpdateInventory();
  const updatePriceHistoryMutation = useUpdateInventoryPriceHistory(id);
  const deleteMutation = useDeleteInventory();
  const archiveMutation = useArchiveInventory();
  const quickAddClientMutation = useCreateClient();
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const { toast } = useToast();
  const { settings } = useSettings();
  const WATCH_BRANDS = settings.watch_brands;
  const SOLD_ON_OPTIONS = settings.sales_platforms;
  const PURCHASE_CHANNEL_OPTIONS = settings.purchase_channels;
  const EXPENSE_CATEGORIES = settings.expense_categories;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [serialLookup, setSerialLookup] = useState({ serialNumber: "", internalSerial: "" });
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
        toast({ title: "Success", description: "Expense added to this watch" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (!confirm("Delete this expense only? The watch and other financial records will remain. This cannot be undone.")) return;
    deleteExpenseMutation.mutate(expenseId, {
      onSuccess: () => {
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
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      type: "client",
      notes: "",
      isVip: false,
    }
  });

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: watchEditFormDefaults,
  });

  const watchedStatus = form.watch("status");
  const watchedSerialNumber = form.watch("serialNumber") ?? "";
  const watchedInternalSerial = form.watch("internalSerial") ?? "";
  const serialMatches = useInventorySerialMatches(
    serialLookup.serialNumber,
    serialLookup.internalSerial,
    isEditOpen,
    id,
  );
  const serialLookupIsCurrent =
    normalizeWatchSerial(watchedSerialNumber) === normalizeWatchSerial(serialLookup.serialNumber) &&
    normalizeWatchSerial(watchedInternalSerial) === normalizeWatchSerial(serialLookup.internalSerial);
  const watchedSalePrice = Number(form.watch("salePrice"));
  const watchedSoldPlatform = form.watch("soldPlatform");
  const watchedChrono24FeeRate = form.watch("chrono24FeeRate");

  useEffect(() => {
    if (!isEditOpen) {
      setSerialLookup({ serialNumber: "", internalSerial: "" });
      return;
    }
    const timeout = window.setTimeout(
      () => setSerialLookup({ serialNumber: watchedSerialNumber, internalSerial: watchedInternalSerial }),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [isEditOpen, watchedSerialNumber, watchedInternalSerial]);

  useEffect(() => {
    if (watchedStatus === "sold") {
      setShowSaleDetails(true);
    }
    if (watchedStatus === "servicing") {
      setShowServiceDetails(true);
    }
  }, [watchedStatus]);

  useEffect(() => {
    if (watchedSoldPlatform !== "Chrono24") return;

    const rate = Number(watchedChrono24FeeRate);
    const feeRate = Number.isFinite(rate) ? rate : settings.chrono24_commission;

    if (!Number.isFinite(rate)) {
      form.setValue("chrono24FeeRate", feeRate);
    }

    if (watchedSalePrice > 0 && feeRate >= 0 && feeRate <= 100) {
      const fee = watchedSalePrice * (feeRate / 100);
      form.setValue("platformFees", Number(fee.toFixed(2)));
    }
  }, [watchedSalePrice, watchedSoldPlatform, watchedChrono24FeeRate, form.setValue, settings.chrono24_commission]);

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
      const hasSaleData = (item as any).salePrice > 0 || !!getSoldDate(item);
      const hasServiceData = (item as any).serviceFee > 0 || (item as any).polishFee > 0 || (item as any).serviceStartDate || (item as any).dateReturnedFromService;
      const hasShippingData = item.shippingPartner || item.trackingNumber || item.chrono24CertificationSent;
      setShowSaleDetails(hasSaleData);
      setShowServiceDetails(hasServiceData);
      setShowShippingDetails(!!hasShippingData);
    }
  }, [item]);

  useEffect(() => {
    if (isEditOpen && item) {
      const savedSoldDate = getSoldDate(item);
      setBuyerDraft({ ...emptySaleBuyer(), mode: item.buyerId ? "existing" : "new", clientId: item.buyerId || null, name: item.soldTo || "" });
      setBuyerDirty(false);
      setBuyerError("");
      form.reset({
        brand: item.brand,
        model: item.model,
        referenceNumber: item.referenceNumber,
        serialNumber: item.serialNumber || "",
        internalSerial: (item as any).internalSerial || "",
        year: item.year || undefined,
        condition: normalizeWatchCondition(item.condition),
        box: item.box || false,
        papers: item.papers || false,
        gdriveLink: item.gdriveLink || "",
        purchasedFrom: (item as any).purchasedFrom || "",
        paidWith: (item as any).paidWith || "",
        clientId: item.clientId ?? null,
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
        chrono24FeeRate: (item as any).chrono24FeeRate != null ? (item as any).chrono24FeeRate / 100 : undefined,
        shippingFee: ((item as any).shippingFee || 0) / 100,
        insuranceFee: ((item as any).insuranceFee || 0) / 100,
        soldTo: (item as any).soldTo || "",
        dateSold: savedSoldDate?.toISOString() || "",
        serviceStartDate: (item as any).serviceStartDate ? new Date((item as any).serviceStartDate).toISOString() : "",
        dateSentToService: (item as any).dateSentToService ? new Date((item as any).dateSentToService).toISOString() : "",
        dateReturnedFromService: (item as any).dateReturnedFromService ? new Date((item as any).dateReturnedFromService).toISOString() : "",
        serviceFee: ((item as any).serviceFee || 0) / 100,
        polishFee: ((item as any).polishFee || 0) / 100,
        serviceNotes: (item as any).serviceNotes || "",
        shippingPartner: item.shippingPartner || "",
        trackingNumber: item.trackingNumber || "",
        chrono24CertificationSent: item.chrono24CertificationSent ?? false,
        storeWarrantyMonths: item.storeWarrantyMonths ?? null,
        manufacturerPurchaseDate: item.manufacturerPurchaseDate || "",
        manufacturerWarrantyExpires: item.manufacturerWarrantyExpires || "",
        manufacturerWarrantyCardPresent: item.manufacturerWarrantyCardPresent ?? false,
        manufacturerWarrantyDetails: item.manufacturerWarrantyDetails || "",
        targetSellPrice: (item.targetSellPrice || 0) / 100,
        listPrice: item.listPrice ? item.listPrice / 100 : null,
        linkCount: (item as any).linkCount ?? null,
        notes: item.notes || "",
      });
    }
  }, [isEditOpen]);

  const [isPurchaseDateOpen, setIsPurchaseDateOpen] = useState(false);
  const [isDateReceivedOpen, setIsDateReceivedOpen] = useState(false);
  const [isDateListedOpen, setIsDateListedOpen] = useState(false);
  const [isDateSoldOpen, setIsDateSoldOpen] = useState(false);
  const [isDateServiceStartOpen, setIsDateServiceStartOpen] = useState(false);
  const [isDateReturnedOpen, setIsDateReturnedOpen] = useState(false);

  const [descriptionValue, setDescriptionValue] = useState((item as any)?.description || "");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [listingTitleValue, setListingTitleValue] = useState("");
  const [isSavingListingTitle, setIsSavingListingTitle] = useState(false);
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
      setListingTitleValue((item as any).listingTitle || "");
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
      await apiJson("PUT", `/api/inventory/${id}`, { description: descriptionValue });
      await refreshData(queryClient, "inventory");
      toast({ title: "Saved", description: "Listing description saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveListingTitle = async () => {
    setIsSavingListingTitle(true);
    try {
      await apiJson("PUT", `/api/inventory/${id}`, { listingTitle: listingTitleValue });
      await refreshData(queryClient, "inventory");
      toast({ title: "Saved", description: "Listing title saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingListingTitle(false);
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
      const data = await readApiJson<{ description?: string; message?: string }>(result);
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
      const data = await readApiJson<{ caption?: string; message?: string }>(result);
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
      await apiJson("PUT", `/api/inventory/${id}`, { instagramCaption: captionValue });
      await refreshData(queryClient, "inventory");
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
      const data = await readApiJson<{ specs?: Record<string, string>; message?: string }>(result);
      if (data.specs) {
        setMovementSpecs(data.specs);
        await refreshData(queryClient, "inventory");
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
      await apiJson("PUT", `/api/inventory/${id}`, { notes: notesValue });
      await refreshData(queryClient, "inventory");
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
          if (item?.serviceStartDate) {
            payload.dateReturnedFromService = date.toISOString();
          }
        } else if (newStatus === "received") {
          payload.dateReceived = date.toISOString();
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
      await apiJson("PUT", `/api/inventory/${id}`, payload);
      await refreshData(queryClient, "inventory");
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
    if (confirm(`Delete ${item.brand} ${item.model}? Only this watch record will be removed. Linked expenses and transaction records will remain but become unlinked. This cannot be undone.`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          window.location.href = "/inventory";
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      });
    }
  };

  const handleArchive = () => {
    if (confirm(`Archive ${item.brand} ${item.model}? It will leave active inventory, but its details, client links, and expenses will remain. You can restore it from Admin.`)) {
      archiveMutation.mutate(id, {
        onSuccess: () => {
          window.location.href = "/inventory";
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      });
    }
  };

  const onSubmitEdit = (data: EditFormValues) => {
    if (updateMutation.isPending) return;
    let saleBuyer: SaleBuyerInput | undefined;
    if (buyerDirty) {
      try {
        saleBuyer = buildSaleBuyerInput(buyerDraft);
        setBuyerError("");
      } catch (error) {
        setBuyerError(error instanceof z.ZodError ? error.issues[0].message : (error as Error).message);
        document.getElementById(buyerDraft.mode === "existing" ? "sale-buyer-search" : "sale-buyer-name")?.focus();
        return;
      }
    }
    const submissionData = {
      ...buildWatchEditPayload(data, item?.status || data.status, new Date(), form.getFieldState("dateSold").isDirty),
      ...(saleBuyer ? { saleBuyer } : {}),
    };
    updateMutation.mutate(
      { id, ...submissionData as any },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          toast({ title: "Success", description: "Watch updated successfully" });
        },
        onError: (err) => {
          if (buyerDirty) setBuyerError(err.message);
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

  // Use the fee that was snapshotted when this item was created; fall back to
  // the current admin-panel value only for old items that have no snapshot.
  const effectiveWrFee = (item as any).watchRegisterFeeSnapshot ?? settings.watch_register_fee;

  const salePrice = (item as any).salePrice || 0;
  const {
    totalCostsCents: totalCosts,
    marginPercent: margin,
    profitCents: profit,
    vatAmountCents: vatAmount,
    netAfterVatCents: netAfterVat,
  } = calculateWatchFinancials(item, salePrice, settings.vat_rate, settings.watch_register_fee);
  
  const getEndDate = () => {
    if (item.status === "sold") return startOfDay(getSoldDate(item) ?? new Date());
    return startOfDay(new Date());
  };
  
  const holdTime = item.dateReceived 
    ? Math.max(0, differenceInDays(
        getEndDate(),
        startOfDay(typeof item.dateReceived === 'string' ? parseISO(item.dateReceived) : new Date(item.dateReceived))
      )) 
    : 0;

  const daysInService = (() => {
    const serviceStart = item.serviceStartDate;
    const serviceCompleted = item.dateReturnedFromService;
    if (!serviceStart) return null;
    const start = startOfDay(typeof serviceStart === 'string' ? parseISO(serviceStart) : new Date(serviceStart));
    const end = serviceCompleted
      ? startOfDay(typeof serviceCompleted === 'string' ? parseISO(serviceCompleted) : new Date(serviceCompleted))
      : startOfDay(new Date());
    return Math.max(0, differenceInDays(end, start));
  })();
  const historicals = (allInventory || [])
    .filter((h) => h.referenceNumber === item.referenceNumber && h.status === "sold")
    .map((h) => {
      const soldAt = getSoldDate(h);
      const soldDateStr = soldAt?.toISOString() ?? null;
      const daysToSell =
        soldDateStr && h.purchaseDate
          ? Math.max(0, differenceInDays(soldAt!, new Date(h.purchaseDate)))
          : null;
      const { profitCents: histProfit, marginPercent: histMargin } =
        calculateWatchFinancials(h, h.salePrice || 0, 0, settings.watch_register_fee, true);
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

  const _soldDateRaw = getSoldDate(item);
  const daysListed = (item as any).dateListed
    ? Math.max(0, differenceInDays(
        item.status === "sold" && _soldDateRaw
          ? startOfDay(_soldDateRaw)
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
          <h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-3">
            {item.brand} {item.model}
            <Badge variant="outline" className="px-3 py-1 text-sm font-semibold text-emerald-600 border-emerald-200 bg-emerald-50">
              {item.referenceNumber}
            </Badge>
            {item.archivedAt && (
              <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
                Archived
              </Badge>
            )}
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
                <WatchIdentityFields
                  form={form}
                  watchBrands={WATCH_BRANDS}
                  serialLookupIsCurrent={serialLookupIsCurrent}
                  serialMatchNotice={<SerialMatchNotice
                    matches={serialMatches.data ?? []}
                    loading={serialMatches.isFetching}
                    error={serialMatches.isError}
                    action="update"
                  />}
                />

                <PurchaseAndPreparationFields
                  form={form}
                  purchaseChannels={PURCHASE_CHANNEL_OPTIONS}
                  clients={clients}
                  showSellerField={showSellerField}
                  isSellerRequired={isSellerRequired}
                  filterDealersOnly={filterDealersOnly}
                  paidWithMethods={settings.paid_with_methods?.length ? settings.paid_with_methods : PAID_WITH_OPTIONS_DEFAULT.map(name => ({ name }))}
                  onQuickAddSeller={() => {
                    quickClientForm.setValue("type", filterDealersOnly ? "dealer" : "client");
                    setIsQuickAddClientOpen(true);
                  }}
                  purchaseDatePopover={{ open: isPurchaseDateOpen, onOpenChange: setIsPurchaseDateOpen }}
                />

                <StatusAndListingFields
                  form={form}
                  receivedDatePopover={{ open: isDateReceivedOpen, onOpenChange: setIsDateReceivedOpen }}
                  listedDatePopover={{ open: isDateListedOpen, onOpenChange: setIsDateListedOpen }}
                />

                <SaleDetailsFields
                  form={form}
                  platforms={SOLD_ON_OPTIONS}
                  showSaleDetails={showSaleDetails}
                  setShowSaleDetails={setShowSaleDetails}
                  salesSectionRef={salesSectionRef}
                  buyerDraft={buyerDraft}
                  clients={clients}
                  clientsLoading={clientsLoading}
                  clientsUnavailable={clientsUnavailable}
                  buyerDirty={buyerDirty}
                  buyerError={buyerError}
                  onBuyerChange={value => {
                    setBuyerDraft(value);
                    setBuyerDirty(true);
                    setBuyerError("");
                    form.setValue("soldTo", value.name, { shouldDirty: true });
                  }}
                  soldDatePopover={{ open: isDateSoldOpen, onOpenChange: setIsDateSoldOpen }}
                />

                <WarrantyFields form={form} />

                <ServiceMaintenanceFields
                  form={form}
                  showServiceDetails={showServiceDetails}
                  setShowServiceDetails={setShowServiceDetails}
                  serviceStartDatePopover={{ open: isDateServiceStartOpen, onOpenChange: setIsDateServiceStartOpen }}
                  serviceCompletedDatePopover={{ open: isDateReturnedOpen, onOpenChange: setIsDateReturnedOpen }}
                />

                <ShippingFields form={form} showShippingDetails={showShippingDetails} setShowShippingDetails={setShowShippingDetails} />
                <WatchNotesFields form={form} />

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
          <div className="flex flex-col items-end gap-1">
            {!item.archivedAt && (
              <Button
                variant="outline"
                className="w-28 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                data-testid="button-archive-watch"
              >
                {archiveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                Archive
              </Button>
            )}
            <Button variant="outline" className="w-28 border-red-200 text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-delete-watch">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Columns */}
        <div className="lg:col-span-2 space-y-6">
          <WatchIdentityCard item={item} holdTime={holdTime} daysInService={daysInService} daysListed={daysListed} />
          <PurchaseInformationCard item={item} formatCurrency={formatCurrency} />

          <DealOverviewCard
            item={item}
            salePrice={salePrice}
            profit={profit}
            margin={margin}
            totalFees={totalFees}
            netAfterVat={netAfterVat}
            vatAmount={vatAmount}
            effectiveRegisterFee={effectiveWrFee}
            chrono24Commission={settings.chrono24_commission}
            formatCurrency={formatCurrency}
            buyerDelivery={item.status === "sold" ? (
              <BuyerDeliverySummary item={item} buyer={linkedBuyer} clientsUnavailable={clientsUnavailable} />
            ) : undefined}
          >

              {/* Shipping Details - shows when info exists and item is not sold (sold items show in Transaction pillar) */}
              {item.status !== 'sold' && (item.shippingPartner || item.trackingNumber || item.chrono24CertificationSent) && (
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
                    {item.chrono24CertificationSent && (
                      <div className="col-span-2 flex justify-between text-sm">
                        <span className="text-slate-500">Chrono24 Certification</span>
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />Sent
                        </span>
                      </div>
                    )}
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
          </DealOverviewCard>

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
                  <p className="text-xs text-slate-500">Current Status</p>
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

                {(item as any).dateReturnedFromService && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Service Completed</Label>
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

                {getSoldDate(item) && (
                  <div>
                    <Label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Sold</Label>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">{format(getSoldDate(item)!, 'M/d/yyyy')}</span>
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

          <PriceHistoryCard
            history={priceHistoryQuery.data}
            currentListPrice={item.listPrice ?? null}
            isLoading={priceHistoryQuery.isLoading}
            isError={priceHistoryQuery.isError}
            isUpdatingPrice={updatePriceHistoryMutation.isPending}
            onUpdatePrice={async (historyId, listPrice) => {
              await updatePriceHistoryMutation.mutateAsync({ historyId, listPrice });
              toast({ title: "Price corrected", description: "The historical price entry was updated." });
            }}
          />

          <BuyerContactCard
            item={item}
            buyer={linkedBuyer}
            isLoading={clientsLoading}
            isUnavailable={clientsUnavailable}
          />

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

          {/* Listing Title Card */}
          <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-listing-title">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Listing Title</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={listingTitleValue}
                onChange={(e) => setListingTitleValue(e.target.value)}
                placeholder="Enter a title for this watch listing..."
                className="bg-white border-slate-200 text-sm text-slate-700"
                data-testid="input-listing-title"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveListingTitle}
                  disabled={isSavingListingTitle}
                  data-testid="button-save-listing-title"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSavingListingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save
                </Button>
              </div>
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

          <QuickEstimate initialBuyPriceCents={item.purchasePrice} />
        </div>
      </div>
      {/* Historicals Section */}
      {historicals.length > 0 && (
        <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-historicals">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900">Historicals</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{historicals.length} {historicals.length === 1 ? "sale" : "sales"} of this reference</span>
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
                      className="relative group hover:bg-slate-50 transition-colors cursor-pointer"
                      data-testid={`row-historical-${h.id}`}
                    >
                      <td className="px-6 py-3">
                        <RowLink
                          href={`/inventory/${h.id}`}
                          label={`Open ${h.brand} ${h.model}`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {h.brand} {h.model}
                          </span>
                          {h.id === item.id && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                              This watch
                            </Badge>
                          )}
                        </div>
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white border-slate-200 text-slate-900 sm:max-w-[680px]" data-testid="dialog-quick-add-client">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={quickClientForm.handleSubmit((data) => {
            quickAddClientMutation.mutate(data, {
              onSuccess: (newClient: any) => {
                form.setValue("clientId", newClient.id);
                setIsQuickAddClientOpen(false);
                quickClientForm.reset();
                toast({ title: "Success", description: `${data.type === 'dealer' ? 'Dealer' : 'Client'} "${data.name}" added` });
              },
              onError: (err: any) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            });
          })} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Label>Address line 1</Label>
              <Input {...quickClientForm.register("addressLine1")} className="bg-white border-slate-200" autoComplete="address-line1" />
            </div>
            <div className="space-y-2">
              <Label>Address line 2</Label>
              <Input {...quickClientForm.register("addressLine2")} className="bg-white border-slate-200" autoComplete="address-line2" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...quickClientForm.register("city")} className="bg-white border-slate-200" autoComplete="address-level2" />
              </div>
              <div className="space-y-2">
                <Label>State / Province</Label>
                <Input {...quickClientForm.register("state")} className="bg-white border-slate-200" autoComplete="address-level1" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input {...quickClientForm.register("postalCode")} className="bg-white border-slate-200" autoComplete="postal-code" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <select
                  {...quickClientForm.register("country")}
                  autoComplete="country-name"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
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
