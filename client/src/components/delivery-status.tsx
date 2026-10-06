import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { amsterdamToday, deliveryDateError, formatDeliveryDate, returnWindow } from "@shared/delivery";
import { useAmsterdamClock } from "@/hooks/use-amsterdam-clock";
import { useUpdateInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeliveryStatus({ id, deliveredDate }: { id: number; deliveredDate: string | null }) {
  const now = useAmsterdamClock();
  const today = amsterdamToday(now);
  const countdown = returnWindow(deliveredDate, now);
  const update = useUpdateInventory();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const startEditing = () => {
    setSelectedDate(deliveredDate || amsterdamToday());
    setError(null);
    setClearing(false);
    setOpen(true);
  };
  const save = async (date: string | null) => {
    const message = date === null ? null : deliveryDateError(date);
    if (message) { setError(message); return; }
    setError(null);
    try {
      await update.mutateAsync({ id, deliveredDate: date });
      setOpen(false);
      toast({
        title: date ? "Delivery confirmed" : "Delivery date cleared",
        description: date ? `Delivered ${formatDeliveryDate(date)}. Return countdown updated.` : "Delivery is now unconfirmed.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save delivery date. Please try again.");
    }
  };

  return (
    <div className="border-t border-emerald-100 pt-3 mt-3 space-y-3" data-testid="delivery-status">
      {countdown && deliveredDate ? (
        <>
          <div className="flex items-start gap-2 text-sm text-emerald-800">
            <Check className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Delivered <strong>{formatDeliveryDate(deliveredDate)}</strong></span>
          </div>
          <div className="space-y-1" role="status" aria-live="polite">
            <Badge variant="outline" className={countdown.daysRemaining < 0
              ? "bg-slate-50 text-slate-600 border-slate-200 whitespace-normal"
              : countdown.daysRemaining <= 3
                ? "bg-amber-50 text-amber-800 border-amber-200 whitespace-normal"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 whitespace-normal"}>
              {countdown.label}
            </Badge>
            <p className="text-xs text-slate-600">Return deadline: {formatDeliveryDate(countdown.deadline)} (Amsterdam)</p>
          </div>
        </>
      ) : <p className="text-sm text-slate-500">Delivery not confirmed</p>}
      <Button type="button" variant="outline" className="min-h-11 w-full whitespace-normal" onClick={startEditing} data-testid="button-mark-delivered">
        {countdown ? "Edit delivery date" : "Mark delivered"}
      </Button>
      <p className="text-xs text-slate-500">14-day reminder only; does not determine return eligibility or record return requests.</p>
      <Dialog open={open} onOpenChange={(value) => { if (!update.isPending) setOpen(value); }}>
        <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>{clearing ? "Clear delivery confirmation?" : countdown ? "Edit delivery date" : "Mark delivered"}</DialogTitle>
            <DialogDescription>
              {clearing ? "This removes the delivery date and countdown. The sale and tracking details will not change."
                : "Select the date the customer received the watch. The 14-day countdown starts the next day."}
            </DialogDescription>
          </DialogHeader>
          {!clearing && (
            <div className="space-y-2">
              <Label htmlFor={`delivery-date-${id}`}>Delivery date</Label>
              <Input id={`delivery-date-${id}`} type="date" value={selectedDate} max={today}
                disabled={update.isPending} className="min-h-11 min-w-0 w-full"
                aria-invalid={!!error} aria-describedby={error ? `delivery-error-${id}` : undefined}
                onChange={event => { setSelectedDate(event.target.value); setError(null); }}
                data-testid="input-delivery-date" />
            </div>
          )}
          {error && <p role="alert" id={`delivery-error-${id}`} className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button type="button" disabled={update.isPending} variant={clearing ? "destructive" : "default"}
              className="min-h-11" onClick={() => save(clearing ? null : selectedDate)} data-testid="button-confirm-delivery">
              {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {clearing ? "Confirm clear" : "Confirm delivery date"}
            </Button>
            {deliveredDate && !clearing && (
              <Button type="button" variant="ghost" className="min-h-11 text-red-600" disabled={update.isPending}
                onClick={() => { setClearing(true); setError(null); }} data-testid="button-clear-delivery">
                Clear delivery date
              </Button>
            )}
            <Button type="button" variant="outline" className="min-h-11" disabled={update.isPending}
              onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
