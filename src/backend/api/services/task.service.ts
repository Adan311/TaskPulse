import { supabase } from "@/backend/api/client/supabase";
import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string;
  project?: string | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchTasks() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user", user.id);

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return (data || []).map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    project: task.project,
    user_id: task.user,
    created_at: task.created_at,
    updated_at: task.updated_at
  }));
}

export async function createTask(task: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const newTask = {
    id: uuidv4(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    project: task.project,
    user: user.id
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert([newTask])
    .select();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  return data ? data[0] : null;
}

export async function updateTask(task: Partial<Task> & { id: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const updateData: any = {};
  
  if (task.title !== undefined) updateData.title = task.title;
  if (task.description !== undefined) updateData.description = task.description;
  if (task.status !== undefined) updateData.status = task.status;
  if (task.priority !== undefined) updateData.priority = task.priority;
  if (task.due_date !== undefined) updateData.due_date = task.due_date;
  if (task.project !== undefined) updateData.project = task.project;
  if (task.user_id !== undefined) updateData.user = task.user_id;

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", task.id)
    .eq("user", user.id)
    .select();

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }

  return data ? data[0] : null;
}

export async function deleteTask(taskId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
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

  return true;
}

export async function updateTaskStatus(taskId: string, status: Task["status"]) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("user", user.id)
    .select();

  if (error) {
    console.error("Error updating task status:", error);
    throw error;
  }

  return data ? data[0] : null;
}
