import { useInventory, useCreateInventory } from "@/hooks/use-inventory";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Extending schema to coerce types from form strings
const createFormSchema = insertInventorySchema.extend({
  year: z.coerce.number().optional(),
  purchasePrice: z.coerce.number(),
  targetSellPrice: z.coerce.number(),
  clientId: z.coerce.number().optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

export default function Inventory() {
  const [search, setSearch] = useState("");
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
      condition: "Used",
      status: "in_stock",
      purchasePrice: 0,
      targetSellPrice: 0,
      box: false,
      papers: false,
    },
  });

  const onSubmit = (data: CreateFormValues) => {
    createMutation.mutate(data, {
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

  const filteredInventory = inventory?.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.brand.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      item.referenceNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h2>
          <p className="text-slate-500 mt-1">Manage your collection of timepieces.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add Watch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900">
            <DialogHeader>
              <DialogTitle>Add New Watch</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input {...form.register("brand")} className="bg-white border-slate-200" placeholder="Rolex" />
                  {form.formState.errors.brand && <p className="text-red-500 text-xs">{form.formState.errors.brand.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input {...form.register("model")} className="bg-white border-slate-200" placeholder="Submariner" />
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" placeholder="124060" />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input {...form.register("serialNumber")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" {...form.register("year")} className="bg-white border-slate-200" placeholder="2023" />
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
                  <Label>Purchase Price (Cents)</Label>
                  <Input type="number" {...form.register("purchasePrice")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Target Sell Price (Cents)</Label>
                  <Input type="number" {...form.register("targetSellPrice")} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select onValueChange={(val) => form.setValue("condition", val as any)} defaultValue="Used">
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Mint">Mint</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {createMutation.isPending ? "Adding..." : "Add Watch"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by brand, model, or reference..." 
            className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-emerald-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-500">Brand</TableHead>
                <TableHead className="text-slate-500">Model</TableHead>
                <TableHead className="text-slate-500">Reference</TableHead>
                <TableHead className="text-slate-500">Year</TableHead>
                <TableHead className="text-slate-500">Condition</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500 text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredInventory?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory?.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900 group-hover:text-emerald-600">
                      <Link href={`/inventory/${item.id}`}>{item.brand}</Link>
                    </TableCell>
                    <TableCell className="text-slate-600">{item.model}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{item.referenceNumber}</TableCell>
                    <TableCell className="text-slate-500">{item.year || "N/A"}</TableCell>
                    <TableCell className="text-slate-500">{item.condition}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === 'in_stock' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : item.status === 'sold'
                            ? 'bg-slate-50 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-900 font-mono">
                      ${(item.targetSellPrice / 100).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
