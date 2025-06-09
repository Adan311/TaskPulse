
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/backend/database/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";

export function GoogleCalendarCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your Google Calendar authorization...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the URL parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        console.log("Callback params:", { 
          code: code ? "present" : "missing", 
          state: state || "missing", 
          error: error || "none" 
        });

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
          setMessage("Invalid state parameter. Authorization failed for security reasons.");
          setErrorDetails(`Received state: ${state}, Expected state: ${savedState || "missing"}`);
          return;
        }

        // Get the user ID we saved before the OAuth flow
        const userId = localStorage.getItem("googleCalendarUserId");
        if (!userId) {
          setStatus("error");
          setMessage("User ID not found. Please try connecting again from the calendar page.");
          return;
        }

        console.log("Found stored user ID:", userId);

        // Clear the state and userId from localStorage
        localStorage.removeItem("googleCalendarState");
        localStorage.removeItem("googleCalendarUserId");

        // Exchange the authorization code for tokens
        const origin = window.location.origin;
        const redirectUri = `${origin}/calendar/google-callback`;
        
        console.log("Calling edge function with:", { 
          action: "callback",
          code: "present", 
          redirectUri,
          userId 
        });
        
        const { data, error: callbackError } = await supabase.functions.invoke("google-calendar-auth", {
          body: {
            action: "callback",
            code,
            redirectUri,
            userId
          },
        });

        if (callbackError) {
          console.error("Edge function error:", callbackError);
          throw new Error(`Failed to process Google Calendar callback: ${callbackError.message}`);
        }

        if (!data) {
          throw new Error("No data returned from the edge function");
        }

        console.log("Edge function response:", data);

        // Success!
        setStatus("success");
        setMessage(`Google Calendar connected successfully! ${data.events_imported || 0} events imported. Your events will now be synced bidirectionally between the app and Google Calendar.`);

        // Show a toast notification
        toast({
          title: "Calendar Connected",
          description: `Your Google Calendar has been connected and ${data.events_imported || 0} events were imported. Events will now sync both ways.`,
        });

        // After 3 seconds, redirect back to the calendar page
        setTimeout(() => {
          navigate("/calendar");
        }, 3000);
      } catch (error: any) {
        console.error("Error processing Google Calendar callback:", error);
        setStatus("error");
        setMessage(`An error occurred while connecting to Google Calendar: ${error.message}`);
        
        // Store more detailed error information for debugging
        if (error.stack) {
          setErrorDetails(error.stack);
        }
        
        // If the error has response data, show it for debugging
        if (error.response) {
          try {
            const responseData = await error.response.text();
            setDebugInfo(responseData);
          } catch (e) {
            setDebugInfo("Could not parse error response");
          }
        }
        
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "There was a problem connecting your Google Calendar.",
        });
      }
    };

    handleCallback();
  }, [navigate, toast, location]);

  return (
    <div className="flex h-screen items-center justify-center p-6 bg-background">
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
          
          {errorDetails && (
            <Alert variant="destructive">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                <div className="bg-muted p-3 rounded-md overflow-auto text-xs max-h-40">
                  <pre>{errorDetails}</pre>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {debugInfo && (
            <Alert>
              <AlertTitle>Debug Information</AlertTitle>
              <AlertDescription>
                <div className="bg-muted p-3 rounded-md overflow-auto text-xs max-h-40">
                  <pre>{debugInfo}</pre>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
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
