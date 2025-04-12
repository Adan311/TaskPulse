
import { supabase } from '../client/supabase';
import type { Task } from '../../types/supabaseSchema';

// Re-export the Task type
export type { Task };

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
}

export async function createTask(taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
}

export async function updateTask(taskData: Partial<Task> & { id: string }): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', taskData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task status:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  return data;
}
