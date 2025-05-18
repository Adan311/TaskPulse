import { supabase } from "@/integrations/supabase/client";
import { getEvents } from "@/backend/api/services/eventService";
import { fetchTasks } from "@/backend/api/services/task.service";

/**
 * Service that allows the AI to safely query user-specific data
 * This follows the MCP pattern for data access with explicit user permission checks
 */

/**
 * Get events for a specific user within a date range
 */
export const getUserEvents = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  query?: string
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
    
    if (startDate) {
      const startDateObj = new Date(startDate);
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDateObj;
      });
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart <= endDateObj;
      });
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
 */
export const getUserTasks = async (
  userId: string,
  status?: string,
  dueDate?: string,
  query?: string
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