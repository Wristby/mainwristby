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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <img src={logoPng} alt="Wristby Logo" className="w-20 h-20 object-contain" />
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">WRISTBY</h1>
          <p className="text-slate-400 font-medium">Internal Inventory Management</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-slate-500 leading-relaxed">Sign in to continue.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-username"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-password"
                required
              />
            </div>

            {(error || loginError) && (
              <p className="text-red-400 text-sm">{error || loginError}</p>
            )}
            
            <Button 
              type="submit"
              size="lg"
              disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98]"
              data-testid="button-submit"
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-xs text-slate-600">© 2026 Wristby</p>
      </div>
    </div>
  );
}
