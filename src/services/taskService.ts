
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  project?: string | null;
  due_date?: string | null;
  priority?: string | null;
  user?: string | null;
}

export const fetchTasks = async (): Promise<Task[]> => {
  // Get the current user session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Error getting session:", sessionError);
    throw sessionError;
  }
  
  // Extract the user ID from the session data
  const userId = sessionData?.session?.user?.id;
  
  // Debug logging for troubleshooting
  console.log("Session data when fetching tasks:", sessionData);
  console.log("Fetching tasks for user ID:", userId);
  
  if (!userId) {
    console.error("No authenticated user found when fetching tasks");
    return []; // Return empty array if not authenticated instead of throwing
  }

  // Query tasks for the current user only
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user", userId)
    .order("title");

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as Task[];
};

export const createTask = async (task: Omit<Task, "id" | "user">): Promise<Task> => {
  // Get current user session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Error getting session:", sessionError);
    throw sessionError;
  }
  
  // Extract the user ID from the session data
  const userId = sessionData?.session?.user?.id;
  
  // Debug logging for troubleshooting
  console.log("Session data:", sessionData);
  console.log("Creating task with user ID:", userId);
  
  if (!userId) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated to create tasks");
  }
  
  // Create the new task with a UUID and the proper user ID
  const newTask = {
    id: uuidv4(),
    ...task,
    user: userId,
  };

  // Log the task to be inserted
  console.log("Task being inserted:", newTask);

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
  const { error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", task.id);

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: Task["status"]): Promise<void> => {
  await updateTask({ id: taskId, status });
};
