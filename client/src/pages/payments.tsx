import { useInventory } from "@/hooks/use-inventory";
import { useSettings } from "@/hooks/use-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CreditCard,
  Loader2,
  CalendarIcon,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, differenceInDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val / 100);

function isCredit(method: string | null | undefined, creditNames: Set<string>): boolean {
  if (!method) return false;
  return creditNames.has(method);
}

function getUrgency(item: InventoryItem, creditNames: Set<string>): "none" | "green" | "yellow" | "red" {
  if (!isCredit(item.paidWith, creditNames)) return "none";
  if (item.creditPaid) return "none";
  if (!item.creditDueDate) return "green";
  const due = startOfDay(new Date(item.creditDueDate as string | Date));
  const today = startOfDay(new Date());
  const diff = differenceInDays(due, today);
  if (diff < 0) return "red";
  if (diff <= 7) return "yellow";
  return "green";
}

const METHOD_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16",
];

type FilterType = "all" | "credit" | "debit_wire" | "unpaid_credit";

export default function Payments() {
  const { data: inventory, isLoading } = useInventory();
  const { settings } = useSettings();
  const { toast } = useToast();

  const creditNames = useMemo(() => {
    const methods = settings?.paid_with_methods;
    if (!methods?.length) return new Set<string>();
    return new Set(methods.filter((m) => m.isCredit).map((m) => m.name));
  }, [settings?.paid_with_methods]);

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"due_date" | "purchase_date" | "amount">("purchase_date");
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [openCalendar, setOpenCalendar] = useState<number | null>(null);

  const creditMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { creditPaid?: boolean; creditDueDate?: string | null; creditNotes?: string | null } }) =>
      apiRequest("PATCH", `/api/inventory/${id}/credit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const itemsWithPayment = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => item.paidWith && item.paidWith.trim() !== "");
  }, [inventory]);

  const chartData = useMemo(() => {
    const activeItems = itemsWithPayment.filter((i) => i.status !== "sold");
    const grouped: Record<string, number> = {};
    for (const item of activeItems) {
      const method = item.paidWith!;
      grouped[method] = (grouped[method] || 0) + item.purchasePrice;
    }
    return Object.entries(grouped)
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }, [itemsWithPayment]);

  const creditItems = useMemo(
    () => itemsWithPayment.filter((i) => isCredit(i.paidWith, creditNames)),
    [itemsWithPayment, creditNames]
  );

  const unpaidCreditItems = useMemo(
    () => creditItems.filter((i) => !i.creditPaid),
    [creditItems]
  );

  const oldestUnpaid = useMemo(() => {
    if (!unpaidCreditItems.length) return null;
    const withDate = unpaidCreditItems.filter((i) => i.purchaseDate);
    if (!withDate.length) return null;
    const oldest = withDate.reduce((a, b) =>
      new Date(a.purchaseDate!) < new Date(b.purchaseDate!) ? a : b
    );
    return differenceInDays(new Date(), new Date(oldest.purchaseDate!));
  }, [unpaidCreditItems]);

  const totalUnpaidCredit = useMemo(
    () => unpaidCreditItems.reduce((sum, i) => sum + i.purchasePrice, 0),
    [unpaidCreditItems]
  );

  const filteredItems = useMemo(() => {
    let items = itemsWithPayment;

    if (filter === "credit") items = items.filter((i) => isCredit(i.paidWith, creditNames));
    else if (filter === "debit_wire") items = items.filter((i) => !isCredit(i.paidWith, creditNames));
    else if (filter === "unpaid_credit") items = items.filter((i) => isCredit(i.paidWith, creditNames) && !i.creditPaid);

    if (search.trim()) {
      const term = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.brand.toLowerCase().includes(term) ||
          i.model.toLowerCase().includes(term) ||
          i.referenceNumber.toLowerCase().includes(term) ||
          (i.paidWith || "").toLowerCase().includes(term)
      );
    }

    const sorted = [...items].sort((a, b) => {
      if (sortBy === "amount") return b.purchasePrice - a.purchasePrice;
      if (sortBy === "due_date") {
        const aD = a.creditDueDate ? new Date(a.creditDueDate).getTime() : Infinity;
        const bD = b.creditDueDate ? new Date(b.creditDueDate).getTime() : Infinity;
        return aD - bD;
      }
      const aD = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const bD = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return bD - aD;
    });

    // Paid-off credit items sink to the bottom
    return sorted.sort((a, b) => {
      const aPaid = isCredit(a.paidWith, creditNames) && a.creditPaid ? 1 : 0;
      const bPaid = isCredit(b.paidWith, creditNames) && b.creditPaid ? 1 : 0;
      return aPaid - bPaid;
    });
  }, [itemsWithPayment, filter, search, sortBy, creditNames]);

  const handleTogglePaid = (item: InventoryItem) => {
    creditMutation.mutate({ id: item.id, data: { creditPaid: !item.creditPaid } });
  };

  const handleSaveNotes = (id: number) => {
    creditMutation.mutate({ id, data: { creditNotes: notesValue } }, {
      onSuccess: () => {
        setEditingNotes(null);
        toast({ title: "Notes saved" });
      },
    });
  };

  const handleSetDueDate = (id: number, date: Date | undefined) => {
    creditMutation.mutate({ id, data: { creditDueDate: date ? date.toISOString() : null } });
    setOpenCalendar(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const urgencyBorderClass = (item: InventoryItem) => {
    const u = getUrgency(item, creditNames);
    if (u === "red") return "border-l-4 border-l-red-400";
    if (u === "yellow") return "border-l-4 border-l-amber-400";
    return "";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Payments</h2>
          <p className="text-slate-500 mt-1">Track purchase payment methods and manage credit card payoffs</p>
        </div>

        {/* Bar Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
              Capital Deployed by Payment Method (Active Inventory)
            </h3>
            {chartData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No active inventory with payment methods recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="method" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `€${(v / 100).toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), "Capital"]}
                    contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Unpaid Credit Watches</p>
                <p className="text-2xl font-bold text-slate-900" data-testid="text-unpaid-credit-count">
                  {unpaidCreditItems.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Outstanding Credit</p>
                <p className="text-2xl font-bold text-slate-900" data-testid="text-outstanding-credit">
                  {formatCurrency(totalUnpaidCredit)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Oldest Unpaid</p>
                <p className="text-2xl font-bold text-slate-900" data-testid="text-oldest-unpaid">
                  {oldestUnpaid !== null ? `${oldestUnpaid}d ago` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search watches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
              data-testid="input-payments-search"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["all", "credit", "debit_wire", "unpaid_credit"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={cn(
                  filter === f
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
                data-testid={`button-filter-${f}`}
              >
                {f === "all" && "All"}
                {f === "credit" && "Credit Only"}
                {f === "debit_wire" && "Debit / Wire"}
                {f === "unpaid_credit" && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Unpaid Credit
                  </span>
                )}
              </Button>
            ))}
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[160px] bg-white border-slate-200" data-testid="select-payments-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="purchase_date">Sort: Purchase Date</SelectItem>
              <SelectItem value="due_date">Sort: Due Date</SelectItem>
              <SelectItem value="amount">Sort: Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide pl-4">Watch</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Purchase Price</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Purchase Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Paid Off</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    No transactions match the current filter
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const credit = isCredit(item.paidWith, creditNames);
                  const urgency = getUrgency(item, creditNames);
                  const isPaidOff = credit && item.creditPaid;
                  const isMutating = creditMutation.isPending && creditMutation.variables?.id === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      data-testid={`row-payment-${item.id}`}
                      className={cn(
                        "border-b border-slate-100 transition-colors",
                        isPaidOff ? "opacity-50 bg-slate-50" : "bg-white hover:bg-slate-50/60",
                        urgency === "red" && !isPaidOff && "bg-red-50/30 hover:bg-red-50/50",
                        urgency === "yellow" && !isPaidOff && "bg-amber-50/30 hover:bg-amber-50/50"
                      )}
                    >
                      {/* Watch */}
                      <TableCell className="pl-4 py-3">
                        <Link href={`/inventory/${item.id}`}>
                          <div className="flex items-center gap-1.5 group cursor-pointer">
                            <span className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {item.brand} {item.model}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">Ref: {item.referenceNumber}</p>
                      </TableCell>

                      {/* Method */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            credit
                              ? "border-blue-200 text-blue-700 bg-blue-50"
                              : "border-slate-200 text-slate-600 bg-slate-50"
                          )}
                          data-testid={`badge-method-${item.id}`}
                        >
                          {item.paidWith}
                        </Badge>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="font-medium text-slate-900" data-testid={`text-price-${item.id}`}>
                        {formatCurrency(item.purchasePrice)}
                      </TableCell>

                      {/* Purchase Date */}
                      <TableCell className="text-slate-600 text-sm">
                        {item.purchaseDate ? format(new Date(item.purchaseDate), "d MMM yyyy") : "—"}
                      </TableCell>

                      {/* Due Date — editable for credit only */}
                      <TableCell>
                        {credit ? (
                          <Popover open={openCalendar === item.id} onOpenChange={(o) => setOpenCalendar(o ? item.id : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPaidOff || isMutating}
                                className={cn(
                                  "h-7 px-2 text-xs gap-1.5 rounded-lg",
                                  urgency === "red" && !isPaidOff ? "text-red-600 font-semibold" : "",
                                  urgency === "yellow" && !isPaidOff ? "text-amber-600 font-semibold" : "",
                                  (!item.creditDueDate || isPaidOff) ? "text-slate-400" : ""
                                )}
                                data-testid={`button-due-date-${item.id}`}
                              >
                                {urgency === "red" && !isPaidOff && <AlertTriangle className="w-3 h-3" />}
                                {urgency === "yellow" && !isPaidOff && <Clock className="w-3 h-3" />}
                                {!isPaidOff && urgency === "green" && item.creditDueDate && <CalendarIcon className="w-3 h-3" />}
                                {item.creditDueDate
                                  ? format(new Date(item.creditDueDate), "d MMM yyyy")
                                  : <span className="text-slate-300">Set date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                              <Calendar
                                mode="single"
                                selected={item.creditDueDate ? new Date(item.creditDueDate) : undefined}
                                onSelect={(date) => handleSetDueDate(item.id, date)}
                                initialFocus
                              />
                              {item.creditDueDate && (
                                <div className="px-3 pb-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-red-500 w-full text-xs"
                                    onClick={() => handleSetDueDate(item.id, undefined)}
                                  >
                                    <X className="w-3 h-3 mr-1" /> Clear date
                                  </Button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            item.status === "sold"
                              ? "border-slate-200 text-slate-500 bg-slate-50"
                              : item.status === "in_stock"
                              ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                              : item.status === "incoming"
                              ? "border-blue-200 text-blue-700 bg-blue-50"
                              : "border-amber-200 text-amber-700 bg-amber-50"
                          )}
                          data-testid={`badge-status-${item.id}`}
                        >
                          {item.status === "in_stock" ? "In Stock" : item.status === "sold" ? "Sold" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>

                      {/* Notes */}
                      <TableCell>
                        <Popover
                          open={editingNotes === item.id}
                          onOpenChange={(o) => {
                            if (o) {
                              setNotesValue((item as any).creditNotes || "");
                              setEditingNotes(item.id);
                            } else {
                              setEditingNotes(null);
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 w-7 p-0 rounded-lg",
                                (item as any).creditNotes
                                  ? "text-emerald-600 hover:text-emerald-700"
                                  : "text-slate-300 hover:text-slate-500"
                              )}
                              data-testid={`button-notes-${item.id}`}
                            >
                              <StickyNote className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 bg-white border-slate-200 p-3" align="start">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Notes</p>
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="e.g. Paid via bank transfer 12/6"
                              rows={3}
                              className="text-sm resize-none border-slate-200"
                              data-testid={`textarea-notes-${item.id}`}
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 h-7 text-xs"
                                onClick={() => setEditingNotes(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                                onClick={() => handleSaveNotes(item.id)}
                                disabled={isMutating}
                                data-testid={`button-save-notes-${item.id}`}
                              >
                                Save
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      {/* Paid Off Checkbox — credit only */}
                      <TableCell className="text-center">
                        {credit ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex justify-center">
                                {isMutating ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                ) : isPaidOff ? (
                                  <button
                                    onClick={() => handleTogglePaid(item)}
                                    className="text-emerald-500 hover:text-slate-400 transition-colors"
                                    data-testid={`button-paid-toggle-${item.id}`}
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <Checkbox
                                    checked={false}
                                    onCheckedChange={() => handleTogglePaid(item)}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                    data-testid={`checkbox-paid-${item.id}`}
                                  />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              {isPaidOff ? "Mark as unpaid" : "Mark as paid off"}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {filteredItems.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            Showing {filteredItems.length} of {itemsWithPayment.length} transactions
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
