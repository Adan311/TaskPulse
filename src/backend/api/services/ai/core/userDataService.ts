/**
 * User Data Service - Re-exports from modular data service components
 * This follows the MCP pattern for data access with explicit user permission checks
 */

// Re-export data query functions
export {
  getUserEvents,
  getUserTasks,
  getUserProjects,
  getUserFiles,
  getUserNotes
} from './dataQueries';

// Re-export project operation functions
export {
  getProjectItems,
  getProjectProgress,
  getProjectTimeline
} from './projectOperations';

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