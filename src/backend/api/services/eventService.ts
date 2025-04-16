import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { Event as DbEvent } from "@/backend/types/supabaseSchema";
import { Database } from "@/integrations/supabase/types";

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

  // Use the column name approach instead of equality filter for better type safety
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user", user.id);

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

  // Use column names directly for better type safety
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user", user.id)
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
  
  // Create a properly typed database event for insertion
  const newEvent: Database['public']['Tables']['events']['Insert'] = {
    id: newEventId,
    title: event.title,
    description: event.description ?? null,
    start_time: event.startTime,
    end_time: event.endTime,
    color: event.color ?? null,
    project: event.project ?? null,
    source: event.source || "app",
    user: user.id,
    google_event_id: event.googleEventId ?? null
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
    const formattedData = data[0];
    if (formattedData) {
      await saveEventToGoogleCalendar(formattedData as any);
    }
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

  // Format the event for the database update
  const dbEvent = formatEventForDatabase(event);
  
  // Add updated_at field
  const updateData = {
    ...dbEvent,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", id)
    .eq("user", user.id)
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
    const formattedData = data[0];
    if (formattedData) {
      await saveEventToGoogleCalendar(formattedData as any);
    }
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
    .eq("id", id)
    .eq("user", user.id);

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
    .eq("source", "google")
    .eq("user", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }

  return (data || []).map(formatEventForFrontend);
}

// Re-export the frontend Event type
export type { FrontendEvent as Event };
