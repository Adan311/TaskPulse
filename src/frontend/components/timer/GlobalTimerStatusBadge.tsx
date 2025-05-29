import React from 'react';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { usePomodoroTimer } from '@/frontend/hooks/usePomodoroTimer';
import { cn } from '@/frontend/lib/utils';
import { useNavigate } from 'react-router-dom';

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
    activeTimeLog,
    isActive,
    isPaused,
    formattedElapsedTime,
    stopTracking,
    pauseTracking,
    resumeTracking,
    isLoading
  } = useTimeTracking();

  const {
    mode: pomodoroMode,
    timeLeft: pomodoroTimeLeft,
    isRunning: pomodoroIsRunning,
    formattedTime: pomodoroFormattedTime,
    displayModeText: pomodoroDisplayText,
    timerContext,
    start: pomodoroStart,
    pause: pomodoroPause,
    reset: pomodoroReset
  } = usePomodoroTimer();

  const navigate = useNavigate();

  // Simple logic: Show if time tracking is active OR Pomodoro is running
  const hasActiveTimer = activeTimeLog || pomodoroIsRunning;
  
  if (!hasActiveTimer) {
    return null;
  }

  // Priority: Show time tracking if active, otherwise show Pomodoro
  const isShowingTimeTracking = !!activeTimeLog;
  const isShowingPomodoro = !activeTimeLog && pomodoroIsRunning;

  const getContextName = () => {
    if (isShowingTimeTracking && activeTimeLog) {
      if (activeTimeLog.task_id) {
        return activeTimeLog.description || 'Task';
      }
      if (activeTimeLog.project_id) {
        return activeTimeLog.description || 'Project';
      }
      if (activeTimeLog.event_id) {
        return activeTimeLog.description || 'Event';
      }
      return activeTimeLog.description || 'Timer';
    }
    
    if (isShowingPomodoro) {
      if (timerContext) {
        return timerContext.title;
      }
      return pomodoroDisplayText;
    }
    
    return 'Timer';
  };

  const getStatusColor = () => {
    if (isShowingTimeTracking) {
      if (isPaused) return 'bg-orange-500';
      if (isActive) return 'bg-green-500';
      return 'bg-gray-500';
    }
    
    if (isShowingPomodoro) {
      if (!pomodoroIsRunning) return 'bg-orange-500'; // Paused
      if (pomodoroMode === 'focus') return 'bg-blue-500';
      return 'bg-green-500'; // Break
    }
    
    return 'bg-gray-500';
  };

  const getDisplayTime = () => {
    if (isShowingTimeTracking) {
      return formattedElapsedTime;
    }
    if (isShowingPomodoro) {
      return pomodoroFormattedTime;
    }
    return '0:00';
  };

  const handleBadgeClick = () => {
    navigate('/timer');
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShowingTimeTracking) {
      stopTracking();
    } else if (isShowingPomodoro) {
      pomodoroReset();
    }
  };

  const handlePauseResumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShowingTimeTracking) {
      if (isPaused) {
        resumeTracking();
      } else {
        pauseTracking();
      }
    } else if (isShowingPomodoro) {
      if (pomodoroIsRunning) {
        pomodoroPause();
      } else {
        pomodoroStart();
      }
    }
  };

  const isTimerPaused = isShowingTimeTracking ? isPaused : !pomodoroIsRunning;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div 
          className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            getStatusColor()
          )}
        />
        <span 
          className="text-xs font-mono cursor-pointer hover:text-primary"
          onClick={handleBadgeClick}
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
          <div className={cn(
            "h-2 w-2 rounded-full",
            isActive && !isPaused ? "animate-pulse" : "",
            getStatusColor()
          )} />
          
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium truncate max-w-24">
              {getContextName()}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {getDisplayTime()}
            </span>
          </div>
        </div>
      </Badge>

      {showControls && (
        <div className="flex items-center gap-1">
          <button
            onClick={handlePauseResumeClick}
            disabled={isLoading}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isTimerPaused ? 'Resume' : 'Pause'}
          >
            {isTimerPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          
          <button
            onClick={handleStopClick}
            disabled={isLoading}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent text-destructive hover:text-destructive transition-colors"
            title="Stop"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}; 