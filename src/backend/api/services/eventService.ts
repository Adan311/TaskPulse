
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { Event as DbEvent } from "@/backend/types/supabaseSchema";

// Convert database event to frontend event format
function formatEventForFrontend(dbEvent: any): FrontendEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    color: dbEvent.color,
    project: dbEvent.project,
    googleEventId: dbEvent.google_event_id,
    source: dbEvent.source,
    participants: [] // Initialize with empty array
  };
}

// Convert frontend event to database format
function formatEventForDatabase(event: Partial<FrontendEvent>): Partial<DbEvent> {
  const dbEvent: any = {};
  
  if (event.title !== undefined) dbEvent.title = event.title;
  if (event.description !== undefined) dbEvent.description = event.description;
  if (event.startTime !== undefined) dbEvent.start_time = event.startTime;
  if (event.endTime !== undefined) dbEvent.end_time = event.endTime;
  if (event.color !== undefined) dbEvent.color = event.color;
  if (event.project !== undefined) dbEvent.project = event.project;
  if (event.googleEventId !== undefined) dbEvent.google_event_id = event.googleEventId;
  if (event.source !== undefined) dbEvent.source = event.source;
  
  return dbEvent;
}

export async function getEvents(): Promise<FrontendEvent[]> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .filter("user", "eq", user.id);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return (data || []).map(formatEventForFrontend);
}

export async function getEventById(id: string): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .filter("id", "eq", id)
    .filter("user", "eq", user.id)
    .limit(1);

  if (error) {
    console.error("Error fetching event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with id ${id} not found`);
  }

  return formatEventForFrontend(data[0]);
}

export async function createEvent(event: Omit<FrontendEvent, "id">): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const newEventId = uuidv4();
  const newEvent = {
    ...formatEventForDatabase(event),
    id: newEventId,
    source: event.source || "app",
    user: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("events")
    .insert(newEvent)
    .select();

  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create event: No data returned");
  }

  // Sync to Google Calendar if connected
  try {
    // Convert to DbEvent format for Google Calendar sync
    const formattedData = {
      ...data[0],
      start_time: data[0].start_time,
      end_time: data[0].end_time,
      google_event_id: data[0].google_event_id,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    };
    await saveEventToGoogleCalendar(formattedData);
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return formatEventForFrontend(data[0]);
}

export async function updateEvent(id: string, event: Partial<FrontendEvent>): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const dbEvent = {
    ...formatEventForDatabase(event),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("events")
    .update(dbEvent)
    .filter("id", "eq", id)
    .filter("user", "eq", user.id)
    .select();

  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with id ${id} not found or you don't have permission to update it`);
  }

  // Sync to Google Calendar if connected
  try {
    // Convert to DbEvent format for Google Calendar sync
    const formattedData = {
      ...data[0],
      start_time: data[0].start_time,
      end_time: data[0].end_time,
      google_event_id: data[0].google_event_id,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    };
    await saveEventToGoogleCalendar(formattedData);
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return formatEventForFrontend(data[0]);
}

export async function deleteEvent(id: string): Promise<boolean> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Delete from Google Calendar first if it's linked
  try {
    await deleteEventFromGoogleCalendar(id);
  } catch (syncError) {
    console.error("Error deleting from Google Calendar:", syncError);
    // Continue even if sync fails
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .filter("id", "eq", id)
    .filter("user", "eq", user.id);

  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }

  return true;
}

export async function getGoogleCalendarEvents(): Promise<FrontendEvent[]> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .filter("source", "eq", "google")
    .filter("user", "eq", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }

  return (data || []).map(formatEventForFrontend);
}

// Re-export the frontend Event type
export type { FrontendEvent as Event };
