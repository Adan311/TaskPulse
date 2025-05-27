/**
 * Task Service - Re-exports from modular task components
 * This file serves as the main entry point for all task-related functionality
 */

// Re-export utility functions and types from operations module
export {
  mapDbTaskToTask,
  updateProjectProgress,
  fetchTasks,
  fetchProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  archiveTask,
  bulkArchiveTasks,
  autoArchiveOldTasks,
  restoreTask,
  deleteTaskPermanently,
  unlinkTaskFromProject
} from './tasks/taskOperations';

// Re-export recurring task functions from recurrence module
export {
  createRecurringTask,
  getNextOccurrenceDate,
  generateFutureRecurringTaskInstances,
  refreshRecurringTaskStatus,
  processAllRecurringTasks,
  updateRecurringTaskInstances
} from './tasks/taskRecurrence';
