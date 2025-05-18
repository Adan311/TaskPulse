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
    if (filters?.includes('upcoming') || (!startDate && !endDate && !filters?.includes('past'))) {
      // Default behavior is to show upcoming events if no specific filter is set
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
      filteredTasks = filteredTasks.filter(task => 
        task.project && 
        (typeof task.project === 'string' ? 
          task.project.toLowerCase().includes(projectName) : 
          (typeof task.project === 'object' && task.project !== null && 'name' in task.project ? 
            (task.project as any).name.toLowerCase().includes(projectName) : false))
      );
    }
    
    // Filter by status if provided
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    // Filter by due date if provided
    if (dueDate) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDueDate = new Date(task.due_date).toISOString().split('T')[0];
        return taskDueDate === dueDate;
      });
    }
    
    // Handle date range filters
    const dueDateAfter = filters?.find(f => f.startsWith('due_after:'));
    if (dueDateAfter) {
      const dateStr = dueDateAfter.split(':')[1];
      try {
        const afterDate = new Date(dateStr);
        afterDate.setHours(0, 0, 0, 0);
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date) return false;
          const taskDueDate = new Date(task.due_date);
          return taskDueDate >= afterDate;
        });
      } catch (e) {
        console.error("Invalid date format for due_after filter:", dateStr);
      }
    }
    
    const dueDateBefore = filters?.find(f => f.startsWith('due_before:'));
    if (dueDateBefore) {
      const dateStr = dueDateBefore.split(':')[1];
      try {
        const beforeDate = new Date(dateStr);
        beforeDate.setHours(23, 59, 59, 999);
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date) return false;
          const taskDueDate = new Date(task.due_date);
          return taskDueDate <= beforeDate;
        });
      } catch (e) {
        console.error("Invalid date format for due_before filter:", dateStr);
      }
    }
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      const lowercasedQuery = query.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(lowercasedQuery) || 
        (task.description && task.description.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // Sort by due date (ascending, null dates at the end)
    filteredTasks.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      return dateA.getTime() - dateB.getTime();
    });
    
    return filteredTasks;
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return [];
  }
};

/**
 * Get projects for a specific user
 * @param userId User ID
 * @param status Optional status filter ('active', 'completed', 'on-hold')
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
    
    // Query projects directly from the database
    let projectQuery = supabase
      .from('projects')
      .select('*')
      .eq('user', user.id);
    
    // Apply status filter if provided
    if (status) {
      projectQuery = projectQuery.eq('status', status);
    }
    
    const { data: projects, error } = await projectQuery;
    
    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
    
    let filteredProjects = projects || [];
    
    // Filter by query if provided
    if (query && query.trim() !== '') {
      const lowercasedQuery = query.toLowerCase();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(lowercasedQuery) || 
        (project.description && project.description.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // Sort by due_date (if applicable) or name
    filteredProjects.sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return filteredProjects;
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
};

/**
 * Get all items (tasks, events, notes) related to a specific project
 * @param userId User ID
 * @param projectId Project ID or name
 */
export const getProjectItems = async (
  userId: string,
  projectId: string
): Promise<{tasks: any[], events: any[], notes: any[]}> => {
  try {
    // Verify the user making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    // First check if projectId is actually a name
    let actualProjectId = projectId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      // This is not a UUID, so it's likely a project name
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id')
        .eq('user', user.id)
        .ilike('name', `%${projectId}%`)
        .limit(1);
      
      if (error || !projects || projects.length === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }
      
      actualProjectId = projects[0].id;
    }
    
    // Now fetch all related items
    const [tasksResult, eventsResult, notesResult] = await Promise.all([
      // Get tasks for this project
      supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      // Get events for this project
      supabase
        .from('events')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId),
        
      // Get notes for this project
      supabase
        .from('notes')
        .select('*')
        .eq('user', user.id)
        .eq('project', actualProjectId)
    ]);
    
    const tasks = tasksResult.data || [];
    const events = eventsResult.data || [];
    const notes = notesResult.data || [];
    
    return {
      tasks,
      events,
      notes
    };
  } catch (error) {
    console.error("Error fetching project items:", error);
    return {
      tasks: [],
      events: [],
      notes: []
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