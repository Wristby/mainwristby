// Design-only adapter. This module has no network, authentication, or persistence.
import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { z } from "zod";
import { DEFAULTS, type AppSettings } from "./settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
export type { QuickEstimatePlatformFee } from "./settings";

export type InventoryItem = {
  id: number; brand: string; model: string; referenceNumber: string;
  serialNumber: string | null; status: "incoming" | "received" | "servicing" | "in_stock" | "sold";
  purchasePrice: number; salePrice: number | null;
  [key: string]: any;
};
export type DashboardStats = { totalInventoryValue: number; totalProfit: number; activeInventoryCount: number; soldInventoryCount: number; turnRate: number };

const daysAgo = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString(); };
const names = [
  ["Rolex", "Submariner Date", "126610LN"], ["Cartier", "Santos Medium", "WSSA0029"],
  ["Omega", "Speedmaster Professional", "310.30.42.50.01.002"], ["Tudor", "Black Bay 58", "79030N"],
  ["Rolex", "Datejust 36", "126234"], ["IWC", "Pilot's Watch Mark XX", "IW328201"],
  ["Grand Seiko", "Heritage Collection", "SBGA211"], ["Rolex", "Explorer", "124270"],
];
export const previewWatches: InventoryItem[] = [
  ...names.map(([brand, model, referenceNumber], index) => ({
    id: 1001 + index, brand, model, referenceNumber, serialNumber: `PREVIEW-${101 + index}`,
    status: (["in_stock", "in_stock", "in_stock", "received", "servicing", "incoming", "in_stock", "received"] as const)[index],
    purchasePrice: [950000, 425000, 520000, 235000, 730000, 390000, 405000, 560000][index],
    salePrice: null, targetSellPrice: 0, box: true, papers: true, condition: "Excellent", watchRegister: false,
    purchaseDate: daysAgo(index * 3 + 2), dateListed: daysAgo(index * 19 + 8), dateReceived: daysAgo(index * 4 + 3),
  })),
  ...[98000, 72000, 67000, 54000, 46000, 33000].map((profit, index) => {
    const [brand, model, referenceNumber] = names[index];
    return {
      id: 1101 + index, brand, model, referenceNumber, serialNumber: `PREVIEW-${201 + index}`,
      status: "sold" as const, purchasePrice: 500000, salePrice: 500000 + profit,
      targetSellPrice: 500000 + profit, box: true, papers: true, condition: "Excellent", watchRegister: false,
      soldDate: new Date(new Date().getFullYear(), new Date().getMonth(), Math.max(1, new Date().getDate() - index)).toISOString(),
      purchaseDate: daysAgo(35 + index), deliveredDate: index === 5 ? null : daysAgo(index * 3 + 1).slice(0, 10),
    };
  }),
];
const initialSettings: AppSettings = { ...DEFAULTS, monthly_profit_goal: 500000 };
const SettingsContext = createContext({ settings: initialSettings, setSettings: (_: AppSettings) => {} });
const notify = (message: string) => window.dispatchEvent(new CustomEvent("wristby-preview-notice", { detail: message }));

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(initialSettings);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const listener = (event: Event) => {
      setNotice((event as CustomEvent<string>).detail);
      clearTimeout(timer); timer = setTimeout(() => setNotice(""), 5000);
    };
    window.addEventListener("wristby-preview-notice", listener);
    return () => { clearTimeout(timer); window.removeEventListener("wristby-preview-notice", listener); };
  }, []);
  return <SettingsContext.Provider value={{ settings, setSettings }}>
    {children}
    {notice && <div role="status" style={{ position: "fixed", bottom: 24, right: 16, left: "auto", maxWidth: "min(360px, calc(100vw - 32px))", zIndex: 100, padding: 16, background: "#12281e", color: "white", borderRadius: 12, boxShadow: "0 8px 28px #0002", fontSize: 13 }}>
      {notice}<button aria-label="Dismiss preview message" onClick={() => setNotice("")} style={{ marginLeft: 12 }}>×</button>
    </div>}
  </SettingsContext.Provider>;
}
export function useQuery<T>({ queryKey }: { queryKey: string[] }) {
  const data = queryKey[0] === "/api/inventory" ? previewWatches : { totalInventoryValue: 4215000, totalProfit: 370000, activeInventoryCount: 8, soldInventoryCount: 6, turnRate: 24 };
  return { data: data as T, isLoading: false, isError: false };
}
export function useSettings() { return useContext(SettingsContext); }
export function useUpdateSetting() {
  const context = useContext(SettingsContext);
  return { isPending: false, mutate: ({ key, value }: { key: string; value: unknown }) => context.setSettings({ ...context.settings, [key]: value }) };
}
export function useAmsterdamClock() { return new Date(); }
export function useAuth() { return { user: { username: "Preview" }, isLoading: false, logout: () => notify("Design preview only. Your live account remains signed in.") }; }
export function useToast() { return { toast: (_: unknown) => notify("Preview only — no business records were changed.") }; }
function usePreviewMutation() {
  return { isPending: false, mutate: (data: any, options?: { onSuccess?: (data: any) => void; onError?: (error: Error) => void }) => {
    options?.onSuccess?.({ ...data, id: 9999 }); notify("Preview only — no business records were saved.");
  } };
}
export const useCreateExpense = usePreviewMutation;
export const useCreateClient = usePreviewMutation;
export function useLocation(): [string, (path: string) => void] {
  return ["/", path => notify(`Navigation preview: ${path}. Live app and records are unchanged.`)];
}
export function Link({ href, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} href="#" onClick={event => { event.preventDefault(); onClick?.(event); notify(`Navigation preview: ${href}. Live app and records are unchanged.`); }}>{children}</a>;
}
export function Calendar({ selected, onSelect }: { selected?: Date; onSelect?: (date: Date | undefined) => void; [key: string]: unknown }) {
  return <input aria-label="Preview date" type="date" value={selected?.toISOString().slice(0, 10) || ""} onChange={event => onSelect?.(event.target.value ? new Date(event.target.value) : undefined)}/>;
}
export function WatchIntake({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader>
    <DialogTitle>Add Watch</DialogTitle>
    <DialogDescription>This is a dashboard design preview. Your existing five-step watch intake and its fields stay unchanged.</DialogDescription>
  </DialogHeader><button onClick={() => onOpenChange(false)}>Back to dashboard</button></DialogContent></Dialog>;
}
export const insertExpenseSchema = z.object({
  description: z.string(), amount: z.number(), date: z.date(), category: z.enum(["marketing", "rent_storage", "subscriptions", "tools", "insurance", "service", "shipping", "parts", "platform_fees", "other"]), isRecurring: z.boolean(), inventoryId: z.number().nullable().optional(),
});
export const insertClientSchema = z.object({
  name: z.string(), email: z.string(), phone: z.string(), socialHandle: z.string(), website: z.string(), country: z.string(), type: z.string(), notes: z.string(), isVip: z.boolean(),
});
