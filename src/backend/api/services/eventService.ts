/**
 * Event Service - Re-exports from modular event components
 * This file serves as the main entry point for all event-related functionality
 */

// Re-export utility functions and types from operations module
export {
  formatEventForFrontend,
  formatEventForDatabase,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getGoogleCalendarEvents
} from './events/eventOperations';

// Re-export recurring event functions from recurrence module
export {
  createRecurringEvent,
  getNextEventOccurrenceDate,
  generateFutureRecurringEventInstances,
  processAllRecurringEvents,
  updateRecurringEventInstances
} from './events/eventRecurrence';

// Re-export the frontend Event type
export type { Event } from "@/frontend/types/calendar";
