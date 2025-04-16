
import { supabase } from '@/integrations/supabase/client';
import { DatabaseEvent } from '@/backend/types/supabaseSchema';

/**
 * Checks if the user has connected their Google Calendar
 */
export async function hasGoogleCalendarConnected(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Use proper typing for filter method
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('id')
    .filter('user_id', 'eq', user.id)
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

  // Use proper typing for filter method
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .filter('user_id', 'eq', user.id);

  if (error) {
    console.error('Error fetching connected calendars:', error);
    return [];
  }

  return data || [];
}

/**
 * Initiates the Google Calendar authorization flow
 * This function is called by the GoogleCalendarButton component
 */
export async function initiateGoogleCalendarAuth(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to connect Google Calendar");
      return null;
    }
    
    const origin = window.location.origin;
    const redirectUri = `${origin}/api/google-calendar-callback`;
    
    // Call the edge function to get the auth URL
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'init',
        userId: user.id,
        origin,
        redirectUri
      }
    });
    
    if (error) {
      console.error("Error initiating Google Calendar auth:", error);
      return null;
    }
    
    return data?.authUrl || null;
  } catch (err) {
    console.error("Exception initiating Google Calendar auth:", err);
    return null;
  }
}

/**
 * Saves an event to Google Calendar
 */
export async function saveEventToGoogleCalendar(event: DatabaseEvent): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Check if user has connected Google Calendar
  const isConnected = await hasGoogleCalendarConnected();
  if (!isConnected) {
    // No connection found, silently return
    return false;
  }
  
  // Check if this is a Google-sourced event, if so, don't sync back
  if (event.source === 'google') {
    return false;
  }

  try {
    // Call the edge function to save the event to Google Calendar
    const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
      body: { action: 'saveEvent', event: event },
    });

    if (error) {
      console.error('Error saving event to Google Calendar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception saving event to Google Calendar:', error);
    return false;
  }
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteEventFromGoogleCalendar(eventId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Check if user has connected Google Calendar
  const isConnected = await hasGoogleCalendarConnected();
  if (!isConnected) {
    // No connection found, silently return
    return false;
  }

  try {
    // First, get the event to check if it's a Google-sourced event
    const { data, error } = await supabase
      .from('events')
      .select('source, google_event_id')
      .filter('id', 'eq', eventId)
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error('Error fetching event for deletion:', error);
      return false;
    }

    const event = data[0];
    
    // Don't delete Google-sourced events from Google Calendar through this flow
    if (event.source === 'google') {
      return false;
    }

    // Only proceed if the event has a Google event ID
    if (!event.google_event_id) {
      return false;
    }

    // Call the edge function to delete the event from Google Calendar
    const { error: functionError } = await supabase.functions.invoke('google-calendar-sync', {
      body: { action: 'deleteEvent', googleEventId: event.google_event_id },
    });

    if (functionError) {
      console.error('Error deleting event from Google Calendar:', functionError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting event from Google Calendar:', error);
    return false;
  }
}
