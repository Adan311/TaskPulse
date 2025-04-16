
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
      const authUrl = await initiateGoogleCalendarAuth();
      if (authUrl) {
        console.log("Redirecting to Google auth URL:", authUrl);
        // Redirect to Google auth page
        window.location.href = authUrl;
      } else {
        console.error("No auth URL returned");
        toast({
          title: "Error",
          description: "Could not initiate Google Calendar authentication.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error initiating Google Calendar auth:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Don't call onSuccess here - it should be called after successful callback
    }
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
