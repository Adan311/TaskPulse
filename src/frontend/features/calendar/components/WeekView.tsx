
import React, { useState } from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';
import { Event } from '@/frontend/types/calendar';

interface WeekViewProps {
  events: Event[];
  date: Date | undefined;
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export function WeekView({ events, date, onEditEvent, onEventsChange }: WeekViewProps) {
  const currentDate = date || new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Function to get events for a specific day and hour
  const getEventsForTimeSlot = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startTime);
      const eventHour = eventDate.getHours();
      return isSameDay(eventDate, day) && eventHour === hour;
    });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-8 gap-1">
            {/* Time column */}
            <div className="sticky top-0 bg-background z-10 h-10"></div>
            {/* Day headers */}
            {days.map((day, index) => (
              <div key={index} className="sticky top-0 bg-background z-10 h-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
                </div>
              </div>
            ))}

            {/* Time slots */}
            {hours.map((hour) => (
              <React.Fragment key={`hour-${hour}`}>
                <div className="text-xs text-muted-foreground p-1 text-right sticky left-0 pr-2">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
                {days.map((day, dayIndex) => {
                  const timeSlotEvents = getEventsForTimeSlot(day, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="h-12 border-t border-l min-w-[80px] relative hover:bg-accent/50 transition-colors"
                    >
                      {timeSlotEvents.map((event) => (
                        <div
                          key={event.id}
                          className="absolute left-0 right-0 px-1 py-0.5 text-xs font-medium text-white rounded-sm overflow-hidden cursor-pointer"
                          style={{ 
                            backgroundColor: event.color || '#3b82f6',
                            top: '2px',
                            bottom: '2px'
                          }}
                          onClick={() => onEditEvent(event)}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
