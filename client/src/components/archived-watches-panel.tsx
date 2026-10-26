import { Loader2, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { useArchivedInventory, useRestoreInventory } from "@/hooks/use-inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ArchivedWatchesPanel() {
  const archivedQuery = useArchivedInventory();
  const restoreMutation = useRestoreInventory();
  const { toast } = useToast();

  const restoreWatch = (id: number) => {
    restoreMutation.mutate(id, {
      onSuccess: () => toast({ title: "Watch restored", description: "It is back in active inventory." }),
      onError: (error) => toast({ title: "Could not restore watch", description: error.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4" data-testid="archived-watches-panel">
      <p className="text-sm text-slate-500">
        Archived watches are hidden from active inventory. Their watch details, customer links, and expenses are preserved.
      </p>

      {archivedQuery.isLoading && (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading archived watches…
        </div>
      )}

      {archivedQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <span>{archivedQuery.error.message}</span>
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => archivedQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {archivedQuery.data?.length === 0 && !archivedQuery.isLoading && !archivedQuery.isError && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
          No watches are archived.
        </div>
      )}

      {!!archivedQuery.data?.length && (
        <div className="space-y-3" data-testid="archived-watches-list">
          {archivedQuery.data.map((watch) => (
            <div
              key={watch.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid={`archived-watch-${watch.id}`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/inventory/${watch.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline">
                    {watch.brand} {watch.model}
                  </Link>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {watch.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="break-words text-xs text-slate-500">
                  Ref. {watch.referenceNumber}
                  {watch.serialNumber ? ` · Serial ${watch.serialNumber}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  Archived {watch.archivedAt ? new Date(String(watch.archivedAt)).toLocaleDateString() : "date unavailable"}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => restoreWatch(watch.id)}
                disabled={restoreMutation.isPending}
                data-testid={`button-restore-watch-${watch.id}`}
              >
                {restoreMutation.isPending && restoreMutation.variables === watch.id
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RotateCcw className="mr-2 h-4 w-4" />}
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
