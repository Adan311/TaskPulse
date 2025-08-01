import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format 
} from 'date-fns';

export interface RecurrenceConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  days?: string[];
  endDate?: string;
  count?: number;
}

/**
 * Unified recurrence logic for both tasks and events
 */
export const getNextOccurrenceDate = (
  fromDate: Date,
  config: RecurrenceConfig
): Date | null => {
  if (!config.pattern) {
    return null;
  }

  const baseDate = new Date(fromDate);
  let nextDate: Date;

  switch (config.pattern) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekly':
      if (config.days && config.days.length > 0) {
        // Handle both formats: ['Sunday', 'Monday'] and ['sunday', 'monday']
        const currentDay = baseDate.getDay();
        
        // Normalize day names and convert to indices
        const selectedDayIndices = config.days.map(day => {
          const normalizedDay = day.toLowerCase();
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          
          // Handle both formats: 'Sunday' and 'sunday'
          if (dayMap[normalizedDay] !== undefined) {
            return dayMap[normalizedDay];
          }
          
          // Handle capitalized format
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const index = daysOfWeek.indexOf(day);
          return index !== -1 ? index : dayMap[normalizedDay];
        }).filter(index => index !== undefined).sort((a, b) => a - b);

        // Find the next day in the current week
        let nextDay = selectedDayIndices.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          // Next occurrence is in the current week
          nextDate = addDays(startOfDay(baseDate), nextDay - currentDay);
        } else {
          // Next occurrence is in the next week
          const firstDayNextWeek = selectedDayIndices[0];
          const daysUntilNextWeek = 7 - currentDay + firstDayNextWeek;
          nextDate = addDays(startOfDay(baseDate), daysUntilNextWeek);
        }
      } else {
        // Simple weekly recurrence
        nextDate = addWeeks(baseDate, 1);
      }
      break;
    case 'monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(baseDate, 1);
      break;
    default:
      return null;
  }

  // Check if we've exceeded the end date
  if (config.endDate && isAfter(nextDate, parseISO(config.endDate))) {
    return null;
  }

  return nextDate;
};

/**
 * Helper function to validate recurrence configuration
 */
export const validateRecurrenceConfig = (config: RecurrenceConfig): boolean => {
  if (!config.pattern) return false;
  
  if (config.pattern === 'weekly' && config.days) {
    // Validate day names
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validDaysCapitalized = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return config.days.every(day => 
      validDays.includes(day.toLowerCase()) || validDaysCapitalized.includes(day)
    );
  }
  
  return true;
};

/**
 * Helper function to normalize recurrence days to lowercase format
 */
export const normalizeRecurrenceDays = (days: string[]): string[] => {
  return days.map(day => day.toLowerCase());
};

/**
 * Initialize recurrence processing system
 * Sets up periodic processing of recurring tasks and events
 */
export const initRecurrenceProcessing = (intervalMinutes: number = 60): (() => void) => {
  console.log(`Initializing recurrence processing with ${intervalMinutes} minute intervals`);
  
  // Process immediately on startup
  processRecurringItems();
  
  // Set up periodic processing
  const intervalId = setInterval(() => {
    processRecurringItems();
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  
  // Return cleanup function
  return () => {
    console.log('Cleaning up recurrence processing interval');
    clearInterval(intervalId);
  };
};

/**
 * Process all recurring items (tasks and events)
 * This function is called periodically to generate future instances
 */
const processRecurringItems = async (): Promise<void> => {
  try {
    console.log('Processing recurring items...');
    
    // Import the processing functions dynamically to avoid circular dependencies
    const { processAllRecurringTasks } = await import('./task.service');
    const { processAllRecurringEvents } = await import('./event.service');
    
    // Process both tasks and events
    await Promise.all([
      processAllRecurringTasks(),
      processAllRecurringEvents()
    ]);
    
    console.log('Recurring items processing completed');
  } catch (error) {
    console.error('Error processing recurring items:', error);
  }
}; 