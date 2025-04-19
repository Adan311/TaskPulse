
import { Toaster as SonnerToast } from "sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/frontend/components/layout/app-sidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen flex bg-background">
        <AppSidebar />
        <div className="flex-1">
          <SonnerToast />
          <Outlet />
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
