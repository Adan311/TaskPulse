
// Define database schema types

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

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  project?: string;
  user: string; // Changed from user_id to user to match the database
  google_event_id?: string;
  source?: 'app' | 'google';
  created_at: string;
  updated_at: string;
}
