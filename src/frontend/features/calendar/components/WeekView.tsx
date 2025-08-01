import React, { useState } from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay, isToday } from 'date-fns';
import { Event } from '@/frontend/types/calendar';

interface WeekViewProps {
  events: Event[];
  date: Date | undefined;
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export function WeekView({ events, date, onEditEvent, onEventsChange }: WeekViewProps) {
  const currentDate = date || new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00

  // Utility to get minutes from 00:00
  const getMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

  // Filter events for the current week
  const weekEvents = events.filter(event => {
    const start = parseISO(event.startTime);
    return start >= weekStart && start <= weekEnd;
  });

  // Group events by day
  const eventsByDay: Record<string, Event[]> = {};
  days.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    eventsByDay[dayStr] = weekEvents.filter(event => isSameDay(parseISO(event.startTime), day));
  });

  // Constants for grid layout
  const HOUR_HEIGHT = 60; // px
  const CAL_START = 0; // 00:00 in minutes
  const CAL_END = 24 * 60; // 24:00 in minutes
  const CAL_TOTAL = CAL_END - CAL_START;

  // --- Robust Overlap Handling (Modern Look) ---
  function getEventLayout(events: Event[]) {
    // Parse and sort events by start time
    type ParsedEvent = Event & { _parsedStart: number; _parsedEnd: number; _index: number };
    const parsed: ParsedEvent[] = events.map((event, i) => ({
      ...event,
      _parsedStart: getMinutes(parseISO(event.startTime)),
      _parsedEnd: getMinutes(parseISO(event.endTime || event.startTime)) || (getMinutes(parseISO(event.startTime)) + 30),
      _index: i
    })).sort((a, b) => a._parsedStart - b._parsedStart);

    // Build overlap groups using a sweep line
    let layouts: { event: Event, slot: number, totalSlots: number }[] = [];
    let active: { event: ParsedEvent, slot: number }[] = [];
    for (let i = 0; i < parsed.length; i++) {
      // Remove finished events
      active = active.filter(a => a.event._parsedEnd > parsed[i]._parsedStart);
      // Find available slot
      let used = active.map(a => a.slot);
      let slot = 0;
      while (used.includes(slot)) slot++;
      active.push({ event: parsed[i], slot });
      // Find max overlaps in this group
      let groupStart = parsed[i]._parsedStart;
      let groupEnd = parsed[i]._parsedEnd;
      let maxOverlap = 1;
      for (let j = 0; j < parsed.length; j++) {
        if (i !== j && parsed[j]._parsedStart < groupEnd && parsed[j]._parsedEnd > groupStart) {
          let overlapCount = 1;
          for (let k = 0; k < parsed.length; k++) {
            if (k !== j && parsed[k]._parsedStart < parsed[j]._parsedEnd && parsed[k]._parsedEnd > parsed[j]._parsedStart) {
              overlapCount++;
            }
          }
          maxOverlap = Math.max(maxOverlap, overlapCount);
        }
      }
      layouts.push({ event: parsed[i], slot, totalSlots: maxOverlap });
    }
    return layouts;
  }

  // --- Current Time Line ---
  const now = new Date();
  const nowMinutes = getMinutes(now);
  const todayIdx = days.findIndex(day => isToday(day));
  const nowTop = ((nowMinutes - CAL_START) / CAL_TOTAL) * (HOUR_HEIGHT * hours.length);

  return (
    <div className="w-full h-full flex flex-col overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Weekday headers */}
      <div className="grid w-full" style={{ gridTemplateColumns: `44px repeat(7, 1fr)`, columnGap: '16px', rowGap: 0 }}>
        <div />
        {days.map((day, i) => (
          <div key={i} className="text-center">
            <div className="text-lg font-bold">
              {format(day, 'EEE')}
            </div>
            <div className="text-xs opacity-70">
              {format(day, 'MMM d')}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 w-full relative" style={{ minHeight: `${HOUR_HEIGHT * hours.length}px` }}>
        <div className="absolute inset-0 grid" style={{
          gridTemplateColumns: `44px repeat(7, 1fr)`,
          columnGap: '16px',
          rowGap: 0,
          width: '100%',
          height: '100%'
        }}>
          {/* Time labels */}
          <div className="flex flex-col items-end pr-3 select-none" style={{ minWidth: 0, width: '44px', padding: 0, margin: 0 }}>
            {hours.map(hour => (
              <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-xs text-muted-foreground/80 flex items-start justify-end font-mono tracking-wider">
                {format(new Date(2000, 0, 1, hour), 'HH:mm')}
              </div>
            ))}
          </div>
          {/* Days columns */}
          {days.map((day, dayIdx) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[dayStr] || [];
            const slottedEvents = getEventLayout(dayEvents);
            return (
              <div
                key={dayIdx}
                className="relative h-full overflow-visible flex"
                style={{ minHeight: `${HOUR_HEIGHT * hours.length}px` }}
              >
                {/* Hour grid lines (horizontal only, subtle) */}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-muted-foreground/10"
                    style={{
                      top: `${i * HOUR_HEIGHT}px`,
                      zIndex: 1
                    }}
                  />
                ))}
                {/* Current time indicator */}
                {isToday(day) && nowMinutes >= CAL_START && nowMinutes <= CAL_END && (
                  <div
                    className="absolute left-0 right-0 h-1.5 flex items-center"
                    style={{
                      top: `${nowTop}px`,
                      zIndex: 10
                    }}
                  >
                    <div className="w-full h-0.5 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div>
                  </div>
                )}
                {/* Events: use flex for side-by-side, never overflow column */}
                <div className="absolute top-0 left-0 w-full h-full flex" style={{ pointerEvents: 'none' }}>
                  {slottedEvents.map(({ event, slot, totalSlots }, i) => {
                    const start = parseISO(event.startTime);
                    const end = parseISO(event.endTime || event.startTime);
                    const eventStartMin = Math.max(getMinutes(start), CAL_START);
                    const eventEndMin = Math.min(Math.max(getMinutes(end), eventStartMin + 30), CAL_END);
                    if (eventEndMin <= CAL_START || eventStartMin >= CAL_END) return null;
                    const top = ((eventStartMin - CAL_START) / CAL_TOTAL) * (HOUR_HEIGHT * hours.length);
                    const height = ((eventEndMin - eventStartMin) / CAL_TOTAL) * (HOUR_HEIGHT * hours.length);
                    const width = `calc((100% - ${(totalSlots-1)*8}px) / ${totalSlots})`;
                    const left = `calc(${slot} * ((100% - ${(totalSlots-1)*8}px) / ${totalSlots}) + ${slot*8}px`;
                    return (
                      <div
                        key={event.id}
                        className="absolute rounded-xl shadow-lg flex flex-col justify-start px-4 py-3 cursor-pointer border border-white/30 bg-clip-padding"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          width,
                          left,
                          background: event.color || '#f1f5f9',
                          color: '#222',
                          zIndex: 2 + slot,
                          boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)',
                          minWidth: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          pointerEvents: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          alignItems: 'flex-start',
                        }}
                        title={`${event.title ? event.title + '\n' : ''}${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
                        onClick={() => onEditEvent(event)}
                      >
                        {event.title && (
                          <span className="font-medium text-sm truncate w-full block mb-1" style={{fontSize: '0.875rem', lineHeight: 1.3, whiteSpace: 'nowrap'}}>{event.title}</span>
                        )}
                        <span className="text-xs opacity-70 w-full block" style={{fontSize: '0.75rem', letterSpacing: '0.025em', whiteSpace: 'nowrap'}}>
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
