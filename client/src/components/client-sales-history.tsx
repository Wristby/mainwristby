import type { InventoryItem } from "@shared/schema";
import { format } from "date-fns";
import { Watch } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RowLink } from "@/components/row-link";
import { compareSoldDates, getSoldDate } from "@/lib/sold-date";

const formatAmount = (amount: number) => new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
}).format(amount / 100);

export function ClientSalesHistory({ sales }: { sales: InventoryItem[] }) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden" data-testid="client-sales-history">
      <CardHeader className="bg-slate-50/50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Watch className="w-5 h-5 text-emerald-600 shrink-0" />
          Watches sold to this client
        </CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Watch</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Sale date</TableHead>
            <TableHead className="text-right">Sale amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                No watches sold to this client yet.
              </TableCell>
            </TableRow>
          ) : [...sales].sort((a, b) => compareSoldDates(a, b, "desc")).map(item => {
            const date = getSoldDate(item);
            // Older rows have the default salePrice of zero while their actual
            // amount lives in soldPrice. Keep zero when neither field has a
            // nonzero amount instead of treating it as missing.
            const amount = item.salePrice === 0 && item.soldPrice != null && item.soldPrice !== 0
              ? item.soldPrice
              : item.salePrice ?? item.soldPrice;
            return (
              <TableRow key={item.id} className="relative group cursor-pointer hover:bg-slate-50 transition-colors">
                <TableCell>
                  <RowLink href={`/inventory/${item.id}`} label={`Open ${item.brand} ${item.model}`} />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 group-hover:text-emerald-600">{item.brand}</span>
                    <span className="text-sm text-slate-500">{item.model}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-500">{item.referenceNumber || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-500">{date ? format(date, "dd MMM yyyy") : "Not recorded"}</TableCell>
                <TableCell className="text-right whitespace-nowrap font-medium text-slate-900">
                  {amount == null ? "Not recorded" : formatAmount(amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
