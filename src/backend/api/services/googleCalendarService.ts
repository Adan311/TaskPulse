
import { supabase } from '@/integrations/supabase/client';
import { GoogleCalendarAuth } from './googleCalendar/googleCalendarAuth';
import { GoogleCalendarSync } from './googleCalendar/googleCalendarSync';

/**
 * Checks if the user has connected their Google Calendar
 */
export async function hasGoogleCalendarConnected(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Use proper typing for queries with type assertion
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('id')
    .eq('user_id', user.id as any)
    .limit(1);

  if (error) {
    console.error('Error checking Google Calendar connection:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Gets the list of connected Google Calendars
 */
export async function getConnectedCalendars(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Use proper typing for queries with type assertion
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', user.id as any);

  if (error) {
    console.error('Error fetching connected calendars:', error);
    return [];
  }

  return data || [];
}

/**
 * Force sync with Google Calendar
 * This will pull the latest events from Google Calendar and update the local database
 */
export async function syncWithGoogleCalendar(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user found, cannot sync with Google Calendar");
      return false;
    }
    
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      console.log("Google Calendar not connected, skipping sync");
      return false;
    }
    
    // Call the edge function to sync events
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'syncEvents',
        userId: user.id
      },
    });
    
    if (error) {
      console.error("Error syncing with Google Calendar:", error);
      return false;
    }
    
    console.log("Google Calendar sync response:", data);
    return true;
  } catch (error) {
    console.error("Exception syncing with Google Calendar:", error);
    return false;
  }
}

// Export all functionality from sub-modules
export const { 
  initiateGoogleCalendarAuth,
  revokeGoogleCalendarAccess 
} = GoogleCalendarAuth;

export const {
  saveEventToGoogleCalendar,
  deleteEventFromGoogleCalendar
} = GoogleCalendarSync;
