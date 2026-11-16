import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/queryClient";
import "./public-auth.css";

export default function VerifyEmailPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  const resendEmail = new URLSearchParams(window.location.search).get("resend") ?? "";
  const planIntent = new URLSearchParams(window.location.search).get("plan");
  const [email, setEmail] = useState(resendEmail);
  const [status, setStatus] = useState(token ? "Verifying your email…" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(Boolean(token));
  if (planIntent === "pro") sessionStorage.setItem("wristby-pending-plan", "pro");
  const plan = planIntent === "pro" ? "pro" : sessionStorage.getItem("wristby-pending-plan");
  const loginHref = plan === "pro" ? "/login?plan=pro" : "/login";

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiFetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }, "Verification link is invalid or expired.")
      .then((response) => response.json())
      .then((result: { message: string }) => {
        if (active) setStatus(result.message);
      })
      .catch((reason) => {
        if (active) {
          setStatus("");
          setError(reason instanceof Error ? reason.message : "Verification link is invalid or expired.");
        }
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }, "Could not request a verification email.");
      const result = await response.json() as { message: string };
      setStatus(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not request a verification email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <section className="wb-auth-panel" aria-labelledby="verify-heading">
        <div className="wb-auth-overline">Account security</div>
        <h1 id="verify-heading">Verify your email.</h1>
        {status && <p className="wb-auth-success" role="status">{status}</p>}
        {error && <p className="wb-auth-error" role="alert">{error}</p>}
        {!token && (
          <form className="wb-auth-form" onSubmit={resend}>
            <p className="wb-auth-subtitle">Enter your signup email and we’ll send a fresh verification link if it needs one.</p>
            <div><Label htmlFor="resend-email">Email address</Label><Input id="resend-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <Button className="wb-auth-submit" disabled={busy}>{busy ? "Sending…" : "Resend verification email"}</Button>
          </form>
        )}
        {token && busy && <p className="wb-auth-subtitle" role="status">Please wait while we check your link.</p>}
        <p className="wb-auth-switch"><Link href={loginHref}>Continue to sign in</Link></p>
        <Link className="wb-auth-back" href="/landing">← Back to WRISTBY</Link>
      </section>
    </main>
  );
}
