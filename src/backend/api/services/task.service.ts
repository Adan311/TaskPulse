import { supabase } from '../client/supabase';
import type { Task } from '../../types/supabaseSchema';
import { v4 as uuidv4 } from 'uuid';

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

  // Transform the data to match the Task interface
  return (data || []).map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: (task.status || 'todo') as Task['status'],
    priority: (task.priority || 'medium') as Task['priority'],
    due_date: task.due_date,
    project: task.project,
    user_id: task.user || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

export async function createTask(taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Generate a new id for the task
  const id = uuidv4();
  
  // Create task object with required properties for the database
  const taskToInsert = {
    id,
    ...taskData,
    user: userData.user.id,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  // Transform the returned data to match the Task interface
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    status: (data.status || 'todo') as Task['status'],
    priority: (data.priority || 'medium') as Task['priority'],
    due_date: data.due_date,
    project: data.project,
    user_id: data.user || userData.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function updateTask(taskData: Partial<Task> & { id: string }): Promise<Task> {
  // Map user_id to user for the database
  const taskToUpdate: any = { ...taskData };
  
  // Handle the user_id to user mapping
  if (taskToUpdate.user_id) {
    taskToUpdate.user = taskToUpdate.user_id;
    delete taskToUpdate.user_id;
  }
  
  // Remove created_at and updated_at as they're not in the database schema
  delete taskToUpdate.created_at;
  delete taskToUpdate.updated_at;

  const { data, error } = await supabase
    .from('tasks')
    .update(taskToUpdate)
    .eq('id', taskData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  // Transform the returned data to match the Task interface
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    status: (data.status || 'todo') as Task['status'],
    priority: (data.priority || 'medium') as Task['priority'],
    due_date: data.due_date,
    project: data.project,
    user_id: data.user || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
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

  // Transform the returned data to match the Task interface
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    status: (data.status || 'todo') as Task['status'],
    priority: (data.priority || 'medium') as Task['priority'],
    due_date: data.due_date,
    project: data.project,
    user_id: data.user || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
