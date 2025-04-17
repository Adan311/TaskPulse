
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from "uuid";

export interface Project {
  id: string;
  name: string;
  description: string;
  user: string;
  created_at?: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching projects");
    return []; // Return empty array if not authenticated
  }

  // Query projects for the current user only
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user", user.id as any)
    .order("name");

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  // Use proper type assertion to avoid TypeScript errors
  return (data || []) as Project[];
};

export const createProject = async (project: Omit<Project, "id" | "user" | "created_at">): Promise<Project> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create projects");
  }
  
  const newProject = {
    id: uuidv4(),
    ...project,
    user: user.id,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert([newProject as any])
    .select();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create project");
  }

  // Use type assertion to fix TypeScript errors
  return data[0] as Project;
};
