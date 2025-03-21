
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleCalendarButtonProps {
  onSuccess?: () => void;
}

export function GoogleCalendarButton({ onSuccess }: GoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleCalendarConnect = async () => {
    try {
      setIsLoading(true);

      // Get the current origin for the redirect URI
      const origin = window.location.origin;

      // Call the edge function to start the authorization process
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { 
          action: "init",
          origin 
        },
      });

      if (error) {
        throw new Error(`Failed to start Google Calendar authorization: ${error.message}`);
      }

      // Store the state in localStorage for verification when the user returns
      localStorage.setItem("googleCalendarState", data.state);

      // Redirect the user to Google's authorization page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Google Calendar. Please try again.",
      });
    } finally {
      setIsLoading(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Button 
      onClick={handleGoogleCalendarConnect} 
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      {isLoading ? "Connecting..." : "Add Your Google Calendar"}
    </Button>
  );
}
