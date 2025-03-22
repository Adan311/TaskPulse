
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
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("title");

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as Task[];
};

export const createTask = async (task: Omit<Task, "id" | "user">): Promise<Task> => {
  const newTask = {
    id: uuidv4(),
    ...task,
  };

  const { data, error } = await supabase.from("tasks").insert([newTask]).select();

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
