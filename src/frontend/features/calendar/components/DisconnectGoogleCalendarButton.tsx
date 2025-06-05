import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { GoogleCalendarAuth } from "@/backend/api/services/googleCalendar/googleCalendarAuth";

interface DisconnectGoogleCalendarButtonProps {
  calendarId: string; // The id from google_calendar_tokens
  onSuccess?: () => void;
}

export function DisconnectGoogleCalendarButton({ calendarId, onSuccess }: DisconnectGoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const result = await GoogleCalendarAuth.revokeGoogleCalendarAccess(calendarId);
      if (result) {
        toast({
          title: "Disconnected",
          description: "Google Calendar disconnected successfully.",
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Error",
          description: "Could not disconnect Google Calendar. Please try again or check your connection.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to disconnect Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      disabled={isLoading}
      onClick={handleDisconnect}
      className="h-11"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Disconnecting..." : "Disconnect Google Calendar"}
    </Button>
  );
}
