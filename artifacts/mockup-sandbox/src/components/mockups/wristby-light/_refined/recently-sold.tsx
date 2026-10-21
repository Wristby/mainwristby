import { format } from "date-fns";
import { ShoppingBag, Watch } from "lucide-react";
import { Link } from "../_source/runtime";
import type { InventoryItem } from "../_source/runtime";
import { Badge } from "../_source/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../_source/ui/card";
import { SoldReturnSummary } from "../_source/sold-return-summary";

type RecentlySoldProps = {
  watches: InventoryItem[];
  now: Date;
  calcProfit: (item: InventoryItem) => number;
  formatCurrency: (value: number) => string;
};

const timestamp = (item: InventoryItem) => {
  const value = new Date(item.soldDate || item.dateSold || 0).getTime();
  return Number.isFinite(value) ? value : 0;
};

export function RecentlySold({ watches, now, calcProfit, formatCurrency }: RecentlySoldProps) {
  const sold = watches.filter((item) => item.status === "sold");
  const recent = [...sold].sort((a, b) => timestamp(b) - timestamp(a)).slice(0, 6);
  return (
    <Card className="wb-sold-panel bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-emerald-700" />
          <CardTitle className="text-slate-900 text-lg">Recently Sold</CardTitle>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">{recent.length} recent</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {!recent.length ? <div className="text-center py-8 text-slate-400">No watches sold yet.</div> :
          recent.map((item) => {
            const profit = calcProfit(item);
            const soldDate = item.soldDate || item.dateSold;
            return (
              <Link key={item.id} href={`/inventory/${item.id}`} className="wb-sold-row block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Watch className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm [overflow-wrap:anywhere]">{item.brand} {item.model}</p>
                      <p className="text-xs text-slate-500">{soldDate && !isNaN(new Date(soldDate).getTime()) ? format(new Date(soldDate), "d MMM yyyy") : "—"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(item.salePrice || 0)}</p>
                    <p className={`text-xs font-medium tabular-nums ${profit >= 0 ? "text-emerald-700" : "text-red-500"}`}>{profit >= 0 ? "+" : ""}{formatCurrency(profit)}</p>
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
