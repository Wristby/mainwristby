import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export interface AppSettings {
  chrono24_commission: number;
  watch_register_fee: number;
  default_tax_rate: number;
  default_margin_rate: number;
  monthly_profit_goal: number;
  aging_threshold_days: number;
  watch_brands: string[];
  sales_platforms: string[];
  shipping_partners: string[];
  purchase_channels: string[];
  expense_categories: { value: string; label: string }[];
  ai_model: string;
  ai_prompt_template: string;
  inventory_export_columns: string[];
  financial_export_columns: string[];
  dashboard_sections: Record<string, { visible: boolean; order: number }>;
}

const DEFAULTS: AppSettings = {
  chrono24_commission: 6.5,
  watch_register_fee: 600,
  default_tax_rate: 36.97,
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
  ai_model: "openai/gpt-4o-mini",
  ai_prompt_template: "",
  inventory_export_columns: [],
  financial_export_columns: [],
  dashboard_sections: {
    kpi_cards: { visible: true, order: 0 },
    quick_actions: { visible: true, order: 1 },
    monthly_profit_goal: { visible: true, order: 2 },
    quick_estimate: { visible: true, order: 3 },
    inventory_status: { visible: true, order: 4 },
    aging_inventory: { visible: true, order: 5 },
    recent_additions: { visible: true, order: 6 },
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
  for (const [lsKey, settingKey] of Object.entries(mappings)) {
    const val = localStorage.getItem(lsKey);
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        try {
          await apiRequest("PUT", `/api/settings/${settingKey}`, { value: settingKey === "monthly_profit_goal" ? Math.round(num * 100) : num });
        } catch {}
      }
      localStorage.removeItem(lsKey);
    }
  }
  localStorage.setItem(migrationKey, "1");
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

  const merged: AppSettings = { ...DEFAULTS, ...(query.data || {}) };

  return {
    ...query,
    settings: merged,
  };
}

export function useUpdateSetting() {
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}
