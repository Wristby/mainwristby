import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import "./_group.css";

export function RoundedSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowError(false);
    setIsSigningIn(true);
    window.setTimeout(() => {
      setIsSigningIn(false);
      setShowError(true);
    }, 500);
  }

  return (
    <main className="wristby-login-preview flex min-h-screen items-center justify-center bg-[#f3f2ed] px-5 py-12 text-[#18231e]">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 flex items-center justify-center gap-3" aria-label="WRISTBY">
          <img src="/__mockup/images/wristby-login-symbol.png" alt="" className="h-7 w-7 object-contain" />
          <span className="text-[13px] font-extrabold tracking-[0.22em] text-[#1d382e]">WRISTBY</span>
        </div>

        <section className="rounded-[20px] border border-[#deded7] bg-[#fbfbf8] px-6 py-8 shadow-[0_14px_40px_rgba(34,45,38,0.045)] sm:px-11 sm:py-11">
          <div className="mb-7">
            <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.16em] text-[#7a807a]">
              YOUR PRIVATE WORKSPACE
            </p>
            <h1 className="text-[38px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[42px]">
              Welcome back.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-[#70756f]">
              Sign in to continue to your watch business.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2 text-left text-[13px] font-semibold text-[#303932]" htmlFor="preview-username">
              <span>Username</span>
              <input
                id="preview-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
                className="h-11 w-full rounded-[9px] border border-[#d8d9d2] bg-white px-3 text-[14px] font-normal text-[#202a24] outline-none transition-shadow placeholder:text-[#a0a39e] focus:border-[#315c48] focus:ring-2 focus:ring-[#315c48]/15"
              />
            </label>
            <label className="block space-y-2 text-left text-[13px] font-semibold text-[#303932]" htmlFor="preview-password">
              <span>Password</span>
              <input
                id="preview-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
                className="h-11 w-full rounded-[9px] border border-[#d8d9d2] bg-white px-3 text-[14px] font-normal text-[#202a24] outline-none transition-shadow placeholder:text-[#a0a39e] focus:border-[#315c48] focus:ring-2 focus:ring-[#315c48]/15"
              />
            </label>

            {showError && (
              <p role="alert" className="text-sm text-[#a24d4c]">Incorrect username or password.</p>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#203d31] text-[14px] font-semibold text-white transition-colors hover:bg-[#294c3c] active:scale-[0.99] disabled:opacity-80"
            >
              {isSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </button>
          </form>
        </section>

        <p className="mt-7 text-center text-xs text-[#858982]">© 2026 WRISTBY</p>
      </div>
    </main>
  );
}
