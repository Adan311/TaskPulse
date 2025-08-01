import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Event } from '@/frontend/types/calendar';
import { EventList } from '@/frontend/features/calendar/components/EventList';
import { getEvents, updateEvent, deleteEvent } from '@/backend/api/services/event.service';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { format, isPast } from 'date-fns';
import { CalendarIcon, ClockIcon, PencilIcon, EyeIcon, EyeOffIcon, Trash2, Unlink } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Button } from '@/frontend/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle
} from '@/frontend/components/ui/dialog';
import { EventForm } from '@/frontend/features/calendar/components/EventForm';
import { Badge } from '@/frontend/components/ui/badge';
import { useToast } from '@/frontend/hooks/use-toast';

interface ProjectEventsProps {
  projectId: string;
  limit?: number;
  showAllEvents?: boolean;
}

export const ProjectEvents = forwardRef<{ refreshEvents: () => void }, ProjectEventsProps>(
  ({ projectId, limit = 4, showAllEvents = false }, ref) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const allEvents = await getEvents();
      setEvents(allEvents.filter(e => e.project === projectId));
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId]);
  
  // Expose the refreshEvents method through the ref
  useImperativeHandle(ref, () => ({
    refreshEvents: fetchEvents
  }));

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchEvents();
  };

  const handleUnlinkEvent = async (event: Event) => {
    try {
      await updateEvent(event.id, { ...event, project: undefined });
      toast({ 
        title: 'Event unlinked successfully',
        description: 'The event has been removed from this project.'
      });
      fetchEvents();
    } catch (err: any) {
      toast({ 
        title: 'Failed to unlink event', 
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      toast({ 
        title: 'Event deleted successfully',
        description: 'The event has been permanently deleted.'
      });
      fetchEvents();
    } catch (err: any) {
      toast({ 
        title: 'Failed to delete event', 
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  // Filter events based on whether they're past events and the showPastEvents state
  const filteredEvents = events.filter(event => {
    const eventEnd = new Date(event.endTime);
    const isPastEvent = isPast(eventEnd);
    
    if (showAllEvents) {
      return true;
    }
    
    if (showPastEvents) {
      return true;
    } else {
      return !isPastEvent;
    }
  });

  // Limit the number of events shown
  const displayEvents = filteredEvents.slice(0, limit);
  const hasMoreEvents = filteredEvents.length > limit;

  if (loading) {
    return <div className="py-4 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
    </div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-destructive">{error}</div>;
  }
  
  if (events.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">No events scheduled for this project.</div>;
  }
  
  if (filteredEvents.length === 0) {
    return (
      <div>
        <div className="py-4 text-center text-muted-foreground">
          {showPastEvents ? "No past events." : "No upcoming events."}
        </div>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="mt-2"
          >
            {showPastEvents ? (
              <>
                <EyeOffIcon className="h-4 w-4 mr-2" />
                Hide Past Events
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-2" />
                Show Past Events
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showAllEvents && (
        <div className="flex justify-between items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="text-xs h-8 px-2"
          >
            {showPastEvents ? (
              <>
                <EyeOffIcon className="h-3 w-3 mr-1" />
                Hide Past
              </>
            ) : (
              <>
                <EyeIcon className="h-3 w-3 mr-1" />
                Show Past
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="space-y-3">
        {displayEvents.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onEdit={() => handleEditEvent(event)} 
            onUnlink={() => handleUnlinkEvent(event)}
            onDelete={() => handleDeleteEvent(event.id)}
          />
        ))}
        
        {hasMoreEvents && (
          <div className="text-center mt-2">
            <Button 
              variant="link" 
              className="text-xs"
              onClick={() => window.location.href = `/calendar?project=${projectId}`}
            >
              See all {filteredEvents.length} events
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventForm 
              event={selectedEvent}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onUnlink: () => void;
  onDelete: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onUnlink, onDelete }) => {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const isPastEvent = isPast(end);
  
  return (
    <div className={cn(
      "rounded-lg border p-3",
      "hover:border-primary transition-colors",
      isPastEvent ? "opacity-60" : ""
    )}>
      <div className="flex justify-between">
        <h3 className="font-medium text-sm">{event.title}</h3>
        <div className="flex items-center">
          {isPastEvent && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 mr-1.5">
              Past
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUnlink}>
            <Unlink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2 flex items-center">
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
        <span>
          {format(start, 'EEEE, MMM d, yyyy')}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center">
        <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
        <span>
          {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
        </span>
      </div>
    </div>
  );
};