import { supabase } from "@/integrations/supabase/client";
import { getEvents } from "@/backend/api/services/eventService";
import { fetchTasks } from "@/backend/api/services/task.service";

/**
 * Service that allows the AI to safely query user-specific data
 * This follows the MCP pattern for data access with explicit user permission checks
 */

/**
 * Get events for a specific user within a date range
 * @param userId User ID
 * @param startDate Optional start date (YYYY-MM-DD)
 * @param endDate Optional end date (YYYY-MM-DD)
 * @param query Optional text query
 * @param filters Optional additional filters like 'upcoming', 'past', 'month:may', etc.
 */
export const getUserEvents = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  query?: string,
  filters?: string[]
): Promise<any[]> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // Get all events using the existing service (follows MCP pattern)
    const events = await getEvents();
    
    // Filter events by date if provided
    let filteredEvents = [...events];
    
    // Handle 'upcoming' filter - include only events from today onwards
    if (filters?.includes('upcoming') || (!startDate && !endDate && (!filters || filters.length === 0 || !filters.includes('past')))) {
      // Default behavior is to show upcoming events if no specific date range or filter is set
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= today;
      });
      
      // Sort from the soonest to latest
      filteredEvents.sort((a, b) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    // Handle 'past' filter - include only events before today
    if (filters?.includes('past')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart < today;
      });
      
      // Sort from the most recent to oldest for past events
      filteredEvents.sort((a, b) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    // Handle month filtering - e.g., 'month:may'
    const monthFilter = filters?.find(f => f.startsWith('month:'));
    if (monthFilter) {
      const monthName = monthFilter.split(':')[1].toLowerCase();
      const monthMap: {[key: string]: number} = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
      };
      
      if (monthMap[monthName] !== undefined) {
        const currentYear = new Date().getFullYear();
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate.getMonth() === monthMap[monthName] && 
                 eventDate.getFullYear() === currentYear;
        });
      }
    }
    
    // Standard date range filtering
    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0); // Start of the day
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDateObj;
      });
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of the day
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart <= endDateObj;
      });
    }
    
    // Filter by project if specified in filters
    const projectFilter = filters?.find(f => f.startsWith('project:'));
    if (projectFilter) {
      const projectName = projectFilter.split(':')[1].toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.project && 
        (typeof event.project === 'string' ? 
          event.project.toLowerCase().includes(projectName) : 
          (typeof event.project === 'object' && event.project !== null && 'name' in event.project ? 
            (event.project as any).name.toLowerCase().includes(projectName) : false))
      );
    }
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      const lowercasedQuery = query.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(lowercasedQuery) || 
        (event.description && event.description.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    return filteredEvents;
  } catch (error) {
    console.error("Error fetching user events:", error);
    return [];
  }
};

/**
 * Get tasks for a specific user
 * @param userId User ID
 * @param status Optional status filter ('todo', 'in-progress', 'done', etc.)
 * @param dueDate Optional due date filter (YYYY-MM-DD)
 * @param query Optional text query
 * @param filters Optional additional filters like 'priority:high', 'upcoming', 'overdue', 'project:name', etc.
 */
export const getUserTasks = async (
  userId: string,
  status?: string,
  dueDate?: string,
  query?: string,
  filters?: string[]
): Promise<any[]> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // Get tasks using the existing service (follows MCP pattern)
    const tasks = await fetchTasks();
    
    // Apply filters
    let filteredTasks = [...tasks];
    
    // Handle upcoming/overdue filter
    if (filters?.includes('upcoming')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      filteredTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= today && task.status !== 'done';
      });
    }
    
    if (filters?.includes('overdue')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      filteredTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate < today && task.status !== 'done';
      });
    }
    
    // Handle priority filter - e.g., 'priority:high'
    const priorityFilter = filters?.find(f => f.startsWith('priority:'));
    if (priorityFilter) {
      const priority = priorityFilter.split(':')[1].toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.priority && task.priority.toLowerCase() === priority
      );
    }
    
    // Handle project filter - e.g., 'project:website'
    const projectFilter = filters?.find(f => f.startsWith('project:'));
    if (projectFilter) {
      const projectName = projectFilter.split(':')[1].toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        if (!task.project) return false;
        
        // Handle both string and object project references
        const taskProjectName = typeof task.project === 'string' ? 
          task.project : 
          (task.project && typeof task.project === 'object' && 'name' in task.project ? 
            (task.project as any).name : '');
            
        return taskProjectName.toLowerCase().includes(projectName);
      });
    }
    
    // Filter by status if provided
    if (status) {
      filteredTasks = filteredTasks.filter(task => 
        task.status && task.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by due date if provided
    if (dueDate) {
      const targetDate = new Date(dueDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filteredTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDueDate = new Date(task.due_date);
        return taskDueDate >= targetDate && taskDueDate < nextDay;
      });
    }
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      const lowercasedQuery = query.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(lowercasedQuery) || 
        (task.description && task.description.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    return filteredTasks;
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return [];
  }
};

/**
 * Get projects for a specific user
 * @param userId User ID
 * @param status Optional status filter ('active', 'completed', etc.)
 * @param query Optional text query
 */
export const getUserProjects = async (
  userId: string,
  status?: string,
  query?: string
): Promise<any[]> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    let projectQuery = supabase
      .from('projects')
      .select('*')
      .eq('user', user.id);
    
    // Filter by status if provided
    if (status) {
      projectQuery = projectQuery.eq('status', status);
    }
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      projectQuery = projectQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    
    const { data: projects, error } = await projectQuery.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user projects:", error);
      return [];
    }
    
    return projects || [];
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
};

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // Enhanced project matching - handle both UUID and project names
    let actualProjectId = projectId;
    
    // Check if projectId is a UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      // This is not a UUID, so it's likely a project name
      let projects = null;
      let error = null;
      
      // Try 1: Exact match (case insensitive)
      ({ data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', user.id)
        .ilike('name', projectId)
        .limit(1));
      
      // Try 2: Partial match if exact match fails
      if (!projects || projects.length === 0) {
        ({ data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user', user.id)
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
            .eq('user', user.id)
            .ilike('name', `%${cleanedName}%`)
            .limit(5));
        }
      }
      
      if (error || !projects || projects.length === 0) {
        return {
          tasks: [],
          events: [],
          notes: [],
          files: []
        };
      }
      
      // If multiple matches, prefer exact or closest match
      if (projects.length > 1) {
        const exactMatch = projects.find(p => p.name.toLowerCase() === projectId.toLowerCase());
        if (exactMatch) {
          actualProjectId = exactMatch.id;
        } else {
          // Find the shortest name (likely the best match)
          const bestMatch = projects.reduce((prev, curr) => 
            prev.name.length <= curr.name.length ? prev : curr
          );
          actualProjectId = bestMatch.id;
        }
      } else {
        actualProjectId = projects[0].id;
      }
    }
    
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
 * Format a date string to a user-friendly format
 */
export const formatDateForUser = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a time string to a user-friendly format
 */
export const formatTimeForUser = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString("en-US", {
    hour: '2-digit',
    minute: '2-digit'
  });
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // Enhanced project matching (same as getProjectItems)
    let actualProjectId = projectId;
    let project;
    
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      // This is not a UUID, so it's likely a project name
      let projects = null;
      let error = null;
      
      // Try 1: Exact match (case insensitive)
      ({ data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', user.id)
        .ilike('name', projectId)
        .limit(1));
      
      // Try 2: Partial match if exact match fails
      if (!projects || projects.length === 0) {
        ({ data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user', user.id)
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
            .eq('user', user.id)
            .ilike('name', `%${cleanedName}%`)
            .limit(5));
        }
      }
      
      if (error || !projects || projects.length === 0) {
        return null;
      }
      
      // If multiple matches, prefer exact or closest match
      if (projects.length > 1) {
        const exactMatch = projects.find(p => p.name.toLowerCase() === projectId.toLowerCase());
        if (exactMatch) {
          project = exactMatch;
        } else {
          // Find the shortest name (likely the best match)
          project = projects.reduce((prev, curr) => 
            prev.name.length <= curr.name.length ? prev : curr
          );
        }
      } else {
        project = projects[0];
      }
      
      actualProjectId = project.id;
    } else {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user', user.id)
        .single();
      
      if (error || !projectData) {
        return null;
      }
      
      project = projectData;
    }
    
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // Enhanced project matching (same as getProjectProgress)
    let actualProjectId = projectId;
    let projectName = projectId;
    
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      // This is not a UUID, so it's likely a project name
      let projects = null;
      let error = null;
      
      // Try 1: Exact match (case insensitive)
      ({ data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', user.id)
        .ilike('name', projectId)
        .limit(1));
      
      // Try 2: Partial match if exact match fails
      if (!projects || projects.length === 0) {
        ({ data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user', user.id)
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
            .eq('user', user.id)
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
      
      actualProjectId = selectedProject.id;
      projectName = selectedProject.name;
    } else {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user', user.id)
        .single();
      
      if (error || !projectData) {
        return null;
      }
      
      projectName = projectData.name;
    }
    
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

/**
 * Get files for a specific user
 * @param userId User ID
 * @param nameSearch Optional name search query
 * @param fileType Optional file type filter (e.g., 'pdf', 'image', etc.)
 * @param projectName Optional project name filter
 */
export const getUserFiles = async (
  userId: string,
  nameSearch?: string,
  fileType?: string,
  projectName?: string
): Promise<Array<{
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
  project?: any;
  task?: any;
  event?: any;
}>> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    let query = supabase
      .from('files')
      .select(`
        *,
        project:projects(*),
        task:tasks(*),
        event:events(*)
      `)
      .eq('user', user.id);
    
    // Filter by name if provided
    if (nameSearch && nameSearch.trim() !== '') {
      query = query.ilike('name', `%${nameSearch}%`);
    }
    
    // Filter by file type if provided
    if (fileType && fileType.trim() !== '') {
      query = query.ilike('type', `%${fileType}%`);
    }
    
    const { data: files, error } = await query.order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user files:", error);
      return [];
    }
    
    let filteredFiles = files || [];
    
    // Filter by project name if provided (done in application layer for flexibility)
    if (projectName && projectName.trim() !== '') {
      const lowercaseProjectName = projectName.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.project && 
        file.project.name && 
        file.project.name.toLowerCase().includes(lowercaseProjectName)
      );
    }
    
    return filteredFiles;
  } catch (error) {
    console.error("Error fetching user files:", error);
    return [];
  }
};

/**
 * Get notes for a specific user
 * @param userId User ID
 * @param contentSearch Optional content search query
 * @param projectName Optional project name filter
 * @param pinnedOnly Optional flag to only return pinned notes
 */
export const getUserNotes = async (
  userId: string,
  contentSearch?: string,
  projectName?: string,
  pinnedOnly?: boolean
): Promise<Array<{
  id: string;
  content: string;
  last_updated: string;
  pinned: boolean;
  project?: any;
}>> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    let query = supabase
      .from('notes')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('user', user.id);
    
    // Filter by content if provided
    if (contentSearch && contentSearch.trim() !== '') {
      query = query.ilike('content', `%${contentSearch}%`);
    }
    
    // Filter by pinned status if requested
    if (pinnedOnly === true) {
      query = query.eq('pinned', true);
    }
    
    const { data: notes, error } = await query.order('last_updated', { ascending: false });
    
    if (error) {
      console.error("Error fetching user notes:", error);
      return [];
    }
    
    let filteredNotes = notes || [];
    
    // Filter by project name if provided (done in application layer for flexibility)
    if (projectName && projectName.trim() !== '') {
      const lowercaseProjectName = projectName.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.project && 
        note.project.name && 
        note.project.name.toLowerCase().includes(lowercaseProjectName)
      );
    }
    
    return filteredNotes;
  } catch (error) {
    console.error("Error fetching user notes:", error);
    return [];
  }
}; 