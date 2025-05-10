import { useEffect, useRef } from 'react';
import { checkPendingReminders, markReminderAsSent } from '@/backend/api/services/reminder.service';
import { showReminderNotification } from '@/frontend/components/ui/Notification';

/**
 * Custom hook to check for pending reminders and display them
 * @param intervalMs - Interval in milliseconds between reminder checks (default: 60000, which is 1 minute)
 */
export const useReminders = (intervalMs = 60000) => {
  // Use a ref to track if we're already checking for reminders
  const isChecking = useRef(false);

  useEffect(() => {
    // Function to check for pending reminders
    const checkForReminders = async () => {
      // Prevent multiple concurrent checks
      if (isChecking.current) return;
      
      try {
        isChecking.current = true;
        
        // Get pending reminders
        const reminders = await checkPendingReminders();
        
        // Show notifications for each reminder
        for (const reminder of reminders) {
          // Show the notification
          showReminderNotification(reminder);
          
          // Mark the reminder as sent to avoid showing it again
          await markReminderAsSent(reminder.id, reminder.type);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      } finally {
        isChecking.current = false;
      }
    };

    // Initial check when component mounts
    checkForReminders();
    
    // Set up interval to check regularly
    const intervalId = setInterval(checkForReminders, intervalMs);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [intervalMs]);

  // No need to return anything, this hook is just for the side effect
}; 