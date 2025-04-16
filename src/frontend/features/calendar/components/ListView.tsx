
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { Event } from '@/frontend/types/calendar';
import { EventItem } from './EventItem';

interface ListViewProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export function ListView({ events, onEditEvent, onEventsChange }: ListViewProps) {
  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.startTime.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort dates in ascending order
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {events.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No events found. Create your first event to get started.</div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  <h3 className="font-semibold sticky top-0 bg-background py-2 z-10">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div>
                    {groupedEvents[date].map((event) => (
                      <EventItem 
                        key={event.id} 
                        event={event} 
                        onEdit={onEditEvent}
                        onDelete={onEventsChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
