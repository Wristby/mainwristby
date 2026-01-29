import { useInventoryItem, useUpdateInventory, useDeleteInventory } from "@/hooks/use-inventory";
import { useClients } from "@/hooks/use-clients";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, ArrowLeft, Trash2, Pencil, Calendar, Box, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val / 100);
};

const PURCHASE_FROM_OPTIONS = ["Chrono24", "Eni Dealer", "Ayhan Dealer", "IPLAYWATCH Dealer"];
const PAID_WITH_OPTIONS = ["Credit", "Debit", "Wire"];

const editFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  
  purchasedFrom: z.string().optional().nullable(),
  paidWith: z.string().optional().nullable(),
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
  
  targetSellPrice: z.coerce.number().optional().default(0),
  purchaseDate: z.string().optional().nullable(),
  dateListed: z.string().optional().nullable(),
  dateSold: z.string().optional().nullable(),
  status: z.enum(["in_stock", "sold", "incoming", "servicing"]),
  condition: z.enum(["New", "Mint", "Used", "Damaged"]).optional(),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  clientId: z.coerce.number().optional().nullable(),
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  soldPlatform: z.string().optional().nullable(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

export default function InventoryDetail() {
  const [match, params] = useRoute("/inventory/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: item, isLoading } = useInventoryItem(id);
  const { data: clients } = useClients();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      referenceNumber: "",
      serialNumber: "",
      internalSerial: "",
      year: undefined,
      purchasedFrom: "",
      paidWith: "",
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
      status: "in_stock",
      condition: "Used",
      box: false,
      papers: false,
      notes: "",
      clientId: undefined,
      shippingPartner: "",
      trackingNumber: "",
      soldPlatform: "",
    },
  });

  // Reset form when item data loads
  useEffect(() => {
    if (item) {
      form.reset({
        brand: item.brand,
        model: item.model,
        referenceNumber: item.referenceNumber,
        serialNumber: item.serialNumber || "",
        internalSerial: (item as any).internalSerial || "",
        year: item.year || undefined,
        purchasedFrom: (item as any).purchasedFrom || "",
        paidWith: (item as any).paidWith || "",
        purchasePrice: item.purchasePrice,
        importFee: (item as any).importFee || 0,
        watchRegister: !!(item as any).watchRegister,
        serviceFee: (item as any).serviceFee || 0,
        polishFee: (item as any).polishFee || 0,
        salePrice: (item as any).salePrice || 0,
        soldTo: (item as any).soldTo || "",
        platformFees: (item as any).platformFees || 0,
        shippingFee: (item as any).shippingFee || 0,
        insuranceFee: (item as any).insuranceFee || 0,
        targetSellPrice: item.targetSellPrice || 0,
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : "",
        dateListed: item.dateListed ? new Date(item.dateListed).toISOString().split('T')[0] : "",
        dateSold: item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : "",
        status: item.status as "in_stock" | "sold" | "incoming" | "servicing",
        condition: (item.condition as "New" | "Mint" | "Used" | "Damaged") || "Used",
        box: item.box || false,
        papers: item.papers || false,
        notes: item.notes || "",
        clientId: item.clientId || undefined,
        shippingPartner: item.shippingPartner || "",
        trackingNumber: item.trackingNumber || "",
        soldPlatform: item.soldPlatform || "",
      });
    }
  }, [item, form]);

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!item) return <div className="text-slate-600">Item not found</div>;

  const handleMarkSold = () => {
    updateMutation.mutate(
      { id, status: "sold", soldDate: new Date(), soldPrice: item.targetSellPrice },
      { onSuccess: () => toast({ title: "Updated", description: "Marked as sold" }) }
    );
  };

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
    const submissionData = {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      dateListed: data.dateListed ? new Date(data.dateListed) : null,
      soldDate: data.dateSold ? new Date(data.dateSold) : (data.status === 'sold' ? new Date() : null),
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
      case 'sold': return 'Sold';
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'servicing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'incoming': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'sold': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
                      <Input {...form.register("model")} className="bg-white border-slate-200" data-testid="edit-input-model" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reference *</Label>
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
                      <Input type="number" {...form.register("year")} className="bg-white border-slate-200" />
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
                        <Checkbox id="edit-box" checked={form.watch("box")} onCheckedChange={(checked) => form.setValue("box", !!checked)} />
                        <Label htmlFor="edit-box" className="cursor-pointer">Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="edit-papers" checked={form.watch("papers")} onCheckedChange={(checked) => form.setValue("papers", !!checked)} />
                        <Label htmlFor="edit-papers" className="cursor-pointer">Papers</Label>
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
                      <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" data-testid="edit-input-price" />
                    </div>
                    <div className="space-y-2">
                      <Label>Import Fee (€)</Label>
                      <Input type="number" {...form.register("importFee")} className="bg-white border-slate-200" />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox 
                        id="edit-watchRegister" 
                        checked={form.watch("watchRegister")} 
                        onCheckedChange={(checked) => form.setValue("watchRegister", !!checked)} 
                      />
                      <Label htmlFor="edit-watchRegister" className="cursor-pointer">Watch Register Check (€6)</Label>
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
                      <Label>Sale Price (€)</Label>
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
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-save-watch">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
                <Button variant="destructive" size="icon" onClick={handleDelete} className="bg-red-100 hover:bg-red-200 text-red-600" data-testid="button-delete-watch">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Brand</span>
                <div className="text-slate-900 font-medium">{item.brand}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Model</span>
                <div className="text-slate-900 font-medium">{item.model}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Reference</span>
                <div className="text-slate-900 font-mono">{item.referenceNumber}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Serial #</span>
                <div className="text-slate-900 font-mono">{item.serialNumber || "N/A"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Movement Serial Number</span>
                <div className="text-slate-900 font-mono">{(item as any).internalSerial || "N/A"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Year</span>
                <div className="text-slate-900">{item.year || "Unknown"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Condition</span>
                <div className="text-slate-900">{item.condition}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Includes</span>
                <div className="flex gap-2">
                  {item.box && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                      <Box className="w-3 h-3 mr-1" />
                      Box
                    </Badge>
                  )}
                  {item.papers && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                      <FileText className="w-3 h-3 mr-1" />
                      Papers
                    </Badge>
                  )}
                  {!item.box && !item.papers && <span className="text-slate-500">Watch only</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
              <div className="text-slate-500">Purchased From</div>
              <div className="text-slate-900 font-medium">{(item as any).purchasedFrom || "N/A"}</div>
              <div className="text-slate-500">Paid With</div>
              <div className="text-slate-900 font-medium">{(item as any).paidWith || "N/A"}</div>
              <div className="text-slate-500">COGS</div>
              <div className="text-slate-900 font-medium">{formatCurrency(item.purchasePrice)}</div>
              <div className="text-slate-500">Import Fee</div>
              <div className="text-slate-900 font-medium">{formatCurrency((item as any).importFee || 0) || "€0.00"}</div>
              <div className="text-slate-500">Watch Register Check</div>
              <div className="text-slate-900 font-medium">{item.watchRegister ? "Yes (€6.00)" : "No"}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Financials</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const cogs = item.purchasePrice || 0;
                const importFee = (item as any).importFee || 0;
                const serviceFee = (item as any).servicePolishFee || 0;
                const watchRegisterFee = (item as any).watchRegister ? 600 : 0;
                const salePrice = (item as any).salePrice || item.soldPrice || item.targetSellPrice || 0;
                const platformFees = (item as any).platformFees || 0;
                const shippingFee = (item as any).shippingFee || 0;
                const insuranceFee = (item as any).insuranceFee || 0;
                const totalFees = platformFees + shippingFee + insuranceFee;
                const totalCosts = cogs + importFee + serviceFee + totalFees + watchRegisterFee;
                const netProfit = salePrice - totalCosts;
                const marginPercent = salePrice > 0 ? ((netProfit / salePrice) * 100).toFixed(1) : 0;
                
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">COGS</span>
                        <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(cogs)}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sale Price</span>
                        <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(salePrice)}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Fees</span>
                        <div className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalFees)}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net Profit</span>
                        <div className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)} ({marginPercent}%)
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Cost Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-slate-500">COGS</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(cogs)}</div>
                          <div className="text-slate-500">Import Fee</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(importFee)}</div>
                          <div className="text-slate-500">Service/Polish</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(serviceFee)}</div>
                          <div className="text-slate-500 font-semibold border-t border-slate-200 pt-2">Total Costs</div>
                          <div className="text-slate-900 font-bold text-right border-t border-slate-200 pt-2">{formatCurrency(cogs + importFee + serviceFee)}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Fee Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-slate-500">Platform Fees</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(platformFees)}</div>
                          <div className="text-slate-500">Shipping Fee</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(shippingFee)}</div>
                          <div className="text-slate-500">Insurance Fee</div>
                          <div className="text-slate-900 font-medium text-right">{formatCurrency(insuranceFee)}</div>
                          <div className="text-slate-500 font-semibold border-t border-slate-200 pt-2">Total Fees</div>
                          <div className="text-slate-900 font-bold text-right border-t border-slate-200 pt-2">{formatCurrency(totalFees)}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Sale & Shipping</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-slate-500">Sold To</div>
                    <div className="text-slate-900 font-medium">{(item as any).soldTo || item.soldPlatform || "Not sold"}</div>
                    <div className="text-slate-500">Shipper</div>
                    <div className="text-slate-900 font-medium">{item.shippingPartner || "N/A"}</div>
                    <div className="text-slate-500">Tracking #</div>
                    <div className="text-slate-900 font-mono">{item.trackingNumber || "N/A"}</div>
                  </div>
                </div>
                {item.expenses && item.expenses.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Additional Expenses</h4>
                    <div className="space-y-2">
                      {item.expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">{expense.description}</span>
                          <span className="text-slate-900 font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {item.notes && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Notes</span>
                  <p className="text-slate-700 mt-1">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current State</span>
                <Badge variant="outline" className={getStatusStyles(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
              <Separator className="bg-slate-200" />
              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase">DATE RECEIVED</span>
                <div className="text-sm text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "Pending"}
                </div>
              </div>
              {item.dateListed && (
                <>
                  <Separator className="bg-slate-200" />
                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 uppercase">DATE LISTED</span>
                    <div className="text-sm text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(item.dateListed).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
              {item.soldDate && (
                <>
                  <Separator className="bg-slate-200" />
                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 uppercase">DATE SOLD</span>
                    <div className="text-sm text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(item.soldDate).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
              {item.soldPrice && (
                <>
                  <Separator className="bg-slate-200" />
                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 uppercase">SOLD PRICE</span>
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCurrency(item.soldPrice)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
