
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/services/eventService";

export interface GoogleCalendarTokens {
  id: string;
  email: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Fetch the list of connected Google Calendars for the current user
export async function getConnectedCalendars(): Promise<GoogleCalendarTokens[]> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Explicitly define the return type and avoid deep type nesting
  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching connected calendars:", error);
    throw error;
  }

  // Type assertion to resolve deep type instantiation
  return (data || []) as GoogleCalendarTokens[];
}

// Check if user has Google Calendar connected
export async function hasGoogleCalendarConnected(): Promise<boolean> {
  const calendars = await getConnectedCalendars();
  return calendars.length > 0;
}

// Sync events from Google Calendar
export async function syncEventsFromGoogleCalendar() {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke(
      "google-calendar-sync",
      {
        body: { 
          action: "sync",
          userId: user.id
        },
      }
    );

    if (error) {
      throw new Error(`Failed to sync events: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error syncing Google Calendar events:", error);
    throw error;
  }
}

// Create or update an event in Google Calendar
export async function saveEventToGoogleCalendar(event: Event): Promise<void> {
  try {
    // Check if we have a Google Calendar connected
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      return; // No Google Calendar connected, skip sync
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const action = event.google_event_id ? "updateEvent" : "createEvent";

    const { data, error } = await supabase.functions.invoke(
      "google-calendar-auth",
      {
        body: { 
          action,
          event,
          userId: user.id
        },
      }
    );

    if (error) {
      throw new Error(`Failed to save event to Google Calendar: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error saving event to Google Calendar:", error);
    throw error;
  }
}

// Delete an event from Google Calendar
export async function deleteEventFromGoogleCalendar(eventId: string): Promise<void> {
  try {
    // Check if we have a Google Calendar connected
    const isConnected = await hasGoogleCalendarConnected();
    if (!isConnected) {
      return; // No Google Calendar connected, skip sync
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke(
      "google-calendar-auth",
      {
        body: { 
          action: "deleteEvent",
          eventId,
          userId: user.id
        },
      }
    );

    if (error) {
      throw new Error(`Failed to delete event from Google Calendar: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error deleting event from Google Calendar:", error);
    throw error;
  }
}

// Disconnect a Google Calendar
export async function disconnectGoogleCalendar(calendarId: string) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase.functions.invoke(
      "google-calendar-auth",
      {
        body: { 
          action: "revoke", 
          calendarId,
          userId: user.id
        },
      }
    );

    if (error) {
      throw new Error(`Failed to disconnect calendar: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    throw error;
  }
}
