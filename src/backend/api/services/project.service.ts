import { supabase } from '../../database/client';
import { v4 as uuidv4 } from "uuid";
import { Project } from '@/backend/database/schema';
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

export const fetchProjects = async (): Promise<Project[]> => {
  const user = await getCurrentUser();
  
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
  const user = await validateUser();
  
  const newProject = {
    id: uuidv4(),
    ...project,
    user: user.id,
    progress: 0,
    status: project.status || 'active',
    priority: project.priority || 'medium',
    auto_progress: true
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
  const user = await validateUser();

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
  const user = await validateUser();

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

/**
 * Calculate project progress based on the completion status of its tasks.
 * If auto_progress is false, it will return the manual_progress value.
 * 
 * @param projectId - The ID of the project
 * @param updateProjectProgress - Whether to update the project progress in the database
 * @returns The calculated progress percentage (0-100)
 */
export const calculateProjectProgress = async (
  projectId: string, 
  updateProjectProgress: boolean = true
): Promise<number> => {
  const user = await validateUser();

  // First, check if the project uses auto or manual progress
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("auto_progress, manual_progress")
    .eq("id", projectId)
    .eq("user", user.id)
    .single();

  if (projectError) {
    console.error("Error fetching project for progress calculation:", projectError);
    throw projectError;
  }

  // If not using auto progress, return the manual progress value
  if (projectData && projectData.auto_progress === false && projectData.manual_progress !== null) {
    return projectData.manual_progress;
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
    // No tasks means 0% progress
    if (updateProjectProgress) {
      await updateProject(projectId, { progress: 0 });
    }
    return 0;
  }

  // Calculate progress based on completed tasks
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const progress = Math.round((completedTasks / tasks.length) * 100);

  // Update project progress if requested
  if (updateProjectProgress) {
    await updateProject(projectId, { progress });
  }

  return progress;
};

/**
 * Set the project to use automatically calculated progress based on task completion.
 * 
 * @param projectId - The ID of the project
 * @returns The updated project
 */
export const setAutoProgress = async (projectId: string): Promise<Project> => {
  const user = await validateUser();

  // Calculate the current progress
  const progress = await calculateProjectProgress(projectId, false);

  // Update the project
  return await updateProject(projectId, { 
    auto_progress: true,
    progress 
  });
};

/**
 * Set the project to use manually defined progress.
 * 
 * @param projectId - The ID of the project
 * @param manualProgress - The manually set progress value (0-100)
 * @returns The updated project
 */
export const setManualProgress = async (projectId: string, manualProgress: number): Promise<Project> => {
  const user = await validateUser();

  // Validate the progress value
  if (manualProgress < 0 || manualProgress > 100) {
    throw new Error("Progress must be between 0 and 100");
  }

  // Update the project
  return await updateProject(projectId, { 
    auto_progress: false,
    manual_progress: manualProgress,
    progress: manualProgress 
  });
};

/**
 * Update project progress when tasks are created, updated or deleted.
 * This should be called from task service after tasks are modified.
 * 
 * @param projectId - The ID of the project
 * @returns The new progress percentage
 */
export const updateProjectProgressOnTaskChange = async (projectId: string): Promise<number> => {
  // Check if the project exists and uses auto progress
  const user = await validateUser();

  const { data: project, error } = await supabase
    .from("projects")
    .select("auto_progress")
    .eq("id", projectId)
    .eq("user", user.id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw error;
  }

  // Only update progress if auto_progress is enabled
  if (project && project.auto_progress) {
    return await calculateProjectProgress(projectId, true);
  }

  return -1; // Indicates that auto-progress is disabled
};
