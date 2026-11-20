import type { ReactNode } from "react";
import { BarChart3, CreditCard, DollarSign, LayoutDashboard, Menu, Package, Settings, Users } from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Inventory", icon: Package, active: true },
  { label: "Clients", icon: Users },
  { label: "Financials", icon: DollarSign },
  { label: "Payments", icon: CreditCard },
  { label: "Analytics", icon: BarChart3 },
  { label: "Admin", icon: Settings },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="wristby-modern min-h-screen">
      <div className="wm-shell">
        <aside className="wm-desktop-rail">
          <div className="wm-sidebar">
            <div className="wm-brand">
              <img src="/__mockup/images/wristby-logo.png" alt="WRISTBY" />
              <span className="wm-brand-copy"><strong>WRISTBY</strong><small>Watch Tracking</small></span>
            </div>
            <nav aria-label="Main navigation" className="wm-navigation">
              {items.map(({ label, icon: Icon, active }) => (
                <div key={label} className={`wm-nav-link ${active ? "is-active" : ""}`}>
                  <Icon aria-hidden="true" /><span>{label}</span>
                </div>
              ))}
            </nav>
            <div className="wm-sidebar-bottom"><div className="wm-logout">Log out</div></div>
          </div>
        </aside>
        <div className="wm-main-column">
          <header className="wm-mobile-header">
            <button className="wm-menu-button" aria-label="Open navigation"><Menu aria-hidden="true" /></button>
            <span className="wm-mobile-brand">WRISTBY</span>
          </header>
          <main className="wm-main-scroll">
            <div className="wm-page-content animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
