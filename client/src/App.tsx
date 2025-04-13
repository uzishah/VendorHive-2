import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";

import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth";
import VendorsPage from "@/pages/vendors";
import VendorProfilePage from "@/pages/vendor-profile";
import UserProfilePage from "@/pages/user-profile";
import DashboardPage from "@/pages/dashboard";
import VendorServicesPage from "@/pages/vendor-services";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendors/:id" component={VendorProfilePage} />
      <Route path="/profile" component={UserProfilePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/services" component={VendorServicesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
