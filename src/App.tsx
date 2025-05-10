import { Toaster as SonnerToast } from "sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/frontend/components/layout/app-sidebar";
import { UserProvider } from "@/frontend/components/ui/user-context";
import { useReminders } from './frontend/hooks/useReminders';

const queryClient = new QueryClient();

const App = () => {
  // Hook to check for reminders every minute
  useReminders();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <div className="min-h-screen flex bg-background">
            <AppSidebar />
            <div className="flex-1">
              <SonnerToast />
              <Outlet />
            </div>
          </div>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
