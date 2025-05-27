import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Task } from '@/backend/types/supabaseSchema';
import { mapDbTaskToTask, updateProjectProgress } from './taskOperations';
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format
} from 'date-fns';

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

    if (!task.is_recurring || task.recurrence_mode !== 'refresh') {
      return null;
    }

    // Check if the task is overdue and should be moved to the next occurrence
    const now = new Date();
    const dueDate = task.due_date ? parseISO(task.due_date) : null;

    if (dueDate && isBefore(dueDate, startOfDay(now)) && task.status !== 'done') {
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
      } else if (task.recurrence_mode === 'refresh') {
        // Refresh status for refresh mode
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