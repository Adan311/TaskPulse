import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/backend/database/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Project as SchemaProject } from "@/backend/database/schema";

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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProjects([]);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', user.id);

      if (error) throw error;
      
      // Ensure each project has the required fields
      const projectsWithDefaults = (data || []).map(p => ({
        ...p,
        status: p.status || 'active',
        progress: p.progress || 0,
        priority: p.priority || 'medium',
      })) as Project[];
      
      setProjects(projectsWithDefaults);
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
      const { data: { user } } = await supabase.auth.getUser();
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const newProject: Omit<Project, 'created_at' | 'updated_at'> = {
        id: uuidv4(),
        name,
        description,
        user: user.id,
        status,
        progress: 0,
        priority,
        auto_progress: true,
        color,
        due_date: dueDate
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProjects(prev => [...prev, data[0] as Project]);
        toast({
          title: "Project created",
          description: "Your new project has been created successfully.",
        });
        return data[0] as Project;
      }
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user', user.id);

      if (error) throw error;
      
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user', user.id)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProjects(prev => prev.map(project => 
          project.id === projectId ? data[0] as Project : project
        ));
        
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        });
        
        return data[0] as Project;
      }
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