import { supabase } from "../../../../database/client";
import { validateUser } from "@/shared/utils/authUtils";

/**
 * Helper function to resolve project ID from name or UUID
 * Returns project data and the resolved ID
 */
async function resolveProjectId(
  userId: string, 
  projectId: string
): Promise<{ project: any; actualProjectId: string } | null> {
  // Check if projectId is a UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
    // This is not a UUID, so it's likely a project name
    let projects = null;
    let error = null;
    
    // Try 1: Exact match (case insensitive)
    ({ data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user', userId)
      .ilike('name', projectId)
      .limit(1));
    
    // Try 2: Partial match if exact match fails
    if (!projects || projects.length === 0) {
      ({ data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', userId)
        .ilike('name', `%${projectId}%`)
        .limit(5));
    }
    
    // Try 3: Remove common words and try again
    if (!projects || projects.length === 0) {
      const cleanedName = projectId.replace(/\b(project|the|my|a|an)\b/gi, '').trim();
      if (cleanedName && cleanedName !== projectId) {
        ({ data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user', userId)
          .ilike('name', `%${cleanedName}%`)
          .limit(5));
      }
    }
    
    if (error || !projects || projects.length === 0) {
      return null;
    }
    
    // If multiple matches, prefer exact or closest match
    let selectedProject;
    if (projects.length > 1) {
      const exactMatch = projects.find(p => p.name.toLowerCase() === projectId.toLowerCase());
      if (exactMatch) {
        selectedProject = exactMatch;
      } else {
        // Find the shortest name (likely the best match)
        selectedProject = projects.reduce((prev, curr) => 
          prev.name.length <= curr.name.length ? prev : curr
        );
      }
    } else {
      selectedProject = projects[0];
    }
    
    return {
      project: selectedProject,
      actualProjectId: selectedProject.id
    };
  } else {
    // It's already a UUID, fetch the project data
    const { data: projectData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user', userId)
      .single();
    
    if (error || !projectData) {
      return null;
    }
    
    return {
      project: projectData,
      actualProjectId: projectId
    };
  }
}

/**
 * Get all items (tasks, events, notes, files) for a specific project
 * @param userId User ID
 * @param projectId Project ID or name
 */
export const getProjectItems = async (
  userId: string,
  projectId: string
): Promise<{tasks: any[], events: any[], notes: any[], files: any[]}> => {
  try {
    // Verify the user making the request
    const user = await validateUser(userId);
    
    // Resolve project ID using shared helper
    const projectResolution = await resolveProjectId(user.id, projectId);
    
    if (!projectResolution) {
      return {
        tasks: [],
        events: [],
        notes: [],
        files: []
      };
    }
    
    const { actualProjectId } = projectResolution;
    
    // Get all project-related items
    const [tasksResult, eventsResult, notesResult, filesResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      supabase
        .from('events')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      supabase
        .from('notes')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      supabase
        .from('files')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId)
    ]);
    
    const tasks = tasksResult.data || [];
    const events = eventsResult.data || [];
    const notes = notesResult.data || [];
    const files = filesResult.data || [];
    
    return {
      tasks,
      events,
      notes,
      files
    };
  } catch (error) {
    console.error("Error fetching project items:", error);
    return {
      tasks: [],
      events: [],
      notes: [],
      files: []
    };
  }
};

/**
 * Get project progress and analytics
 * @param userId User ID
 * @param projectId Project ID or name
 */
export const getProjectProgress = async (
  userId: string,
  projectId: string
): Promise<{
  project: any;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingEvents: number;
  notes: number;
  files: number;
} | null> => {
  try {
    // Verify the user making the request
    const user = await validateUser(userId);
    
    // Resolve project ID using shared helper
    const projectResolution = await resolveProjectId(user.id, projectId);
    
    if (!projectResolution) {
      return null;
    }
    
    const { project, actualProjectId } = projectResolution;
    
    // Get all project-related items
    const [tasksResult, eventsResult, notesResult, filesResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      supabase
        .from('events')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      supabase
        .from('notes')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
              supabase
        .from('files')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId)
    ]);
    
    const tasks = tasksResult.data || [];
    const events = eventsResult.data || [];
    const notes = notesResult.data || [];
    const files = filesResult.data || [];
    
    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const pendingTasks = tasks.filter(task => task.status !== 'done').length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.status !== 'done' && 
      task.due_date && 
      new Date(task.due_date) < now
    ).length;
    
    // Calculate upcoming events (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    }).length;
    
    // Calculate progress percentage
    let progress = 0;
    if (totalTasks > 0) {
      progress = Math.round((completedTasks / totalTasks) * 100);
    }
    
    return {
      project,
      progress,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      upcomingEvents,
      notes: notes.length,
      files: files.length
    };
  } catch (error) {
    console.error("Error fetching project progress:", error);
    return null;
  }
};

/**
 * Get project timeline with tasks and events
 * @param userId User ID
 * @param projectId Project ID or name
 * @param days Number of days to look ahead (default: 30)
 */
export const getProjectTimeline = async (
  userId: string,
  projectId: string,
  days: number = 30
): Promise<{
  projectName: string;
  timeline: Array<{
    type: 'task' | 'event' | 'project_deadline';
    title: string;
    date: string;
    status?: string;
    isOverdue: boolean;
  }>;
} | null> => {
  try {
    // Verify the user making the request
    const user = await validateUser(userId);
    
    // Resolve project ID using shared helper
    const projectResolution = await resolveProjectId(user.id, projectId);
    
    if (!projectResolution) {
      return null;
    }
    
    const { project: projectData, actualProjectId } = projectResolution;
    const projectName = projectData.name;
    
    // Calculate date range
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Get tasks and events for the project within the date range
    const [tasksResult, eventsResult, projectResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId)
        .not('due_date', 'is', null),
        
      supabase
        .from('events')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId)
        .gte('start_time', now.toISOString())
        .lte('start_time', futureDate.toISOString()),
        
      supabase
        .from('projects')
        .select('*')
        .eq('id', actualProjectId)
        .eq('user', user.id)
        .single()
    ]);
    
    const tasks = tasksResult.data || [];
    const events = eventsResult.data || [];
    const project = projectResult.data;
    
    // Build timeline array
    const timeline: Array<{
      type: 'task' | 'event' | 'project_deadline';
      title: string;
      date: string;
      status?: string;
      isOverdue: boolean;
    }> = [];
    
    // Add tasks to timeline
    tasks.forEach(task => {
      if (task.due_date) {
        const taskDate = new Date(task.due_date);
        timeline.push({
          type: 'task',
          title: task.title,
          date: task.due_date,
          status: task.status,
          isOverdue: taskDate < now && task.status !== 'done'
        });
      }
    });
    
    // Add events to timeline
    events.forEach(event => {
      timeline.push({
        type: 'event',
        title: event.title,
        date: event.start_time,
        isOverdue: false // Events in the future can't be overdue
      });
    });
    
    // Add project deadline if it exists and is within range
    if (project?.due_date) {
      const projectDueDate = new Date(project.due_date);
      if (projectDueDate >= now && projectDueDate <= futureDate) {
        timeline.push({
          type: 'project_deadline',
          title: `${project.name} Deadline`,
          date: project.due_date,
          isOverdue: projectDueDate < now
        });
      }
    }
    
    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      projectName,
      timeline
    };
  } catch (error) {
    console.error("Error fetching project timeline:", error);
    return null;
  }
}; 