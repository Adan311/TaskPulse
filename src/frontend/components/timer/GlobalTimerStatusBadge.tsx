import React from 'react';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { useGlobalTimer } from '@/frontend/context/TimerContext';
import { cn } from '@/frontend/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/frontend/components/ui/button';

interface GlobalTimerStatusBadgeProps {
  className?: string;
  compact?: boolean;
  showControls?: boolean;
}

export const GlobalTimerStatusBadge: React.FC<GlobalTimerStatusBadgeProps> = ({
  className,
  compact = false,
  showControls = false
}) => {
  const {
    hasActiveTimer,
    getCurrentContext,
    getStatusColor,
    getDisplayTime,
    isTimeTrackingPaused,
    pomodoroIsRunning,
    isSynchronized,
    isLoading,
    stopAllTimers,
    pauseAllTimers,
    resumeAllTimers
  } = useGlobalTimer();

  const navigate = useNavigate();

  if (!hasActiveTimer) {
    return null;
  }

  const handleBadgeClick = () => {
    navigate('/timer');
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAllTimers();
  };

  const handlePauseResumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimeTrackingPaused || (pomodoroIsRunning === false)) {
      resumeAllTimers();
    } else {
      pauseAllTimers();
    }
  };

  const isTimerPaused = isTimeTrackingPaused || (pomodoroIsRunning === false);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div 
          className={cn(
            "h-2 w-2 rounded-full",
            isTimerPaused ? "" : "animate-pulse",
            getStatusColor()
          )}
        />
        <span 
          className="text-xs font-mono cursor-pointer hover:text-primary transition-colors"
          onClick={handleBadgeClick}
          title={`Timer: ${getCurrentContext()}`}
        >
          {getDisplayTime()}
        </span>
      </div>
    );
  }

  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="secondary" 
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={handleBadgeClick}
      >
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              "h-2 w-2 rounded-full",
              isTimerPaused ? "" : "animate-pulse",
              getStatusColor()
            )}
          />
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">{getCurrentContext()}</span>
            </div>
            <span className="text-xs font-mono">{getDisplayTime()}</span>
          </div>
        </div>
      </Badge>

      {showControls && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePauseResumeClick}
            disabled={isLoading}
            className="h-6 w-6 p-0"
            title={isTimerPaused ? "Resume timer" : "Pause timer"}
          >
            {isTimerPaused ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStopClick}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Stop all timers"
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}; 