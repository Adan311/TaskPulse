
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
      const authUrl = await initiateGoogleCalendarAuth();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
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
      if (onSuccess) {
        onSuccess();
      }
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
