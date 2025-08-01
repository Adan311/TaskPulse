import React, { useState } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Play, Square } from 'lucide-react';
import { useGlobalTimer } from '@/frontend/context/TimerContext';
import { Task } from '@/backend/database/schema';
import { cn } from '@/frontend/lib/utils';

interface TaskTimeTrackerProps {
  task: Task;
  className?: string;
  compact?: boolean;
}

export const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({ 
  task, 
  className,
  compact = false 
}) => {
  const {
    activeTimeLog,
    isTimeTrackingActive,
    startTimeTracking,
    stopTimeTracking,
    isLoading,
    formattedTimeTrackingTime,
    hasActiveTimer
  } = useGlobalTimer();

  const isTrackingThisTask = activeTimeLog?.task_id === task.id;
  const totalLoggedMinutes = task.total_time_logged_minutes || 0;
  const estimatedMinutes = task.estimated_time_minutes || 0;

  const handleStartTracking = async () => {
    try {
      await startTimeTracking({
        taskId: task.id,
        projectId: task.project || undefined,
        description: `Working on: ${task.title}`,
        sessionType: 'work'
      });
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTimeTracking();
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTimeProgress = (): number => {
    if (!estimatedMinutes || estimatedMinutes === 0) return 0;
    return Math.min((totalLoggedMinutes / estimatedMinutes) * 100, 100);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Time logged badge */}
        {totalLoggedMinutes > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatMinutes(totalLoggedMinutes)}
          </Badge>
        )}
        
        {/* Active tracking indicator */}
        {isTrackingThisTask && (
          <Badge variant="default" className="text-xs bg-green-600">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
            {formattedTimeTrackingTime}
          </Badge>
        )}
        
        {/* Start/Stop button */}
        {isTrackingThisTask ? (
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
            disabled={isLoading || (hasActiveTimer && !isTrackingThisTask)}
            className="h-6 w-6 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Time Statistics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Time Logged</span>
          <span className="text-sm font-medium">
            {totalLoggedMinutes > 0 ? formatMinutes(totalLoggedMinutes) : 'None'}
          </span>
        </div>
        
        {estimatedMinutes > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated</span>
              <span className="text-sm font-medium">{formatMinutes(estimatedMinutes)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(getTimeProgress())}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    getTimeProgress() > 100 ? "bg-red-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(getTimeProgress(), 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active tracking display */}
      {isTrackingThisTask && (
        <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Actively tracking</span>
            </div>
            <span className="text-sm font-mono">{formattedTimeTrackingTime}</span>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        {isTrackingThisTask ? (
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
            disabled={isLoading || (hasActiveTimer && !isTrackingThisTask)}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Tracking
          </Button>
        )}
      </div>

      {/* Disabled state hint */}
      {hasActiveTimer && !isTrackingThisTask && (
        <p className="text-xs text-muted-foreground">
          Stop current tracking session to track time for this task
        </p>
      )}
    </div>
  );
}; 