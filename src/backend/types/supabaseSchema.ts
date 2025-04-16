
// Define database schema types
import { Database } from '@/integrations/supabase/types';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  project?: string | null;
  user: string; // Changed from user_id to user to match the database
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
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
