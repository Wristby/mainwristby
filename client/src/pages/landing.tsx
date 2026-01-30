import { Button } from "@/components/ui/button";
import { Watch } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Watch className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">WRISTBY</h1>
          <p className="text-slate-400 font-medium">Internal Inventory Management</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Authorized access only. Please sign in with your Replit account to continue to the system.
            </p>
          </div>
          
          <Button 
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98]"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In with Replit
          </Button>
        </div>

        <p className="text-xs text-slate-600">
          © 2024 Chronos Management Systems. Internal Tool.
        </p>
      </div>
    </div>
  );
}
