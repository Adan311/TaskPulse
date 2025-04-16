
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { EventForm } from "./EventForm";
import { Event } from "@/backend/api/services/eventService";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  event?: Event;
}

export function EventDialog({ open, onOpenChange, onSuccess, event }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {event 
              ? "Make changes to your event here. Click update when you're done."
              : "Fill out the form to create a new event on your calendar."}
          </DialogDescription>
        </DialogHeader>
        <EventForm 
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          event={event}
        />
      </DialogContent>
    </Dialog>
  );
}
