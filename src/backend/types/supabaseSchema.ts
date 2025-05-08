// Define database schema types
import { Database } from '@/integrations/supabase/types';

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
}

// Make sure Event interface matches the database schema
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
}

// Helper type to extract event type from Database
export type DatabaseEvent = Database['public']['Tables']['events']['Row'];
export type DatabaseEventInsert = Database['public']['Tables']['events']['Insert'];
export type DatabaseEventUpdate = Database['public']['Tables']['events']['Update'];

// Helper function to check if an object is a database event
export function isDatabaseEvent(obj: any): obj is DatabaseEvent {
  return obj && typeof obj === 'object' && 'id' in obj;
}
