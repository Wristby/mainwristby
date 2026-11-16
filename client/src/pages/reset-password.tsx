import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/queryClient";
import "./public-auth.css";

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (token && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await apiFetch(
        token ? "/api/password-reset/confirm" : "/api/password-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(token ? { token, password } : { email: email.trim().toLowerCase() }),
        },
        "Could not process this request. Please try again.",
      );
      const result = await response.json() as { message: string };
      setStatus(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not process this request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <section className="wb-auth-panel" aria-labelledby="reset-heading">
        <div className="wb-auth-overline">Account security</div>
        <h1 id="reset-heading">{token ? "Choose a new password." : "Reset your password."}</h1>
        <p className="wb-auth-subtitle">{token ? "Use at least 12 characters for your new password." : "Enter your account email. If it exists, a reset link will arrive shortly."}</p>
        <form className="wb-auth-form" onSubmit={handleSubmit}>
          {token ? (
            <>
              <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              <div><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            </>
          ) : (
            <div><Label htmlFor="reset-email">Email address</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          )}
          {status && <p className="wb-auth-success" role="status">{status}</p>}
          {error && <p className="wb-auth-error" role="alert">{error}</p>}
          <Button className="wb-auth-submit" disabled={busy}>{busy ? "Please wait…" : token ? "Update password" : "Send reset link"}</Button>
        </form>
        <p className="wb-auth-switch"><Link href="/login">Return to sign in</Link></p>
      </section>
    </main>
  );
}
