
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

  // Use proper typing for queries
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('id')
    .eq('user_id', user.id)
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

  // Use proper typing for queries
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', user.id);

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
    
    // Save user ID for later use in the OAuth callback
    localStorage.setItem('googleCalendarUserId', user.id);
    
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('googleCalendarState', state);
    
    const origin = window.location.origin;
    const redirectUri = `${origin}/api/google-calendar-callback`;
    
    console.log("Initiating Google Calendar auth with:", {
      userId: user.id,
      origin,
      redirectUri,
      state
    });
    
    // Call the edge function to get the auth URL
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'init',
        userId: user.id,
        origin,
        redirectUri,
        state
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user found, cannot sync to Google Calendar");
      return false;
    }

    // Check if user has connected Google Calendar
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      console.log("Google Calendar not connected, skipping sync");
      return false;
    }
    
    // Check if this is a Google-sourced event, if so, don't sync back
    if (event.source === 'google') {
      console.log("Event is from Google, skipping sync back");
      return false;
    }

    console.log("Syncing event to Google Calendar:", event);

    // Call the edge function to save the event to Google Calendar
    const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: event.google_event_id ? 'updateEvent' : 'createEvent', 
        event: event,
        userId: user.id
      },
    });

    if (error) {
      console.error('Error saving event to Google Calendar:', error);
      return false;
    }

    console.log("Google Calendar sync response:", data);

    // If this was a new event and we got a Google event ID back, update our local record
    if (!event.google_event_id && data && data.google_event_id) {
      const { error: updateError } = await supabase
        .from("events")
        .update({ 
          google_event_id: data.google_event_id,
          source: 'app_synced'
        })
        .eq('id', event.id);
        
      if (updateError) {
        console.error('Error updating event with Google Calendar ID:', updateError);
      }
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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No user found, cannot delete from Google Calendar");
      return false;
    }

    // Check if user has connected Google Calendar
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      console.log("Google Calendar not connected, skipping delete");
      return false;
    }

    // First, get the event to check if it's a Google-sourced event
    const { data, error } = await supabase
      .from('events')
      .select('source, google_event_id')
      .eq('id', eventId)
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error('Error fetching event for deletion:', error);
      return false;
    }

    const event = data[0];
    
    // Don't delete Google-sourced events from Google Calendar through this flow
    if (event.source === 'google') {
      console.log("Event is from Google, skipping delete");
      return false;
    }

    // Only proceed if the event has a Google event ID
    if (!event.google_event_id) {
      console.log("Event has no Google ID, skipping delete");
      return false;
    }

    console.log("Deleting event from Google Calendar:", {
      eventId,
      googleEventId: event.google_event_id
    });

    // Call the edge function to delete the event from Google Calendar
    const { error: functionError } = await supabase.functions.invoke('google-calendar-auth', {
      body: { 
        action: 'deleteEvent', 
        eventId,
        googleEventId: event.google_event_id,
        userId: user.id
      },
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
