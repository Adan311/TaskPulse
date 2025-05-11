import { processAllRecurringTasks } from './task.service';
import { processAllRecurringEvents } from './eventService';

// Add a flag and timer ID to track initialization status
let isInitialized = false;
let intervalId: number | null = null;
let initialTimeoutId: number | null = null;

/**
 * Check and process all recurring tasks and events.
 * This should be called by a background process or polling mechanism.
 */
export const processAllRecurringItems = async (): Promise<void> => {
  try {
    console.log("Processing all recurring items...");
    
    // Process tasks first
    await processAllRecurringTasks();
    
    // Then process events
    await processAllRecurringEvents();
    
    console.log("Successfully processed all recurring items");
  } catch (error) {
    console.error("Error in processAllRecurringItems:", error);
    // Don't throw the error as it would break the processing chain
  }
};

/**
 * Initialize the recurrence processing system.
 * This should be called when the application starts.
 */
export const initRecurrenceProcessing = (intervalMinutes: number = 60): () => void => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log("Recurrence processing system already initialized - ignoring duplicate call");
    return () => {}; // Return empty cleanup function
  }
  
  console.log(`Initializing recurrence processing system with ${intervalMinutes} minute interval`);
  isInitialized = true;
  
  // Clear any existing timers (should never happen but just in case)
  if (initialTimeoutId !== null) {
    clearTimeout(initialTimeoutId);
    initialTimeoutId = null;
  }
  
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  // Run immediately on startup with a short delay
  initialTimeoutId = setTimeout(() => {
    console.log("Running initial recurrence processing...");
    processAllRecurringItems().catch(error => {
      console.error("Error in initial recurrence processing:", error);
    });
    // Clear the reference as we're done with it
    initialTimeoutId = null;
  }, 5000) as unknown as number; // Delay by 5 seconds to ensure all services are ready
  
  // Set interval for future processing
  intervalId = setInterval(() => {
    console.log("Running scheduled recurrence processing...");
    processAllRecurringItems().catch(error => {
      console.error("Error in scheduled recurrence processing:", error);
    });
  }, intervalMinutes * 60 * 1000) as unknown as number;
  
  // Return a cleanup function that can be used to stop the processing
  return () => {
    if (!isInitialized) return; // Already cleaned up
    
    if (initialTimeoutId !== null) {
      clearTimeout(initialTimeoutId);
      initialTimeoutId = null;
    }
    
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    isInitialized = false;
    console.log("Recurrence processing system stopped");
  };
}; 