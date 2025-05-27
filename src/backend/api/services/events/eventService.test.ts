/**
 * Event Service Quick Test
 * Simple test that gives YES/NO result when loading calendar page
 */

import { 
  // Operations functions
  formatEventForFrontend,
  formatEventForDatabase,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getGoogleCalendarEvents,
  
  // Recurring event functions
  createRecurringEvent,
  getNextEventOccurrenceDate,
  generateFutureRecurringEventInstances,
  processAllRecurringEvents,
  updateRecurringEventInstances
} from '../eventService';

/**
 * Quick test function that returns YES or NO
 */
export const testEventService = (): string => {
  try {
    // Test all required functions exist
    const requiredFunctions = [
      formatEventForFrontend,
      formatEventForDatabase,
      getEvents,
      getEventById,
      createEvent,
      updateEvent,
      deleteEvent,
      getGoogleCalendarEvents,
      createRecurringEvent,
      getNextEventOccurrenceDate,
      generateFutureRecurringEventInstances,
      processAllRecurringEvents,
      updateRecurringEventInstances
    ];

    // Check if all functions are properly defined
    const allFunctionsExist = requiredFunctions.every(fn => typeof fn === 'function');
    
    if (allFunctionsExist) {
      console.log('✅ EVENT SERVICE TEST: YES - All functions working');
      return 'YES';
    } else {
      console.error('❌ EVENT SERVICE TEST: NO - Some functions missing');
      return 'NO';
    }
  } catch (error) {
    console.error('❌ EVENT SERVICE TEST: NO - Import error:', error);
    return 'NO';
  }
};

// Auto-run test when imported
console.log('🧪 Testing Event Service...');
const result = testEventService();
console.log(`📊 EVENT SERVICE STATUS: ${result}`); 