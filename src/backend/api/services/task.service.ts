import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  user: string;
  project?: string;
  created_at?: string;
  due_date?: string;
  archived?: boolean;
  completion_date?: string;
  labels?: string[];
  parent_task_id?: string;
  last_updated_at?: string;
}

export const fetchTasks = async (filters?: TaskFilters) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user', user.id);

    if (filters) {
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end.toISOString());
      }
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }
      if (!filters.showArchived) {
        query = query.eq('archived', false);
      }
    } else {
      query = query.eq('archived', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData: Omit<Task, "id" | "user" | "created_at" | "archived" | "last_updated_at">) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      user: user.id,
      created_at: now,
      archived: false,
      last_updated_at: now,
      ...taskData,
    };
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskData: Partial<Task> & { id: string }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const updates = {
      ...taskData,
      last_updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('id', taskData.id)
      .eq('user', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user', user.id);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const updates: Partial<Task> = {
      status,
      completion_date: status === 'done' ? new Date().toISOString() : null,
      last_updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('id', taskId)
      .eq('user', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const archiveTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const updates = {
      archived: true,
      last_updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('id', taskId)
      .eq('user', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Error archiving task:', error);
    throw error;
  }
};

export const bulkArchiveTasks = async (taskIds: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const updates = {
      archived: true,
      last_updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .in('id', taskIds)
      .eq('user', user.id)
      .select();
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error('Error bulk archiving tasks:', error);
    throw error;
  }
};

export const autoArchiveOldTasks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const updates = {
      archived: true,
      last_updated_at: new Date().toISOString(),
    };
    // @ts-ignore
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('user', user.id)
      .eq('status', 'done')
      .lt('completion_date', thirtyDaysAgo.toISOString())
      .eq('archived', false)
      .select();
    if (error) throw error;
    return data as Task[];
  } catch (error) {
    console.error('Error auto-archiving old tasks:', error);
    throw error;
  }
};

export const restoreTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const updates = {
      archived: false,
      last_updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('id', taskId)
      .eq('user', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Error restoring task:', error);
    throw error;
  }
};

export const deleteTaskPermanently = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user', user.id);
    if (error) throw error;
  } catch (error) {
    console.error('Error permanently deleting task:', error);
    throw error;
  }
};
