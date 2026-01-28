import { Button } from "@/components/ui/button";
import { Watch, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Watch className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CHRONOS</span>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            onClick={() => window.location.href = "/api/login"}
          >
            Login Access
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Precision Inventory Management for Watch Dealers.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
            Track every timepiece from acquisition to sale. Monitor margins, manage client relationships, and scale your dealership with a system built for luxury.
          </p>
          <div className="flex gap-4">
             <Button 
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 h-12"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white h-12"
            >
              Request Demo
            </Button>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000" />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            {/* Abstract UI Mockup */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center">
                 <Watch className="text-emerald-500 w-6 h-6" />
              </div>
              <div>
                <div className="h-4 w-32 bg-slate-800 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-800 rounded opacity-60" />
              </div>
              <div className="ml-auto text-emerald-400 font-mono font-bold">$42,500</div>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-800 rounded" />
              <div className="h-2 w-5/6 bg-slate-800 rounded" />
              <div className="h-2 w-4/6 bg-slate-800 rounded" />
            </div>
            <div className="mt-6 flex gap-3">
               <div className="h-20 flex-1 bg-slate-950 rounded border border-slate-800" />
               <div className="h-20 flex-1 bg-slate-950 rounded border border-slate-800" />
               <div className="h-20 flex-1 bg-slate-950 rounded border border-slate-800" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for the Trade</h2>
            <p className="text-slate-400">Everything you need to run a modern watch dealership efficiently.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ShieldCheck} 
              title="Inventory Tracking" 
              desc="Detailed records for every reference, serial number, and condition report."
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Profit Analytics" 
              desc="Real-time margin analysis and turn-rate metrics to optimize cash flow."
            />
            <FeatureCard 
              icon={Users} 
              title="Client CRM" 
              desc="Manage collector profiles, wishlists, and purchase history in one place."
            />
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>© 2024 Chronos Management Systems. Internal Tool.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors group">
      <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-emerald-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
