// Application-specific schema interfaces that extend auto-generated database types
import { Database } from './types';

// Re-export Database type for convenience
export type { Database };

// Helper type to extract event type from Database
export type DatabaseEvent = Database['public']['Tables']['events']['Row'];
export type DatabaseEventInsert = Database['public']['Tables']['events']['Insert'];
export type DatabaseEventUpdate = Database['public']['Tables']['events']['Update'];

// Helper function to check if an object is a database event
export function isDatabaseEvent(obj: any): obj is DatabaseEvent {
  return obj && typeof obj === 'object' && 'id' in obj;
}

// Application-specific interfaces for better type safety and business logic
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'done' | null;
  priority: 'low' | 'medium' | 'high' | null;
  due_date?: string | null;
  project?: string | null;
  user?: string | null;
  archived?: boolean | null;
  completion_date?: string | null;
  labels?: string[] | null;
  parent_task_id?: string | null;
  last_updated_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reminder_at?: string | null;
  reminder_sent?: boolean | null;
  // Time tracking fields
  estimated_time_minutes?: number | null;
  total_time_logged_minutes?: number | null;
  // Recurrence fields
  is_recurring?: boolean | null;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrence_days?: string[] | null; // Days of the week for weekly recurrence
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  parent_id?: string | null; // Link to parent recurring task
  recurrence_mode?: 'clone' | 'refresh' | null; // Whether to create new tasks or refresh the existing one
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status: 'active' | 'completed' | 'on-hold';
  due_date?: string | null;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  user: string;
  created_at?: string;
  updated_at?: string;
  auto_progress?: boolean;
  manual_progress?: number | null;
  // Time tracking fields
  estimated_time_hours?: number | null;
  total_time_logged_hours?: number | null;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  color?: string | null;
  project?: string | null;
  user: string; // Changed from user_id to user to match the database
  google_event_id?: string | null;
  source?: 'app' | 'google' | null;
  created_at?: string;
  updated_at?: string;
  reminder_at?: string | null;
  reminder_sent?: boolean | null;

  // Recurrence fields
  is_recurring?: boolean | null;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrence_days?: string[] | null; // Days of the week for weekly recurrence
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  parent_id?: string | null; // Link to parent recurring event
} 