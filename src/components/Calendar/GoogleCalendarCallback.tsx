
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export function GoogleCalendarCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your Google Calendar authorization...");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        // Check if there was an error or if code is missing
        if (error || !code) {
          setStatus("error");
          setMessage(`Google Calendar authorization was denied or failed: ${error || "No authorization code received"}`);
          return;
        }

        // Verify the state parameter matches what we saved
        const savedState = localStorage.getItem("googleCalendarState");
        if (!savedState || state !== savedState) {
          setStatus("error");
          setMessage("Invalid state parameter. Authorization failed.");
          return;
        }

        // Clear the state from localStorage
        localStorage.removeItem("googleCalendarState");

        // Exchange the authorization code for tokens
        const redirectUri = `${window.location.origin}/api/google-calendar-callback`;
        
        const { data, error: callbackError } = await supabase.functions.invoke("google-calendar-auth", {
          body: {
            action: "callback",
            code,
            redirectUri,
          },
        });

        if (callbackError) {
          throw new Error(`Failed to process Google Calendar callback: ${callbackError.message}`);
        }

        // Success!
        setStatus("success");
        setMessage(`Google Calendar connected successfully! ${data.events_imported} events imported. Your events will now be synced bidirectionally between the app and Google Calendar.`);

        // Show a toast notification
        toast({
          title: "Calendar Connected",
          description: `Your Google Calendar has been connected and ${data.events_imported} events were imported. Events will now sync both ways.`,
        });

        // After 3 seconds, redirect back to the calendar page
        setTimeout(() => {
          navigate("/calendar");
        }, 3000);
      } catch (error) {
        console.error("Error processing Google Calendar callback:", error);
        setStatus("error");
        setMessage(`An error occurred while connecting to Google Calendar: ${error.message}`);
        
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "There was a problem connecting your Google Calendar.",
        });
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we connect your calendar..."}
            {status === "success" && "Your calendar has been connected successfully!"}
            {status === "error" && "There was a problem connecting your calendar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status !== "loading" && (
            <Button 
              className="w-full" 
              onClick={() => navigate("/calendar")}
              variant={status === "success" ? "default" : "outline"}
            >
              Return to Calendar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
