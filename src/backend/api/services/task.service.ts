/**
 * Task Service - Consolidated task functionality

 */

import { supabase } from "../../database/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/database/schema';
import { Database } from '../../database/types';
import { updateProjectProgressOnTaskChange } from "./project.service";
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';
import { getNextOccurrenceDate as getSharedNextOccurrenceDate } from './recurrence.service';
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format 
} from 'date-fns';

type DbTask = Database['public']['Tables']['tasks']['Row'];

// ===== UTILITY FUNCTIONS =====

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

// ===== TASK OPERATIONS =====

export const fetchTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  try {
    const user = await validateUser();

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
  const user = await getCurrentUser();
  
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
  const user = await validateUser();

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
    const user = await validateUser();

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
    }

    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const user = await validateUser();

    // First, get the task to know which project to update
    const { data: taskData, error: fetchError } = await supabase
      .from("tasks")
      .select("project")
      .eq("id", taskId)
      .eq("user", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching task for deletion:", fetchError);
      throw fetchError;
    }

    // Delete the task
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
    console.error("Error in deleteTask:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
  const user = await validateUser();

  const updateData: any = { status };
  
  // Set completion date when marking as done
  if (status === 'done') {
    updateData.completion_date = new Date().toISOString();
  } else {
    // Clear completion date when changing from done to another status
    updateData.completion_date = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
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
  const user = await validateUser();

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

  return mapDbTaskToTask(data);
};

export const bulkArchiveTasks = async (taskIds: string[]) => {
  const user = await validateUser();

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
  const user = await validateUser();

  // Archive completed tasks older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: true })
    .eq("user", user.id)
    .eq("status", "done")
    .lt("completion_date", thirtyDaysAgo.toISOString())
    .eq("archived", false)
    .select();

  if (error) {
    console.error("Error auto-archiving old tasks:", error);
    throw error;
  }

  return (data || []).map(mapDbTaskToTask);
};

export const restoreTask = async (taskId: string) => {
  const user = await validateUser();

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

  return mapDbTaskToTask(data);
};

export const deleteTaskPermanently = async (taskId: string) => {
  const user = await validateUser();

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
  const user = await validateUser();

  // First get the current task to know which project to update
  const { data: currentTask, error: fetchError } = await supabase
    .from("tasks")
    .select("project")
    .eq("id", taskId)
    .eq("user", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching task:", fetchError);
    throw fetchError;
  }

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

  // Update the old project's progress
  if (currentTask?.project) {
    await updateProjectProgress(currentTask.project);
  }

  return mapDbTaskToTask(data);
};

// ===== TASK RECURRENCE FUNCTIONS =====

export const createRecurringTask = async (task: Omit<Task, "id" | "user" | "created_at" | "updated_at">): Promise<Task> => {
  const user = await validateUser();

  const newTask = {
    id: uuidv4(),
    ...task,
    user: user.id,
    archived: false,
    reminder_sent: false,
    is_recurring: true,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert([newTask])
    .select()
    .single();

  if (error) {
    console.error("Error creating recurring task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create recurring task");
  }

  const createdTask = mapDbTaskToTask(data);

  // Generate future instances if using clone mode
  if (createdTask.recurrence_mode === 'clone') {
    await generateFutureRecurringTaskInstances(createdTask.id);
  }

  // Update project progress if task is associated with a project
  if (task.project) {
    await updateProjectProgress(task.project);
  }

  return createdTask;
};

export const getNextOccurrenceDate = (
  task: Task,
  fromDate: Date
): Date | null => {
  if (!task.is_recurring || !task.recurrence_pattern) {
    return null;
  }

  // Use shared recurrence service to eliminate duplication
  return getSharedNextOccurrenceDate(fromDate, {
    pattern: task.recurrence_pattern,
    days: task.recurrence_days,
    endDate: task.recurrence_end_date,
    count: task.recurrence_count
  });
};

export const generateFutureRecurringTaskInstances = async (taskId: string, daysInFuture: number = 30): Promise<void> => {
  try {
    const user = await validateUser();

    // Get the parent task
    const { data: parentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user", user.id)
      .single();

    if (fetchError || !parentTask) {
      console.error("Error fetching parent task:", fetchError);
      return;
    }

    const task = mapDbTaskToTask(parentTask);

    if (!task.is_recurring || task.recurrence_mode !== 'clone') {
      return;
    }

    // Get existing instances to avoid duplicates
    const { data: existingInstances } = await supabase
      .from("tasks")
      .select("due_date")
      .eq("parent_id", taskId)
      .eq("user", user.id);

    const existingDueDates = new Set(
      existingInstances?.map(instance => instance.due_date).filter(Boolean) || []
    );

    const futureDate = addDays(new Date(), daysInFuture);
    const instances: any[] = [];
    let currentDate = task.due_date ? parseISO(task.due_date) : new Date();
    let instanceCount = 0;

    // Count existing instances if we have a recurrence count limit
    if (task.recurrence_count) {
      instanceCount = existingInstances?.length || 0;
    }

    while (isBefore(currentDate, futureDate)) {
      const nextDate = getNextOccurrenceDate(task, currentDate);
      
      if (!nextDate) break;

      // Check recurrence count limit
      if (task.recurrence_count && instanceCount >= task.recurrence_count) {
        break;
      }

      const nextDateString = format(nextDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
      
      // Skip if we already have an instance for this date
      if (!existingDueDates.has(nextDateString)) {
        const instanceId = uuidv4();
        instances.push({
          id: instanceId,
          title: task.title,
          description: task.description,
          status: 'todo', // New instances start as todo
          priority: task.priority,
          due_date: nextDateString,
          user: user.id,
          project: task.project,
          archived: false,
          labels: task.labels,
          parent_id: taskId,
          is_recurring: false, // Instances are not recurring themselves
          reminder_sent: false,
        });
        instanceCount++;
      }

      currentDate = nextDate;
    }

    if (instances.length > 0) {
      const { error: insertError } = await supabase
        .from("tasks")
        .insert(instances);

      if (insertError) {
        console.error("Error creating recurring task instances:", insertError);
      } else {
        console.log(`Created ${instances.length} recurring task instances`);
      }
    }
  } catch (error) {
    console.error("Error generating future recurring task instances:", error);
  }
};

export const refreshRecurringTaskStatus = async (task: Task): Promise<Task | null> => {
  try {
    const user = await validateUser();

    if (!task.is_recurring || task.recurrence_mode !== 'refresh') {
      return null;
    }

    // Check if the task is overdue and should be moved to the next occurrence
    const now = new Date();
    const dueDate = task.due_date ? parseISO(task.due_date) : null;

    if (dueDate && isBefore(dueDate, startOfDay(now)) && (!task.status || task.status === 'todo' || task.status === 'in_progress')) {
      // Move to next occurrence
      const nextDate = getNextOccurrenceDate(task, dueDate);
      
      if (nextDate) {
        const { data, error } = await supabase
          .from("tasks")
          .update({
            due_date: format(nextDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
            status: 'todo', // Reset status for the new occurrence
            completion_date: null,
            reminder_sent: false,
          })
          .eq("id", task.id)
          .eq("user", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error refreshing recurring task:", error);
          return null;
        }

        return mapDbTaskToTask(data);
      }
    }

    return null;
  } catch (error) {
    console.error("Error in refreshRecurringTaskStatus:", error);
    return null;
  }
};

export const processAllRecurringTasks = async (): Promise<void> => {
  try {
    const user = await validateUser();

    // Get all recurring tasks
    const { data: recurringTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user", user.id)
      .eq("is_recurring", true);

    if (error) {
      console.error("Error fetching recurring tasks:", error);
      throw error;
    }

    if (!recurringTasks || recurringTasks.length === 0) {
      console.log("No recurring tasks found");
      return;
    }

    console.log(`Processing ${recurringTasks.length} recurring tasks`);

    for (const dbTask of recurringTasks) {
      const task = mapDbTaskToTask(dbTask);
      
      try {
        if (task.recurrence_mode === 'clone') {
          // Generate future instances for clone mode
          await generateFutureRecurringTaskInstances(task.id);
        } else if (task.recurrence_mode === 'refresh') {
          // Refresh the task status for refresh mode
          await refreshRecurringTaskStatus(task);
        }
      } catch (taskError) {
        console.error(`Error processing recurring task ${task.id}:`, taskError);
        // Continue processing other tasks even if one fails
      }
    }

    console.log("Finished processing all recurring tasks");
  } catch (error) {
    console.error("Error in processAllRecurringTasks:", error);
    throw error;
  }
};

export const updateRecurringTaskInstances = async (
  parentTaskId: string,
  taskUpdates: Partial<Omit<Task, "id" | "user" | "created_at">>
): Promise<void> => {
  try {
    const user = await validateUser();

    // Get all child instances of this recurring task
    const { data: instances, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("parent_id", parentTaskId)
      .eq("user", user.id);

    if (fetchError) {
      console.error("Error fetching recurring task instances:", fetchError);
      throw fetchError;
    }

    if (!instances || instances.length === 0) {
      console.log("No recurring task instances found to update");
      return;
    }

    // Filter out fields that shouldn't be updated on instances
    const allowedUpdates = { ...taskUpdates };
    delete allowedUpdates.is_recurring; // Instances are never recurring
    delete allowedUpdates.recurrence_pattern;
    delete allowedUpdates.recurrence_days;
    delete allowedUpdates.recurrence_end_date;
    delete allowedUpdates.recurrence_count;
    delete allowedUpdates.recurrence_mode;
    delete allowedUpdates.parent_id;

    // Update all instances
    const { error: updateError } = await supabase
      .from("tasks")
      .update(allowedUpdates)
      .eq("parent_id", parentTaskId)
      .eq("user", user.id);

    if (updateError) {
      console.error("Error updating recurring task instances:", updateError);
      throw updateError;
    }

    console.log(`Updated ${instances.length} recurring task instances`);
  } catch (error) {
    console.error("Error in updateRecurringTaskInstances:", error);
    throw error;
  }
}; 