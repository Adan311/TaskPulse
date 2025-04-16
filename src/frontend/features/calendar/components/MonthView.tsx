
import { useState } from 'react';
import { Calendar } from '@/frontend/components/ui/calendar';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { useToast } from "@/frontend/hooks/use-toast";
import { format, isSameDay, parseISO } from 'date-fns';
import { Event } from '@/frontend/types/calendar';
import { EventItem } from './EventItem';
import { EventDialog } from './EventDialog';

interface MonthViewProps {
  events: Event[];
  date: Date | undefined;
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export function MonthView({ events, date, onEditEvent, onEventsChange }: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const { toast } = useToast();

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
  };

  const handleEditEvent = (event: Event) => {
    onEditEvent(event);
  };

  // Get events for the selected date
  const selectedDateEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = parseISO(event.startTime);
        return isSameDay(eventDate, selectedDate);
      })
    : [];

  // Create a map of dates with events for calendar highlighting
  const eventDates = events.reduce((acc, event) => {
    const date = event.startTime.split('T')[0];
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
              selected={selectedDate}
              onSelect={handleDateChange}
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
                {selectedDate ? `Events on ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date'}
              </h3>
              {selectedDateEvents.length === 0 ? (
                <div className="py-2 text-sm text-muted-foreground">No events scheduled for this day.</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {selectedDateEvents.map(event => (
                    <EventItem 
                      key={event.id} 
                      event={event} 
                      onEdit={handleEditEvent}
                      onDelete={onEventsChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
