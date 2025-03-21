
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleCalendarButtonProps {
  onSuccess?: () => void;
}

export function GoogleCalendarButton({ onSuccess }: GoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get the current user when component mounts
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getCurrentUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleCalendarConnect = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "You need to be logged in to connect your Google Calendar.",
        });
        return;
      }

      setIsLoading(true);

      // Get the current origin for the redirect URI
      const origin = window.location.origin;
      
      // Define the exact redirect URI path that matches what's configured in Google Cloud Console
      const redirectUri = `${origin}/api/google-calendar-callback`;

      // Call the edge function to start the authorization process
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { 
          action: "init",
          origin,
          redirectUri, // Pass the exact redirect URI to ensure it matches
          userId: user.id // Pass the user ID
        },
      });

      if (error) {
        throw new Error(`Failed to start Google Calendar authorization: ${error.message}`);
      }

      // Store the state in localStorage for verification when the user returns
      localStorage.setItem("googleCalendarState", data.state);
      localStorage.setItem("googleCalendarUserId", user.id);

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
      disabled={isLoading || !user}
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
