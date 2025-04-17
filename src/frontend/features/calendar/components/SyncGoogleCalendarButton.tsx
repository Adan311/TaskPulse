
import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { syncWithGoogleCalendar } from "@/backend/api/services/googleCalendarService";

interface SyncGoogleCalendarButtonProps {
  onSuccess?: () => void;
}

export function SyncGoogleCalendarButton({ onSuccess }: SyncGoogleCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncWithGoogleCalendar();
      
      if (result) {
        toast({
          title: "Calendar synced",
          description: "Your Google Calendar events have been synced successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Sync failed",
          description: "Failed to sync with Google Calendar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast({
        title: "Sync error",
        description: "An error occurred while syncing with Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className="gap-1"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Syncing..." : "Sync Calendar"}
    </Button>
  );
}
