import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut, 
  Menu,
  BarChart3,
  CalendarDays,
  DollarSign,
  Settings,
  CreditCard,
  Orbit,
  BookOpenText,
} from "lucide-react";
import logoPng from "@assets/WRISTBY-login-logo_1770424094780.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { installTouchScrollGuard } from "@/lib/touch-scroll-guard";
import "@/styles/modern.css";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: DollarSign, label: "Financials", href: "/financials" },
  { icon: CreditCard, label: "Payments", href: "/payments" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: BookOpenText, label: "Dealer's Notebook", href: "/dealers-notebook" },
  { icon: CalendarDays, label: "Sales Patterns", href: "/sales-patterns" },
  { icon: Orbit, label: "Watch Universe", href: "/watch-universe" },
  { icon: Settings, label: "Admin", href: "/admin" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="wm-sidebar flex h-full w-64 flex-col">
      <Link href="/" onClick={onNavigate} className="wm-brand">
        <img src={logoPng} alt="WRISTBY" />
        <span className="wm-brand-copy">
          <strong>WRISTBY</strong><small>Watch Tracking</small>
        </span>
      </Link>
      <nav aria-label="Main navigation" className="wm-navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href
            || (item.href === "/" && location === "/dashboard")
            || (item.href !== "/" && location.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn("wm-nav-link", isActive && "is-active")}
            >
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="wm-sidebar-bottom">
        <Button
          variant="ghost"
          className="wm-logout"
          onClick={() => { logout(); onNavigate?.(); }}
        >
          <LogOut aria-hidden="true" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="wm-menu-button lg:hidden" aria-label="Open navigation">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="wristby-modern wristby-modern-drawer" aria-label="Main navigation">
        <SheetTitle className="sr-only">WRISTBY navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate between your watch management tools.</SheetDescription>
        <Sidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    // Portalled dialogs and menus share the protected workspace's visual theme.
    const wasThemed = document.body.classList.contains("wristby-modern");
    document.body.classList.add("wristby-modern");
    const removeGuard = installTouchScrollGuard(document);
    return () => {
      removeGuard();
      if (!wasThemed) document.body.classList.remove("wristby-modern");
    };
  }, []);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;

  if (!user) {
    window.location.href = "/login"; // Or show landing page
    return null;
  }

  return (
    <div className="wristby-modern">
    <div className="wm-shell">
      <aside className="wm-desktop-rail">
        <Sidebar />
      </aside>

      <div className="wm-main-column">
        <header className="wm-mobile-header">
          <MobileNav />
          <Link href="/" className="wm-mobile-brand">
            <img src={logoPng} alt="" aria-hidden="true" />
            <span>WRISTBY</span>
          </Link>
        </header>
        
        <main className="wm-main-scroll">
          <div className="wm-page-content animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
    </div>
  );
}
