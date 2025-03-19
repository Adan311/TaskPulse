
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { format, isSameDay, parseISO } from 'date-fns';
import { Event, getEvents } from '@/services/eventService';
import { EventItem } from './EventItem';
import { EventDialog } from './EventDialog';

export function MonthView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  // Get events for the selected date
  const selectedDateEvents = date 
    ? events.filter(event => {
        const eventDate = parseISO(event.start_time);
        return isSameDay(eventDate, date);
      })
    : [];

  // Create a map of dates with events for calendar highlighting
  const eventDates = events.reduce((acc, event) => {
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
        <div className="grid lg:grid-cols-7 gap-4">
          <div className="lg:col-span-5">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: (date) => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  return !!eventDates[dateString];
                },
              }}
              modifiersStyles={{
                hasEvent: { 
                  fontWeight: 'bold',
                  textDecoration: 'underline', 
                  textDecorationColor: 'var(--primary)',
                  textDecorationThickness: '2px'
                }
              }}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">
                {date ? `Events on ${format(date, 'MMMM d, yyyy')}` : 'Select a date'}
              </h3>
              {loading ? (
                <div className="py-2 text-sm text-muted-foreground">Loading events...</div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="py-2 text-sm text-muted-foreground">No events scheduled for this day.</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {selectedDateEvents.map(event => (
                    <EventItem 
                      key={event.id} 
                      event={event} 
                      onEdit={handleEditEvent}
                      onDelete={fetchEvents}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
