import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { syncWithGoogleCalendar } from "@/backend/api/services/googleCalendar/googleCalendarService";

interface SyncGoogleCalendarButtonProps {
  onSuccess?: () => void;
  variant?: "outline" | "default" | "secondary" | "ghost" | null;
  size?: "sm" | "default" | "lg" | "icon" | null;
  className?: string;
}

export function SyncGoogleCalendarButton({ 
  onSuccess, 
  variant = "outline", 
  size = "sm",
  className = "gap-1" 
}: SyncGoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Google Calendar sync...");
      const result = await syncWithGoogleCalendar();
      console.log("Sync result:", result);
      
      if (result && result.success) {
        const successMessage = `Calendar synced successfully! ${
          result.imported ? `Imported ${result.imported} events.` : ''
        } ${result.pushed ? `Pushed ${result.pushed} events.` : ''}`;
        
        toast({
          title: "Calendar synced",
          description: successMessage,
        });
        
        setLastSynced(new Date());
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("Sync incomplete or failed:", result);
        
        // More descriptive error message based on the error type
        let errorMessage = result.error || "Calendar sync encountered an issue.";
        
        if (errorMessage.includes("CORS")) {
          errorMessage = "Connection issue detected. This might be due to a CORS error. Please try again or contact support.";
        } else if (errorMessage.includes("Failed to send")) {
          errorMessage = "Could not connect to the sync service. Please check your network connection and try again.";
        }
        
        toast({
          title: "Sync issue",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      
      // Determine appropriate error message
      let errorMessage = "Failed to sync with Google Calendar. Please try reconnecting your account.";
      
      if (error instanceof Error) {
        if (error.message.includes("CORS") || error.message.includes("Failed to send")) {
          errorMessage = "Network connection issue. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isLoading}
      className={className}
      title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : "Sync with Google Calendar"}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Syncing..." : "Sync Calendar"}
    </Button>
  );
}
