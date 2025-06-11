import { Toaster as SonnerToast } from "sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/frontend/components/layout/app-sidebar";
import { UserProvider } from "@/frontend/components/ui/user-context";
import { GlobalTimerProvider } from "@/frontend/context/TimerContext";
import { useReminders } from './frontend/hooks/useReminders';
import { initRecurrenceProcessing } from './backend/api/services/recurrence.service';
import { useEffect, useRef } from 'react';
import CookieConsentBanner from "@/frontend/components/legal/CookieConsentBanner";
import { a11y } from "@/frontend/utils/accessibility";
import { initPerformanceMonitoring } from "@/frontend/utils/performance";
import { useAuthCheck } from '@/frontend/hooks/useAuthCheck';
import { useLocation } from 'react-router-dom';

const queryClient = new QueryClient();

const App = () => {
  // Global hooks for app-wide functionality
  useReminders();
  
  // Check authentication and current route
  const { isAuthenticated } = useAuthCheck();
  const location = useLocation();
  
  // Don't show sidebar on auth pages or landing page
  const isAuthPage = location.pathname.startsWith('/auth');
  const isLandingPage = location.pathname === '/' && !isAuthenticated;
  const showSidebar = !isAuthPage && !isLandingPage;
  
  // Use ref instead of state to prevent re-renders
  const recurrenceInitializedRef = useRef(false);
  const performanceMonitorRef = useRef<any>(null);

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

  // Add accessibility features and performance monitoring on mount
  useEffect(() => {
    // Add skip link for keyboard navigation
    a11y.addSkipLink();
    
    // Initialize performance monitoring
    performanceMonitorRef.current = initPerformanceMonitoring();
    
    // Set up global keyboard shortcuts
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Alt + M: Go to main content
      if (e.altKey && e.key === 'm') {
        const mainContent = document.getElementById('main-content');
        mainContent?.focus();
        e.preventDefault();
      }
      
      // Alt + N: Go to navigation
      if (e.altKey && e.key === 'n') {
        const navigation = document.getElementById('app-navigation');
        navigation?.focus();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyboard);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyboard);
      
      // Clean up performance monitoring
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.destroy();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <GlobalTimerProvider>
            <div className="min-h-screen flex bg-background">
              {/* Navigation landmark - only show if not on landing page or auth pages */}
              {showSidebar && (
                <nav 
                  id="app-navigation"
                  role="navigation" 
                  aria-label="Main navigation"
                  tabIndex={-1}
                >
                  <AppSidebar />
                </nav>
              )}
              
              {/* Main content area */}
              <div className="flex-1" role="main">
                <SonnerToast />
                
                {/* Main content landmark with skip target */}
                <main 
                  id="main-content" 
                  tabIndex={-1}
                  className="focus:outline-none"
                  aria-label="Main content"
                >
                  <Outlet />
                </main>
                
                <CookieConsentBanner />
              </div>
            </div>
          </GlobalTimerProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
