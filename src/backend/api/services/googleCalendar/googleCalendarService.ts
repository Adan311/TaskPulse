import { supabase } from '../../../database/client';
import { GoogleCalendarAuth } from './googleCalendarAuth';
import { GoogleCalendarSync } from './googleCalendarSync';
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

/**
 * Checks if the user has connected their Google Calendar
 */
export async function hasGoogleCalendarConnected(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user, cannot check Google Calendar connection");
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
  } catch (error) {
    console.error("Exception checking Google Calendar connection:", error);
    return false;
  }
}

/**
 * Gets the list of connected Google Calendars
 */
export async function getConnectedCalendars(): Promise<any[]> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No authenticated user, cannot get connected calendars");
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
  } catch (error) {
    console.error("Exception fetching connected calendars:", error);
    return [];
  }
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
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("No user found, cannot sync with Google Calendar");
      return { success: false, error: "You must be signed in to sync with Google Calendar" };
    }
    
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      console.log("Google Calendar not connected, skipping sync");
      return { success: false, error: "Google Calendar is not connected to your account. Please connect your calendar first." };
    }
    
    console.log("Invoking edge function for Google Calendar sync");
    
    // Call the edge function to sync events - with explicit headers option to avoid CORS issues
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'syncEvents',
        userId: user.id
      },
      headers: {} // Explicitly provide empty headers to avoid custom headers
    });
    
    if (error) {
      console.error("Error syncing with Google Calendar:", error);
      return { 
        success: false, 
        error: error.message || "Failed to sync with Google Calendar. Please try reconnecting your account." 
      };
    }
    
    if (!data || !data.success) {
      console.error("Sync returned unsuccessful status:", data);
      return { 
        success: false, 
        error: data?.error || "Calendar sync failed. Please try reconnecting your Google Calendar." 
      };
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
      error: error instanceof Error ? error.message : "Unknown error during sync. Please try again later." 
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