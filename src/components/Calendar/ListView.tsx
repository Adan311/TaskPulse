
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { EventItem } from './EventItem';
import { EventDialog } from './EventDialog';
import { Event, getEvents } from '@/services/eventService';

export function ListView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.start_time.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="py-4 text-center">Loading events...</div>
          ) : error ? (
            <div className="py-4 text-center text-destructive">{error}</div>
          ) : events.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No events found. Create your first event to get started.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date} className="space-y-2">
                  <h3 className="font-semibold sticky top-0 bg-background py-2 z-10">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div>
                    {dayEvents.map((event) => (
                      <EventItem 
                        key={event.id} 
                        event={event} 
                        onEdit={handleEditEvent}
                        onDelete={fetchEvents}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchEvents}
        event={selectedEvent}
      />
    </Card>
  );
}
