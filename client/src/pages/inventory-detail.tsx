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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val / 100);
};

const editFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  year: z.coerce.number().optional().nullable(),
  purchasePrice: z.coerce.number().min(1, "Purchase price is required"),
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
      year: undefined,
      purchasePrice: 0,
      targetSellPrice: 0,
      status: "in_stock",
      condition: "Used",
      box: false,
      papers: false,
      notes: "",
      clientId: undefined,
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
        year: item.year || undefined,
        purchasePrice: item.purchasePrice,
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
            <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900">
              <DialogHeader>
                <DialogTitle>Edit Watch</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input {...form.register("brand")} className="bg-white border-slate-200" data-testid="edit-input-brand" />
                    {form.formState.errors.brand && <p className="text-red-500 text-xs">{form.formState.errors.brand.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input {...form.register("model")} className="bg-white border-slate-200" data-testid="edit-input-model" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" data-testid="edit-input-reference" />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input {...form.register("serialNumber")} className="bg-white border-slate-200" data-testid="edit-input-serial" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" {...form.register("year")} className="bg-white border-slate-200" />
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
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.watch("status")} onValueChange={(val) => form.setValue("status", val as "in_stock" | "sold" | "incoming" | "servicing")}>
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
                    <Label>Source (Client/Dealer)</Label>
                    <Select value={form.watch("clientId")?.toString()} onValueChange={(val) => form.setValue("clientId", parseInt(val))}>
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
                    <Label>Purchase Price (Cents)</Label>
                    <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" data-testid="edit-input-price" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sold For</Label>
                    <Input type="number" {...form.register("targetSellPrice")} className="bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sold Platform</Label>
                    <Input {...form.register("soldPlatform")} className="bg-white border-slate-200" placeholder="Chrono24, eBay, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Partner</Label>
                    <Select value={form.watch("shippingPartner") || ""} onValueChange={(val) => form.setValue("shippingPartner", val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select Shipping" />
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
                    <Label>Tracking Number</Label>
                    <Input {...form.register("trackingNumber")} className="bg-white border-slate-200" />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox 
                      id="edit-box" 
                      checked={form.watch("box")} 
                      onCheckedChange={(checked) => form.setValue("box", !!checked)}
                    />
                    <Label htmlFor="edit-box" className="cursor-pointer">Includes Box</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox 
                      id="edit-papers" 
                      checked={form.watch("papers")} 
                      onCheckedChange={(checked) => form.setValue("papers", !!checked)}
                    />
                    <Label htmlFor="edit-papers" className="cursor-pointer">Includes Papers</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input {...form.register("notes")} className="bg-white border-slate-200" placeholder="Additional details..." />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-save-watch">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {item.status !== "sold" && (
            <Button 
              variant="outline" 
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={handleMarkSold}
              disabled={updateMutation.isPending}
              data-testid="button-mark-sold"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Sold
            </Button>
          )}
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
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Serial</span>
                <div className="text-slate-900 font-mono">{item.serialNumber || "N/A"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Year</span>
                <div className="text-slate-900">{item.year || "Unknown"}</div>
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
              <CardTitle className="text-slate-900 text-lg">Financials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cost</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(item.purchasePrice)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sold Price</span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(item.targetSellPrice || 0)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Expenses</span>
                  <div className="text-xl font-bold text-red-600 mt-1">{formatCurrency(item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net Profit</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {formatCurrency((item.targetSellPrice || 0) - item.purchasePrice - (item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0))}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Sale Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-slate-500">Platform</div>
                    <div className="text-slate-900 font-medium">{item.soldPlatform || "Not sold"}</div>
                    <div className="text-slate-500">Shipping Partner</div>
                    <div className="text-slate-900 font-medium">{item.shippingPartner || "N/A"}</div>
                    <div className="text-slate-500">Tracking Number</div>
                    <div className="text-slate-900 font-mono">{item.trackingNumber || "N/A"}</div>
                  </div>
                </div>
                {item.expenses && item.expenses.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Expense Breakdown</h4>
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
