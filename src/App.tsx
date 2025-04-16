
import { Toaster } from "sonner";
import { Toaster as SonnerToast } from "sonner";
import { TooltipProvider } from "@/frontend/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/frontend/components/theme/theme-provider";
import Index from "@/frontend/pages/Index";
import Calendar from "@/frontend/pages/Calendar";
import Timer from "@/frontend/pages/Timer";
import Tasks from "@/frontend/pages/Tasks";
import SignIn from "@/frontend/pages/auth/SignIn";
import SignUp from "@/frontend/pages/auth/SignUp";
import NotFound from "@/frontend/pages/NotFound";
import { GoogleCalendarCallback } from "@/frontend/features/calendar/components/GoogleCalendarCallback";
import Projects from "@/frontend/pages/Projects";
import Components from "@/frontend/pages/Components";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <SonnerToast />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/components" element={<Components />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/api/google-calendar-callback" element={<GoogleCalendarCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
