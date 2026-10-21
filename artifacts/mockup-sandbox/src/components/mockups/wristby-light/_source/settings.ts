export type QuickEstimatePlatformFee = {
  id: string;
  label: string;
  type: "percentage" | "flat";
  // Percentage points for percentage fees; euro cents for flat fees.
  amount: number;
};

export interface AppSettings {
  chrono24_commission: number;
  watch_register_fee: number;
  quick_estimate_platform_fees: QuickEstimatePlatformFee[];
  default_tax_rate: number;
  vat_rate: number;
  default_margin_rate: number;
  monthly_profit_goal: number;
  aging_threshold_days: number;
  watch_brands: string[];
  sales_platforms: string[];
  shipping_partners: string[];
  purchase_channels: string[];
  paid_with_methods: { name: string; isCredit: boolean }[];
  expense_categories: { value: string; label: string }[];
  ai_model: string;
  ai_prompt_template: string;
  ai_movement_prompt_template: string;
  ai_instagram_prompt_template: string;
  inventory_export_columns: string[];
  financial_export_columns: string[];
  dashboard_sections: Record<string, { visible: boolean; order: number }>;
}

export const DEFAULTS: AppSettings = {
  chrono24_commission: 6.5,
  watch_register_fee: 600,
  quick_estimate_platform_fees: [
    { id: "chrono24", label: "Chrono24", type: "percentage", amount: 6.5 },
    { id: "wristler", label: "Wristler", type: "percentage", amount: 3 },
  ],
  default_tax_rate: 36.97,
  vat_rate: 21,
  default_margin_rate: 12.5,
  monthly_profit_goal: 200000,
  aging_threshold_days: 60,
  watch_brands: [
    "Audemars Piguet", "Bell and Ross", "Blancpain", "Breguet", "Breitling",
    "Cartier", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
    "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
    "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe",
    "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
    "Vacheron Constantin", "Zenith"
  ],
  sales_platforms: ["Chrono24", "Facebook Marketplace", "OLX", "Reddit", "Website"],
  shipping_partners: ["DHL", "FedEx", "UPS"],
  purchase_channels: ["Dealer", "Chrono24", "Reddit", "eBay", "Private Purchase", "Other"],
  paid_with_methods: [
    { name: "Credit", isCredit: true },
    { name: "Debit", isCredit: false },
    { name: "Wire", isCredit: false },
  ],
  expense_categories: [
    { value: "marketing", label: "Marketing" },
    { value: "rent_storage", label: "Rent/Storage" },
    { value: "subscriptions", label: "Subscriptions" },
    { value: "tools", label: "Tools" },
    { value: "insurance", label: "Insurance" },
    { value: "service", label: "Service" },
    { value: "shipping", label: "Shipping" },
    { value: "parts", label: "Parts" },
    { value: "platform_fees", label: "Platform Fees" },
    { value: "other", label: "Other" },
  ],
  ai_model: "gemini-3.5-flash-lite",
  ai_prompt_template: "",
  ai_movement_prompt_template: "",
  ai_instagram_prompt_template: "",
  inventory_export_columns: [],
  financial_export_columns: [],
  dashboard_sections: {
    kpi_cards: { visible: true, order: 0 },
    quick_actions: { visible: true, order: 1 },
    monthly_profit_goal: { visible: true, order: 2 },
    quick_estimate: { visible: true, order: 3 },
    inventory_status: { visible: true, order: 4 },
    aging_listed_inventory: { visible: true, order: 5 },
    recent_additions: { visible: true, order: 7 },
  },
};

