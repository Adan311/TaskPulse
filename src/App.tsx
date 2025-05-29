import { Toaster as SonnerToast } from "sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/frontend/components/layout/app-sidebar";
import { UserProvider } from "@/frontend/components/ui/user-context";
import { useReminders } from './frontend/hooks/useReminders';
import { initRecurrenceProcessing } from './backend/api/services/recurrence.service';
import { useEffect, useRef } from 'react';
import CookieConsentBanner from "@/frontend/components/legal/CookieConsentBanner";

const queryClient = new QueryClient();

const App = () => {
  // Global hooks for app-wide functionality
  useReminders();
  
  // Use ref instead of state to prevent re-renders
  const recurrenceInitializedRef = useRef(false);

  // Initialize recurrence processing system
  useEffect(() => {
    // Skip if already initialized
    if (recurrenceInitializedRef.current) return;
    
    // Mark as initialized immediately to prevent duplicate execution
    recurrenceInitializedRef.current = true;
    
    console.log("Setting up recurrence processing (App component)");
    
    // Process recurring tasks and events every hour
    const cleanup = initRecurrenceProcessing(60);
    
    // Clean up on unmount
    return () => {
      console.log("Cleaning up recurrence processing (App component)");
      cleanup();
      // Reset the ref on unmount
      recurrenceInitializedRef.current = false;
    };
  }, []); // Empty dependency array runs once on mount

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <div className="min-h-screen flex bg-background">
            <AppSidebar />
            <div className="flex-1">
              <SonnerToast />
              <Outlet />
              <CookieConsentBanner />
            </div>
          </div>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
