import React from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Play, Square, BarChart3 } from 'lucide-react';
import { useGlobalTimer } from '@/frontend/context/TimerContext';
import { cn } from '@/frontend/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  estimated_time_hours?: number;
  total_time_logged_hours?: number;
}

interface ProjectTimeTrackerProps {
  project: Project;
  className?: string;
  compact?: boolean;
  showStats?: boolean;
}

export const ProjectTimeTracker: React.FC<ProjectTimeTrackerProps> = ({ 
  project, 
  className,
  compact = false,
  showStats = true
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

  const isTrackingThisProject = activeTimeLog?.project_id === project.id;
  const totalLoggedHours = project.total_time_logged_hours || 0;
  const estimatedHours = project.estimated_time_hours || 0;

  const handleStartTracking = async () => {
    try {
      await startTimeTracking({
        projectId: project.id,
        description: `Working on project: ${project.name}`,
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

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  };

  const getTimeProgress = (): number => {
    if (!estimatedHours || estimatedHours === 0) return 0;
    return Math.min((totalLoggedHours / estimatedHours) * 100, 100);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Time spent badge */}
        {totalLoggedHours > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatHours(totalLoggedHours)} spent
          </Badge>
        )}
        
        {/* Active tracking indicator */}
        {isTrackingThisProject && (
          <Badge variant="default" className="text-xs bg-blue-600">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
            {formattedTimeTrackingTime}
          </Badge>
        )}
        
        {/* Start/Stop button */}
        {isTrackingThisProject ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStopTracking}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Stop tracking"
          >
            <Square className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStartTracking}
            disabled={isLoading || (hasActiveTimer && !isTrackingThisProject)}
            className="h-6 w-6 p-0"
            title="Start tracking time for this project"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Statistics */}
      {showStats && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Project Time</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time Spent</span>
              <span className="text-sm font-medium">
                {totalLoggedHours > 0 ? formatHours(totalLoggedHours) : 'None'}
              </span>
            </div>
            
            {estimatedHours > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated</span>
                  <span className="text-sm font-medium">{formatHours(estimatedHours)}</span>
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
                        getTimeProgress() > 100 ? "bg-red-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(getTimeProgress(), 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active tracking display */}
      {isTrackingThisProject && (
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium">Actively tracking project</span>
            </div>
            <span className="text-sm font-mono">{formattedTimeTrackingTime}</span>
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        {isTrackingThisProject ? (
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
            disabled={isLoading || (hasActiveTimer && !isTrackingThisProject)}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Tracking
          </Button>
        )}
      </div>

      {/* Disabled state hint */}
      {hasActiveTimer && !isTrackingThisProject && (
        <p className="text-xs text-muted-foreground">
          Stop current tracking session to track time for this project
        </p>
      )}
    </div>
  );
}; 