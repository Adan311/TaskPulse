
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Task } from "@/backend/types/supabaseSchema";

export async function getTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Cast the data to ensure type compatibility
    return (data || []) as Task[];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

export async function createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User must be authenticated to create tasks");
    }

    const task = {
      id: uuidv4(), // Generate a new UUID for the task
      ...taskData,
      user_id: user.id, // Set the user_id to the current user's ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    
    return data as Task;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
  try {
    // Make sure we're not overriding the user_id
    const { user_id, ...updates } = taskData;
    
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("tasks")
      .update(updatesWithTimestamp)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    return data as Task;
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

export async function updateTaskStatus(id: string, status: Task["status"]): Promise<void> {
  await updateTask(id, { status });
}
