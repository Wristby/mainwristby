import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings, useUpdateSetting } from "@/hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  DollarSign,
  Target,
  Clock,
  List,
  Sparkles,
  Download,
  LayoutDashboard,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Search,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
        data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Icon className="w-5 h-5 text-emerald-600" />
          {title}
          {open ? <ChevronDown className="w-4 h-4 ml-auto text-slate-400" /> : <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

const MODEL_GROUP_ORDER = ["OpenAI", "Anthropic", "Google", "Cohere", "Mistral", "Meta", "Other"];

function getModelProviderLabel(model: string, name: string) {
  const text = `${name} ${model}`.toLowerCase();
  if (text.includes("openai") || text.includes("gpt")) return "OpenAI";
  if (text.includes("claude") || text.includes("anthropic")) return "Anthropic";
  if (text.includes("gemini") || text.includes("google")) return "Google";
  if (text.includes("cohere")) return "Cohere";
  if (text.includes("mistral")) return "Mistral";
  if (text.includes("llama") || text.includes("meta")) return "Meta";
  return "Other";
}

function ModelPicker({
  value,
  models,
  onChange,
}: {
  value: string;
  models: { name: string; model: string; provider: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = models.find((m) => m.model === value);

  const grouped = MODEL_GROUP_ORDER.map((provider) => ({
    provider,
    items: models.filter((m) => m.provider === provider && `${m.name} ${m.model}`.toLowerCase().includes(query.toLowerCase())),
  })).filter((group) => group.items.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-white border-slate-200 font-normal"
          data-testid="button-ai-model-picker"
        >
          <span className="truncate">{selected ? selected.name : value}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(600px,90vw)] p-0 overflow-hidden" align="start">
        <div className="border-b border-slate-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="pl-9 bg-white border-slate-200"
              data-testid="input-search-ai-models"
            />
          </div>
        </div>
        <ScrollArea className="max-h-[480px]">
          <div className="p-2">
            {grouped.map((group) => (
              <div key={group.provider} className="mb-3 last:mb-0">
                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.provider}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((model) => (
                    <button
                      key={model.model}
                      type="button"
                      onClick={() => {
                        onChange(model.model);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-50"
                      data-testid={`button-ai-model-${model.model.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900">{model.name}</div>
                        <div className="text-xs text-slate-400">{model.model}</div>
                      </div>
                      {selected?.model === model.model && (
                        <Check className="ml-3 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function EditableList({ items, onSave, label }: {
  items: string[];
  onSave: (items: string[]) => void;
  label: string;
}) {
  const [list, setList] = useState<string[]>(items);
  const [newItem, setNewItem] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setList(items);
    setIsDirty(false);
  }, [items]);

  const addItem = () => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      const updated = [...list, newItem.trim()];
      setList(updated);
      setNewItem("");
      setIsDirty(true);
    }
  };

  const removeItem = (index: number) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
    setIsDirty(true);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setList(newList);
    setIsDirty(true);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Add new ${label.toLowerCase().replace(/s$/, '')}...`}
          className="bg-white border-slate-200"
          data-testid={`input-add-${label.toLowerCase().replace(/\s+/g, '-')}`}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
        />
        <Button onClick={addItem} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid={`button-add-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {list.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 group">
            <GripVertical className="w-3 h-3 text-slate-300" />
            <span className="flex-1 text-sm text-slate-700">{item}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => moveItem(index, "up")} disabled={index === 0}>
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => moveItem(index, "down")} disabled={index === list.length - 1}>
              <ArrowDown className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 transition-opacity" onClick={() => removeItem(index)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {isDirty && (
        <Button onClick={() => { onSave(list); setIsDirty(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" data-testid={`button-save-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          <Save className="w-4 h-4 mr-1" /> Save {label}
        </Button>
      )}
    </div>
  );
}

function EditableCategoryList({ items, onSave }: {
  items: { value: string; label: string }[];
  onSave: (items: { value: string; label: string }[]) => void;
}) {
  const [list, setList] = useState(items);
  const [newLabel, setNewLabel] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setList(items);
    setIsDirty(false);
  }, [items]);

  const addItem = () => {
    if (newLabel.trim()) {
      const value = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!list.find(l => l.value === value)) {
        const updated = [...list, { value, label: newLabel.trim() }];
        setList(updated);
        setNewLabel("");
        setIsDirty(true);
      }
    }
  };

  const removeItem = (index: number) => {
    setList(list.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setList(newList);
    setIsDirty(true);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700">Expense Categories</Label>
      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add new category..."
          className="bg-white border-slate-200"
          data-testid="input-add-expense-category"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
        />
        <Button onClick={addItem} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid="button-add-expense-category">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {list.map((item, index) => (
          <div key={item.value} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 group">
            <GripVertical className="w-3 h-3 text-slate-300" />
            <span className="flex-1 text-sm text-slate-700">{item.label}</span>
            <Badge variant="outline" className="text-xs text-slate-400">{item.value}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => moveItem(index, "up")} disabled={index === 0}>
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => moveItem(index, "down")} disabled={index === list.length - 1}>
              <ArrowDown className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 transition-opacity" onClick={() => removeItem(index)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {isDirty && (
        <Button onClick={() => { onSave(list); setIsDirty(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" data-testid="button-save-expense-categories">
          <Save className="w-4 h-4 mr-1" /> Save Categories
        </Button>
      )}
    </div>
  );
}

const DASHBOARD_SECTION_LABELS: Record<string, string> = {
  kpi_cards: "KPI Cards",
  quick_actions: "Quick Actions",
  monthly_profit_goal: "Monthly Profit Goal",
  quick_estimate: "Quick Estimate",
  inventory_status: "Inventory Status Summary",
  aging_inventory: "Aging Inventory",
  recent_additions: "Recent Additions",
  recently_sold: "Recently Sold",
};

const ALL_INVENTORY_COLUMNS = [
  "ID", "Brand", "Model", "Reference Number", "Serial Number", "Movement Serial",
  "Year", "Condition", "Box", "Papers", "Status", "Purchased From", "Paid With",
  "Purchase Price (EUR)", "Import Fee (EUR)", "Watch Register", "Service Fee (EUR)",
  "Polish Fee (EUR)", "Target Sell Price (EUR)", "Sale Price (EUR)", "Sold Date",
  "Platform Fees (EUR)", "Shipping Fee (EUR)", "Insurance Fee (EUR)", "Margin %",
  "Sold To", "Sold Platform", "Purchase Date", "Date Received", "Date Listed", "Hold Time (Days)",
  "Shipping Partner", "Tracking Number", "Google Drive Link", "Net Profit (EUR)", "Notes",
  "Service Start Date"
];

const ALL_FINANCIAL_COLUMNS = [
  "Description", "Amount (EUR)", "Category", "Date", "Recurring", "Watch Reference"
];

export default function Admin() {
  const { settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const { data: aiModels } = useQuery<{ models: { name: string; model: string }[] }>({
    queryKey: ["/api/ai/models"],
  });

  const saveSetting = (key: string, value: unknown) => {
    updateSetting.mutate({ key, value }, {
      onSuccess: () => {
        toast({ title: "Saved", description: "Setting updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-admin-title">Admin Panel</h2>
        <p className="text-slate-500 mt-1">Manage app-wide settings and configuration</p>
      </div>

      <div className="space-y-4">
        <CollapsibleSection title="Business Rates & Fees" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumberSetting
              label="Chrono24 Commission (%)"
              value={settings.chrono24_commission}
              onSave={(v) => saveSetting("chrono24_commission", v)}
              suffix="%"
              step={0.1}
              testId="chrono24-commission"
            />
            <NumberSetting
              label="Watch Register Fee (EUR)"
              value={settings.watch_register_fee / 100}
              onSave={(v) => saveSetting("watch_register_fee", Math.round(v * 100))}
              prefix="€"
              step={0.5}
              testId="watch-register-fee"
            />
            <NumberSetting
              label="Default Tax Rate (%)"
              value={settings.default_tax_rate}
              onSave={(v) => saveSetting("default_tax_rate", v)}
              suffix="%"
              step={0.01}
              testId="default-tax-rate"
            />
            <NumberSetting
              label="Default Margin Rate (%)"
              value={settings.default_margin_rate}
              onSave={(v) => saveSetting("default_margin_rate", v)}
              suffix="%"
              step={0.1}
              testId="default-margin-rate"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Monthly Profit Goal" icon={Target}>
          <NumberSetting
            label="Monthly Profit Goal (EUR)"
            value={settings.monthly_profit_goal / 100}
            onSave={(v) => saveSetting("monthly_profit_goal", Math.round(v * 100))}
            prefix="€"
            step={100}
            testId="monthly-profit-goal"
          />
        </CollapsibleSection>

        <CollapsibleSection title="Aging Inventory Threshold" icon={Clock}>
          <NumberSetting
            label="Days before flagging as aging"
            value={settings.aging_threshold_days}
            onSave={(v) => saveSetting("aging_threshold_days", v)}
            suffix="days"
            step={1}
            testId="aging-threshold"
          />
        </CollapsibleSection>

        <CollapsibleSection title="Dropdown Lists" icon={List}>
          <div className="space-y-6">
            <EditableList
              items={settings.watch_brands}
              onSave={(items) => saveSetting("watch_brands", items)}
              label="Watch Brands"
            />
            <Separator />
            <EditableList
              items={settings.sales_platforms}
              onSave={(items) => saveSetting("sales_platforms", items)}
              label="Sales Platforms"
            />
            <Separator />
            <EditableList
              items={settings.shipping_partners}
              onSave={(items) => saveSetting("shipping_partners", items)}
              label="Shipping Partners"
            />
            <Separator />
            <EditableList
              items={settings.purchase_channels}
              onSave={(items) => saveSetting("purchase_channels", items)}
              label="Purchase Channels"
            />
            <Separator />
            <EditableCategoryList
              items={settings.expense_categories}
              onSave={(items) => saveSetting("expense_categories", items)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="AI Settings" icon={Sparkles}>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-slate-700">AI Model</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">Applies to all AI features (Listing Description &amp; Movement Specs)</p>
              <ModelPicker
                value={settings.ai_model}
                models={(aiModels?.models || []).map((m) => ({
                  name: m.name,
                  model: m.model,
                  provider: getModelProviderLabel(m.model, m.name),
                }))}
                onChange={(v) => saveSetting("ai_model", v)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Listing Description Prompt</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                Available placeholders: {"{{brand}}"}, {"{{model}}"}, {"{{referenceNumber}}"}, {"{{year}}"}, {"{{condition}}"}, {"{{box}}"}, {"{{papers}}"}
              </p>
              <PromptEditor
                value={settings.ai_prompt_template}
                onSave={(v) => saveSetting("ai_prompt_template", v)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-slate-700">Movement Specs Prompt</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                Available placeholders: {"{{brand}}"}, {"{{referenceNumber}}"}
              </p>
              <PromptEditor
                value={settings.ai_movement_prompt_template}
                onSave={(v) => saveSetting("ai_movement_prompt_template", v)}
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Data Export Settings" icon={Download} defaultOpen={false}>
          <div className="space-y-6">
            <ColumnSelector
              title="Inventory Export Columns"
              allColumns={ALL_INVENTORY_COLUMNS}
              selectedColumns={settings.inventory_export_columns}
              onSave={(cols) => saveSetting("inventory_export_columns", cols)}
            />
            <Separator />
            <ColumnSelector
              title="Financial Export Columns"
              allColumns={ALL_FINANCIAL_COLUMNS}
              selectedColumns={settings.financial_export_columns}
              onSave={(cols) => saveSetting("financial_export_columns", cols)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Dashboard Customization" icon={LayoutDashboard} defaultOpen={false}>
          <DashboardCustomizer
            sections={settings.dashboard_sections}
            onSave={(sections) => saveSetting("dashboard_sections", sections)}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}

function NumberSetting({ label, value, onSave, prefix, suffix, step = 1, testId }: {
  label: string;
  value: number;
  onSave: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  testId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <div
          className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 cursor-pointer hover:border-emerald-300 transition-colors"
          onClick={() => setEditing(true)}
          data-testid={`setting-${testId}`}
        >
          <span className="text-lg font-bold text-slate-900">
            {prefix}{value.toLocaleString("de-DE", { minimumFractionDigits: step < 1 ? 2 : 0, maximumFractionDigits: step < 1 ? 2 : 0 })}{suffix && ` ${suffix}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          step={step}
          className="bg-white border-slate-200"
          autoFocus
          data-testid={`input-${testId}`}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        />
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
        <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white" data-testid={`button-save-${testId}`}>
          <Save className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setInputValue(value.toString()); }} data-testid={`button-cancel-${testId}`}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PromptEditor({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [text, setText] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setText(value);
    setIsDirty(false);
  }, [value]);

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setIsDirty(true); }}
        className="bg-white border-slate-200 min-h-[200px] font-mono text-sm"
        data-testid="textarea-ai-prompt"
      />
      {isDirty && (
        <Button onClick={() => { onSave(text); setIsDirty(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" data-testid="button-save-prompt">
          <Save className="w-4 h-4 mr-1" /> Save Prompt
        </Button>
      )}
    </div>
  );
}

function ColumnSelector({ title, allColumns, selectedColumns, onSave }: {
  title: string;
  allColumns: string[];
  selectedColumns: string[];
  onSave: (columns: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedColumns));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSelected(new Set(selectedColumns));
    setIsDirty(false);
  }, [selectedColumns]);

  const toggle = (col: string) => {
    const next = new Set(selected);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    setSelected(next);
    setIsDirty(true);
  };

  const selectAll = () => {
    setSelected(new Set(allColumns));
    setIsDirty(true);
  };

  const selectNone = () => {
    setSelected(new Set());
    setIsDirty(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700">{title}</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="text-xs" data-testid={`button-select-all-${title.toLowerCase().replace(/\s+/g, '-')}`}>Select All</Button>
          <Button variant="outline" size="sm" onClick={selectNone} className="text-xs" data-testid={`button-select-none-${title.toLowerCase().replace(/\s+/g, '-')}`}>Reset (All Columns)</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allColumns.map(col => (
          <label key={col} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
            <Checkbox
              checked={selected.has(col)}
              onCheckedChange={() => toggle(col)}
              className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            {col}
          </label>
        ))}
      </div>
      {isDirty && (
        <Button onClick={() => { onSave(Array.from(selected)); setIsDirty(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" data-testid={`button-save-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          <Save className="w-4 h-4 mr-1" /> Save Column Selection
        </Button>
      )}
    </div>
  );
}

const DEFAULT_DASHBOARD_SECTIONS: Record<string, { visible: boolean; order: number }> = {
  kpi_cards: { visible: true, order: 0 },
  quick_actions: { visible: true, order: 1 },
  monthly_profit_goal: { visible: true, order: 2 },
  quick_estimate: { visible: true, order: 3 },
  inventory_status: { visible: true, order: 4 },
  aging_inventory: { visible: true, order: 5 },
  recent_additions: { visible: true, order: 6 },
  recently_sold: { visible: true, order: 7 },
};

function mergeSections(saved: Record<string, { visible: boolean; order: number }>) {
  const maxOrder = Object.values(saved).reduce((m, s) => Math.max(m, s.order), -1);
  let nextOrder = maxOrder + 1;
  const merged = { ...saved };
  for (const key of Object.keys(DEFAULT_DASHBOARD_SECTIONS)) {
    if (!(key in merged)) {
      merged[key] = { ...DEFAULT_DASHBOARD_SECTIONS[key], order: nextOrder++ };
    }
  }
  return merged;
}

function DashboardCustomizer({ sections, onSave }: {
  sections: Record<string, { visible: boolean; order: number }>;
  onSave: (sections: Record<string, { visible: boolean; order: number }>) => void;
}) {
  const [config, setConfig] = useState(() => mergeSections(sections));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setConfig(mergeSections(sections));
    setIsDirty(false);
  }, [sections]);

  const sortedKeys = Object.keys(config).sort((a, b) => (config[a]?.order ?? 0) - (config[b]?.order ?? 0));

  const toggleVisibility = (key: string) => {
    const updated = { ...config, [key]: { ...config[key], visible: !config[key].visible } };
    setConfig(updated);
    setIsDirty(true);
  };

  const moveSection = (key: string, direction: "up" | "down") => {
    const index = sortedKeys.indexOf(key);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedKeys.length) return;

    const updated = { ...config };
    const targetKey = sortedKeys[targetIndex];
    const currentOrder = updated[key].order;
    updated[key] = { ...updated[key], order: updated[targetKey].order };
    updated[targetKey] = { ...updated[targetKey], order: currentOrder };
    setConfig(updated);
    setIsDirty(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Toggle sections on/off and reorder them using the arrows.</p>
      <div className="space-y-2">
        {sortedKeys.map((key, index) => (
          <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <GripVertical className="w-4 h-4 text-slate-300" />
            <span className="flex-1 text-sm font-medium text-slate-700">{DASHBOARD_SECTION_LABELS[key] || key}</span>
            <Switch
              checked={config[key]?.visible ?? true}
              onCheckedChange={() => toggleVisibility(key)}
              data-testid={`switch-dashboard-${key}`}
            />
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(key, "up")} disabled={index === 0}>
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(key, "down")} disabled={index === sortedKeys.length - 1}>
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {isDirty && (
        <Button onClick={() => { onSave(config); setIsDirty(false); }} className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" data-testid="button-save-dashboard-config">
          <Save className="w-4 h-4 mr-1" /> Save Dashboard Layout
        </Button>
      )}
    </div>
  );
}
