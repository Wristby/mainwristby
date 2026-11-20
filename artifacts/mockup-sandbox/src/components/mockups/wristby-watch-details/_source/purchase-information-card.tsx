import type { InventoryItem } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PurchaseInformationCardProps = {
  item: InventoryItem;
  formatCurrency: (cents: number) => string;
};

export function PurchaseInformationCard({ item, formatCurrency }: PurchaseInformationCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Purchase Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Purchase Channel</span>
            <span className="text-sm font-medium text-slate-900">{(item as any).purchasedFrom || "N/A"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Paid With</span>
            <span className="text-sm font-medium text-slate-900">{(item as any).paidWith || "N/A"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">COGS</span>
            <span className="text-sm font-medium text-slate-900">{formatCurrency(item.purchasePrice)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Import Fee</span>
            <span className="text-sm font-medium text-slate-900">{formatCurrency((item as any).importFee || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Watch Register Check</span>
            <span className="text-sm font-medium text-slate-900">{(item as any).watchRegister ? "Yes " : "No"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
