import { useState } from 'react';
import { format, parseISO, addMonths, isBefore, isAfter, subMonths, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Event } from '@/frontend/types/calendar';
import { EventItem } from './EventItem';

interface ListViewProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export function ListView({ events, onEditEvent, onEventsChange }: ListViewProps) {
  // Split events into groups: Old, Past Month, Upcoming
  const today = startOfDay(new Date());
  const oneMonthAgo = subMonths(today, 1);
  const oldEvents = events.filter(e => isBefore(parseISO(e.startTime), oneMonthAgo));
  const pastMonthEvents = events.filter(e => isAfter(parseISO(e.startTime), oneMonthAgo) && isBefore(parseISO(e.startTime), today));
  const upcomingEvents = events.filter(e => !isBefore(parseISO(e.startTime), today));

  const [open, setOpen] = useState({
    old: false,
    pastMonth: false,
    upcoming: true,
  });

  const groupAndSort = (evts: Event[]) => {
    // Group by date, sorted ascending
    const grouped = evts.reduce((acc, event) => {
      const date = event.startTime.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
    const sortedDates = Object.keys(grouped).sort();
    return { grouped, sortedDates };
  };

  const renderSection = (label: string, key: keyof typeof open, evts: Event[]) => {
    if (evts.length === 0) return null;
    const { grouped, sortedDates } = groupAndSort(evts);
    return (
      <div className="mb-4">
        <button
          className="flex items-center gap-2 font-semibold text-lg w-full py-2 px-1 rounded-md hover:bg-accent focus:bg-accent transition"
          onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}
          aria-expanded={open[key]}
        >
          {open[key] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          {label} <span className="ml-2 text-xs text-muted-foreground">({evts.length})</span>
        </button>
        {open[key] && (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="space-y-2">
                <h3 className="font-semibold sticky top-0 bg-background py-2 z-10">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div>
                  {grouped[date].map(event => (
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
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(95vh-200px)]">
          {events.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No events found. Create your first event to get started.</div>
          ) : (
            <div className="space-y-2">
              {renderSection('Upcoming', 'upcoming', upcomingEvents)}
              {renderSection('Past Month', 'pastMonth', pastMonthEvents)}
              {renderSection('Old', 'old', oldEvents)}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
