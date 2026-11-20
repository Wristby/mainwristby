import type { InventoryItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";
import { serviceHistoryToFormValues } from "@/lib/service-history";

export function ServiceHistoryCard({
  item,
  formatCurrency,
}: {
  item: InventoryItem;
  formatCurrency: (cents: number) => string;
}) {
  const visits = serviceHistoryToFormValues(item);
  if (visits.length === 0) return null;
  const totalCostCents = visits.reduce((total, visit) => total + Math.round(visit.cost * 100), 0);

  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="card-service-history">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
          <Wrench className="h-4 w-4 text-slate-500" /> Service History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visits.map((visit, index) => (
          <article key={`${visit.startDate}-${visit.completedDate}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4" data-testid={`service-history-visit-${index + 1}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Visit {index + 1}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {visit.startDate ? format(parseISO(visit.startDate), "dd MMM yyyy") : "Start date not recorded"}
                  {" – "}
                  {visit.completedDate ? format(parseISO(visit.completedDate), "dd MMM yyyy") : "Completion date not recorded"}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-800">{formatCurrency(Math.round(visit.cost * 100))}</span>
            </div>
            {visit.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{visit.notes}</p>}
          </article>
        ))}
        <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">
          <span className="font-medium text-slate-600">Total recorded visit costs</span>
          <span className="font-semibold text-slate-900">{formatCurrency(totalCostCents)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
