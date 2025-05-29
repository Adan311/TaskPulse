import { startTimeTracking, stopTimeTracking, getActiveTimeLog, TimeLog } from './timeTrackingService';

export interface TimerSession {
  taskId?: string;
  projectId?: string;
  description?: string;
  sessionType: 'work' | 'break' | 'meeting' | 'planning';
}

/**
 * Start a timer session with time tracking
 */
export const startTimerSession = async (session: TimerSession): Promise<TimeLog> => {
  try {
    return await startTimeTracking({
      taskId: session.taskId,
      projectId: session.projectId,
      description: session.description,
      sessionType: session.sessionType,
      timerMode: 'pomodoro'
    });
  } catch (error) {
    console.error('Error starting timer session:', error);
    throw error;
  }
};

/**
 * Complete a timer session and save time log
 */
export const completeTimerSession = async (): Promise<TimeLog | null> => {
  try {
    const activeSession = await getActiveTimeLog();
    if (!activeSession) {
      console.warn('No active timer session to complete');
      return null;
    }

    return await stopTimeTracking();
  } catch (error) {
    console.error('Error completing timer session:', error);
    throw error;
  }
};

/**
 * Get the current active timer session
 */
export const getCurrentTimerSession = async (): Promise<TimeLog | null> => {
  try {
    return await getActiveTimeLog();
  } catch (error) {
    console.error('Error getting current timer session:', error);
    return null;
  }
};

/**
 * Check if there's an active timer session
 */
export const hasActiveTimerSession = async (): Promise<boolean> => {
  try {
    const activeSession = await getActiveTimeLog();
    return activeSession !== null;
  } catch (error) {
    console.error('Error checking active timer session:', error);
    return false;
  }
}; 