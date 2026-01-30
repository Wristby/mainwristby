import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-expenses";
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
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Plus, 
  Loader2, 
  Filter, 
  TrendingUp, 
  Receipt, 
  Wallet,
  BarChart3,
  Pencil,
  Trash2,
  DollarSign,
  Calendar as CalendarIcon,
  RefreshCw
} from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format, getMonth, getYear } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "rent_storage", label: "Rent/Storage" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "tools", label: "Tools" },
  { value: "insurance", label: "Insurance" },
  { value: "service", label: "Service" },
  { value: "shipping", label: "Shipping" },
  { value: "parts", label: "Parts" },
  { value: "other", label: "Other" },
];

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const createFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val / 100);
};

export default function Financials() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { toast } = useToast();
  
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "other",
      date: new Date(),
      isRecurring: false,
    },
  });

  const onSubmit = (data: CreateFormValues) => {
    const submitData = {
      ...data,
      date: data.date instanceof Date ? data.date : (data.date ? new Date(data.date) : new Date()),
    };
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, ...submitData }, {
        onSuccess: () => {
          setIsCreateOpen(false);
          setEditingExpense(null);
          form.reset();
          toast({ title: "Success", description: "Expense updated" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          setIsCreateOpen(false);
          form.reset();
          toast({ title: "Success", description: "Expense added" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      });
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    form.setValue("description", expense.description);
    form.setValue("amount", expense.amount);
    form.setValue("category", expense.category);
    form.setValue("date", new Date(expense.date));
    form.setValue("isRecurring", expense.isRecurring);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Success", description: "Expense deleted" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const years = useMemo(() => {
    if (!expenses) return [];
    const uniqueYears = Array.from(new Set(expenses.map(e => getYear(new Date(e.date)))));
    return uniqueYears.sort((a, b) => b - a);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter((expense) => {
      const term = search.toLowerCase();
      const matchesSearch = expense.description.toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      
      const expenseDate = new Date(expense.date);
      const matchesMonth = monthFilter === "all" || getMonth(expenseDate).toString() === monthFilter;
      const matchesYear = yearFilter === "all" || getYear(expenseDate).toString() === yearFilter;
      
      return matchesSearch && matchesCategory && matchesMonth && matchesYear;
    });
  }, [expenses, search, categoryFilter, monthFilter, yearFilter]);

  const metrics = useMemo(() => {
    if (!inventory || !expenses) return { 
      totalRevenue: 0, 
      totalExpenses: 0, 
      totalCogs: 0,
      grossProfit: 0, 
      netProfit: 0, 
      avgRoi: 0 
    };

    const soldItems = inventory.filter(i => i.status === 'sold');
    
    const totalRevenue = soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
    const totalCogs = soldItems.reduce((sum, item) => sum + item.purchasePrice, 0);
    
    const totalServicePolishFees = soldItems.reduce((sum, item) => 
      sum + (item.serviceFee || 0) + (item.polishFee || 0), 0);
    
    const totalPlatformFees = soldItems.reduce((sum, item) => sum + (item.platformFees || 0), 0);
    const totalShippingInsurance = soldItems.reduce((sum, item) => 
      sum + (item.shippingFee || 0) + (item.insuranceFee || 0), 0);
    
    const totalWatchRegisterFees = soldItems.reduce((sum, item) => 
      sum + (item.watchRegister ? 600 : 0), 0);

    const totalSaleExpenses = totalServicePolishFees + totalPlatformFees + totalShippingInsurance + totalWatchRegisterFees;
    
    const filteredExpenseTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Net profit after all watch-specific fees and general business expenses
    const netProfit = totalRevenue - totalCogs - totalSaleExpenses - allExpensesTotal;
    
    let totalRoi = 0;
    let roiCount = 0;
    soldItems.forEach(item => {
      if (item.purchasePrice > 0 && item.salePrice) {
        const itemExpenses = (item.serviceFee || 0) + 
                            (item.polishFee || 0) + 
                            (item.platformFees || 0) + 
                            (item.shippingFee || 0) + 
                            (item.insuranceFee || 0) +
                            (item.watchRegister ? 600 : 0);
        const profit = item.salePrice - item.purchasePrice - itemExpenses;
        const roi = (profit / item.purchasePrice) * 100;
        totalRoi += roi;
        roiCount++;
      }
    });
    const avgRoi = roiCount > 0 ? Math.round(totalRoi / roiCount) : 0;

    return { 
      totalRevenue, 
      totalExpenses: filteredExpenseTotal, 
      totalCogs,
      grossProfit, 
      netProfit, 
      avgRoi 
    };
  }, [inventory, expenses, filteredExpenses]);

  const monthlyData = useMemo(() => {
    if (!inventory || !expenses) return [];
    
    const months: { [key: string]: { revenue: number; expenses: number; cogs: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    monthNames.forEach(m => {
      months[m] = { revenue: 0, expenses: 0, cogs: 0 };
    });

    inventory.filter(i => i.status === 'sold' && (i.soldDate || i.dateSold)).forEach(item => {
      const month = monthNames[new Date((item.soldDate || item.dateSold)!).getMonth()];
      months[month].revenue += item.salePrice || 0;
      months[month].cogs += item.purchasePrice;
      const itemExpenses = (item.serviceFee || 0) + 
                          (item.polishFee || 0) + 
                          (item.platformFees || 0) + 
                          (item.shippingFee || 0) + 
                          (item.insuranceFee || 0) +
                          (item.watchRegister ? 600 : 0);
      months[month].expenses += itemExpenses;
    });

    expenses.forEach(expense => {
      const month = monthNames[new Date(expense.date).getMonth()];
      months[month].expenses += expense.amount;
    });

    return monthNames.map(month => ({
      month,
      profit: (months[month].revenue - months[month].cogs - months[month].expenses) / 100,
    }));
  }, [inventory, expenses]);

  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const isLoading = expensesLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Financials</h2>
          <p className="text-slate-500 mt-1">Track expenses, sales, and deal-level profitability</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[130px] bg-white border-slate-200" data-testid="select-month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {MONTHS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[100px] bg-white border-slate-200" data-testid="select-year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="all">All Years</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingExpense(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md" data-testid="button-add-expense">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...form.register("description")} className="bg-white border-slate-200" placeholder="Monthly subscription..." data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    {...form.register("amount")} 
                    className="bg-white border-slate-200" 
                    placeholder="10" 
                    data-testid="input-amount" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={(val) => form.setValue("category", val as any)} defaultValue={form.getValues("category")}>
                    <SelectTrigger className="bg-white border-slate-200" data-testid="select-category-form">
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
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-slate-200",
                          !form.watch("date") && "text-muted-foreground"
                        )}
                        data-testid="button-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("date") ? format(form.watch("date"), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                      <Calendar
                        mode="single"
                        selected={form.watch("date") || new Date()}
                        onSelect={(date) => form.setValue("date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Recurring Expense</Label>
                    <p className="text-xs text-slate-500">Enable for monthly repeating costs</p>
                  </div>
                  <Switch
                    checked={form.watch("isRecurring")}
                    onCheckedChange={(checked) => form.setValue("isRecurring", checked)}
                    data-testid="switch-recurring"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingExpense(null);
                    form.reset();
                  }} className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-submit-expense">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingExpense ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{formatCurrency(metrics.totalRevenue)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{formatCurrency(metrics.totalExpenses)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total COGS</p>
            <p className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">{formatCurrency(metrics.totalCogs)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Gross Income</p>
            <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{soldItems.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Net Profit</p>
            <p className="text-2xl font-bold text-purple-600 mt-1 tabular-nums">{formatCurrency(metrics.netProfit)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg ROI %</p>
            <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{metrics.avgRoi}%</p>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Monthly Net Profit Trend</h3>
            <span className="text-xs text-slate-400">Last 12 months</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-1">
            <TooltipProvider delayDuration={0}>
              {monthlyData.map((data, idx) => {
                const maxProfit = Math.max(...monthlyData.map(d => Math.abs(d.profit)), 1);
                const height = Math.abs(data.profit) / maxProfit * 100;
                const isNegative = data.profit < 0;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full h-24 flex items-end justify-center cursor-pointer">
                          <div 
                            className={`w-full max-w-6 rounded-t transition-all hover:opacity-80 ${isNegative ? 'bg-red-400' : 'bg-emerald-500'}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">{data.month}</p>
                          <p className={isNegative ? 'text-red-500' : 'text-emerald-600'}>
                            {formatCurrency(data.profit * 100)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-slate-400">{data.month}</span>
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Expenses</h3>
              <p className="text-xs text-slate-400">Filtered by selected month/year</p>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search description..." 
                  className="pl-10 w-48 bg-white border-slate-200 text-slate-900"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-expenses"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] bg-white border-slate-200" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
                <Filter className="w-4 h-4 mr-1" /> Filter
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-500">ID</TableHead>
                  <TableHead className="text-slate-500">Date</TableHead>
                  <TableHead className="text-slate-500">Month</TableHead>
                  <TableHead className="text-slate-500">Category</TableHead>
                  <TableHead className="text-slate-500">Description</TableHead>
                  <TableHead className="text-slate-500 text-right">Amount</TableHead>
                  <TableHead className="text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No expenses found. Add your first expense to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="border-slate-100 hover:bg-slate-50" data-testid={`expense-row-${expense.id}`}>
                      <TableCell className="font-mono text-xs text-slate-400">{expense.id}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="flex items-center gap-2">
                          {expense.isRecurring && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <RefreshCw className="w-3 h-3 text-emerald-500" />
                                </TooltipTrigger>
                                <TooltipContent>Recurring Expense</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {format(new Date(expense.date), "yyyy-MM")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900 max-w-xs truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={() => handleEdit(expense)}
                            data-testid={`button-edit-expense-${expense.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(expense.id)}
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
