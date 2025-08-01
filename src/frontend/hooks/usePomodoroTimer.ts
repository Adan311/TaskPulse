import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerContext } from '@/frontend/features/timer/components/TimerContextSelector';

export interface PomodoroSettings {
  focusDuration: number; // in seconds
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

export interface PomodoroState {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  timeLeft: number; // in seconds
  isRunning: boolean;
  sessionCount: number;
  timerContext: TimerContext | null;
  settings: PomodoroSettings;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 1500, // 25 minutes
  shortBreak: 300, // 5 minutes
  longBreak: 900, // 15 minutes
  sessionsBeforeLongBreak: 4
};

const STORAGE_KEY = 'pomodoro-timer-state';

// Enhanced state interface for better persistence
interface StoredPomodoroState extends PomodoroState {
  startTimestamp?: number; // When the timer was started
  pausedAt?: number; // When the timer was paused
}

// Load initial state from localStorage with proper time calculation
const loadInitialState = (): PomodoroState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: StoredPomodoroState = JSON.parse(saved);
      
      // Calculate actual time left if timer was running
      if (parsed.isRunning && parsed.startTimestamp) {
        const now = Date.now();
        const elapsed = Math.floor((now - parsed.startTimestamp) / 1000);
        const actualTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
        
        return {
          mode: parsed.mode || 'focus',
          timeLeft: actualTimeLeft,
          isRunning: actualTimeLeft > 0 ? true : false, // Keep running if time remains
          sessionCount: parsed.sessionCount || 0,
          timerContext: parsed.timerContext || null,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
        };
      }
      
      // Timer was paused or stopped
      return {
        mode: parsed.mode || 'focus',
        timeLeft: parsed.timeLeft || DEFAULT_SETTINGS.focusDuration,
        isRunning: false,
        sessionCount: parsed.sessionCount || 0,
        timerContext: parsed.timerContext || null,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
      };
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
  
  return {
    mode: 'focus',
    timeLeft: DEFAULT_SETTINGS.focusDuration,
    isRunning: false,
    sessionCount: 0,
    timerContext: null,
    settings: DEFAULT_SETTINGS
  };
};

export const usePomodoroTimer = () => {
  const [state, setState] = useState<PomodoroState>(loadInitialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const startTimestampRef = useRef<number | null>(null);

  // Initialize start timestamp if timer was loaded as running
  useEffect(() => {
    if (state.isRunning && !startTimestampRef.current) {
      startTimestampRef.current = Date.now();
    }
  }, [state.isRunning]);

  // Save state to localStorage whenever it changes with proper timestamps
  useEffect(() => {
    try {
      const stateToSave: StoredPomodoroState = {
        ...state,
        ...(state.isRunning && startTimestampRef.current && {
          startTimestamp: startTimestampRef.current
        })
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, [state]);

  // Timer interval effect
  useEffect(() => {
    if (state.isRunning) {
      lastUpdateRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastUpdateRef.current) / 1000);
        lastUpdateRef.current = now;

        setState(prevState => {
          const newTimeLeft = Math.max(0, prevState.timeLeft - deltaSeconds);
          
          if (newTimeLeft === 0) {
            // Timer finished
            return {
              ...prevState,
              timeLeft: 0,
              isRunning: false
            };
          }
          
          return {
            ...prevState,
            timeLeft: newTimeLeft
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning]);

  // Handle session transitions when timer reaches 0
  useEffect(() => {
    if (!state.isRunning && state.timeLeft === 0) {
      handleSessionComplete();
    }
  }, [state.isRunning, state.timeLeft]);

  const handleSessionComplete = () => {
    setState(prevState => {
      if (prevState.mode === 'focus') {
        const newSessionCount = prevState.sessionCount + 1;
        const shouldTakeLongBreak = newSessionCount % prevState.settings.sessionsBeforeLongBreak === 0;
        const newMode = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
        const newTimeLeft = shouldTakeLongBreak ? prevState.settings.longBreak : prevState.settings.shortBreak;
        
        return {
          ...prevState,
          mode: newMode,
          timeLeft: newTimeLeft,
          sessionCount: newSessionCount,
          isRunning: false
        };
      } else {
        // Break finished, switch to focus
        return {
          ...prevState,
          mode: 'focus',
          timeLeft: prevState.settings.focusDuration,
          isRunning: false
        };
      }
    });
  };

  const start = useCallback(() => {
    startTimestampRef.current = Date.now();
    setState(prevState => ({
      ...prevState,
      isRunning: true
    }));
  }, []);

  const pause = useCallback(() => {
    startTimestampRef.current = null;
    setState(prevState => ({
      ...prevState,
      isRunning: false
    }));
  }, []);

  const reset = useCallback(() => {
    startTimestampRef.current = null;
    setState(prevState => {
      const currentDuration = getCurrentDuration(prevState.mode, prevState.settings);
      return {
        ...prevState,
        timeLeft: currentDuration,
        isRunning: false
      };
    });
  }, []);

  const switchMode = useCallback((newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setState(prevState => {
      const newTimeLeft = getCurrentDuration(newMode, prevState.settings);
      return {
        ...prevState,
        mode: newMode,
        timeLeft: newTimeLeft,
        isRunning: false
      };
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setState(prevState => {
      const updatedSettings = { ...prevState.settings, ...newSettings };
      const newTimeLeft = getCurrentDuration(prevState.mode, updatedSettings);
      
      return {
        ...prevState,
        settings: updatedSettings,
        timeLeft: prevState.isRunning ? prevState.timeLeft : newTimeLeft
      };
    });
  }, []);

  const setTimerContext = useCallback((context: TimerContext | null) => {
    setState(prevState => ({
      ...prevState,
      timerContext: context
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      sessionCount: 0,
      mode: 'focus',
      timeLeft: prevState.settings.focusDuration,
      isRunning: false
    }));
  }, []);

  // Utility functions
  const getCurrentDuration = (mode: string, settings: PomodoroSettings): number => {
    switch (mode) {
      case 'focus': return settings.focusDuration;
      case 'shortBreak': return settings.shortBreak;
      case 'longBreak': return settings.longBreak;
      default: return settings.focusDuration;
    }
  };

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getDisplayModeText = useCallback(() => {
    if (state.timerContext?.sessionType === 'break') return "Break";
    if (state.mode === "shortBreak") return "Short Break";
    if (state.mode === "longBreak") return "Long Break";
    if (state.timerContext?.sessionType === 'meeting') return "Meeting";
    if (state.timerContext?.sessionType === 'planning') return "Planning";
    return "Focus";
  }, [state.mode, state.timerContext]);

  const getSessionDescription = useCallback(() => {
    if (state.timerContext) {
      return state.timerContext.title;
    }
    switch (state.mode) {
      case 'focus': return "Focus Session";
      case 'shortBreak': return "Short Break";
      case 'longBreak': return "Long Break";
      default: return "Focus Session";
    }
  }, [state.mode, state.timerContext]);

  const progressValue = (state.timeLeft / getCurrentDuration(state.mode, state.settings)) * 100;

  return {
    // State
    mode: state.mode,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    sessionCount: state.sessionCount,
    timerContext: state.timerContext,
    settings: state.settings,
    
    // Actions
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    setTimerContext,
    resetSession,
    
    // Computed values
    formattedTime: formatTime(state.timeLeft),
    displayModeText: getDisplayModeText(),
    sessionDescription: getSessionDescription(),
    progressValue,
    currentDuration: getCurrentDuration(state.mode, state.settings),
    
    // Utilities
    formatTime
  };
}; 