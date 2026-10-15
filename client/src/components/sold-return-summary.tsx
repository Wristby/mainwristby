import { formatDeliveryDate, returnWindow } from "@shared/delivery";
import { cn } from "@/lib/utils";

export function SoldReturnSummary({ deliveredDate, now, showDeliveredDate = true }: {
  deliveredDate?: string | null;
  now: Date;
  showDeliveredDate?: boolean;
}) {
  const countdown = returnWindow(deliveredDate, now);
  if (!countdown || !deliveredDate) {
    return <span className="text-sm text-slate-500">Delivery not confirmed</span>;
  }

  const tone = countdown.daysRemaining < 0
    ? "text-slate-500"
    : countdown.daysRemaining <= 3
      ? "text-amber-800"
      : "text-emerald-800";

  return (
    <div className="space-y-1.5">
      {showDeliveredDate && (
        <p className="text-xs text-slate-600">Delivered <span className="font-medium text-slate-800">{formatDeliveryDate(deliveredDate)}</span></p>
      )}
      <div className="space-y-0.5">
        <p className={cn("text-sm font-medium", tone)}>{countdown.label}</p>
        <p className="text-xs text-slate-500">Deadline: {formatDeliveryDate(countdown.deadline)}</p>
      </div>
    </div>
  );
}
