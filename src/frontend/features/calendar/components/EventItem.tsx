import { format, parseISO } from "date-fns";
import { MoreHorizontal, Trash, Edit, Clock } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
} from "@/frontend/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Event, deleteEvent } from "@/backend/api/services/event.service";
import { EventTimeTracker } from "./EventTimeTracker";

interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: () => void;
}

export function EventItem({ event, onEdit, onDelete }: EventItemProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id);
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
      onDelete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem deleting the event.",
      });
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: event.color || "#3b82f6" }}
            />
            <h3 className="font-medium">{event.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {format(parseISO(event.startTime), "h:mm a")} - {format(parseISO(event.endTime), "h:mm a")}
            </span>
          </div>
          {event.description && <p className="mt-1">{event.description}</p>}
        </div>

        {/* Add compact event time tracking */}
        <div className="mt-3 pt-3 border-t">
          <EventTimeTracker event={event} compact={true} />
        </div>
      </CardContent>
    </Card>
  );
}
