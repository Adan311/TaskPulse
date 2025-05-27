import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/types/supabaseSchema';
import { Database } from '@/integrations/supabase/types';
import { updateProjectProgressOnTaskChange } from "../project.service";

type DbTask = Database['public']['Tables']['tasks']['Row'];

export const mapDbTaskToTask = (dbTask: DbTask): Task => ({
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
  reminder_at: dbTask.reminder_at,
  reminder_sent: dbTask.reminder_sent || false,
  is_recurring: dbTask.is_recurring || false,
  recurrence_pattern: dbTask.recurrence_pattern as Task['recurrence_pattern'],
  recurrence_days: dbTask.recurrence_days as string[] || [],
  recurrence_end_date: dbTask.recurrence_end_date,
  recurrence_count: dbTask.recurrence_count,
  parent_id: dbTask.parent_id,
  recurrence_mode: dbTask.recurrence_mode as Task['recurrence_mode'] || 'clone',
});

// Utility function to update project progress when a task changes
export const updateProjectProgress = async (projectId: string | null | undefined) => {
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
    reminder_sent: false,
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if this is updating a project
    const projectChanged = updates.project !== undefined;
    const newProjectId = updates.project; // Store this for later use

    // Update the task
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
      throw new Error("Task not found or you don't have permission to update it");
    }

    const updatedTask = mapDbTaskToTask(data);

    // If this is a recurring task, update instances as needed
    if (updatedTask.is_recurring) {
      // Import and call recurring task functions
      const { updateRecurringTaskInstances, generateFutureRecurringTaskInstances } = await import('./taskRecurrence.js');
      
      // Update all child instances with relevant field changes
      await updateRecurringTaskInstances(taskId, updates);
      
      // If the task uses clone mode, generate new instances based on updated pattern
      if (updatedTask.recurrence_mode === 'clone') {
        await generateFutureRecurringTaskInstances(taskId);
      }
    }

    // Update project progress if the project was changed
    if (projectChanged) {
      // Update progress for the new project
      if (newProjectId) {
        await updateProjectProgress(newProjectId);
      }
      
      // Also update progress for the old project if it was different
      // We need to get the original task to know the old project
      const { data: originalTaskData } = await supabase
        .from("tasks")
        .select("project")
        .eq("id", taskId)
        .single();
      
      if (originalTaskData && originalTaskData.project && originalTaskData.project !== newProjectId) {
        await updateProjectProgress(originalTaskData.project);
      }
    } else if (updates.status !== undefined) {
      // If status changed but not project, still update project progress
      await updateProjectProgress(updatedTask.project);
    }

    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the task first to know which project to update
    const { data: taskData } = await supabase
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

    // Update project progress if task was associated with a project
    if (taskData?.project) {
      await updateProjectProgress(taskData.project);
    }

    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to update task status");
  }

  const updates: Partial<Task> = { status };
  
  // If marking as done, set completion date
  if (status === 'done') {
    updates.completion_date = new Date().toISOString();
  } else {
    // If changing from done to another status, clear completion date
    updates.completion_date = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task status:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Task not found or you don't have permission to update it");
  }

  const updatedTask = mapDbTaskToTask(data);

  // Update project progress if task is associated with a project
  if (updatedTask.project) {
    await updateProjectProgress(updatedTask.project);
  }

  return updatedTask;
};

export const archiveTask = async (taskId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to archive tasks");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: true })
    .eq("id", taskId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error archiving task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Task not found or you don't have permission to archive it");
  }

  return mapDbTaskToTask(data);
};

export const bulkArchiveTasks = async (taskIds: string[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to archive tasks");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: true })
    .in("id", taskIds)
    .eq("user", user.id)
    .select();

  if (error) {
    console.error("Error bulk archiving tasks:", error);
    throw error;
  }

  return (data || []).map(mapDbTaskToTask);
};

export const autoArchiveOldTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to auto-archive tasks");
  }

  // Archive done tasks older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: true })
    .eq("user", user.id)
    .eq("status", "done")
    .eq("archived", false)
    .lt("completion_date", thirtyDaysAgo.toISOString())
    .select();

  if (error) {
    console.error("Error auto-archiving old tasks:", error);
    throw error;
  }

  return (data || []).map(mapDbTaskToTask);
};

export const restoreTask = async (taskId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to restore tasks");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: false })
    .eq("id", taskId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error restoring task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Task not found or you don't have permission to restore it");
  }

  return mapDbTaskToTask(data);
};

export const deleteTaskPermanently = async (taskId: string) => {
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
    console.error("Error permanently deleting task:", error);
    throw error;
  }

  return true;
};

export const unlinkTaskFromProject = async (taskId: string): Promise<Task> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the current task to know which project to update
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("project")
      .eq("id", taskId)
      .eq("user", user.id)
      .single();

    // Update the task to remove project association
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
      throw new Error("Task not found or you don't have permission to update it");
    }

    // Update project progress for the old project
    if (currentTask?.project) {
      await updateProjectProgress(currentTask.project);
    }

    return mapDbTaskToTask(data);
  } catch (error) {
    console.error("Error unlinking task from project:", error);
    throw error;
  }
}; 