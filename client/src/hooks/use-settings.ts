import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

const DEFAULTS: AppSettings = {
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
  ai_model: "gemini-flash-lite-latest",
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
    aging_inventory: { visible: true, order: 6 },
    recent_additions: { visible: true, order: 7 },
  },
};

async function migrateLocalStorage() {
  const migrationKey = "settings_migrated_to_db";
  if (localStorage.getItem(migrationKey)) return;
  const mappings: Record<string, string> = {
    taxRate: "default_tax_rate",
    marginRate: "default_margin_rate",
    monthlyProfitGoal: "monthly_profit_goal",
  };
  let allSucceeded = true;
  for (const [lsKey, settingKey] of Object.entries(mappings)) {
    const val = localStorage.getItem(lsKey);
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        try {
          await apiRequest("PUT", `/api/settings/${settingKey}`, { value: num });
          localStorage.removeItem(lsKey);
        } catch (err) {
          console.error(`Failed to migrate setting ${lsKey} -> ${settingKey}:`, err);
          allSucceeded = false;
        }
      } else {
        localStorage.removeItem(lsKey);
      }
    }
  }
  if (allSucceeded) {
    localStorage.setItem(migrationKey, "1");
  }
}

export function useSettings() {
  const query = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });
  const migrated = useRef(false);
  useEffect(() => {
    if (query.data && !migrated.current) {
      migrated.current = true;
      migrateLocalStorage().then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      });
    }
  }, [query.data]);

  const rawMerged = { ...DEFAULTS, ...(query.data || {}) };

  const fallbackPlatformFees = DEFAULTS.quick_estimate_platform_fees.map((fee) =>
    fee.id === "chrono24" && typeof rawMerged.chrono24_commission === "number"
      ? { ...fee, amount: rawMerged.chrono24_commission }
      : fee
  );
  const normalizedPlatformFees = Array.isArray(rawMerged.quick_estimate_platform_fees)
    ? rawMerged.quick_estimate_platform_fees
        .filter((entry): entry is QuickEstimatePlatformFee =>
          !!entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.label === "string" &&
          (entry.type === "percentage" || entry.type === "flat") &&
          typeof entry.amount === "number" &&
          Number.isFinite(entry.amount) &&
          entry.amount >= 0
        )
        .map((entry) => ({ ...entry, label: entry.label.trim() }))
        .filter((entry) => entry.label.length > 0)
    : fallbackPlatformFees;
  const normalizedVatRate =
    typeof rawMerged.vat_rate === "number" &&
    Number.isFinite(rawMerged.vat_rate) &&
    rawMerged.vat_rate >= 0 &&
    rawMerged.vat_rate <= 100
      ? rawMerged.vat_rate
      : DEFAULTS.vat_rate;

  const normalizedPaidWith: { name: string; isCredit: boolean }[] = (
    rawMerged.paid_with_methods as unknown[]
  ).map((entry) => {
    if (typeof entry === "string") {
      return { name: entry, isCredit: /credit|cc|amex|visa|mastercard/i.test(entry) };
    }
    return entry as { name: string; isCredit: boolean };
  });

  const merged: AppSettings = {
    ...rawMerged,
    quick_estimate_platform_fees: normalizedPlatformFees.length > 0 ? normalizedPlatformFees : fallbackPlatformFees,
    vat_rate: normalizedVatRate,
    paid_with_methods: normalizedPaidWith,
  };

  return {
    ...query,
    settings: merged,
  };
}

export function useUpdateSetting() {
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}
