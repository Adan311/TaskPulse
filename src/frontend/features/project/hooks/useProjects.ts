import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/backend/database/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { Project as SchemaProject } from "@/backend/database/schema";
import * as projectService from "@/backend/api/services/project.service";
import { getCurrentUser } from "@/shared/utils/authUtils";

// Export the Project type from supabaseSchema to ensure consistency
export type Project = SchemaProject;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const subscriptionRef = useRef<{
    subscription: {
      unsubscribe: () => void;
    } | null;
  }>({ subscription: null });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projects = await projectService.fetchProjects();
      setProjects(projects);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err);
      toast({
        title: "Error loading projects",
        description: err.message || "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Subscribe to real-time updates for projects
  const subscribeToProjectUpdates = useCallback(async () => {
    try {
      // Get current user to filter real-time updates
      const user = await getCurrentUser();
      if (!user) return;

      // Unsubscribe from any existing subscription
      if (subscriptionRef.current.subscription) {
        subscriptionRef.current.subscription.unsubscribe();
      }

      // Subscribe to project changes
      const subscription = supabase
        .channel('projects-updates')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'projects', 
            filter: `user=eq.${user.id}` 
          }, 
          (payload) => {
            // Update the corresponding project in the state
            setProjects(prev => 
              prev.map(project => 
                project.id === payload.new.id 
                  ? { ...project, ...payload.new as Project } 
                  : project
              )
            );
          }
        )
        .subscribe();

      subscriptionRef.current.subscription = subscription;
    } catch (err) {
      console.error("Error setting up real-time subscription:", err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    subscribeToProjectUpdates();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current.subscription) {
        subscriptionRef.current.subscription.unsubscribe();
      }
    };
  }, [fetchProjects, subscribeToProjectUpdates]);

  const createProject = useCallback(async (
    name: string, 
    description: string = "", 
    priority: Project['priority'] = 'medium', 
    color: string = "#3b82f6",
    dueDate?: string,
    status: Project['status'] = 'active'
  ) => {
    try {
      setLoading(true);
      
      const newProject = await projectService.createProject({
        name,
        description,
        status,
        priority,
        color,
        due_date: dueDate
      });

      setProjects(prev => [...prev, newProject]);
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
      return newProject;
    } catch (err: any) {
      console.error("Error creating project:", err);
      toast({
        title: "Error creating project",
        description: err.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      
      await projectService.deleteProject(projectId);
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error deleting project:", err);
      toast({
        title: "Error deleting project",
        description: err.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Omit<Project, 'id' | 'user'>>) => {
    try {
      setLoading(true);
      
      const updatedProject = await projectService.updateProject(projectId, updates);
      
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ));
      
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
      
      return updatedProject;
    } catch (err: any) {
      console.error("Error updating project:", err);
      toast({
        title: "Error updating project",
        description: err.message || "Failed to update project. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    deleteProject,
    updateProject
  };
} 