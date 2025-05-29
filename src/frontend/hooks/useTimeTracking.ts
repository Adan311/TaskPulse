import { useState, useEffect, useCallback } from 'react';
import { 
  TimeLog, 
  TimeStats,
  startTimeTracking, 
  stopTimeTracking, 
  pauseTimeTracking, 
  resumeTimeTracking, 
  cancelTimeTracking,
  getActiveTimeLog, 
  getTimeStats,
  calculateElapsedTime 
} from '@/backend/api/services/timeTracking/timeTrackingService';
import { useToast } from '@/frontend/hooks/use-toast';

export interface UseTimeTrackingReturn {
  // State
  activeTimeLog: TimeLog | null;
  isLoading: boolean;
  error: string | null;
  elapsedSeconds: number;
  timeStats: TimeStats | null;
  
  // Actions
  startTracking: (params: {
    taskId?: string;
    eventId?: string;
    projectId?: string;
    description?: string;
    sessionType?: 'work' | 'break' | 'meeting' | 'planning';
  }) => Promise<void>;
  stopTracking: () => Promise<void>;
  pauseTracking: () => Promise<void>;
  resumeTracking: () => Promise<void>;
  cancelTracking: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Computed
  isActive: boolean;
  isPaused: boolean;
  formattedElapsedTime: string;
}

export const useTimeTracking = (): UseTimeTrackingReturn => {
  const [activeTimeLog, setActiveTimeLog] = useState<TimeLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const { toast } = useToast();

  // Check for active time log on mount
  useEffect(() => {
    const loadActiveTimeLog = async () => {
      try {
        const activeLog = await getActiveTimeLog();
        setActiveTimeLog(activeLog);
        if (activeLog && activeLog.status === 'active') {
          setElapsedSeconds(calculateElapsedTime(activeLog.start_time));
        }
      } catch (error) {
        console.error('Error loading active time log:', error);
      }
    };

    loadActiveTimeLog();
  }, []);

  // Update elapsed time every second for active tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTimeLog && activeTimeLog.status === 'active') {
      interval = setInterval(() => {
        setElapsedSeconds(calculateElapsedTime(activeTimeLog.start_time));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimeLog]);

  // Load time stats on mount
  useEffect(() => {
    refreshStats();
  }, []);

  const startTracking = useCallback(async (params: {
    taskId?: string;
    eventId?: string;
    projectId?: string;
    description?: string;
    sessionType?: 'work' | 'break' | 'meeting' | 'planning';
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const timeLog = await startTimeTracking({
        ...params,
        timerMode: 'manual'
      });
      
      setActiveTimeLog(timeLog);
      setElapsedSeconds(0);
      
      toast({
        title: "Time tracking started",
        description: params.description || "Tracking time for your activity",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start time tracking';
      setError(errorMessage);
      toast({
        title: "Failed to start tracking",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const stopTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const completedLog = await stopTimeTracking();
      setActiveTimeLog(null);
      setElapsedSeconds(0);
      
      // Refresh stats after stopping
      await refreshStats();
      
      const duration = completedLog.duration_seconds ? Math.round(completedLog.duration_seconds / 60) : 0;
      toast({
        title: "Time tracking stopped",
        description: `Session completed: ${duration} minutes`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop time tracking';
      setError(errorMessage);
      toast({
        title: "Failed to stop tracking",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const pauseTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const pausedLog = await pauseTimeTracking();
      setActiveTimeLog(pausedLog);
      
      toast({
        title: "Time tracking paused",
        description: "You can resume tracking anytime",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause time tracking';
      setError(errorMessage);
      toast({
        title: "Failed to pause tracking",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resumeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const resumedLog = await resumeTimeTracking();
      setActiveTimeLog(resumedLog);
      
      toast({
        title: "Time tracking resumed",
        description: "Continuing your session",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume time tracking';
      setError(errorMessage);
      toast({
        title: "Failed to resume tracking",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const cancelTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cancelTimeTracking();
      setActiveTimeLog(null);
      setElapsedSeconds(0);
      
      toast({
        title: "Time tracking cancelled",
        description: "Session discarded",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel time tracking';
      setError(errorMessage);
      toast({
        title: "Failed to cancel tracking",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getTimeStats();
      setTimeStats(stats);
    } catch (error) {
      console.error('Error refreshing time stats:', error);
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    activeTimeLog,
    isLoading,
    error,
    elapsedSeconds,
    timeStats,
    
    // Actions
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    cancelTracking,
    refreshStats,
    
    // Computed
    isActive: activeTimeLog?.status === 'active',
    isPaused: activeTimeLog?.status === 'paused',
    formattedElapsedTime: formatTime(elapsedSeconds),
  };
}; 