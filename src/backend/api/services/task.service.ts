
import { supabase } from "../client/supabase";

// Export Task type
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  project?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        project: taskData.project,
        due_date: taskData.due_date,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    
    return data[0] as Task;
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
        due_date: taskData.due_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskData.id)
      .eq('user_id', user.id)
      .select();
    
    if (error) throw error;
    
    return data[0] as Task;
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
      .eq('id', taskId)
      .eq('user_id', user.id);
    
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
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', taskId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};
