
import { supabase } from "../client/supabase";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string;
  project?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

export async function createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
  try {
    const task = {
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
  try {
    const updates = {
      ...taskData,
      updated_at: new Date().toISOString()
    };

    // Map user_id to user if necessary for backward compatibility
    if (taskData.user_id && !taskData.user) {
      updates.user = taskData.user_id;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}
