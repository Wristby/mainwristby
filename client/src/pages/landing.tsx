import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import logoPng from "@assets/WRISTBY-login-logo_1770424094780.png";

export default function Landing() {
  const { user, isLoading, login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return null;

  if (user) {
    window.location.href = "/";
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f2ed] flex flex-col items-center justify-center px-5 py-12 selection:bg-emerald-700/15">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 flex items-center justify-center gap-3" aria-label="WRISTBY">
          <img src={logoPng} alt="" className="h-7 w-7 object-contain" />
          <span className="text-[13px] font-extrabold tracking-[0.22em] text-[#1d382e]">WRISTBY</span>
        </div>

        <section className="rounded-[20px] border border-[#deded7] bg-[#fbfbf8] px-6 py-8 shadow-[0_14px_40px_rgba(34,45,38,0.045)] sm:px-11 sm:py-11">
          <div className="mb-7">
            <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.16em] text-[#7a807a]">
              YOUR PRIVATE WORKSPACE
            </p>
            <h1 className="text-[38px] font-semibold leading-[1.08] tracking-[-0.055em] text-[#18231e] sm:text-[42px]">
              Welcome back.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-[#70756f]">
              Sign in to continue to your watch business.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="username" className="text-[13px] font-semibold text-[#303932]">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-11 rounded-[9px] border-[#d8d9d2] bg-white px-3 text-[14px] text-[#202a24] placeholder:text-[#a0a39e] focus-visible:ring-[#244738]"
                data-testid="input-username"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-[13px] font-semibold text-[#303932]">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11 rounded-[9px] border-[#d8d9d2] bg-white px-3 text-[14px] text-[#202a24] placeholder:text-[#a0a39e] focus-visible:ring-[#244738]"
                data-testid="input-password"
                required
              />
            </div>

            {(error || loginError) && (
              <p role="alert" className="text-sm leading-5 text-[#a24d4c]">{error || loginError}</p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isLoggingIn}
              className="mt-1 h-12 w-full rounded-[9px] bg-[#203d31] font-semibold text-white shadow-none transition-colors hover:bg-[#294c3c] active:scale-[0.99]"
              data-testid="button-submit"
            >
              {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </section>

        <p className="mt-7 text-center text-xs text-[#858982]">© 2026 WRISTBY</p>
      </div>
    </main>
  );
}
