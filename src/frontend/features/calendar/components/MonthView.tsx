import { useState } from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { useToast } from "@/frontend/hooks/use-toast";
import { 
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  parseISO
} from 'date-fns';
import { Event } from '@/frontend/types/calendar';
import { EventItem } from './EventItem';
import { EventDialog } from './EventDialog';
import { Repeat } from 'lucide-react';

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

  // --- Custom Month Grid Calculation ---
  const today = new Date();
  const monthStart = date ? startOfMonth(date) : startOfMonth(today);
  const monthEnd = date ? endOfMonth(date) : endOfMonth(today);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let curr = weekStart;
  while (curr <= weekEnd) {
    days.push(curr);
    curr = addDays(curr, 1);
  }

  // Map events by date string
  const eventDates = events.reduce((acc, event) => {
    const date = event.startTime.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // --- UI Redesign Start ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full h-full">
      {/* Month grid */}
      <div className="md:col-span-3 flex flex-col w-full h-full">
        <div className="bg-background rounded-2xl border shadow p-8 w-full h-full flex flex-col overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-4 mb-4 w-full">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-base font-semibold text-muted-foreground py-2 w-full">
                {d}
              </div>
            ))}
          </div>
          {/* Day squares */}
          <div className="grid grid-cols-7 gap-4 min-h-[600px]">
            {days.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayEvents = eventDates[dayStr] || [];
              return (
                <div
                  key={dayStr}
                  className={`relative flex flex-col rounded-2xl border bg-white dark:bg-muted shadow-sm h-full w-full aspect-square p-4 cursor-pointer transition-all overflow-hidden
                    ${isCurrMonth ? '' : 'bg-muted/50 text-muted-foreground opacity-60'}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${isSelected && !isToday ? 'ring-2 ring-accent ring-offset-2' : ''}
                    ${isSelected && isToday ? 'ring-4 ring-primary ring-offset-2 ring-accent/10' : ''}
                    hover:bg-accent/70
                  `}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xl">{format(day, 'd')}</span>
                    {/* Event count badge */}
                    {dayEvents.length > 0 && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  {/* Event pills */}
                  <div className="flex flex-col gap-2 w-full">
                    {dayEvents.slice(0, 3).map(event => {
                      const isRecurring = event.isRecurring || event.parentId;
                      return (
                        <div
                          key={event.id}
                          className="w-full max-w-full rounded-full text-xs font-medium mt-0.5 flex items-center px-3 py-1"
                          style={{
                            backgroundColor: event.color || "#2563eb",
                            color: "#fff"
                          }}
                          title={`${event.title}${isRecurring ? ' (Recurring)' : ''}`}
                          onClick={e => {
                            e.stopPropagation();
                            onEditEvent(event);
                          }}
                        >
                          <span className="truncate">{event.title}</span>
                          {isRecurring && (
                            <Repeat className="h-3 w-3 ml-1 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-muted-foreground mt-0.5">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Sidebar: Events for selected day */}
      <div className="md:col-span-1">
        <div className="bg-background rounded-2xl border shadow p-6 h-full">
          <h3 className="font-semibold text-xl mb-4">
            {selectedDate ? `Events on ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date'}
          </h3>
          {selectedDate && (events.filter(event => isSameDay(parseISO(event.startTime), selectedDate)).length === 0) ? (
            <div className="py-2 text-base text-muted-foreground">No events scheduled for this day.</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedDate && events.filter(event => isSameDay(parseISO(event.startTime), selectedDate)).map(event => {
                const isRecurring = event.isRecurring || event.parentId;
                return (
                  <div
                    key={event.id}
                    className="rounded-lg bg-muted p-3 hover:bg-accent cursor-pointer flex flex-col gap-1"
                    onClick={() => onEditEvent(event)}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-base truncate">{event.title}</span>
                      {isRecurring && (
                        <Repeat className="h-3 w-3 ml-1.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  // --- UI Redesign End ---
}
