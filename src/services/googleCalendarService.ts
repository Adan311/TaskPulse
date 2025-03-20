
import { supabase } from "@/integrations/supabase/client";

export interface GoogleCalendarTokens {
  id: string;
  email: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Fetch the list of connected Google Calendars
export async function getConnectedCalendars(): Promise<GoogleCalendarTokens[]> {
  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("*");

  if (error) {
    console.error("Error fetching connected calendars:", error);
    throw error;
  }

  return data || [];
}

// Sync events from Google Calendar
export async function syncEventsFromGoogleCalendar() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "google-calendar-sync",
      {
        body: { action: "sync" },
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

// Disconnect a Google Calendar
export async function disconnectGoogleCalendar(calendarId: string) {
  try {
    const { error } = await supabase.functions.invoke(
      "google-calendar-auth",
      {
        body: { action: "revoke", calendarId },
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
