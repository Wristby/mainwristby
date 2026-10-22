import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { api } from "@shared/routes";
import type { Client } from "@shared/schema";
import {
  buyerReviewPath, buyerSyncPath,
  type BuyerReviewInput, type BuyerSyncReport,
} from "@shared/client-backfill";

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Watch buyers could not be synced. Try again.");
  }
  return response.json();
}

export function LegacyBuyerSync({ clients = [] }: { clients?: Client[] }) {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [created, setCreated] = useState(0);
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    queryClient.invalidateQueries({ queryKey: [api.clients.get.path] });
    queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
    queryClient.invalidateQueries({ queryKey: [api.inventory.get.path] });
  };
  const sync = useMutation({
    mutationFn: () => post<BuyerSyncReport>(buyerSyncPath),
    onSuccess: report => {
      if (report.created) setCreated(count => count + report.created);
      invalidate();
    },
  });
  const resolve = useMutation({
    mutationFn: (input: BuyerReviewInput) => post(buyerReviewPath, input),
    onSuccess: (_data, input) => {
      if (input.action === "create") setCreated(count => count + 1);
      invalidate();
      sync.mutate();
    },
    onError: () => sync.mutate(),
  });
  const runSync = sync.mutate;
  useEffect(() => {
    if (!started.current) { started.current = true; runSync(); }
  }, [runSync]);

  const pending = sync.data?.pending || [];
  const busy = sync.isPending || resolve.isPending;
  if (sync.isSuccess && !pending.length && !created && !resolve.error) return null;

  return (
    <section aria-labelledby="watch-buyer-sync-title" className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="watch-buyer-sync-title" className="font-semibold text-slate-900">Clients from watch buyers</h2>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => sync.mutate()}>Refresh</Button>
      </div>
      <p className="mt-2 text-sm text-slate-600" role="status">
        {sync.isPending ? "Checking historical watch buyers…" : created > 0
          ? `Added ${created} ${created === 1 ? "Client" : "Clients"} from watch buyer records.`
          : "Historical buyer names with possible matches need your review."}
      </p>
      {sync.error && <p role="alert" className="mt-2 text-sm text-red-700">{sync.error.message} Existing Clients are still available. Use Refresh to retry.</p>}
      {resolve.error && <p role="alert" className="mt-2 text-sm text-red-700">{resolve.error.message}</p>}
      {pending.length > 0 && <>
        <p className="mt-2 text-sm text-slate-600">
          {pending.length} {pending.length === 1 ? "buyer needs" : "buyers need"} review. Names alone are not enough to identify a person.
          Link an existing Client or create a separate one. Existing contact details will not be changed.
        </p>
        <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto">
          {pending.map(review => {
            const { watch, name, matches, repeatedName } = review;
            const suggested = new Set(matches.map(client => client.id));
            const choices = [...matches, ...clients.filter(client => !suggested.has(client.id))];
            return <div key={watch.id} className="rounded-lg border border-slate-200 bg-white p-4" data-testid={`buyer-review-${watch.id}`}>
              <p className="font-medium text-slate-900">{name}</p>
              <Link href={`/inventory/${watch.id}`} className="text-sm text-emerald-700 underline">
                {watch.brand} {watch.model} · Ref. {watch.referenceNumber} · Watch #{watch.id}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                {matches.length ? `${matches.length} possible existing ${matches.length === 1 ? "Client" : "Clients"}. ` : ""}
                {repeatedName ? "A similar name also appears on another unlinked watch." : ""}
              </p>
              <label htmlFor={`buyer-client-${watch.id}`} className="mt-3 block text-sm font-medium">Existing Client</label>
              <select id={`buyer-client-${watch.id}`} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                disabled={busy} value={selected[watch.id] || ""}
                onChange={event => setSelected(previous => ({ ...previous, [watch.id]: event.target.value }))}>
                <option value="">Choose a Client to link</option>
                {choices.map(client => <option key={client.id} value={client.id}>
                  {suggested.has(client.id) ? "Possible match: " : ""}{client.name} · #{client.id}{client.email ? ` · ${client.email}` : client.phone ? ` · ${client.phone}` : ""}
                </option>)}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={busy || !selected[watch.id]}
                  onClick={() => resolve.mutate({ action: "link", watchId: watch.id, expectedName: name, clientId: Number(selected[watch.id]) })}>
                  Link selected Client
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={busy}
                  onClick={() => resolve.mutate({ action: "create", watchId: watch.id, expectedName: name })}>
                  Create separate Client
                </Button>
              </div>
            </div>;
          })}
        </div>
      </>}
    </section>
  );
}
