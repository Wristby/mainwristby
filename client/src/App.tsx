import { Switch, Route, Redirect } from "wouter";
import { lazy, Suspense, type ComponentType } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";

const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/login"));
const PublicLanding = lazy(() => import("@/pages/public-landing"));
const SignUp = lazy(() => import("@/pages/signup"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Account = lazy(() => import("@/pages/account"));
const LegalInfo = lazy(() => import("@/pages/legal-info"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Inventory = lazy(() => import("@/pages/inventory"));
const InventoryDetail = lazy(() => import("@/pages/inventory-detail"));
const Clients = lazy(() => import("@/pages/clients"));
const ClientDetail = lazy(() => import("@/pages/client-detail"));
const Financials = lazy(() => import("@/pages/financials"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Admin = lazy(() => import("@/pages/admin"));
const Payments = lazy(() => import("@/pages/payments"));
const WatchUniverse = lazy(() => import("@/pages/watch-universe"));
const SalesPatterns = lazy(() => import("@/pages/sales-patterns"));
const DealersNotebook = lazy(() => import("@/pages/dealers-notebook"));
const PersonalCollection = lazy(() => import("@/pages/personal-collection"));
const PersonalCollectionDetail = lazy(() =>
  import("@/pages/personal-collection").then(({ PersonalCollectionDetailPage }) => ({
    default: PersonalCollectionDetailPage,
  })),
);
const PersonalCollectionInsuranceReport = lazy(() =>
  import("@/pages/personal-collection").then(({ PersonalCollectionInsuranceReportPage }) => ({
    default: PersonalCollectionInsuranceReportPage,
  })),
);
const PersonalCollectionNew = lazy(() =>
  import("@/pages/personal-collection").then(({ PersonalCollectionFormPage }) => ({
    default: function PersonalCollectionNewPage() {
      return <PersonalCollectionFormPage />;
    },
  })),
);
const PersonalCollectionEdit = lazy(() =>
  import("@/pages/personal-collection").then(({ PersonalCollectionFormPage }) => ({
    default: function PersonalCollectionEditPage() {
      return <PersonalCollectionFormPage edit />;
    },
  })),
);
const Warranties = lazy(() => import("@/pages/warranties"));

function RouteLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen bg-slate-50" : "min-h-[40vh]"}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-emerald-600" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

function ProtectedRoute({ component: Component, allowExpired = false }: { component: ComponentType; allowExpired?: boolean }) {
  const { user, isLoading } = useAuth();
  const access = useQuery<{ canAccessWorkspace: boolean }>({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const response = await fetchApiResponse("/api/billing/status");
      await throwIfResNotOk(response, "Could not check workspace access.");
      return response.json();
    },
    enabled: Boolean(user) && !allowExpired,
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <RouteLoading fullScreen />;
  }

  if (!user) {
    return <Redirect to="/landing" />;
  }

  if (!allowExpired && access.isLoading) {
    return <RouteLoading fullScreen />;
  }

  if (!allowExpired && access.data?.canAccessWorkspace === false) {
    return <Redirect to="/account?trial=expired" />;
  }

  return (
    <Layout>
      <Suspense fallback={<RouteLoading />}>
        <Component />
      </Suspense>
    </Layout>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoading fullScreen />}>
    <Switch>
      <Route path="/landing" component={PublicLanding} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={LegalInfo} />
      <Route path="/terms" component={LegalInfo} />
      <Route path="/account">
        <ProtectedRoute component={Account} allowExpired />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/inventory">
        <ProtectedRoute component={Inventory} />
      </Route>
      <Route path="/inventory/:id">
        <ProtectedRoute component={InventoryDetail} />
      </Route>
      <Route path="/clients">
        <ProtectedRoute component={Clients} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute component={ClientDetail} />
      </Route>
      <Route path="/financials">
        <ProtectedRoute component={Financials} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/sales-patterns">
        <ProtectedRoute component={SalesPatterns} />
      </Route>
      <Route path="/dealers-notebook">
        <ProtectedRoute component={DealersNotebook} />
      </Route>
      <Route path="/personal-collection">
        <ProtectedRoute component={PersonalCollection} />
      </Route>
      <Route path="/personal-collection/new">
        <ProtectedRoute component={PersonalCollectionNew} />
      </Route>
      <Route path="/personal-collection/insurance-report">
        <ProtectedRoute component={PersonalCollectionInsuranceReport} />
      </Route>
      <Route path="/personal-collection/:id/edit">
        <ProtectedRoute component={PersonalCollectionEdit} />
      </Route>
      <Route path="/personal-collection/:id">
        <ProtectedRoute component={PersonalCollectionDetail} />
      </Route>
      <Route path="/warranties">
        <ProtectedRoute component={Warranties} />
      </Route>
      <Route path="/watch-universe">
        <ProtectedRoute component={WatchUniverse} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/payments">
        <ProtectedRoute component={Payments} />
      </Route>
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
