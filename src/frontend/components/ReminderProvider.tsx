import React, { ReactNode } from 'react';
import { useReminders } from '../hooks/useReminders';

interface ReminderProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes reminder checking
 * This ensures reminders are checked regularly throughout the application
 */
export function ReminderProvider({ children }: ReminderProviderProps) {
  // Initialize reminder checking
  useReminders();
  
  // Simply render chi - the useReminders hook handles the reminder checking
  return <>{children}</>;
} 