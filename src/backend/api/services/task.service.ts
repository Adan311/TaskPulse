import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/types/supabaseSchema';

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

export const fetchProjectTasks = async (projectId: string): Promise<Task[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching tasks");
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project", projectId)
    .eq("user", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data || [];
};

export const createTask = async (task: Omit<Task, "id" | "user" | "created_at" | "updated_at">): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create tasks");
  }

  const newTask = {
    id: uuidv4(),
    ...task,
    user: user.id,
    archived: false,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert([newTask])
    .select();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create task");
  }

  return data[0];
};

export const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id" | "user" | "created_at">>): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to update tasks");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user", user.id)
    .select();

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to update task or task not found");
  }

  return data[0];
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to delete tasks");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user", user.id);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }

  return true;
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
      .update(updates)
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
      .update(updates)
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
      .update(updates)
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
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
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
      .update(updates)
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
