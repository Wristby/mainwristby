import { Link, useLocation } from "../_source/runtime";
import { useAuth } from "../_source/runtime";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut, 
  Menu,
  BarChart3,
  DollarSign,
  Settings,
  CreditCard
} from "lucide-react";
const logoPng = "/__mockup/images/wristby-logo.png";
import { Button } from "../_source/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../_source/ui/sheet";
import { useEffect, useState } from "react";
import { cn } from "../_source/utils";
import { installTouchScrollGuard } from "../_source/touch-scroll-guard";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: DollarSign, label: "Financials", href: "/financials" },
  { icon: CreditCard, label: "Payments", href: "/payments" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Admin", href: "/admin" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="wb-sidebar flex flex-col h-full bg-white border-r border-slate-200 text-slate-900 w-64">
      <Link href="/">
        <div className="wb-brand p-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img src={logoPng} alt="Wristby Logo" className="w-[53px] h-[53px] rounded-lg object-contain" />
          <div>
            <h1 className="font-bold text-lg tracking-tight">WRISTBY</h1>
            <p className="text-xs text-slate-500 font-medium">Watch Tracking</p>
          </div>
        </div>
      </Link>
      <nav className="wb-navigation flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "wb-navigation-item",
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <footer className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-3"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </footer>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button aria-label="Open navigation" variant="ghost" size="icon" className="lg:hidden text-slate-400">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="wristby-refined p-0 bg-white border-slate-200 w-64">
        <SheetTitle className="sr-only">WRISTBY navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate between your watch management tools.</SheetDescription>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => installTouchScrollGuard(document), []);

  if (isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 text-slate-500">Loading workspace…</div>;

  if (!user) {
    window.location.href = "/login"; // Or show landing page
    return null;
  }

  return (
    <div className="wb-layout flex min-h-[100dvh] bg-white overflow-hidden font-sans text-slate-900">
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        <header className="wb-mobile-header h-16 lg:hidden flex items-center px-4 border-b border-slate-200 bg-white">
          <MobileNav />
          <div className="ml-4 flex items-center gap-2">
            <img src={logoPng} alt="Wristby Logo" className="w-7 h-7 rounded-md object-contain" />
            <span className="font-bold text-slate-900 tracking-tight">WRISTBY</span>
          </div>
        </header>
        
        <main className="wb-main flex-1 overflow-auto relative">
          <div className="wb-content relative z-10 p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
