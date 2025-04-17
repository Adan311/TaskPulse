
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
 * as well as push local events to Google Calendar
 * 
 * @returns {Promise<{success: boolean, imported?: number, pushed?: number, error?: string}>} Result of the sync operation
 */
export async function syncWithGoogleCalendar(): Promise<{success: boolean, imported?: number, pushed?: number, error?: string}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user found, cannot sync with Google Calendar");
      return { success: false, error: "You must be signed in to sync with Google Calendar" };
    }
    
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      console.log("Google Calendar not connected, skipping sync");
      return { success: false, error: "Google Calendar is not connected to your account" };
    }
    
    console.log("Invoking edge function for Google Calendar sync");
    
    // Call the edge function to sync events
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'syncEvents',
        userId: user.id
      },
    });
    
    if (error) {
      console.error("Error syncing with Google Calendar:", error);
      return { success: false, error: error.message || "Failed to sync with Google Calendar" };
    }
    
    console.log("Google Calendar sync response:", data);
    return { 
      success: true,
      imported: data?.imported || 0,
      pushed: data?.pushed || 0
    };
  } catch (error) {
    console.error("Exception syncing with Google Calendar:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during sync" 
    };
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
