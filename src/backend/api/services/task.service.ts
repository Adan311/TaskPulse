
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/backend/types/supabaseSchema";
import { v4 as uuidv4 } from "uuid";

// Fetch all tasks for the current user
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user', user.id as any)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Use type assertion to fix TypeScript errors
    return (data || []) as unknown as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData: Omit<Task, 'id' | 'user' | 'created_at' | 'updated_at'>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Generate a UUID for the new task
    const taskId = uuidv4();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        project: taskData.project,
        due_date: taskData.due_date,
        user: user.id
      } as any)
      .select();
    
    if (error) throw error;
    
    return data[0] as unknown as Task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskData: Partial<Task> & { id: string }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        project: taskData.project,
        due_date: taskData.due_date
      } as any)
      .eq('id', taskData.id as any)
      .eq('user', user.id as any)
      .select();
    
    if (error) throw error;
    
    return data[0] as unknown as Task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId as any)
      .eq('user', user.id as any);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('tasks')
      .update({ status } as any)
      .eq('id', taskId as any)
      .eq('user', user.id as any);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

// Export Task type
export type { Task };
