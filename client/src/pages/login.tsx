import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import "./public-auth.css";

export default function LoginPage() {
  const { user, isLoading, login, isLoggingIn } = useAuth();
  const [location] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const isUpgrade = new URLSearchParams(window.location.search).get("plan") === "pro";

  useEffect(() => {
    if (user) window.location.replace(isUpgrade ? "/account?upgrade=pro" : "/");
  }, [user, isUpgrade, location]);

  if (isLoading || user) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);
    try {
      await login({ identifier: identifier.trim(), password });
      window.location.replace(isUpgrade ? "/account?upgrade=pro" : "/");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not sign in. Check your details and try again.";
      setError(message);
      setNeedsVerification(message.toLowerCase().includes("verify your email"));
    }
  }

  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <section className="wb-auth-panel" aria-labelledby="login-heading">
        <div className="wb-auth-overline">Your private workspace</div>
        <h1 id="login-heading">Welcome back.</h1>
        <p className="wb-auth-subtitle">Sign in to continue to your watch business.</p>
        <form onSubmit={handleSubmit} className="wb-auth-form">
          <div>
            <Label htmlFor="identifier">Email or username</Label>
            <Input
              id="identifier"
              name="username"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>
          <div>
            <div className="wb-auth-label-row">
              <Label htmlFor="password">Password</Label>
              <Link href="/reset-password">Forgot password?</Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="wb-auth-error" role="alert">{error}</p>}
          {needsVerification && (
            <Link className="wb-auth-inline-link" href={`/verify-email?resend=${encodeURIComponent(identifier)}`}>
              Resend verification email
            </Link>
          )}
          <Button type="submit" className="wb-auth-submit" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="wb-auth-switch">New to WRISTBY? <Link href="/signup">Create a workspace</Link></p>
        <Link className="wb-auth-back" href="/landing">← Back to WRISTBY</Link>
      </section>
      <footer className="wb-auth-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </main>
  );
}
