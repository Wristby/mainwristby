import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch, fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";
import "./public-auth.css";

interface WorkspaceAccess {
  plan: "trial" | "pro" | "legacy" | "expired";
  isPro: boolean;
  aiEnabled: boolean;
  isOwner: boolean;
  hasPaidSubscription: boolean;
  canAccessWorkspace: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  activeWatchCount: number;
  clientCount: number;
  limits: { activeWatches: number; clients: number } | null;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date)
    : "—";
}

export default function AccountPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const startedUpgrade = useRef(false);
  const upgradeRequested = new URLSearchParams(window.location.search).get("upgrade") === "pro";
  const billingStatus = new URLSearchParams(window.location.search).get("billing");
  const { data, isLoading, error: loadError } = useQuery<WorkspaceAccess>({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const response = await fetchApiResponse("/api/billing/status");
      await throwIfResNotOk(response, "Could not load your account plan.");
      return response.json();
    },
    retry: false,
    staleTime: 30_000,
  });

  async function startCheckout() {
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/billing/checkout", { method: "POST" }, "Could not start checkout.");
      const result = await response.json() as { url?: string };
      if (!result.url) throw new Error("Checkout is unavailable. Please try again.");
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  async function openBillingPortal() {
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/billing/portal", { method: "POST" }, "Could not open billing settings.");
      const result = await response.json() as { url?: string };
      if (!result.url) throw new Error("Billing settings are unavailable. Please try again.");
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open billing settings.");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (upgradeRequested && data && ["expired", "legacy"].includes(data.plan) && !startedUpgrade.current) {
      startedUpgrade.current = true;
      void startCheckout();
    }
  }, [upgradeRequested, data]);

  if (isLoading) return <main className="wb-auth-page"><div className="wb-auth-panel" role="status">Loading account…</div></main>;
  if (loadError || !data) return <main className="wb-auth-page"><div className="wb-auth-panel"><p className="wb-auth-error">Could not load your account plan.</p></div></main>;

  return (
    <main className="wb-auth-page">
      <Link href="/" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <section className="wb-auth-panel" aria-labelledby="account-heading">
        <div className="wb-auth-overline">Workspace / account</div>
        <h1 id="account-heading">{data.plan === "expired" ? (data.isTrialExpired ? "Your trial has ended." : "Access paused.") : data.plan === "legacy" ? "Your existing access." : "Your full picture."}</h1>
        {billingStatus === "success" && <p className="wb-auth-success" role="status">Checkout completed. Your plan will update as soon as Stripe confirms the subscription.</p>}
        {billingStatus === "cancel" && <p className="wb-auth-footnote">Checkout was cancelled. No payment was taken, and your current access is unchanged.</p>}
        {data.plan === "pro" ? (
          <>
            <p className="wb-auth-subtitle">{data.hasPaidSubscription ? "WRISTBY Pro is active for this workspace." : "Full owner access is active for this workspace."}</p>
            <div className="wb-plan-summary">
              <p><span>Plan</span><strong>{data.hasPaidSubscription ? "Pro · €39.99 / month" : "Owner access"}</strong></p>
              <p><span>Active watches</span><strong>{data.activeWatchCount}</strong></p>
              <p><span>Clients</span><strong>{data.clientCount}</strong></p>
              <p><span>AI features</span><strong>Included</strong></p>
            </div>
            {data.hasPaidSubscription && <Button className="wb-auth-submit" onClick={openBillingPortal} disabled={busy}>Manage billing</Button>}
          </>
        ) : data.plan === "trial" ? (
          <>
            <p className="wb-auth-subtitle">Your 7-day trial includes the full WRISTBY experience and all AI features.</p>
            <div className="wb-plan-summary">
              <p><span>Trial ends</span><strong>{formatDate(data.trialEndsAt)}</strong></p>
              <p><span>Days remaining</span><strong>{data.trialDaysRemaining}</strong></p>
              <p><span>Active watches</span><strong>{data.activeWatchCount}</strong></p>
              <p><span>Clients</span><strong>{data.clientCount}</strong></p>
            </div>
            <p className="wb-auth-footnote">No payment details are required during the trial. It will not convert or charge automatically. Subscribe manually for €39.99/month to keep access after it ends.</p>
            <div className="wb-pro-card">
              <div><small>CONTINUE WITH WRISTBY PRO</small><strong>€39.99 <span>/ month</span></strong></div>
              <p>You can subscribe from this page once the trial ends. Nothing will be charged before then.</p>
            </div>
          </>
        ) : data.plan === "expired" ? (
          <>
            <p className="wb-auth-subtitle">{data.isTrialExpired ? "Your 7-day trial has ended." : "There is no active subscription for this workspace."} Your access is paused until you choose to subscribe.</p>
            <div className="wb-plan-summary">
              {data.trialEndsAt && <p><span>Trial ended</span><strong>{formatDate(data.trialEndsAt)}</strong></p>}
              <p><span>Active watches</span><strong>{data.activeWatchCount}</strong></p>
              <p><span>Clients</span><strong>{data.clientCount}</strong></p>
            </div>
            <p className="wb-auth-footnote">No charge is made automatically, and your records are not deleted. Subscribe manually to restore full access.</p>
            <div className="wb-pro-card">
              <div><small>WRISTBY PRO</small><strong>€39.99 <span>/ month</span></strong></div>
              <p>Full workspace access and every AI feature.</p>
              <Button className="wb-auth-submit" onClick={startCheckout} disabled={busy}>Subscribe to Pro</Button>
            </div>
          </>
        ) : (
          <>
            <p className="wb-auth-subtitle">This account predates the trial offer, so its existing access and limits are unchanged.</p>
            <div className="wb-plan-summary">
              <p><span>Active watches</span><strong>{data.activeWatchCount} / {data.limits?.activeWatches ?? 10}</strong></p>
              <p><span>Clients</span><strong>{data.clientCount} / {data.limits?.clients ?? 25}</strong></p>
              <p><span>AI features</span><strong>Not included</strong></p>
            </div>
            <div className="wb-pro-card">
              <div><small>WRISTBY PRO</small><strong>€39.99 <span>/ month</span></strong></div>
              <p>Unlimited records and every AI feature.</p>
              <Button className="wb-auth-submit" onClick={startCheckout} disabled={busy}>Subscribe to Pro</Button>
            </div>
          </>
        )}
        <div className="wb-plan-summary" aria-labelledby="privacy-request-heading">
          <p><strong id="privacy-request-heading">Privacy and account data</strong></p>
          <p>Request access, correction, export, or deletion of your account information by email. Full workspace export and account closure are currently handled manually; legal or warranty records may need to be retained.</p>
          <p><a className="wb-auth-inline-link" href="mailto:contact@wristby.com?subject=WRISTBY%20privacy%20request">Contact the privacy email</a> · <Link className="wb-auth-inline-link" href="/privacy">Read the Privacy Notice</Link></p>
        </div>
        {error && <p className="wb-auth-error" role="alert">{error}</p>}
        <Link className="wb-auth-back" href={data.canAccessWorkspace ? "/" : "/account"}>
          {data.canAccessWorkspace ? "← Back to your workspace" : "← Account overview"}
        </Link>
      </section>
    </main>
  );
}
