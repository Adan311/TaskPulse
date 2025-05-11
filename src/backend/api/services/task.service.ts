import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/types/supabaseSchema';
import { Database } from '@/integrations/supabase/types';
import { updateProjectProgressOnTaskChange } from "./project.service";
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  isSameDay, format
} from 'date-fns';

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
      // Update all child instances with relevant field changes
      await updateRecurringTaskInstances(taskId, updates);
      
      // If the task uses clone mode, generate new instances based on updated pattern
      if (updatedTask.recurrence_mode === 'clone') {
        await generateFutureRecurringTaskInstances(taskId);
      }
    }

    // Update project progress if the project was changed
    if (projectChanged) {
      // Update progress on the old project if there was one
      if (data.project) {
        await updateProjectProgress(data.project);
      }
      
      // Update progress on the new project if there is one
      if (newProjectId) {
        await updateProjectProgress(newProjectId);
      }
    }

    return updatedTask;
  } catch (err) {
    console.error("Error in updateTask:", err);
    throw err;
  }
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

// Create a recurring task
export const createRecurringTask = async (task: Omit<Task, "id" | "user" | "created_at" | "updated_at">): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create recurring tasks");
  }

  const taskId = uuidv4();

  const newTask = {
    id: taskId,
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

  // Update project progress if task is associated with a project
  if (task.project) {
    await updateProjectProgress(task.project);
  }

  // Generate future instances if recurrence_mode is 'clone'
  if (task.recurrence_mode === 'clone') {
    await generateFutureRecurringTaskInstances(taskId);
  }

  return mapDbTaskToTask(data);
};

// Get the next occurrence date based on recurrence pattern
export const getNextOccurrenceDate = (
  task: Task,
  fromDate: Date
): Date | null => {
  if (!task.recurrence_pattern || !task.due_date) {
    return null;
  }

  const baseDate = parseISO(task.due_date);
  let nextDate: Date;

  switch (task.recurrence_pattern) {
    case 'daily':
      nextDate = addDays(fromDate, 1);
      break;
    case 'weekly':
      // If recurrence_days is specified, find the next day in the list
      if (task.recurrence_days && task.recurrence_days.length > 0) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = fromDate.getDay();
        const selectedDays = task.recurrence_days;
        
        // Convert day names to day indices (0-6)
        const selectedDayIndices = selectedDays.map(day => daysOfWeek.indexOf(day)).sort((a, b) => a - b);
        
        // Find the next day that's in the selected days
        const nextDayIndex = selectedDayIndices.find(day => day > currentDayIndex);
        
        if (nextDayIndex !== undefined) {
          // Found a day later in the same week
          nextDate = addDays(startOfDay(fromDate), nextDayIndex - currentDayIndex);
        } else {
          // Wrap around to the earliest day in the next week
          nextDate = addDays(startOfDay(fromDate), 7 - currentDayIndex + selectedDayIndices[0]);
        }
      } else {
        // Simple weekly recurrence
        nextDate = addWeeks(fromDate, 1);
      }
      break;
    case 'monthly':
      nextDate = addMonths(fromDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(fromDate, 1);
      break;
    default:
      return null;
  }

  // Check if we've exceeded recurrence limits
  if (task.recurrence_end_date && isAfter(nextDate, parseISO(task.recurrence_end_date))) {
    return null;
  }

  return nextDate;
};

// Generate recurring task instances for the next 30 days
export const generateFutureRecurringTaskInstances = async (taskId: string, daysInFuture: number = 30): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User must be authenticated to generate recurring tasks");
    }

    // Get the original recurring task
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user", user.id)
      .single();

    if (taskError || !taskData) {
      console.error("Error fetching recurring task:", taskError);
      throw taskError || new Error("Task not found");
    }

    const task = mapDbTaskToTask(taskData);
    
    if (!task.is_recurring || !task.due_date || task.recurrence_mode !== 'clone') {
      return;
    }

    // Get already generated instances to avoid duplicates
    const { data: instances, error: instancesError } = await supabase
      .from("tasks")
      .select("due_date")
      .eq("parent_id", taskId)
      .eq("user", user.id);

    if (instancesError) {
      console.error("Error fetching existing recurring instances:", instancesError);
      throw instancesError;
    }

    const existingDates = (instances || []).map(instance => 
      instance.due_date ? format(parseISO(instance.due_date), 'yyyy-MM-dd') : null
    ).filter(Boolean);

    // Calculate end date for instance generation
    const today = new Date();
    const endDate = addDays(today, daysInFuture);
    
    // Keep track of how many instances we've generated
    let generatedCount = 0;
    const maxInstances = task.recurrence_count || Number.MAX_SAFE_INTEGER;
    
    let currentDate = parseISO(task.due_date);
    let newInstances: any[] = [];

    while (
      isBefore(currentDate, endDate) && 
      generatedCount < maxInstances && 
      (!task.recurrence_end_date || isBefore(currentDate, parseISO(task.recurrence_end_date)))
    ) {
      // Get next occurrence date
      const nextDate = getNextOccurrenceDate(task, currentDate);
      
      if (!nextDate) break;
      
      // Skip if we already have an instance for this date
      const nextDateString = format(nextDate, 'yyyy-MM-dd');
      if (!existingDates.includes(nextDateString)) {
        // Create a new instance of the task
        const newInstanceId = uuidv4();
        const newInstance = {
          id: newInstanceId,
          title: task.title,
          description: task.description,
          status: "todo" as Task['status'],
          priority: task.priority,
          due_date: nextDate.toISOString(),
          project: task.project,
          user: user.id,
          archived: false,
          labels: task.labels,
          parent_id: taskId,
          is_recurring: false, // Instance is not itself recurring
          reminder_at: task.reminder_at ? nextDate.toISOString() : null,
          reminder_sent: false,
        };
        
        newInstances.push(newInstance);
        existingDates.push(nextDateString);
        generatedCount++;
      }
      
      currentDate = nextDate;
    }

    // Insert all new instances at once
    if (newInstances.length > 0) {
      const { error: insertError } = await supabase
        .from("tasks")
        .insert(newInstances);

      if (insertError) {
        console.error("Error creating recurring task instances:", insertError);
        throw insertError;
      }
    }

  } catch (error) {
    console.error("Error generating recurring task instances:", error);
    throw error;
  }
};

// Refresh recurring task status based on recurrence pattern
export const refreshRecurringTaskStatus = async (task: Task): Promise<Task | null> => {
  try {
    if (!task.is_recurring || !task.due_date || task.recurrence_mode !== 'refresh') {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be authenticated to refresh recurring tasks");
    }

    const now = new Date();
    const dueDate = parseISO(task.due_date);
    
    // Only refresh if the due date has passed
    if (isAfter(dueDate, now)) {
      return null;
    }

    // Calculate next due date
    const nextDueDate = getNextOccurrenceDate(task, dueDate);
    if (!nextDueDate) {
      // End of recurrence
      return null;
    }

    // Update the task with the next due date and reset status
    const updates = {
      due_date: nextDueDate.toISOString(),
      status: "todo" as Task['status'],
      completion_date: null,
      reminder_sent: false,
      reminder_at: task.reminder_at ? nextDueDate.toISOString() : null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id)
      .eq("user", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error refreshing recurring task:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Failed to refresh recurring task");
    }

    return mapDbTaskToTask(data);
  } catch (error) {
    console.error("Error in refreshRecurringTaskStatus:", error);
    throw error;
  }
};

// Check and process all recurring tasks
export const processAllRecurringTasks = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found when processing recurring tasks");
      return;
    }

    // Get all recurring tasks
    const { data: recurringTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user", user.id)
      .eq("is_recurring", true)
      .eq("archived", false);

    if (error) {
      console.error("Error fetching recurring tasks:", error);
      throw error;
    }

    if (!recurringTasks || recurringTasks.length === 0) {
      return;
    }

    // Process each recurring task
    for (const task of recurringTasks) {
      const mappedTask = mapDbTaskToTask(task);
      
      if (mappedTask.recurrence_mode === 'refresh') {
        await refreshRecurringTaskStatus(mappedTask);
      } else if (mappedTask.recurrence_mode === 'clone') {
        await generateFutureRecurringTaskInstances(mappedTask.id);
      }
    }
  } catch (error) {
    console.error("Error processing recurring tasks:", error);
    throw error;
  }
};

// Update all instances of a recurring task when the parent task is updated
export const updateRecurringTaskInstances = async (
  parentTaskId: string,
  taskUpdates: Partial<Omit<Task, "id" | "user" | "created_at">>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User must be authenticated to update recurring task instances");
    }

    // Get all instances of this recurring task
    const { data: instances, error: instancesError } = await supabase
      .from("tasks")
      .select("*")
      .eq("parent_id", parentTaskId)
      .eq("user", user.id);

    if (instancesError) {
      console.error("Error fetching recurring task instances:", instancesError);
      throw instancesError;
    }

    if (!instances || instances.length === 0) {
      // No instances to update
      return;
    }

    console.log(`Updating ${instances.length} instances of recurring task ${parentTaskId}`);

    // Fields that should be propagated to all instances
    const updateableFields = {
      title: taskUpdates.title,
      description: taskUpdates.description,
      priority: taskUpdates.priority,
      project: taskUpdates.project,
      labels: taskUpdates.labels,
    };

    // Filter out undefined values
    const filteredUpdates: Record<string, any> = {};
    Object.entries(updateableFields).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      // No fields to update
      return;
    }

    // Update all instances at once
    const { error: updateError } = await supabase
      .from("tasks")
      .update(filteredUpdates)
      .eq("parent_id", parentTaskId)
      .eq("user", user.id);

    if (updateError) {
      console.error("Error updating recurring task instances:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated ${instances.length} instances of recurring task ${parentTaskId}`);
  } catch (error) {
    console.error("Error updating recurring task instances:", error);
    throw error;
  }
};
