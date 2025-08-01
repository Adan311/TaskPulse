import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { 
  TimeLog, 
  TimeStats,
  startTimeTracking as startTimeTrackingService, 
  stopTimeTracking as stopTimeTrackingService, 
  pauseTimeTracking as pauseTimeTrackingService, 
  resumeTimeTracking as resumeTimeTrackingService, 
  cancelTimeTracking as cancelTimeTrackingService,
  getActiveTimeLog, 
  getTimeStats,
  calculateElapsedTime 
} from '@/backend/api/services/timeTracking/timeTrackingService';
import { PomodoroSettings, PomodoroState } from '@/frontend/hooks/usePomodoroTimer';
import { TimerContext as TimerContextType } from '@/frontend/features/timer/components/TimerContextSelector';
import { useToast } from '@/frontend/hooks/use-toast';

// Global Timer State Interface
interface GlobalTimerState {
  // Time Tracking State
  activeTimeLog: TimeLog | null;
  isTimeTrackingActive: boolean;
  isTimeTrackingPaused: boolean;
  timeTrackingElapsedSeconds: number;
  timeStats: TimeStats | null;
  
  // Pomodoro State
  pomodoroMode: 'focus' | 'shortBreak' | 'longBreak';
  pomodoroTimeLeft: number;
  pomodoroIsRunning: boolean;
  pomodoroSessionCount: number;
  pomodoroSettings: PomodoroSettings;
  pomodoroContext: TimerContextType | null;
  
  // Global State
  isLoading: boolean;
  error: string | null;
  isSynchronized: boolean; // When both timers are running together
}

// Action Interface
interface GlobalTimerActions {
  // Time Tracking Actions
  startTimeTracking: (params: {
    taskId?: string;
    eventId?: string;
    projectId?: string;
    description?: string;
    sessionType?: 'work' | 'break' | 'meeting' | 'planning';
  }) => Promise<void>;
  stopTimeTracking: () => Promise<void>;
  pauseTimeTracking: () => Promise<void>;
  resumeTimeTracking: () => Promise<void>;
  cancelTimeTracking: () => Promise<void>;
  refreshTimeStats: () => Promise<void>;
  
  // Pomodoro Actions
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroContext: (context: TimerContextType | null) => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  
  // Synchronized Actions
  startSynchronizedSession: (context: TimerContextType | null) => Promise<void>;
  stopAllTimers: () => Promise<void>;
  pauseAllTimers: () => Promise<void>;
  resumeAllTimers: () => Promise<void>;
}

// Context Type
interface GlobalTimerContextType extends GlobalTimerState, GlobalTimerActions {
  // Computed Values
  formattedTimeTrackingTime: string;
  formattedPomodoroTime: string;
  getCurrentContext: () => string;
  getStatusColor: () => string;
  getDisplayTime: () => string;
  hasActiveTimer: boolean;
}

// Default Pomodoro Settings
const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 1500, // 25 minutes
  shortBreak: 300, // 5 minutes
  longBreak: 900, // 15 minutes
  sessionsBeforeLongBreak: 4
};

// Storage Keys
const POMODORO_STORAGE_KEY = 'global-pomodoro-state';
const TIMER_SYNC_KEY = 'timer-sync-enabled';

// Create Context
const GlobalTimerContext = createContext<GlobalTimerContextType | undefined>(undefined);

// Helper Functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeTracking = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Load Pomodoro state from localStorage
const loadPomodoroState = (): Partial<PomodoroState> => {
  try {
    const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Calculate actual time left if timer was running
      if (parsed.isRunning && parsed.startTimestamp) {
        const now = Date.now();
        const elapsed = Math.floor((now - parsed.startTimestamp) / 1000);
        const actualTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
        
        return {
          ...parsed,
          timeLeft: actualTimeLeft,
          isRunning: actualTimeLeft > 0
        };
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading Pomodoro state:', error);
  }
  
  return {};
};

// Provider Component
export const GlobalTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Timer State
  const [activeTimeLog, setActiveTimeLog] = useState<TimeLog | null>(null);
  const [timeTrackingElapsedSeconds, setTimeTrackingElapsedSeconds] = useState(0);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  
  // Pomodoro State
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(DEFAULT_POMODORO_SETTINGS.focusDuration);
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [pomodoroContext, setPomodoroContext] = useState<TimerContextType | null>(null);
  
  // Global State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for intervals and timestamps
  const timeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pomodoroStartTimestampRef = useRef<number | null>(null);
  const lastPomodoroUpdateRef = useRef<number>(Date.now());
  
  const { toast } = useToast();

  // Computed Values
  const isTimeTrackingActive = activeTimeLog?.status === 'active';
  const isTimeTrackingPaused = activeTimeLog?.status === 'paused';
  const isSynchronized = isTimeTrackingActive && pomodoroIsRunning && pomodoroMode === 'focus';
  const hasActiveTimer = Boolean(activeTimeLog) || pomodoroIsRunning;
  
  const formattedTimeTrackingTime = formatTimeTracking(timeTrackingElapsedSeconds);
  const formattedPomodoroTime = formatTime(pomodoroTimeLeft);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // Load active time log
      try {
        const activeLog = await getActiveTimeLog();
        setActiveTimeLog(activeLog);
        if (activeLog && activeLog.status === 'active') {
          setTimeTrackingElapsedSeconds(calculateElapsedTime(activeLog.start_time));
        }
      } catch (error) {
        console.error('Error loading active time log:', error);
      }

      // Load Pomodoro state
      const savedPomodoroState = loadPomodoroState();
      if (Object.keys(savedPomodoroState).length > 0) {
        setPomodoroMode(savedPomodoroState.mode || 'focus');
        setPomodoroTimeLeft(savedPomodoroState.timeLeft || DEFAULT_POMODORO_SETTINGS.focusDuration);
        setPomodoroIsRunning(savedPomodoroState.isRunning || false);
        setPomodoroSessionCount(savedPomodoroState.sessionCount || 0);
        setPomodoroContext(savedPomodoroState.timerContext || null);
        setPomodoroSettings(savedPomodoroState.settings || DEFAULT_POMODORO_SETTINGS);
      }
      
      // Load time stats
      refreshTimeStats();
    };
    
    initialize();
  }, []);

  // Time Tracking Timer Effect
  useEffect(() => {
    if (isTimeTrackingActive) {
      timeTrackingIntervalRef.current = setInterval(() => {
        if (activeTimeLog) {
          setTimeTrackingElapsedSeconds(calculateElapsedTime(activeTimeLog.start_time));
        }
      }, 1000);
    } else {
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      }
    }

    return () => {
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      }
    };
  }, [isTimeTrackingActive, activeTimeLog]);

  // Pomodoro Timer Effect
  useEffect(() => {
    if (pomodoroIsRunning) {
      if (!pomodoroStartTimestampRef.current) {
        pomodoroStartTimestampRef.current = Date.now();
      }
      lastPomodoroUpdateRef.current = Date.now();
      
      pomodoroIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastPomodoroUpdateRef.current) / 1000);
        lastPomodoroUpdateRef.current = now;

        setPomodoroTimeLeft(prev => {
          const newTimeLeft = Math.max(0, prev - deltaSeconds);
          
          if (newTimeLeft === 0) {
            // Timer finished - handle in separate effect
            setPomodoroIsRunning(false);
          }
          
          return newTimeLeft;
        });
      }, 1000);
    } else {
      pomodoroStartTimestampRef.current = null;
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
        pomodoroIntervalRef.current = null;
      }
    }

    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
        pomodoroIntervalRef.current = null;
      }
    };
  }, [pomodoroIsRunning]);

  // Save Pomodoro state to localStorage
  useEffect(() => {
    const stateToSave = {
      mode: pomodoroMode,
      timeLeft: pomodoroTimeLeft,
      isRunning: pomodoroIsRunning,
      sessionCount: pomodoroSessionCount,
      timerContext: pomodoroContext,
      settings: pomodoroSettings,
      ...(pomodoroIsRunning && pomodoroStartTimestampRef.current && {
        startTimestamp: pomodoroStartTimestampRef.current
      })
    };
    
    try {
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving Pomodoro state:', error);
    }
  }, [pomodoroMode, pomodoroTimeLeft, pomodoroIsRunning, pomodoroSessionCount, pomodoroContext, pomodoroSettings]);

  // Handle Pomodoro session completion
  useEffect(() => {
    if (!pomodoroIsRunning && pomodoroTimeLeft === 0) {
      handlePomodoroSessionComplete();
    }
  }, [pomodoroIsRunning, pomodoroTimeLeft]);

  const handlePomodoroSessionComplete = () => {
    if (pomodoroMode === 'focus') {
      const newSessionCount = pomodoroSessionCount + 1;
      const shouldTakeLongBreak = newSessionCount % pomodoroSettings.sessionsBeforeLongBreak === 0;
      const newMode = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
      const newTimeLeft = shouldTakeLongBreak ? pomodoroSettings.longBreak : pomodoroSettings.shortBreak;
      
      setPomodoroMode(newMode);
      setPomodoroTimeLeft(newTimeLeft);
      setPomodoroSessionCount(newSessionCount);
      
      toast({
        title: "Focus session completed!",
        description: `Time for a ${shouldTakeLongBreak ? 'long' : 'short'} break`,
      });
    } else {
      // Break finished, switch to focus
      setPomodoroMode('focus');
      setPomodoroTimeLeft(pomodoroSettings.focusDuration);
      
      toast({
        title: "Break finished!",
        description: "Ready for another focus session?",
      });
    }
  };

  // Time Tracking Actions
  const startTimeTracking = useCallback(async (params: {
    taskId?: string;
    eventId?: string;
    projectId?: string;
    description?: string;
    sessionType?: 'work' | 'break' | 'meeting' | 'planning';
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const timeLog = await startTimeTrackingService({
        ...params,
        timerMode: 'manual'
      });
      
      setActiveTimeLog(timeLog);
      setTimeTrackingElapsedSeconds(0);
      
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

  const stopTimeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const completedLog = await stopTimeTrackingService();
      setActiveTimeLog(null);
      setTimeTrackingElapsedSeconds(0);
      
      await refreshTimeStats();
      
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

  const pauseTimeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const pausedLog = await pauseTimeTrackingService();
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

  const resumeTimeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const resumedLog = await resumeTimeTrackingService();
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

  const cancelTimeTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cancelTimeTrackingService();
      setActiveTimeLog(null);
      setTimeTrackingElapsedSeconds(0);
      
      toast({
        title: "Time tracking cancelled",
        description: "Session was cancelled and not saved",
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

  const refreshTimeStats = useCallback(async () => {
    try {
      const stats = await getTimeStats();
      setTimeStats(stats);
    } catch (error) {
      console.error('Error refreshing time stats:', error);
    }
  }, []);

  // Pomodoro Actions
  const startPomodoro = useCallback(() => {
    pomodoroStartTimestampRef.current = Date.now();
    setPomodoroIsRunning(true);
  }, []);

  const pausePomodoro = useCallback(() => {
    pomodoroStartTimestampRef.current = null;
    setPomodoroIsRunning(false);
  }, []);

  const resetPomodoro = useCallback(() => {
    pomodoroStartTimestampRef.current = null;
    setPomodoroIsRunning(false);
    setPomodoroMode('focus');
    setPomodoroTimeLeft(pomodoroSettings.focusDuration);
  }, [pomodoroSettings.focusDuration]);

  const setPomodoroContextCallback = useCallback((context: TimerContextType | null) => {
    setPomodoroContext(context);
  }, []);

  const updatePomodoroSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setPomodoroSettings(prev => ({ ...prev, ...newSettings }));
    
    // If currently in focus mode and not running, update time left
    if (pomodoroMode === 'focus' && !pomodoroIsRunning && newSettings.focusDuration) {
      setPomodoroTimeLeft(newSettings.focusDuration);
    }
  }, [pomodoroMode, pomodoroIsRunning]);

  // Synchronized Actions
  const startSynchronizedSession = useCallback(async (context: TimerContextType | null) => {
    try {
      // Set Pomodoro context first
      setPomodoroContext(context);
      
      // Start time tracking
      const trackingData = {
        description: context?.title || "Focus Session",
        sessionType: 'work' as const,
        ...(context?.type === 'task' && { taskId: context.id }),
        ...(context?.type === 'event' && { eventId: context.id }),
        ...(context?.type === 'project' && { projectId: context.id })
      };
      
      await startTimeTracking(trackingData);
      
      // Start Pomodoro timer
      if (pomodoroMode === 'focus') {
        startPomodoro();
      }
      
      toast({
        title: "Synchronized session started",
        description: `Tracking time for: ${context?.title || 'Focus Session'}`,
      });
    } catch (error) {
      console.error('Failed to start synchronized session:', error);
      toast({
        title: "Failed to start session",
        description: "Could not start synchronized timer session",
        variant: "destructive",
      });
    }
  }, [pomodoroMode, startTimeTracking, startPomodoro, toast]);

  const stopAllTimers = useCallback(async () => {
    try {
      // Stop time tracking if active
      if (activeTimeLog) {
        await stopTimeTracking();
      }
      
      // Reset Pomodoro timer
      resetPomodoro();
      
      toast({
        title: "All timers stopped",
        description: "Timer session ended",
      });
    } catch (error) {
      console.error('Failed to stop all timers:', error);
    }
  }, [activeTimeLog, stopTimeTracking, resetPomodoro, toast]);

  const pauseAllTimers = useCallback(async () => {
    try {
      // Pause time tracking if active
      if (isTimeTrackingActive) {
        await pauseTimeTracking();
      }
      
      // Pause Pomodoro if running
      if (pomodoroIsRunning) {
        pausePomodoro();
      }
      
      toast({
        title: "Timers paused",
        description: "You can resume anytime",
      });
    } catch (error) {
      console.error('Failed to pause all timers:', error);
    }
  }, [isTimeTrackingActive, pauseTimeTracking, pomodoroIsRunning, pausePomodoro, toast]);

  const resumeAllTimers = useCallback(async () => {
    try {
      // Resume time tracking if paused
      if (isTimeTrackingPaused) {
        await resumeTimeTracking();
      }
      
      // Resume Pomodoro if in focus mode
      if (!pomodoroIsRunning && pomodoroMode === 'focus') {
        startPomodoro();
      }
      
      toast({
        title: "Timers resumed",
        description: "Continuing your session",
      });
    } catch (error) {
      console.error('Failed to resume all timers:', error);
    }
  }, [isTimeTrackingPaused, resumeTimeTracking, pomodoroIsRunning, pomodoroMode, startPomodoro, toast]);

  // Computed Helper Functions
  const getCurrentContext = useCallback((): string => {
    if (isSynchronized && pomodoroContext) {
      return pomodoroContext.title;
    }
    
    if (activeTimeLog) {
      if (activeTimeLog.task_id) {
        return activeTimeLog.description || 'Task';
      }
      if (activeTimeLog.project_id) {
        return activeTimeLog.description || 'Project';
      }
      if (activeTimeLog.event_id) {
        return activeTimeLog.description || 'Event';
      }
      return activeTimeLog.description || 'Timer Session';
    }
    
    if (pomodoroIsRunning && pomodoroContext) {
      return pomodoroContext.title;
    }
    
    if (pomodoroIsRunning) {
      return pomodoroMode === 'focus' ? 'Focus Session' : 
             pomodoroMode === 'shortBreak' ? 'Short Break' : 'Long Break';
    }
    
    return 'Timer';
  }, [isSynchronized, pomodoroContext, activeTimeLog, pomodoroIsRunning, pomodoroMode]);

  const getStatusColor = useCallback((): string => {
    if (isSynchronized) {
      if (isTimeTrackingPaused) return 'bg-orange-500';
      return 'bg-blue-500'; // Focus mode
    }
    
    if (activeTimeLog) {
      if (isTimeTrackingPaused) return 'bg-orange-500';
      if (isTimeTrackingActive) return 'bg-green-500';
      return 'bg-gray-500';
    }
    
    if (pomodoroIsRunning) {
      if (pomodoroMode === 'focus') return 'bg-blue-500';
      return 'bg-green-500'; // Break
    }
    
    return 'bg-gray-500';
  }, [isSynchronized, isTimeTrackingPaused, isTimeTrackingActive, activeTimeLog, pomodoroIsRunning, pomodoroMode]);

  const getDisplayTime = useCallback((): string => {
    if (isSynchronized) {
      return formattedTimeTrackingTime;
    }
    
    if (activeTimeLog) {
      return formattedTimeTrackingTime;
    }
    
    if (pomodoroIsRunning) {
      return formattedPomodoroTime;
    }
    
    return '0:00';
  }, [isSynchronized, activeTimeLog, formattedTimeTrackingTime, pomodoroIsRunning, formattedPomodoroTime]);

  const contextValue: GlobalTimerContextType = {
    // State
    activeTimeLog,
    isTimeTrackingActive,
    isTimeTrackingPaused,
    timeTrackingElapsedSeconds,
    timeStats,
    pomodoroMode,
    pomodoroTimeLeft,
    pomodoroIsRunning,
    pomodoroSessionCount,
    pomodoroSettings,
    pomodoroContext,
    isLoading,
    error,
    isSynchronized,
    
    // Computed
    formattedTimeTrackingTime,
    formattedPomodoroTime,
    getCurrentContext,
    getStatusColor,
    getDisplayTime,
    hasActiveTimer,
    
    // Actions
    startTimeTracking,
    stopTimeTracking,
    pauseTimeTracking,
    resumeTimeTracking,
    cancelTimeTracking,
    refreshTimeStats,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroContext: setPomodoroContextCallback,
    updatePomodoroSettings,
    startSynchronizedSession,
    stopAllTimers,
    pauseAllTimers,
    resumeAllTimers
  };

  return (
    <GlobalTimerContext.Provider value={contextValue}>
      {children}
    </GlobalTimerContext.Provider>
  );
};

// Hook to use the Global Timer Context
export const useGlobalTimer = (): GlobalTimerContextType => {
  const context = useContext(GlobalTimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a GlobalTimerProvider');
  }
  return context;
};

export default GlobalTimerProvider; 