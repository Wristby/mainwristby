import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiJson, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import type { InventorySale } from "@shared/schema";
import { salesQueryKey } from "@/hooks/use-sales";
import { amsterdamToday } from "@shared/delivery";

export function ReturnCaseDialog({
  sale,
  onSaved,
}: {
  sale: InventorySale;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [requestDate, setRequestDate] = useState(amsterdamToday());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function submit() {
    setSaving(true);
    try {
      const path = api.sales.createReturn.path.replace(":saleId", String(sale.id));
      await apiJson("POST", path, { requestDate, reason: reason.trim() });
      await queryClient.invalidateQueries({ queryKey: [...salesQueryKey] });
      if (sale.inventoryId != null) {
        await queryClient.invalidateQueries({ queryKey: [`/api/inventory/${sale.inventoryId}/sales`] });
        await queryClient.invalidateQueries({ queryKey: [api.inventory.get.path, sale.inventoryId] });
      }
      setOpen(false);
      setReason("");
      toast({ title: "Return logged", description: "The return is now in your Returns list." });
      onSaved?.();
    } catch (error) {
      toast({
        title: "Could not log return",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="mr-2 h-4 w-4" /> Log return
      </Button>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a return request</DialogTitle>
          <DialogDescription>
            Keep this sale in the watch’s history. You can add shipping, refund, and inspection details from the Returns page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`return-request-date-${sale.id}`}>Request date</Label>
            <Input
              id={`return-request-date-${sale.id}`}
              type="date"
              value={requestDate}
              onChange={(event) => setRequestDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`return-reason-${sale.id}`}>Reason</Label>
            <Textarea
              id={`return-reason-${sale.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              placeholder="Optional note about why the buyer requested a return"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={saving || !requestDate}>
            {saving ? "Saving…" : "Create return case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
