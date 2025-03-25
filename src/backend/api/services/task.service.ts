
import { supabase } from '../client/supabase';
import { v4 as uuidv4 } from "uuid";

// Export the Task type so it can be imported by other files
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  project?: string;
  user: string;
}

export const fetchTasks = async (): Promise<Task[]> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching tasks");
    return []; // Return empty array if not authenticated
  }

  // Query tasks for the current user only
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user", user.id)
    .order("title");

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as Task[];
};

export const createTask = async (task: Omit<Task, "id" | "user">): Promise<Task> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated to create tasks");
  }
  
  // Create the new task with a UUID and the proper user ID
  const newTask = {
    id: uuidv4(),
    ...task,
    user: user.id,
  };

  // Log the task to be inserted
  console.log("Task being inserted:", newTask);

  // Ensure the user ID is correctly set as a UUID before inserting
  if (!newTask.user || typeof newTask.user !== 'string' || newTask.user === 'authenticated') {
    console.error("Invalid user ID:", newTask.user);
    throw new Error("Invalid user ID for task creation");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([newTask])
    .select();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  return data![0] as Task;
};

export const updateTask = async (task: Partial<Task> & { id: string }): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated to update tasks");
  }

  const { error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", task.id)
    .eq("user", user.id);

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated to delete tasks");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user", user.id);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task["status"]): Promise<void> => {
  await updateTask({ id: taskId, status });
};
