import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Client, InventoryItem, insertClientSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Mail, Globe, User, Star, ArrowLeft, Watch, History, TrendingUp, ExternalLink, Pencil, Check } from "lucide-react";
import { Link } from "wouter";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateClient } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val / 100);
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const updateClientMutation = useUpdateClient();

  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const client = clients?.find((c) => c.id === parseInt(id));

  const form = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      socialHandle: "",
      country: "",
      type: "client" as "client" | "dealer",
      notes: "",
      isVip: false,
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        socialHandle: client.socialHandle || "",
        country: client.country || "",
        type: client.type as "client" | "dealer",
        notes: client.notes || "",
        isVip: client.isVip,
      });
    }
  }, [client, form]);

  if (isLoadingClients || isLoadingInventory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Client not found</h2>
        <Button variant="ghost" onClick={() => setLocation("/clients")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>
    );
  }

  const onEditSubmit = (data: any) => {
    updateClientMutation.mutate({ id: client.id, ...data }, {
      onSuccess: () => {
        setIsEditOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        toast({ title: "Success", description: "Client updated successfully" });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  // Filter inventory related to this client
  const clientPurchases = inventory?.filter((item) => item.clientId === client.id) || [];
  const clientSales = inventory?.filter((item) => item.soldTo === client.name) || [];

  const totalValue = clientPurchases.reduce((sum, item) => sum + item.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              {client.name}
              {client.isVip && <Badge className="bg-amber-50 text-amber-600 border-amber-100">VIP</Badge>}
            </h2>
            <div className="flex items-center gap-3 text-slate-500 mt-1">
              <Badge variant="outline" className={client.type === 'dealer' ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                {client.type}
              </Badge>
              <span>•</span>
              <span className="text-sm">Client since {client.createdAt ? format(new Date(client.createdAt), "MMMM yyyy") : 'Unknown'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover-elevate shadow-sm">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-900">
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="socialHandle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Handle</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-slate-200">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="dealer">Dealer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="bg-white border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isVip"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-slate-200">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            VIP Status
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover-elevate text-white" disabled={updateClientMutation.isPending}>
                      {updateClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-white border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Email</p>
                <p className="text-sm">{client.email || 'No email provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Phone</p>
                <p className="text-sm">{client.phone || 'No phone provided'}</p>
              </div>
            </div>
            {client.socialHandle && (
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Social Media</p>
                  <p className="text-sm">{client.socialHandle}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Globe className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">Location</p>
                <p className="text-sm">{client.country || 'No location provided'}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase mb-2">Internal Notes</p>
              <p className="text-sm text-slate-600 italic">
                {client.notes || 'No notes available for this client.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Purchase Value</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalValue)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-full">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{clientPurchases.length + clientSales.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full">
                    <History className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Watch className="w-5 h-5 text-emerald-600" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Watch</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No purchase history found for this client.
                    </TableCell>
                  </TableRow>
                ) : (
                  clientPurchases.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{item.brand}</span>
                          <span className="text-sm text-slate-500">{item.model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{item.referenceNumber}</TableCell>
                      <TableCell className="font-medium text-slate-900">{formatCurrency(item.purchasePrice)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inventory/${item.id}`}>
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="w-4 h-4 text-slate-400" />
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
      </div>
    </div>
  );
}
