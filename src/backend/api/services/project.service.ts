import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from "uuid";
import { Project } from '@/backend/types/supabaseSchema';

export const fetchProjects = async (): Promise<Project[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching projects");
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data || [];
};

export const createProject = async (project: Omit<Project, "id" | "user" | "created_at" | "updated_at" | "progress">): Promise<Project> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create projects");
  }
  
  const newProject = {
    id: uuidv4(),
    ...project,
    user: user.id,
    progress: 0,
    status: project.status || 'active',
    priority: project.priority || 'medium',
  };

  const { data, error } = await supabase
    .from("projects")
    .insert([newProject])
    .select();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create project");
  }

  return data[0];
};

export const updateProject = async (projectId: string, updates: Partial<Omit<Project, "id" | "user" | "created_at">>): Promise<Project> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to update projects");
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user", user.id)
    .select();

  if (error) {
    console.error("Error updating project:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to update project or project not found");
  }

  return data[0];
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to delete projects");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user", user.id);

  if (error) {
    console.error("Error deleting project:", error);
    throw error;
  }

  return true;
};

export const calculateProjectProgress = async (projectId: string): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated");
  }

  // Get all tasks for the project
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("status")
    .eq("project", projectId)
    .eq("user", user.id);

  if (error) {
    console.error("Error fetching tasks for progress calculation:", error);
    throw error;
  }

  if (!tasks || tasks.length === 0) {
    return 0;
  }

  // Calculate progress based on completed tasks
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const progress = Math.round((completedTasks / tasks.length) * 100);

  // Update project progress
  await updateProject(projectId, { progress });

  return progress;
};
