import { format } from "date-fns";
import { ShoppingBag, Watch } from "lucide-react";
import { Link } from "wouter";
import type { InventoryItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SoldReturnSummary } from "@/components/sold-return-summary";

type RecentlySoldProps = {
  watches: InventoryItem[];
  now: Date;
  calcProfit: (item: InventoryItem) => number;
  formatCurrency: (value: number) => string;
};

function saleTimestamp(item: InventoryItem) {
  const timestamp = new Date(item.soldDate || item.dateSold || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function RecentlySold({ watches, now, calcProfit, formatCurrency }: RecentlySoldProps) {
  const sold = watches.filter((item) => item.status === "sold");
  const recent = [...sold].sort((a, b) => saleTimestamp(b) - saleTimestamp(a)).slice(0, 6);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-slate-900 text-lg">Recently Sold</CardTitle>
        </div>
        {recent.length > 0 && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            {sold.length} total
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No watches sold yet.</div>
        ) : recent.map((item) => {
          const profit = calcProfit(item);
          const soldDate = item.soldDate || item.dateSold;
          return (
            <Link key={item.id} href={`/inventory/${item.id}`}
              className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Watch className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm [overflow-wrap:anywhere]">{item.brand} {item.model}</p>
                    <p className="text-xs text-slate-500">
                      {soldDate && !isNaN(new Date(soldDate).getTime()) ? format(new Date(soldDate), "d MMM yyyy") : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(item.salePrice || 0)}</p>
                  <p className={`text-xs font-medium tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <SoldReturnSummary deliveredDate={item.deliveredDate} now={now} showDeliveredDate={false} />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
