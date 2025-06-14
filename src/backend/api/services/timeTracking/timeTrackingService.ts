import { supabase } from '../../../database/client';
import { v4 as uuidv4 } from 'uuid';
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

export interface TimeLog {
  id: string;
  user_id: string;
  task_id?: string | null;
  event_id?: string | null;
  project_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number | null;
  description?: string | null;
  session_type: 'work' | 'break' | 'meeting' | 'planning';
  timer_mode: 'manual' | 'pomodoro' | 'continuous';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TimeLogFilters {
  taskId?: string;
  projectId?: string;
  eventId?: string;
  startDate?: Date;
  endDate?: Date;
  sessionType?: string;
  status?: string;
}

export interface TimeStats {
  totalMinutes: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  averageSessionMinutes: number;
  totalSessions: number;
}

/**
 * Start a new time tracking session
 */
export const startTimeTracking = async (params: {
  taskId?: string;
  eventId?: string;
  projectId?: string;
  description?: string;
  sessionType?: 'work' | 'break' | 'meeting' | 'planning';
  timerMode?: 'manual' | 'pomodoro' | 'continuous';
}): Promise<TimeLog> => {
  try {
    const user = await validateUser();

    // Check if there are ANY active sessions (improved duplicate prevention)
    const { data: activeSessions, error: checkError } = await supabase
      .from('time_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (checkError) throw checkError;
    
    if (activeSessions && activeSessions.length > 0) {
      throw new Error("There is already an active time tracking session. Please stop it first.");
    }

    const newTimeLog = {
      id: uuidv4(),
      user_id: user.id,
      task_id: params.taskId || null,
      event_id: params.eventId || null,
      project_id: params.projectId || null,
      start_time: new Date().toISOString(),
      description: params.description || null,
      session_type: params.sessionType || 'work',
      timer_mode: params.timerMode || 'manual',
      status: 'active' as const,
    };

    const { data, error } = await supabase
      .from('time_logs')
      .insert([newTimeLog])
      .select()
      .single();

    if (error) throw error;
    return data as TimeLog;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
};

/**
 * Get the currently active time log for the user
 */
export const getActiveTimeLog = async (): Promise<TimeLog | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    // Return the most recent active session or null if none exists
    return data && data.length > 0 ? data[0] as TimeLog : null;
  } catch (error) {
    console.error('Error getting active time log:', error);
    return null;
  }
};

/**
 * Pause the active time tracking session
 */
export const pauseTimeTracking = async (): Promise<TimeLog> => {
  try {
    const user = await validateUser();

    // First, get the most recent active session
    const { data: activeSessions, error: selectError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1);

    if (selectError) throw selectError;
    
    if (!activeSessions || activeSessions.length === 0) {
      throw new Error("No active time tracking sessions found");
    }

    const sessionToPause = activeSessions[0];

    // Update all active sessions to paused (to clean up duplicates)
    const { data, error } = await supabase
      .from('time_logs')
      .update({ status: 'paused' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select();

    if (error) throw error;

    // Return the most recent session that was paused
    return {
      ...sessionToPause,
      status: 'paused'
    } as TimeLog;
  } catch (error) {
    console.error('Error pausing time tracking:', error);
    throw error;
  }
};

/**
 * Resume a paused time tracking session
 */
export const resumeTimeTracking = async (): Promise<TimeLog> => {
  try {
    const user = await validateUser();

    // First, get the most recent paused session
    const { data: pausedSessions, error: selectError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'paused')
      .order('start_time', { ascending: false })
      .limit(1);

    if (selectError) throw selectError;
    
    if (!pausedSessions || pausedSessions.length === 0) {
      throw new Error("No paused time tracking sessions found");
    }

    const sessionToResume = pausedSessions[0];

    // Update the most recent paused session to active
    const { data, error } = await supabase
      .from('time_logs')
      .update({ status: 'active' })
      .eq('id', sessionToResume.id)
      .select()
      .single();

    if (error) throw error;
    return data as TimeLog;
  } catch (error) {
    console.error('Error resuming time tracking:', error);
    throw error;
  }
};

/**
 * Stop the active time tracking session
 */
export const stopTimeTracking = async (): Promise<TimeLog> => {
  try {
    const user = await validateUser();

    const endTime = new Date().toISOString();

    // First, get all active/paused sessions
    const { data: sessionsToStop, error: selectError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('start_time', { ascending: false });

    if (selectError) throw selectError;
    
    if (!sessionsToStop || sessionsToStop.length === 0) {
      throw new Error("No active or paused time tracking sessions found");
    }

    // Update all active/paused sessions to completed
    const { data, error } = await supabase
      .from('time_logs')
      .update({ 
        status: 'completed',
        end_time: endTime
      })
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .select();

    if (error) throw error;

    // Return the most recent session (first in the ordered list)
    const mostRecentSession = sessionsToStop[0];
    
    // Calculate duration for the returned session
    const startTime = new Date(mostRecentSession.start_time);
    const endTimeDate = new Date(endTime);
    const durationSeconds = Math.floor((endTimeDate.getTime() - startTime.getTime()) / 1000);

    return {
      ...mostRecentSession,
      status: 'completed',
      end_time: endTime,
      duration_seconds: durationSeconds
    } as TimeLog;
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    throw error;
  }
};

/**
 * Cancel the active time tracking session
 */
export const cancelTimeTracking = async (): Promise<void> => {
  try {
    const user = await validateUser();

    const { error } = await supabase
      .from('time_logs')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .in('status', ['active', 'paused']);

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling time tracking:', error);
    throw error;
  }
};

/**
 * Get time logs with optional filters
 */
export const getTimeLogs = async (filters?: TimeLogFilters): Promise<TimeLog[]> => {
  try {
    const user = await validateUser();

    let query = supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id);

    if (filters) {
      if (filters.taskId) query = query.eq('task_id', filters.taskId);
      if (filters.projectId) query = query.eq('project_id', filters.projectId);
      if (filters.eventId) query = query.eq('event_id', filters.eventId);
      if (filters.sessionType) query = query.eq('session_type', filters.sessionType);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate.toISOString());
      }
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) throw error;
    return (data || []) as TimeLog[];
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw error;
  }
};

/**
 * Get time statistics for the user
 */
export const getTimeStats = async (filters?: TimeLogFilters): Promise<TimeStats> => {
  try {
    const user = await validateUser();

    // Get all completed time logs for calculations
    const timeLogs = await getTimeLogs({ 
      ...filters, 
      status: 'completed' 
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
    
    const todayMinutes = timeLogs
      .filter(log => new Date(log.start_time) >= todayStart)
      .reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
    
    const weekMinutes = timeLogs
      .filter(log => new Date(log.start_time) >= weekStart)
      .reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
    
    const monthMinutes = timeLogs
      .filter(log => new Date(log.start_time) >= monthStart)
      .reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);

    const totalSessions = timeLogs.length;
    const averageSessionMinutes = totalSessions > 0 ? totalMinutes / totalSessions : 0;

    return {
      totalMinutes: Math.round(totalMinutes),
      todayMinutes: Math.round(todayMinutes),
      weekMinutes: Math.round(weekMinutes),
      monthMinutes: Math.round(monthMinutes),
      averageSessionMinutes: Math.round(averageSessionMinutes),
      totalSessions
    };
  } catch (error) {
    console.error('Error getting time stats:', error);
    throw error;
  }
};

/**
 * Update a time log entry
 */
export const updateTimeLog = async (
  timeLogId: string, 
  updates: Partial<Pick<TimeLog, 'description' | 'session_type' | 'end_time'>>
): Promise<TimeLog> => {
  try {
    const user = await validateUser();

    const { data, error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', timeLogId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as TimeLog;
  } catch (error) {
    console.error('Error updating time log:', error);
    throw error;
  }
};

/**
 * Delete a time log entry
 */
export const deleteTimeLog = async (timeLogId: string): Promise<void> => {
  try {
    const user = await validateUser();

    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', timeLogId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting time log:', error);
    throw error;
  }
};

/**
 * Get time logs for a specific project
 */
export const getProjectTimeLogs = async (projectId: string): Promise<TimeLog[]> => {
  try {
    const user = await validateUser();

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project time logs:', error);
    throw error;
  }
};

/**
 * Get time logs for a specific task
 */
export const getTaskTimeLogs = async (taskId: string): Promise<TimeLog[]> => {
  try {
    const user = await validateUser();

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    throw error;
  }
};

/**
 * Get time logs for a specific event
 */
export const getEventTimeLogs = async (eventId: string): Promise<TimeLog[]> => {
  try {
    const user = await validateUser();

    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching event time logs:', error);
    throw error;
  }
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate elapsed time for an active session
 */
export const calculateElapsedTime = (startTime: string): number => {
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 1000);
};

/**
 * Get time statistics for a specific project
 */
export const getProjectTimeStats = async (projectId: string): Promise<{
  totalMinutes: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  thisWeekMinutes: number;
}> => {
  try {
    const user = await validateUser();

    const timeLogs = await getProjectTimeLogs(projectId);
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
    const thisWeekMinutes = timeLogs
      .filter(log => new Date(log.start_time) >= weekStart)
      .reduce((sum, log) => sum + (log.duration_seconds || 0) / 60, 0);
    
    const sessionsCount = timeLogs.length;
    const averageSessionMinutes = sessionsCount > 0 ? totalMinutes / sessionsCount : 0;

    return {
      totalMinutes: Math.round(totalMinutes),
      sessionsCount,
      averageSessionMinutes: Math.round(averageSessionMinutes),
      thisWeekMinutes: Math.round(thisWeekMinutes)
    };
  } catch (error) {
    console.error('Error getting project time stats:', error);
    throw error;
  }
};

/**
 * Get analytics breakdown by session type
 */
export const getTimeAnalyticsByType = async (days: number = 7): Promise<{
  work: number;
  break: number;
  meeting: number;
  planning: number;
}> => {
  try {
    const user = await validateUser();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('time_logs')
      .select('session_type, duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', cutoffDate.toISOString())
      .not('end_time', 'is', null);

    if (error) throw error;

    const analytics = {
      work: 0,
      break: 0,
      meeting: 0,
      planning: 0
    };

    data?.forEach(log => {
      const minutes = Math.floor(log.duration_seconds / 60);
      switch (log.session_type) {
        case 'work':
          analytics.work += minutes;
          break;
        case 'break':
          analytics.break += minutes;
          break;
        case 'meeting':
          analytics.meeting += minutes;
          break;
        case 'planning':
          analytics.planning += minutes;
          break;
      }
    });

    return analytics;
  } catch (error) {
    console.error('Error fetching time analytics by type:', error);
    throw error;
  }
};

/**
 * Get productivity insights for dashboard
 */
export const getProductivityInsights = async (): Promise<{
  totalHoursToday: number;
  totalHoursWeek: number;
  averageSessionMinutes: number;
  mostProductiveTimeSlot: string;
  taskCompletionRate: number;
}> => {
  try {
    const user = await validateUser();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get time logs for the week
    const { data: weekLogs, error: weekError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString())
      .not('end_time', 'is', null);

    if (weekError) throw weekError;

    // Get time logs for today
    const { data: todayLogs, error: todayError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .not('end_time', 'is', null);

    if (todayError) throw todayError;

    // Calculate metrics
    const totalSecondsToday = todayLogs?.reduce((sum, log) => sum + log.duration_seconds, 0) || 0;
    const totalSecondsWeek = weekLogs?.reduce((sum, log) => sum + log.duration_seconds, 0) || 0;
    
    const totalHoursToday = totalSecondsToday / 3600;
    const totalHoursWeek = totalSecondsWeek / 3600;
    
    const averageSessionMinutes = weekLogs?.length 
      ? Math.round((totalSecondsWeek / weekLogs.length) / 60)
      : 0;

    // Find most productive time slot (simplified)
    const hourCounts: { [hour: number]: number } = {};
    weekLogs?.forEach(log => {
      if (log.start_time) {
        const hour = new Date(log.start_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + log.duration_seconds;
      }
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const mostProductiveTimeSlot = mostProductiveHour 
      ? `${mostProductiveHour}:00 - ${parseInt(mostProductiveHour) + 1}:00`
      : 'N/A';

    // Calculate task completion rate from time logs
    // This provides a productivity estimate based on completed sessions
    const completedSessions = weekLogs?.filter(log => log.status === 'completed').length || 0;
    const totalSessions = weekLogs?.length || 0;
    const taskCompletionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      totalHoursToday,
      totalHoursWeek,
      averageSessionMinutes,
      mostProductiveTimeSlot,
      taskCompletionRate
    };
  } catch (error) {
    console.error('Error fetching productivity insights:', error);
    throw error;
  }
}; 