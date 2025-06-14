import { supabase } from "../../database/client";
import { Task } from '@/backend/database/schema';
import { Event } from '@/frontend/types/calendar';
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

// Type for reminders
export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  type: 'task' | 'event';
  reminderAt: string;
  entityData: Task | Event;
}

/**
 * Check for pending reminders that need to be sent
 * This should be called by a background process or polling mechanism
 */
export const checkPendingReminders = async (): Promise<Reminder[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user found when checking reminders");
      return [];
    }
    
    const now = new Date().toISOString();
    
    // Check for pending task reminders
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user', user.id)
      .eq('reminder_sent', false)
      .lte('reminder_at', now)
      .is('archived', false);
    
    if (tasksError) {
      console.error('Error fetching task reminders:', tasksError);
      throw tasksError;
    }
    
    // Check for pending event reminders
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user', user.id)
      .eq('reminder_sent', false)
      .lte('reminder_at', now);
    
    if (eventsError) {
      console.error('Error fetching event reminders:', eventsError);
      throw eventsError;
    }
    
    // Convert tasks to Reminders
    const taskReminders: Reminder[] = (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: 'task' as const,
      reminderAt: task.reminder_at,
      entityData: task
    }));
    
    // Convert events to Reminders
    const eventReminders: Reminder[] = (events || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: 'event' as const,
      reminderAt: event.reminder_at,
      entityData: {
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.start_time,
        endTime: event.end_time,
        color: event.color,
        project: event.project,
        participants: []
      }
    }));
    
    return [...taskReminders, ...eventReminders];
  } catch (error) {
    console.error('Error checking pending reminders:', error);
    throw error;
  }
};

/**
 * Mark a reminder as sent to avoid duplicate notifications
 */
export const markReminderAsSent = async (reminderId: string, type: 'task' | 'event'): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user found when marking reminder as sent");
      return;
    }
    
    const table = type === 'task' ? 'tasks' : 'events';
    
    const { error } = await supabase
      .from(table)
      .update({ reminder_sent: true })
      .eq('id', reminderId)
      .eq('user', user.id);
    
    if (error) {
      console.error(`Error marking ${type} reminder as sent:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markReminderAsSent:', error);
    throw error;
  }
};

/**
 * Set or update a reminder for a task
 */
export const setTaskReminder = async (taskId: string, reminderAt: string | null): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user found when setting task reminder");
      return;
    }
    
    const updates = reminderAt 
      ? { reminder_at: reminderAt, reminder_sent: false }
      : { reminder_at: null, reminder_sent: false };
    
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user', user.id);
    
    if (error) {
      console.error('Error setting task reminder:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in setTaskReminder:', error);
    throw error;
  }
};

/**
 * Set or update a reminder for an event
 */
export const setEventReminder = async (eventId: string, reminderAt: string | null): Promise<void> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user found when setting event reminder");
      return;
    }
    
    const updates = reminderAt 
      ? { reminder_at: reminderAt, reminder_sent: false }
      : { reminder_at: null, reminder_sent: false };
    
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('user', user.id);
    
    if (error) {
      console.error('Error setting event reminder:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in setEventReminder:', error);
    throw error;
  }
}; 