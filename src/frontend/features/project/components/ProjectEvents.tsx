import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Event } from '@/frontend/types/calendar';
import { EventList } from '@/frontend/features/calendar/components/EventList';
import { getEvents } from '@/backend/api/services/eventService';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, PencilIcon } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Button } from '@/frontend/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle
} from '@/frontend/components/ui/dialog';
import { EventForm } from '@/frontend/features/calendar/components/EventForm';

interface ProjectEventsProps {
  projectId: string;
}

export const ProjectEvents = forwardRef<{ refreshEvents: () => void }, ProjectEventsProps>(({ projectId }, ref) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  if (loading) {
    return <div className="py-8 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
    </div>;
  }
  
  if (error) {
    return <div className="py-8 text-center text-destructive">{error}</div>;
  }
  
  if (events.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No events scheduled for this project.</div>;
  }
  
  return (
    <>
      <div className="space-y-4">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onEdit={() => handleEditEvent(event)}
          />
        ))}
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventForm 
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
              event={selectedEvent}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

interface EventCardProps {
  event: Event;
  onEdit: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  
  const formattedDate = format(startTime, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');
  
  // Calculate if the event is today, upcoming, or past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(startTime);
  eventDate.setHours(0, 0, 0, 0);
  
  const isToday = eventDate.getTime() === today.getTime();
  const isPast = eventDate.getTime() < today.getTime();
  const isUpcoming = eventDate.getTime() > today.getTime();
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{event.title}</h3>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isToday ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              isUpcoming ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            )}>
              {isToday ? "Today" : isUpcoming ? "Upcoming" : "Past"}
            </span>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <PencilIcon className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center mb-1">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formattedDate}
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            {formattedStartTime} - {formattedEndTime}
          </div>
        </div>
        
        {event.description && (
          <p className="mt-2 text-sm">{event.description}</p>
        )}
      </CardContent>
    </Card>
  );
}; 