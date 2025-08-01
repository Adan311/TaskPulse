import React from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Play, Pause, Square, Clock, Target, FolderOpen } from 'lucide-react';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { cn } from '@/frontend/lib/utils';

interface ActiveTimeTrackerProps {
  className?: string;
  compact?: boolean;
  taskName?: string;
  projectName?: string;
}

export const ActiveTimeTracker: React.FC<ActiveTimeTrackerProps> = ({ 
  className,
  compact = false,
  taskName,
  projectName
}) => {
  const {
    activeTimeLog,
    isActive,
    isPaused,
    formattedElapsedTime,
    isLoading,
    pauseTracking,
    resumeTracking,
    stopTracking
  } = useTimeTracking();

  if (!activeTimeLog) {
    return null;
  }

  const getActivityName = () => {
    if (taskName) return taskName;
    if (projectName) return projectName;
    if (activeTimeLog.description) return activeTimeLog.description;
    return 'Time Tracking';
  };

  const getActivityType = () => {
    if (taskName) return 'Task';
    if (projectName) return 'Project';
    return 'Activity';
  };

  const getActivityIcon = () => {
    if (taskName) return <Target className="h-4 w-4" />;
    if (projectName) return <FolderOpen className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-md bg-primary/10 border", className)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getActivityIcon()}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{getActivityName()}</div>
            <div className="text-xs text-muted-foreground">{formattedElapsedTime}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isActive ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={pauseTracking}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <Pause className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={resumeTracking}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={stopTracking}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isActive ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            )} />
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {activeTimeLog.session_type}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getActivityIcon()}
              <span className="text-xs text-muted-foreground">{getActivityType()}</span>
            </div>
            <h3 className="font-medium truncate">{getActivityName()}</h3>
          </div>

          <div className="text-center">
            <div className="text-3xl font-mono font-bold tracking-wider text-primary">
              {formattedElapsedTime}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Started at {new Date(activeTimeLog.start_time).toLocaleTimeString()}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={pauseTracking}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={resumeTracking}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={stopTracking}
              disabled={isLoading}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 