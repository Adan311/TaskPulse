import React from 'react';
import { cn } from "@/frontend/lib/utils";
import { Event } from "@/frontend/types/calendar";
import { format, addHours } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";

interface TimelineViewProps {
  events: Event[];
  date?: Date;
  onEditEvent: (event: Event) => void;
}

export function TimelineView({ events, date, onEditEvent }: TimelineViewProps) {
  return (
    <div className="relative min-h-[600px]">
      <div className="absolute inset-0">
        <div className="grid grid-cols-[repeat(8,1fr)] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-border h-full" />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-full">
          {events.map((event) => (
            <TimelineEvent key={event.id} event={event} onEditEvent={onEditEvent} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ event, onEditEvent }: { event: Event, onEditEvent: (event: Event) => void }) {
  return (
    <div 
      className={cn(
        "rounded-lg p-3 mb-2",
        event.color
      )}
      style={{
        marginLeft: `${(parseInt(event.startTime.split(':')[0]) - 9) * 100}px`,
        width: `${(parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0])) * 100}px`
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-sm">{event.title}</h4>
          <p className="text-xs text-muted-foreground">
            {event.startTime} - {event.endTime}
          </p>
        </div>
        <div className="flex -space-x-2">
          {event.participants.map((participant, i) => (
            <Avatar key={i} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={participant.avatar} alt={participant.name} />
              <AvatarFallback>{participant.name[0]}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
