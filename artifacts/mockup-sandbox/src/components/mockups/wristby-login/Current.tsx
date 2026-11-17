import { useState, type FormEvent } from "react";
import "./_group.css";

export function Current() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="wristby-login-preview min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/__mockup/images/wristby-login-symbol.png" alt="Wristby Logo" className="h-[138px] w-[138px] object-contain" />
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">WRISTBY</h1>
          <p className="font-medium text-slate-400">Internal Inventory Management</p>
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm leading-relaxed text-slate-500">Sign in to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <label className="block space-y-2 text-sm text-slate-300">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-white placeholder:text-slate-500"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-300">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-white placeholder:text-slate-500"
              />
            </label>
            <button type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
              Sign In
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-600">© 2026 Wristby</p>
      </div>
    </main>
  );
}
