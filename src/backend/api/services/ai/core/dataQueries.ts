import { supabase } from "../../../../database/client";
import { getEvents } from "@/backend/api/services/event.service";
import { fetchTasks } from "@/backend/api/services/task.service";
import { fetchNotesWithProjects } from "@/backend/api/services/notes.service";
import { validateUser } from "@/shared/utils/authUtils";

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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
    // Use the new notes service (follows MCP pattern)
    const notes = await fetchNotesWithProjects(contentSearch, projectName, pinnedOnly);
    
    // Map to the expected format for AI integration
    return notes.map(note => ({
      id: note.id,
      content: note.content || '',
      last_updated: note.last_updated || new Date().toISOString(),
      pinned: note.pinned || false,
      project: note.project_data
    }));
  } catch (error) {
    console.error("Error fetching user notes:", error);
    return [];
  }
}; 