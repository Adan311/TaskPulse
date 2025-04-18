
import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { syncWithGoogleCalendar } from "@/backend/api/services/googleCalendarService";

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
        toast({
          title: "Sync issue",
          description: result.error || "Calendar sync encountered an issue. Please check your connection to Google Calendar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync with Google Calendar. Please reconnect your account.",
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
