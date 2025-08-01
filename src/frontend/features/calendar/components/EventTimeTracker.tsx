import React, { useState, useEffect } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Play, Square, Calendar } from 'lucide-react';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { Event } from '@/frontend/types/calendar';
import { cn } from '@/frontend/lib/utils';

interface EventTimeTrackerProps {
  event: Event;
  className?: string;
  compact?: boolean;
}

export const EventTimeTracker: React.FC<EventTimeTrackerProps> = ({ 
  event, 
  className,
  compact = false 
}) => {
  const {
    activeTimeLog,
    isActive,
    startTracking,
    stopTracking,
    isLoading,
    formattedElapsedTime
  } = useTimeTracking();

  const [isEventLive, setIsEventLive] = useState(false);

  const isTrackingThisEvent = activeTimeLog?.event_id === event.id;
  
  // Calculate event duration in minutes
  const eventDurationMinutes = event.endTime && event.startTime ? 
    Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60)) : 0;
  
  // Check if event is currently happening
  useEffect(() => {
    const checkEventStatus = () => {
      const now = new Date();
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      setIsEventLive(now >= startTime && now <= endTime);
    };

    checkEventStatus();
    const interval = setInterval(checkEventStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [event.startTime, event.endTime]);

  const handleStartTracking = async () => {
    try {
      await startTracking({
        eventId: event.id,
        projectId: event.project || undefined,
        description: `Event: ${event.title}`,
        sessionType: 'meeting' // Default for events
      });
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getEventTimeStatus = () => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'live';
    } else {
      return 'past';
    }
  };

  const eventStatus = getEventTimeStatus();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Event duration info */}
        {eventDurationMinutes > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(eventDurationMinutes)}
          </Badge>
        )}
        
        {/* Live event indicator */}
        {eventStatus === 'live' && (
          <Badge variant="default" className="text-xs bg-green-600">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
            Live
          </Badge>
        )}
        
        {/* Active tracking indicator */}
        {isTrackingThisEvent && (
          <Badge variant="default" className="text-xs bg-blue-600">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
            {formattedElapsedTime}
          </Badge>
        )}
        
        {/* Start/Stop button */}
        {eventStatus !== 'past' && (
          <>
            {isTrackingThisEvent ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStopTracking}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Square className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStartTracking}
                disabled={isLoading || (activeTimeLog !== null && !isTrackingThisEvent)}
                className="h-6 w-6 p-0"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Event Duration Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duration</span>
          <span className="text-sm font-medium">
            {eventDurationMinutes > 0 ? formatDuration(eventDurationMinutes) : 'No duration'}
          </span>
        </div>
        
        {/* Event Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            variant={eventStatus === 'live' ? 'default' : eventStatus === 'upcoming' ? 'secondary' : 'outline'}
            className={cn(
              "text-xs",
              eventStatus === 'live' && "bg-green-600",
              eventStatus === 'upcoming' && "bg-blue-600"
            )}
          >
            {eventStatus === 'live' && <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />}
            {eventStatus === 'live' ? 'Live Now' : eventStatus === 'upcoming' ? 'Upcoming' : 'Past'}
          </Badge>
        </div>
      </div>

      {/* Active tracking display */}
      {isTrackingThisEvent && (
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium">Tracking event</span>
            </div>
            <span className="text-sm font-mono">{formattedElapsedTime}</span>
          </div>
        </div>
      )}

      {/* Control buttons */}
      {eventStatus !== 'past' && (
        <div className="flex gap-2">
          {isTrackingThisEvent ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopTracking}
              disabled={isLoading}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Square className="h-4 w-4" />
              Stop Tracking
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartTracking}
              disabled={isLoading || (activeTimeLog !== null && !isTrackingThisEvent)}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {eventStatus === 'live' ? 'Track Live Event' : 'Track Event'}
            </Button>
          )}
        </div>
      )}

      {/* Disabled state hint */}
      {activeTimeLog !== null && !isTrackingThisEvent && eventStatus !== 'past' && (
        <p className="text-xs text-muted-foreground">
          Stop current tracking session to track time for this event
        </p>
      )}

      {/* Auto-start suggestion for live events */}
      {eventStatus === 'live' && !isTrackingThisEvent && !activeTimeLog && (
        <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            💡 This event is live now! Consider starting time tracking.
          </p>
        </div>
      )}
    </div>
  );
}; 