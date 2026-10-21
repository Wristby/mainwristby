import { useEffect, useState, type ReactNode } from "react";
import { Link, useAuth, useLocation } from "./_source/runtime";
import {
  BarChart3, CreditCard, DollarSign, LayoutDashboard, LogOut, Menu, Package, Settings, Users,
} from "lucide-react";
import { Button } from "./_source/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./_source/ui/sheet";
import { cn } from "./_source/utils";
import { installTouchScrollGuard } from "./_source/touch-scroll-guard";

const logoPng = "/__mockup/images/wristby-logo.png";
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: DollarSign, label: "Financials", href: "/financials" },
  { icon: CreditCard, label: "Payments", href: "/payments" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Admin", href: "/admin" },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  return (
    <div className="wm-sidebar flex h-full w-64 flex-col">
      <Link href="/" onClick={onNavigate} className="wm-brand">
        <img src={logoPng} alt="WRISTBY" />
        <span className="wm-brand-copy"><strong>WRISTBY</strong><small>Watch Tracking</small></span>
      </Link>
      <nav aria-label="Main navigation" className="wm-navigation">
        {NAV_ITEMS.map((item) => {
          const active = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("wm-nav-link", active && "is-active")}
            >
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="wm-sidebar-bottom">
        <Button variant="ghost" onClick={() => { logout(); onNavigate?.(); }} className="wm-logout">
          <LogOut aria-hidden="true" /> Logout
        </Button>
      </div>
    </div>
  );
}

function MobileNav() {
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

export function Layout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => installTouchScrollGuard(document), []);
  if (isLoading) return <div className="wm-loading">Loading dashboard…</div>;
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return (
    <div className="wm-shell">
      <aside className="wm-desktop-rail"><Sidebar /></aside>
      <div className="wm-main-column">
        <header className="wm-mobile-header">
          <MobileNav />
          <Link href="/" className="wm-mobile-brand">
            <img src={logoPng} alt="" aria-hidden="true" />
            <span>WRISTBY</span>
          </Link>
        </header>
        <main className="wm-main-scroll">
          <div className="wm-page-content animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
