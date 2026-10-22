import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RetentionPreview, RetentionSchedule, RetentionScheduleInput } from "@shared/retention";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Archive, Check, Clock3, Loader2, LockKeyhole, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

type Hold = { id: number; scope: "client" | "inventory"; recordId: number; reason: string };
type ApiError = Error & { status?: number };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

const categoryInfo = [
  { key: "optional_profile", title: "Optional profile", trigger: "Last activity", note: "Contact and preference details only" },
  { key: "financial", title: "Financial records", trigger: "Financial year end", note: "Protected; never cleared by this tool" },
  { key: "warranty", title: "Warranty records", trigger: "Delivery", note: "Protected; never cleared by this tool" },
] as const;

const emptySchedule: RetentionScheduleInput = {
  rules: {
    optional_profile: { purpose: "", trigger: "last_activity", days: Number.NaN },
    financial: { purpose: "", trigger: "financial_year_end", days: Number.NaN },
    warranty: { purpose: "", trigger: "delivery", days: Number.NaN },
  },
  backup: { expiryDays: Number.NaN, procedure: "", verified: false },
  ownerApproval: "",
  adviserApproval: "",
  confirmApproval: false,
};

function holdLabel(hold: Hold) {
  return `${hold.scope === "client" ? "Client" : "Watch"} #${hold.recordId}`;
}

function useHolds() {
  return useQuery({
    queryKey: ["/api/retention/holds"],
    queryFn: () => requestJson<Hold[]>("/api/retention/holds"),
  });
}

function HoldManager({ holds, loading, refresh }: { holds: Hold[]; loading: boolean; refresh: () => void }) {
  const [scope, setScope] = useState<"client" | "inventory">("client");
  const [recordId, setRecordId] = useState("");
  const [reason, setReason] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addHold = async () => {
    if (!Number(recordId) || !reason.trim()) return;
    setBusy(true);
    setError("");
    try {
      await requestJson("/api/retention/holds", { method: "POST", body: JSON.stringify({ scope, recordId: Number(recordId), reason: reason.trim() }) });
      setRecordId("");
      setReason("");
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const releaseHold = async (holdId: number) => {
    if (!releaseReason.trim()) {
      setError("Enter a reason before releasing a hold.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/retention/holds/${holdId}/release`, { method: "POST", body: JSON.stringify({ reason: releaseReason.trim() }) });
      setReleaseReason("");
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-emerald-700" />
        <h3 className="text-sm font-semibold text-slate-800">Legal holds</h3>
        <Badge variant="outline" className="ml-auto border-slate-300 text-slate-600">{loading ? "…" : holds.length} active</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-[125px_105px_1fr_auto]">
        <select aria-label="Hold record type" value={scope} onChange={(e) => setScope(e.target.value as "client" | "inventory")} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700">
          <option value="client">Client</option><option value="inventory">Linked watch</option>
        </select>
        <Input aria-label="Record ID for hold" type="number" min="1" placeholder="Record ID" value={recordId} onChange={(e) => setRecordId(e.target.value)} className="h-9 bg-white" />
        <Input aria-label="Reason for hold" placeholder="Required reason for placing hold" value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 bg-white" />
        <Button type="button" size="sm" onClick={addHold} disabled={busy || !Number(recordId) || !reason.trim()} className="bg-emerald-700 text-white hover:bg-emerald-800">Place hold</Button>
      </div>
      {holds.length > 0 && (
        <div className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {holds.map((hold) => (
            <div key={hold.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-xs">
              <span className="font-semibold text-slate-700">{holdLabel(hold)}</span><span className="min-w-0 flex-1 text-slate-500">{hold.reason}</span>
              <Button type="button" variant="outline" size="sm" disabled={busy || !releaseReason.trim()} aria-label={`Release hold ${hold.id}`} onClick={() => releaseHold(hold.id)} className="h-7 border-slate-300 text-slate-600">Release</Button>
            </div>
          ))}
        </div>
      )}
      {holds.length > 0 && <Input aria-label="Reason for releasing hold" value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} placeholder="Reason required to release a hold" className="mt-2 h-9 bg-white" />}
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}

export function RetentionSchedulePanel() {
  const queryClient = useQueryClient();
  const scheduleQuery = useQuery({
    queryKey: ["/api/retention/schedule"],
    queryFn: () => requestJson<RetentionSchedule | null>("/api/retention/schedule"),
  });
  const holdsQuery = useHolds();
  const [form, setForm] = useState<RetentionScheduleInput>(emptySchedule);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (scheduleQuery.data !== undefined && !loaded) {
      if (scheduleQuery.data) {
        const { revision: _revision, approvedAt: _approvedAt, automaticDeletionEnabled: _automaticDeletionEnabled, ...input } = scheduleQuery.data;
        setForm({ ...input, confirmApproval: false });
      } else {
        setForm(emptySchedule);
      }
      setLoaded(true);
    }
  }, [scheduleQuery.data, loaded]);

  const updateRule = (key: keyof RetentionScheduleInput["rules"], field: "purpose" | "days", value: string) => {
    setForm((current) => ({ ...current, confirmApproval: false, rules: { ...current.rules, [key]: { ...current.rules[key], [field]: field === "days" ? (value === "" ? Number.NaN : Number(value)) : value } } }));
    setSaved(false);
  };
  const update = <K extends keyof RetentionScheduleInput>(key: K, value: RetentionScheduleInput[K]) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === "confirmApproval" ? {} : { confirmApproval: false }) }));
    setSaved(false);
  };

  const saveSchedule = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !Number.isFinite(form.rules.optional_profile.days) ||
      !Number.isFinite(form.rules.financial.days) ||
      !Number.isFinite(form.rules.warranty.days) ||
      !Number.isFinite(form.backup.expiryDays)
    ) {
      setSaveError("Enter a day value for each retention category and backup expiry before saving.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await requestJson<RetentionSchedule>("/api/retention/schedule", { method: "PUT", body: JSON.stringify(form) });
      await queryClient.invalidateQueries({ queryKey: ["/api/retention/schedule"] });
      setSaved(true);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (scheduleQuery.isLoading) return <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100" aria-label="Loading retention schedule" />;
  if (scheduleQuery.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Retention schedule could not be loaded: {(scheduleQuery.error as Error).message}<Button variant="outline" size="sm" className="ml-3" onClick={() => scheduleQuery.refetch()}>Retry</Button></div>;

  return (
    <div className="space-y-4">
      <form onSubmit={saveSchedule} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-800"><ShieldCheck className="h-4 w-4" /></div>
            <div><h2 className="font-semibold text-slate-900">Retention safeguards</h2><p className="mt-0.5 text-xs text-slate-500">Document purpose and timing. Nothing is deleted automatically.</p></div>
          </div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Automatic deletion disabled</Badge>
        </div>
        <div className="space-y-5 p-5">
            <div className="grid gap-3 lg:grid-cols-3">
            {categoryInfo.map((category) => (
              <div key={category.key} className="rounded-lg border border-slate-200 p-3.5">
                <div className="mb-2 flex items-center justify-between"><Label htmlFor={`purpose-${category.key}`} className="text-sm font-semibold text-slate-800">{category.title}</Label><span className="text-[10px] uppercase tracking-wide text-slate-400">{category.trigger}</span></div>
                <Input id={`purpose-${category.key}`} value={form.rules[category.key].purpose} onChange={(e) => updateRule(category.key, "purpose", e.target.value)} placeholder="Purpose of keeping these records" maxLength={1000} className="h-9 bg-white text-sm" />
                <div className="mt-2 flex items-center gap-2">
                  <Input aria-label={`${category.title} retention days`} type="number" min={0} max={36500} value={Number.isFinite(form.rules[category.key].days) ? form.rules[category.key].days : ""} onChange={(e) => updateRule(category.key, "days", e.target.value)} placeholder="Days" className="h-9 w-24 bg-white text-sm" />
                  <span className="text-xs text-slate-500">days after fixed trigger</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">{category.note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2"><Archive className="h-4 w-4 text-slate-600" /><h3 className="text-sm font-semibold text-slate-800">Backup controls</h3></div>
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="space-y-2"><Label htmlFor="backup-expiry">Backup expiry</Label><div className="flex items-center gap-2"><Input id="backup-expiry" type="number" min={1} max={3650} value={Number.isFinite(form.backup.expiryDays) ? form.backup.expiryDays : ""} onChange={(e) => update("backup", { ...form.backup, expiryDays: e.target.value === "" ? Number.NaN : Number(e.target.value) })} className="bg-white" /><span className="text-xs text-slate-500">days</span></div></div>
              <div className="space-y-2"><Label htmlFor="backup-procedure">Backup and restoration procedure</Label><Textarea id="backup-procedure" value={form.backup.procedure} onChange={(e) => update("backup", { ...form.backup, procedure: e.target.value })} placeholder="Describe backup expiry and restoration safeguards (20 characters minimum)" className="min-h-[76px] bg-white" maxLength={4000} /><p className="text-[11px] leading-4 text-amber-800">Host-level backup expiry is not application-enforced and remains unverified until independently confirmed.</p></div>
            </div>
            <div className="mt-3 flex items-start gap-2.5"><Checkbox id="backup-verified" checked={form.backup.verified} onCheckedChange={(checked) => update("backup", { ...form.backup, verified: checked === true })} /><Label htmlFor="backup-verified" className="cursor-pointer text-xs leading-5 text-slate-600">Backup expiry and restoration controls have been verified.</Label></div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="owner-approval">Owner approval reference</Label><Input id="owner-approval" value={form.ownerApproval} onChange={(e) => update("ownerApproval", e.target.value)} placeholder="Name, date, or approval record" maxLength={500} /></div>
            <div className="space-y-2"><Label htmlFor="adviser-approval">Accountant / legal approval reference</Label><Input id="adviser-approval" value={form.adviserApproval} onChange={(e) => update("adviserApproval", e.target.value)} placeholder="Name, date, or approval record" maxLength={500} /></div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3"><Checkbox id="confirm-approval" checked={form.confirmApproval} onCheckedChange={(checked) => update("confirmApproval", checked === true)} /><Label htmlFor="confirm-approval" className="cursor-pointer text-xs leading-5 text-amber-900">I confirm both owner and accountant/legal approval are documented. Approval never enables automatic deletion.</Label></div>
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">{scheduleQuery.data?.approvedAt ? `Approval recorded ${new Date(scheduleQuery.data.approvedAt).toLocaleDateString()}` : "No approved schedule recorded yet."}</p>
            <div className="flex items-center gap-3">{saved && <span role="status" className="flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3.5 w-3.5" />Saved</span>}<Button type="submit" disabled={saving} className="bg-emerald-700 text-white hover:bg-emerald-800">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save schedule</Button></div>
          </div>
        </div>
      </form>
      <HoldManager holds={holdsQuery.data || []} loading={holdsQuery.isLoading} refresh={() => { holdsQuery.refetch(); queryClient.invalidateQueries({ queryKey: ["/api/retention/holds"] }); }} />
      {holdsQuery.isError && <p role="alert" className="text-sm text-red-700">Active holds could not be loaded: {(holdsQuery.error as Error).message}<Button variant="ghost" size="sm" onClick={() => holdsQuery.refetch()}>Retry</Button></p>}
    </div>
  );
}

export function ClientRetentionDialog({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clearError, setClearError] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [releaseReason, setReleaseReason] = useState("");
  const queryClient = useQueryClient();
  const previewQuery = useQuery({
    queryKey: ["/api/retention/clients", clientId, "preview"],
    queryFn: () => requestJson<RetentionPreview>(`/api/retention/clients/${clientId}/preview`),
    enabled: open,
    retry: false,
  });
  const holdsQuery = useHolds();
  const preview = previewQuery.data;
  const relatedHolds = useMemo(() => {
    const previewHolds: Hold[] = (preview?.holds || []).map((hold) => ({
      ...hold,
      scope: hold.scope === "inventory" ? "inventory" : "client",
    }));
    const unique = new Map<number, Hold>();
    [...(holdsQuery.data || []), ...previewHolds].forEach((hold) => unique.set(hold.id, hold));
    return Array.from(unique.values()).filter((hold) =>
      (hold.scope === "client" && hold.recordId === clientId) ||
      (hold.scope === "inventory" && (preview?.linkedWatchIds || []).includes(hold.recordId))
    );
  }, [holdsQuery.data, clientId, preview?.holds, preview?.linkedWatchIds]);

  const refreshPreview = async () => {
    setConfirm(false);
    setClearError("");
    await previewQuery.refetch();
    await holdsQuery.refetch();
  };

  useEffect(() => {
    if (!open) {
      setConfirm(false);
      setClearError("");
    }
  }, [open]);

  const placeHold = async (scope: "client" | "inventory", recordId: number) => {
    if (!holdReason.trim()) {
      setClearError("Enter a reason before placing a hold.");
      return;
    }
    setBusy(true);
    setClearError("");
    try {
      await requestJson("/api/retention/holds", { method: "POST", body: JSON.stringify({ scope, recordId, reason: holdReason.trim() }) });
      setHoldReason("");
      await refreshPreview();
    } catch (err) {
      setClearError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const releaseHold = async (holdId: number) => {
    if (!releaseReason.trim()) {
      setClearError("Enter a reason before releasing a hold.");
      return;
    }
    setBusy(true);
    setClearError("");
    try {
      await requestJson(`/api/retention/holds/${holdId}/release`, { method: "POST", body: JSON.stringify({ reason: releaseReason.trim() }) });
      setReleaseReason("");
      await refreshPreview();
    } catch (err) {
      setClearError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const clearOptionalProfile = async () => {
    if (!preview) return;
    setBusy(true);
    setClearError("");
    try {
      await requestJson(`/api/retention/clients/${clientId}/clear`, { method: "POST", body: JSON.stringify({ fingerprint: preview.fingerprint }) });
      await queryClient.invalidateQueries();
      setConfirm(false);
      await previewQuery.refetch();
    } catch (err) {
      const error = err as ApiError;
      setClearError(error.message);
      if (error.status === 409) {
        setConfirm(false);
        await previewQuery.refetch();
      }
    } finally {
      setBusy(false);
    }
  };

  const expiryText = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not scheduled";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={`Privacy preview and optional cleanup for client ${clientId}`} title="Privacy preview and optional cleanup" className="text-slate-400 hover:bg-emerald-50 hover:text-emerald-800"><ShieldCheck className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto border-slate-200 bg-white p-0 text-slate-900">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" />Client privacy review</DialogTitle>
          <DialogDescription>Review what can be cleared and what must remain. This is an optional-profile cleanup, not client deletion.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5 sm:p-6">
          {previewQuery.isLoading && <div className="space-y-3" aria-label="Loading privacy preview"><div className="h-20 animate-pulse rounded-lg bg-slate-100" /><div className="h-28 animate-pulse rounded-lg bg-slate-100" /></div>}
          {previewQuery.isError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Privacy preview could not be loaded: {(previewQuery.error as Error).message}<Button variant="outline" size="sm" className="ml-3 border-red-200" onClick={() => previewQuery.refetch()}>Retry</Button></div>}
          {preview && <>
            <div className={`flex items-start gap-3 rounded-lg border p-3.5 ${preview.eligible ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
              {preview.eligible ? <Check className="mt-0.5 h-4 w-4 text-emerald-700" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />}
              <div><p className="text-sm font-semibold text-slate-800">{preview.eligible ? "Optional profile cleanup is eligible" : "Cleanup is blocked"}</p>
                {preview.blockers.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900">{preview.blockers.map((blocker, index) => <li key={`${blocker}-${index}`}>{blocker}</li>)}</ul>}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Refresh privacy preview" onClick={refreshPreview} className="ml-auto -mt-1 text-slate-500"><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">Fields to clear if eligible</h3>
                {preview.clear.length ? <ul className="space-y-1 text-sm text-slate-700">{preview.clear.map((field) => <li key={field} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-700" />{field}</li>)}</ul> : <p className="text-sm text-slate-500">No optional profile fields currently present.</p>}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700"><LockKeyhole className="h-3.5 w-3.5" />Retained records</h3>
                {preview.retain.length ? <ul className="space-y-1 text-sm text-slate-700">{preview.retain.map((field) => <li key={field}>{field}</li>)}</ul> : <p className="text-sm text-slate-500">No additional retained fields listed.</p>}
                <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
                  Linked watch IDs: {preview.linkedWatchIds.length ? preview.linkedWatchIds.map((watchId) => `#${watchId}`).join(", ") : "None"} · {preview.expenseCount} expense record{preview.expenseCount === 1 ? "" : "s"} protected
                </p>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock3 className="h-4 w-4 text-slate-500" />Retention categories</h3>
              <div className="divide-y divide-slate-100">
                {preview.categories.map((category, index) => <div key={`${category.category}-${index}`} className="grid gap-1 py-2 text-xs sm:grid-cols-[1fr_1fr_auto] sm:items-center"><span className="font-medium capitalize text-slate-700">{category.category.replaceAll("_", " ")}</span><span className="text-slate-500">{category.trigger.replaceAll("_", " ")}</span><span className="text-slate-600">{expiryText(category.eligibleAfter)}</span><span className="sm:col-span-3 text-slate-400">{category.action}</span></div>)}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Legal holds</h3><Badge variant="outline" className="text-slate-600">{relatedHolds.length} active</Badge></div>
              {holdsQuery.isLoading && <p className="text-xs text-slate-500">Loading holds…</p>}
              {holdsQuery.isError && <p role="alert" className="text-xs text-red-700">Could not load active holds: {(holdsQuery.error as Error).message}<Button variant="ghost" size="sm" onClick={() => holdsQuery.refetch()}>Retry</Button></p>}
              {relatedHolds.map((hold) => <div key={hold.id} className="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs"><span className="font-semibold text-slate-700">{holdLabel(hold)}</span><span className="flex-1 text-slate-500">{hold.reason}</span><Button type="button" variant="outline" size="sm" disabled={busy || !releaseReason.trim()} aria-label={`Release ${holdLabel(hold)} legal hold`} onClick={() => releaseHold(hold.id)} className="h-7 border-slate-300 text-slate-600">Release</Button></div>)}
              {relatedHolds.length > 0 && <Input aria-label="Reason for releasing legal hold" value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} placeholder="Reason required to release a hold" className="mb-2 h-9" />}
              <Input aria-label="Reason for placing legal hold" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Reason required to place a hold" className="mb-2 h-9" />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={busy || !holdReason.trim() || relatedHolds.some((hold) => hold.scope === "client" && hold.recordId === clientId)} onClick={() => placeHold("client", clientId)} className="border-slate-300 text-slate-700">Place client hold</Button>
                {preview.linkedWatchIds.map((watchId) => <Button key={watchId} type="button" variant="outline" size="sm" disabled={busy || !holdReason.trim() || relatedHolds.some((hold) => hold.scope === "inventory" && hold.recordId === watchId)} onClick={() => placeHold("inventory", watchId)} className="border-slate-300 text-slate-700">Hold watch #{watchId}</Button>)}
              </div>
            </section>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><p className="text-xs leading-5 text-amber-950">Only optional profile fields may be cleared. Transaction, warranty, inventory links, and expense records remain protected. This action cannot be undone.</p></div>
              <div className="mt-3 flex items-start gap-2.5"><Checkbox id={`clear-confirm-${clientId}`} checked={confirm} onCheckedChange={(checked) => setConfirm(checked === true)} /><Label htmlFor={`clear-confirm-${clientId}`} className="cursor-pointer text-xs leading-5 text-amber-950">I have reviewed this preview and explicitly confirm the irreversible optional-profile cleanup.</Label></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="break-all font-mono text-[10px] text-slate-500">Preview fingerprint: {preview.fingerprint}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" disabled={!preview.eligible || !confirm || busy || previewQuery.isError || previewQuery.isFetching} className="bg-amber-700 text-white hover:bg-amber-800">
                      <Trash2 className="mr-2 h-4 w-4" />Clear optional profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm irreversible profile cleanup</AlertDialogTitle><AlertDialogDescription>This will clear only the optional profile fields listed above. Transaction and expense records remain. The request will use the currently shown preview fingerprint.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Go back</AlertDialogCancel><AlertDialogAction disabled={busy || previewQuery.isError || previewQuery.isFetching} onClick={() => { void clearOptionalProfile(); }} className="bg-amber-700 text-white hover:bg-amber-800">{busy ? "Clearing…" : "Confirm and clear"}</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>}
          {clearError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{clearError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TransactionParty = { id: number; role: "buyer" | "seller"; name: string; retainedAt: string };

export function TransactionParties({ inventoryId }: { inventoryId: number }) {
  const partiesQuery = useQuery({
    queryKey: ["/api/retention/inventory", inventoryId, "parties"],
    queryFn: () => requestJson<TransactionParty[]>(`/api/retention/inventory/${inventoryId}/parties`),
    enabled: !!inventoryId,
  });
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800"><LockKeyhole className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800">Transaction-only identities</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Buyer and seller identity needed for transaction records is retained separately from optional client profile details.</p>
          {partiesQuery.isLoading && <div className="mt-3 h-12 animate-pulse rounded-md bg-slate-200/70" aria-label="Loading retained transaction parties" />}
          {partiesQuery.isError && <div role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">Transaction identities could not be loaded: {(partiesQuery.error as Error).message}<Button type="button" variant="outline" size="sm" className="ml-2 h-7 border-red-200" onClick={() => partiesQuery.refetch()}>Retry</Button></div>}
          {partiesQuery.data && partiesQuery.data.length === 0 && <p className="mt-3 text-xs text-slate-500">No transaction-only identities recorded for this watch.</p>}
          {!!partiesQuery.data?.length && <div className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {partiesQuery.data.map((party) => <div key={party.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
              <Badge variant="outline" className="capitalize text-slate-600">{party.role}</Badge><span className="font-medium text-slate-800">{party.name}</span><span className="ml-auto text-slate-400">Retained {new Date(party.retainedAt).toLocaleDateString()}</span>
            </div>)}
          </div>}
        </div>
      </div>
    </section>
  );
}
