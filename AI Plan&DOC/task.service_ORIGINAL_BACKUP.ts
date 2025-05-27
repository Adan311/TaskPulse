import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { TaskFilters } from '@/frontend/features/tasks/components/TaskFilterBar';
import { Task } from '@/backend/types/supabaseSchema';
import { Database } from '@/integrations/supabase/types';
import { updateProjectProgressOnTaskChange } from "../src/backend/api/services/project.service";
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
  
  // If marking as completed, set completion date
  if (status === 'completed') {
    updates.completion_date = new Date().toISOString();
  } else {
    // If changing from completed to another status, clear completion date
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

  // Archive completed tasks older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("tasks")
    .update({ archived: true })
    .eq("user", user.id)
    .eq("status", "completed")
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

export const createRecurringTask = async (task: Omit<Task, "id" | "user" | "created_at" | "updated_at">): Promise<Task> => {
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

  const baseDate = new Date(fromDate);
  let nextDate: Date;

  switch (task.recurrence_pattern) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekly':
      if (task.recurrence_days && task.recurrence_days.length > 0) {
        // Find the next occurrence based on selected days
        const currentDay = baseDate.getDay();
        const selectedDays = task.recurrence_days.map(day => {
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          return dayMap[day.toLowerCase()];
        }).sort((a, b) => a - b);

        // Find the next day in the current week
        let nextDay = selectedDays.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          // Next occurrence is in the current week
          nextDate = addDays(baseDate, nextDay - currentDay);
        } else {
          // Next occurrence is in the next week
          const firstDayNextWeek = selectedDays[0];
          const daysUntilNextWeek = 7 - currentDay + firstDayNextWeek;
          nextDate = addDays(baseDate, daysUntilNextWeek);
        }
      } else {
        nextDate = addWeeks(baseDate, 1);
      }
      break;
    case 'monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(baseDate, 1);
      break;
    default:
      return null;
  }

  // Check if we've exceeded the end date or count
  if (task.recurrence_end_date && isAfter(nextDate, parseISO(task.recurrence_end_date))) {
    return null;
  }

  return nextDate;
};

export const generateFutureRecurringTaskInstances = async (taskId: string, daysInFuture: number = 30): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!task.is_recurring || task.recurrence_mode !== 'update') {
      return null;
    }

    // Check if the task is overdue and should be moved to the next occurrence
    const now = new Date();
    const dueDate = task.due_date ? parseISO(task.due_date) : null;

    if (dueDate && isBefore(dueDate, startOfDay(now)) && task.status !== 'completed') {
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

        return data ? mapDbTaskToTask(data) : null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error refreshing recurring task status:", error);
    return null;
  }
};

export const processAllRecurringTasks = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // Get all recurring tasks for the user
    const { data: recurringTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user", user.id)
      .eq("is_recurring", true)
      .eq("archived", false);

    if (error) {
      console.error("Error fetching recurring tasks:", error);
      return;
    }

    if (!recurringTasks || recurringTasks.length === 0) {
      return;
    }

    for (const dbTask of recurringTasks) {
      const task = mapDbTaskToTask(dbTask);
      
      if (task.recurrence_mode === 'clone') {
        // Generate future instances for clone mode
        await generateFutureRecurringTaskInstances(task.id);
      } else if (task.recurrence_mode === 'update') {
        // Refresh status for update mode
        await refreshRecurringTaskStatus(task);
      }
    }
  } catch (error) {
    console.error("Error processing recurring tasks:", error);
  }
};

export const updateRecurringTaskInstances = async (
  parentTaskId: string,
  taskUpdates: Partial<Omit<Task, "id" | "user" | "created_at">>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Only update certain fields for instances
    const allowedUpdates: Partial<any> = {};
    
    if (taskUpdates.title !== undefined) allowedUpdates.title = taskUpdates.title;
    if (taskUpdates.description !== undefined) allowedUpdates.description = taskUpdates.description;
    if (taskUpdates.priority !== undefined) allowedUpdates.priority = taskUpdates.priority;
    if (taskUpdates.project !== undefined) allowedUpdates.project = taskUpdates.project;
    if (taskUpdates.labels !== undefined) allowedUpdates.labels = taskUpdates.labels;

    // Don't update due_date, status, or completion_date for instances
    // as they should maintain their individual schedules and states

    if (Object.keys(allowedUpdates).length > 0) {
      const { error } = await supabase
        .from("tasks")
        .update(allowedUpdates)
        .eq("parent_id", parentTaskId)
        .eq("user", user.id);

      if (error) {
        console.error("Error updating recurring task instances:", error);
      }
    }
  } catch (error) {
    console.error("Error updating recurring task instances:", error);
  }
}; 