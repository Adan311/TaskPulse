import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { EventForm } from "./EventForm";
import { Event } from "@/frontend/types/calendar";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  event?: Event;
}

export function EventDialog({ open, onOpenChange, onSuccess, event }: EventDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleDelete = () => {
    onSuccess();
    onOpenChange(false);
  };

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
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
          onDelete={handleDelete}
          event={event}
        />
      </DialogContent>
    </Dialog>
  );
}
