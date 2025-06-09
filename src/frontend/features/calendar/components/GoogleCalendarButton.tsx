
import { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { initiateGoogleCalendarAuth } from "@/backend/api/services/googleCalendar/googleCalendarService";
import { supabase } from "@/backend/database/client";

interface GoogleCalendarButtonProps {
  onSuccess?: () => void;
}

export function GoogleCalendarButton({ onSuccess }: GoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleConnectGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Google Calendar connection process");
      
      // Check if user is authenticated first
      if (!user) {
        console.error("User not authenticated, cannot connect Google Calendar");
        toast({
          title: "Authentication required",
          description: "Please sign in to connect Google Calendar.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Clear any previous state
      localStorage.removeItem("googleCalendarState");
      localStorage.removeItem("googleCalendarUserId");
      
      // Get current application URL for proper redirect
      const origin = window.location.origin;
      console.log("Current origin:", origin);
      
      // Explicitly specify the headers option as an empty object to avoid any custom headers
      // that might cause CORS issues
      const authUrl = await initiateGoogleCalendarAuth();
      console.log("Auth URL received:", authUrl ? "Yes" : "No");
      
      if (authUrl) {
        console.log("Redirecting to Google auth URL:", authUrl);
        toast({
          title: "Connecting to Google Calendar",
          description: "You'll be redirected to Google to authorize access to your calendar.",
        });
        
        // Small delay to allow toast to show
        setTimeout(() => {
          window.location.href = authUrl;
        }, 500);
      } else {
        console.error("No auth URL returned");
        toast({
          title: "Connection error",
          description: "Could not initiate Google Calendar authentication. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Error initiating Google Calendar auth:", error);
      
      // Provide more specific error message based on the type of error
      let errorMessage = "Failed to connect to Google Calendar. Please try again later.";
      
      if (error.message && error.message.includes("CORS")) {
        errorMessage = "CORS error: There's an issue with the connection. Please try again or contact support.";
      }
      
      toast({
        title: "Connection error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // Don't set isLoading to false here as we're redirecting
  };

  return (
    <Button
      variant="outline"
      disabled={isLoading || !user}
      onClick={handleConnectGoogleCalendar}
      title={!user ? "Please sign in to connect Google Calendar" : "Connect to Google Calendar"}
    >
      <Calendar className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Google Calendar"}
      <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
    </Button>
  );
}
