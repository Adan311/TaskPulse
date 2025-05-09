import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/types/supabaseSchema';
import { Database } from '@/integrations/supabase/types';
import { updateProjectProgressOnTaskChange } from "./project.service";

type DbTask = Database['public']['Tables']['tasks']['Row'];

const mapDbTaskToTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  status: dbTask.status as Task['status'],
  priority: dbTask.priority as Task['priority'],
  due_date: dbTask.due_date,
  project: dbTask.project,
  user: dbTask.user,
  archived: dbTask.archived || false,
  completion_date: dbTask.completion_date,
  labels: dbTask.labels || [],
  parent_task_id: dbTask.parent_task_id,
  last_updated_at: dbTask.last_updated_at,
  created_at: dbTask.created_at,
  updated_at: dbTask.updated_at,
});

// Utility function to update project progress when a task changes
const updateProjectProgress = async (projectId: string | null | undefined) => {
  if (projectId) {
    try {
      await updateProjectProgressOnTaskChange(projectId);
    } catch (error) {
      console.error("Error updating project progress:", error);
      // Don't throw the error - we don't want progress updates to fail task operations
    }
  }
};

export const fetchTasks = async (filters?: TaskFilters): Promise<Task[]> => {
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
    return (data || []).map(mapDbTaskToTask);
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

  return (data || []).map(mapDbTaskToTask);
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
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create task");
  }

  // Update project progress if task is associated with a project
  if (task.project) {
    await updateProjectProgress(task.project);
  }

  return mapDbTaskToTask(data);
};

export const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id" | "user" | "created_at">>): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to update tasks");
  }

  // Get the current task to check if project association changed
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("project")
    .eq("id", taskId)
    .eq("user", user.id)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update task or task not found");
  }

  // Update progress for both the old and new project if changed
  if (existingTask && existingTask.project) {
    await updateProjectProgress(existingTask.project);
  }
  
  if (updates.project && updates.project !== existingTask?.project) {
    await updateProjectProgress(updates.project);
  }

  return mapDbTaskToTask(data);
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to delete tasks");
  }

  // Get the task's project before deleting
  const { data: task } = await supabase
    .from("tasks")
    .select("project")
    .eq("id", taskId)
    .eq("user", user.id)
    .single();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user", user.id);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }

  // Update progress for the project if task was associated with one
  if (task && task.project) {
    await updateProjectProgress(task.project);
  }

  return true;
};

export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const updates: Partial<DbTask> = {
      status,
      completion_date: status === 'done' ? new Date().toISOString() : null,
      last_updated_at: new Date().toISOString(),
    };

    // Get the task's project before updating
    const { data: task } = await supabase
      .from("tasks")
      .select("project")
      .eq("id", taskId)
      .eq("user", user.id)
      .single();

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Task not found");
    
    // Update project progress if task has a project
    if (task && task.project) {
      await updateProjectProgress(task.project);
    }
    
    return mapDbTaskToTask(data);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const archiveTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const updates: Partial<DbTask> = {
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
    if (!data) throw new Error("Task not found");
    
    return mapDbTaskToTask(data);
  } catch (error) {
    console.error('Error archiving task:', error);
    throw error;
  }
};

export const bulkArchiveTasks = async (taskIds: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const updates: Partial<DbTask> = {
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
    if (!data) throw new Error("No tasks found");
    
    return data.map(mapDbTaskToTask);
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
    
    const updates: Partial<DbTask> = {
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
    if (!data) return [];
    
    return data.map(mapDbTaskToTask);
  } catch (error) {
    console.error('Error auto-archiving old tasks:', error);
    throw error;
  }
};

export const restoreTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const updates: Partial<DbTask> = {
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
    if (!data) throw new Error("Task not found");
    
    return mapDbTaskToTask(data);
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

export const unlinkTaskFromProject = async (taskId: string): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to unlink tasks");
  }

  // Get the task's project before unlinking
  const { data: task } = await supabase
    .from("tasks")
    .select("project")
    .eq("id", taskId)
    .eq("user", user.id)
    .single();

  const projectId = task?.project;

  // Update the task to remove the project association
  const { data, error } = await supabase
    .from("tasks")
    .update({ project: null })
    .eq("id", taskId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error unlinking task from project:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to unlink task or task not found");
  }

  // Update project progress after removing the task
  if (projectId) {
    await updateProjectProgress(projectId);
  }

  return mapDbTaskToTask(data);
};
