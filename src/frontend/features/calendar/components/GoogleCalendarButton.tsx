
import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { initiateGoogleCalendarAuth } from "@/backend/api/services/googleCalendarService";

interface GoogleCalendarButtonProps {
  onSuccess?: () => void;
}

export function GoogleCalendarButton({ onSuccess }: GoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnectGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Google Calendar connection process");
      
      // Clear any previous state
      localStorage.removeItem("googleCalendarState");
      localStorage.removeItem("googleCalendarUserId");
      
      const authUrl = await initiateGoogleCalendarAuth();
      
      if (authUrl) {
        console.log("Redirecting to Google auth URL");
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
    } catch (error) {
      console.error("Error initiating Google Calendar auth:", error);
      toast({
        title: "Connection error",
        description: "Failed to connect to Google Calendar. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // Don't set isLoading to false here as we're redirecting
  };

  return (
    <Button
      variant="outline"
      disabled={isLoading}
      onClick={handleConnectGoogleCalendar}
    >
      <Calendar className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Google Calendar"}
      <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
    </Button>
  );
}
