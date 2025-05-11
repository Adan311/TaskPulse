import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { Event } from '@/frontend/types/calendar';
import { Repeat } from 'lucide-react';

interface DayViewProps {
  events: Event[];
  date: Date;
  onEditEvent: (event: Event) => void;
  hideHeader?: boolean;
}

const HOUR_HEIGHT = 54; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CAL_START = 0;
const CAL_END = 24 * 60;
const CAL_TOTAL = CAL_END - CAL_START;

// Add a type for parsed events
type ParsedEvent = Event & {
  _parsedStart: number;
  _parsedEnd: number;
};

function getEventLayout(events: Event[]) {
  const parsed: ParsedEvent[] = events
    .map(e => ({
      ...e,
      _parsedStart: parseISO(e.startTime).getHours() * 60 + parseISO(e.startTime).getMinutes(),
      _parsedEnd: parseISO(e.endTime || e.startTime).getHours() * 60 + parseISO(e.endTime || e.startTime).getMinutes(),
    }))
    .sort((a, b) => a._parsedStart - b._parsedStart);
  const layouts: { event: ParsedEvent; slot: number; totalSlots: number }[] = [];
  let maxOverlap = 1;
  for (let i = 0; i < parsed.length; i++) {
    let slot = 0;
    let groupStart = parsed[i]._parsedStart;
    let groupEnd = parsed[i]._parsedEnd;
    let used: number[] = [];
    for (let j = 0; j < layouts.length; j++) {
      if (
        layouts[j].event._parsedStart < groupEnd &&
        layouts[j].event._parsedEnd > groupStart
      ) {
        used.push(layouts[j].slot);
      }
    }
    for (let j = 0; j < parsed.length; j++) {
      if (
        i !== j &&
        parsed[j]._parsedStart < groupEnd &&
        parsed[j]._parsedEnd > groupStart
      ) {
        let overlapCount = 1;
        for (let k = 0; k < parsed.length; k++) {
          if (
            k !== j &&
            parsed[k]._parsedStart < parsed[j]._parsedEnd &&
            parsed[k]._parsedEnd > parsed[j]._parsedStart
          ) {
            overlapCount++;
          }
        }
        maxOverlap = Math.max(maxOverlap, overlapCount);
      }
    }
    while (used.includes(slot)) slot++;
    layouts.push({ event: parsed[i], slot, totalSlots: maxOverlap });
  }
  return layouts;
}

export function DayView({ events, date, onEditEvent, hideHeader }: DayViewProps) {
  console.log('DayView: rendering for', date, 'events:', events.length);
  const today = new Date();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - CAL_START) / CAL_TOTAL) * (HOUR_HEIGHT * HOURS.length);
  const dayEvents = events.filter(
    e => format(parseISO(e.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );
  const slottedEvents = getEventLayout(dayEvents);

  return (
    <div className="bg-background rounded-2xl border shadow p-0 w-full h-full flex flex-col overflow-x-auto overflow-y-auto max-h-[calc(95vh-200px)]">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col items-center py-4 border-b border-muted-foreground/10 bg-background z-10">
          <div className="text-2xl font-bold uppercase tracking-wide text-primary mb-1">{format(date, 'EEE')}</div>
          <div className="text-lg opacity-70 text-primary">{format(date, 'MMMM d, yyyy')}</div>
        </div>
      )}
      {/* Time grid */}
      <div className="flex-1 w-full relative flex overflow-x-auto" style={{ minHeight: `${HOUR_HEIGHT * HOURS.length}px` }}>
        {/* Hour labels */}
        <div className="flex flex-col items-end pr-3 select-none pt-2" style={{ minWidth: 60, width: 60, background: 'transparent', zIndex: 2 }}>
          {HOURS.map(hour => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="text-xs text-muted-foreground flex items-start justify-end h-[54px]"
            >
              {format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
          ))}
        </div>
        {/* Day grid */}
        <div className="relative flex-1 h-full" style={{ minHeight: `${HOUR_HEIGHT * HOURS.length}px` }}>
          {/* Hour grid lines (horizontal only, subtle) */}
          {HOURS.map((hour, i) => (
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
          {isToday(date) && nowMinutes >= CAL_START && nowMinutes <= CAL_END && (
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
              const eventStartMin = Math.max(start.getHours() * 60 + start.getMinutes(), CAL_START);
              const eventEndMin = Math.min(Math.max(end.getHours() * 60 + end.getMinutes(), eventStartMin + 30), CAL_END);
              if (eventEndMin <= CAL_START || eventStartMin >= CAL_END) return null;
              const top = ((eventStartMin - CAL_START) / CAL_TOTAL) * (HOUR_HEIGHT * HOURS.length);
              const height = ((eventEndMin - eventStartMin) / CAL_TOTAL) * (HOUR_HEIGHT * HOURS.length);
              const width = `calc((100% - ${(totalSlots-1)*8}px) / ${totalSlots})`;
              const left = `calc(${slot} * ((100% - ${(totalSlots-1)*8}px) / ${totalSlots}) + ${slot*8}px`;
              const isRecurring = event.isRecurring || event.parentId;
              
              return (
                <div
                  key={event.id}
                  className="absolute rounded-xl shadow-lg flex flex-col justify-start px-3 py-2 cursor-pointer border border-white/20 bg-clip-padding"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    width,
                    left,
                    background: event.color || 'rgba(90,125,255,0.7)',
                    color: '#fff',
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
                  title={`${event.title ? event.title + '\n' : ''}${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}${isRecurring ? '\n(Recurring event)' : ''}`}
                  onClick={() => onEditEvent(event)}
                >
                  <div className="w-full flex items-center justify-between">
                    {event.title && (
                      <span className="font-semibold text-base truncate block" style={{fontSize: '0.97em', lineHeight: 1.2, whiteSpace: 'nowrap'}}>{event.title}</span>
                    )}
                    {isRecurring && (
                      <Repeat className="h-3 w-3 ml-1 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs opacity-80 mt-0.5 w-full block" style={{fontSize: '0.95em', whiteSpace: 'nowrap'}}>
                    {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
