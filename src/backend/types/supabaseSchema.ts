
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id'>;
        Update: Partial<Task>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id'>;
        Update: Partial<Project>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id'>;
        Update: Partial<Event>;
      };
    };
  };
}

// Unified Task interface to be used throughout the application
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  project?: string | null;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | string | null;
  user?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  user: string;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  color?: string;
  project_id?: string;
  user_id: string;
}
