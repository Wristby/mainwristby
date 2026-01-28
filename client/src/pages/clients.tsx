import { useClients, useCreateClient } from "@/hooks/use-clients";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Phone, Mail, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreateClientFormValues = z.infer<typeof insertClientSchema>;

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useClients();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateClient();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      type: "client",
      notes: "",
    },
  });

  const onSubmit = (data: CreateClientFormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Success", description: "Client added successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const filteredClients = clients?.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">CRM</h2>
          <p className="text-slate-400 mt-1">Manage client relationships and dealers.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("name")} className="bg-slate-950 border-slate-800" placeholder="John Doe" />
                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...form.register("email")} className="bg-slate-950 border-slate-800" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} className="bg-slate-950 border-slate-800" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  {...form.register("type")} 
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="client">Client</option>
                  <option value="dealer">Dealer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {createMutation.isPending ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search clients..." 
            className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-emerald-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow className="border-slate-800 hover:bg-slate-950">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-400 text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="border-slate-800 hover:bg-slate-800/50 cursor-pointer group transition-colors"
                  >
                    <TableCell className="font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      {client.name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={client.type === 'dealer' ? 'text-amber-400 border-amber-900 bg-amber-950/20' : 'text-blue-400 border-blue-900 bg-blue-950/20'}
                      >
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail className="w-3 h-3" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-xs">
                       {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}
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
