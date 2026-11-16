import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import "./public-auth.css";

export default function SignUpPage() {
  const { register, isRegistering } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const wantsPro = new URLSearchParams(window.location.search).get("plan") === "pro";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        termsAccepted: true,
        plan: wantsPro ? "pro" : "free",
      });
      setSubmitted(true);
      setError("");
      if (wantsPro) sessionStorage.setItem("wristby-pending-plan", "pro");
      void result;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create your account. Please try again.");
    }
  }

  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <section className="wb-auth-panel" aria-labelledby="signup-heading">
        <div className="wb-auth-overline">A workspace of your own</div>
        <h1 id="signup-heading">Make it yours.</h1>
        <p className="wb-auth-subtitle">Your inventory, clients, and business records stay in a separate workspace.</p>
        {submitted ? (
          <div className="wb-auth-success" role="status">
            Check your inbox for a verification link. Once verified, sign in to start your workspace
            {wantsPro ? " and choose Pro from your account page." : "."}
            <div><Link className="wb-auth-inline-link" href={wantsPro ? "/login?plan=pro" : "/login"}>Continue to sign in</Link></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="wb-auth-form">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" minLength={3} maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="wb-auth-two-col">
              <div><Label htmlFor="first-name">First name <span className="wb-auth-optional">optional</span></Label><Input id="first-name" name="given-name" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div>
              <div><Label htmlFor="last-name">Last name <span className="wb-auth-optional">optional</span></Label><Input id="last-name" name="family-name" autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <p className="wb-auth-footnote">Use at least 12 characters.</p>
            </div>
            <label className="wb-auth-consent">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required />
              <span>I accept the <Link href="/terms">Terms</Link> and confirm I have read the <Link href="/privacy">Privacy Notice</Link>.</span>
            </label>
            {error && <p className="wb-auth-error" role="alert">{error}</p>}
            <Button type="submit" className="wb-auth-submit" disabled={isRegistering || !termsAccepted}>
              {isRegistering ? "Creating your account…" : "Create account"}
            </Button>
          </form>
        )}
        <p className="wb-auth-switch">Already have an account? <Link href={wantsPro ? "/login?plan=pro" : "/login"}>Sign in</Link></p>
        <Link className="wb-auth-back" href="/landing">← Back to WRISTBY</Link>
      </section>
      <footer className="wb-auth-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </main>
  );
}
