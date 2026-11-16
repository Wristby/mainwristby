import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch, fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";
import "./public-auth.css";

interface WorkspaceAccess {
  plan: "free" | "pro";
  isPro: boolean;
  aiEnabled: boolean;
  activeWatchCount: number;
  clientCount: number;
  limits: { activeWatches: number; clients: number } | null;
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
    if (upgradeRequested && data && !data.isPro && !startedUpgrade.current) {
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
        <h1 id="account-heading">{data.isPro ? "Your full picture." : "Choose your room to grow."}</h1>
        {billingStatus === "success" && <p className="wb-auth-success" role="status">Checkout completed. Your plan will update as soon as Stripe confirms the subscription.</p>}
        {billingStatus === "cancel" && <p className="wb-auth-footnote">Checkout was cancelled. Your current plan is unchanged.</p>}
        {data.isPro ? (
          <>
            <p className="wb-auth-subtitle">WRISTBY Pro is active for this workspace.</p>
            <div className="wb-plan-summary">
              <p><span>Plan</span><strong>Pro · €39.99 / month</strong></p>
              <p><span>Active watches</span><strong>{data.activeWatchCount}</strong></p>
              <p><span>Clients</span><strong>{data.clientCount}</strong></p>
              <p><span>AI features</span><strong>Included</strong></p>
            </div>
            <Button className="wb-auth-submit" onClick={openBillingPortal} disabled={busy}>Manage billing</Button>
          </>
        ) : (
          <>
            <p className="wb-auth-subtitle">Your Free workspace includes the essentials. Upgrade whenever you need more capacity or AI.</p>
            <div className="wb-plan-summary">
              <p><span>Active watches</span><strong>{data.activeWatchCount} / 10</strong></p>
              <p><span>Clients</span><strong>{data.clientCount} / 25</strong></p>
              <p><span>AI features</span><strong>Not included</strong></p>
            </div>
            <div className="wb-pro-card">
              <div><small>WRISTBY PRO</small><strong>€39.99 <span>/ month</span></strong></div>
              <p>Unlimited records and every AI feature.</p>
              <Button className="wb-auth-submit" onClick={startCheckout} disabled={busy}>Upgrade to Pro</Button>
            </div>
          </>
        )}
        {error && <p className="wb-auth-error" role="alert">{error}</p>}
        <Link className="wb-auth-back" href="/">← Back to your workspace</Link>
      </section>
    </main>
  );
}
