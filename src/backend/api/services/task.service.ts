
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  project?: string | null;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | null;
  user?: string | null;
}

export const fetchTasks = async (): Promise<Task[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching tasks");
    return [];
  }

  console.log("Fetching tasks for user:", user.id);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user", user.id);

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as Task[];
};

export const createTask = async (task: Omit<Task, "id" | "user">): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated to create tasks");
  }
  
  // Create a new task object with a UUID and the user's actual ID
  const newTask = {
    id: uuidv4(),
    ...task,
    user: user.id
  };

  console.log("Full task object:", newTask);

  const { data, error } = await supabase
    .from("tasks")
    .insert(newTask)
    .select();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned after task creation");
  }

  return data[0] as Task;
};

export const updateTask = async (task: Partial<Task> & { id: string }): Promise<void> => {
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

export const updateTaskStatus = async (taskId: string, status: Task["status"]): Promise<void> => {
  await updateTask({ id: taskId, status });
};

export const deleteTask = async (taskId: string): Promise<void> => {
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
