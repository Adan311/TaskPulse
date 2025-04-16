
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";
import { Event } from "@/frontend/types/calendar";

// Convert database event to frontend event format
function formatEventForFrontend(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    color: dbEvent.color,
    project: dbEvent.project,
    user: dbEvent.user,
    googleEventId: dbEvent.google_event_id,
    source: dbEvent.source
  };
}

// Convert frontend event to database format
function formatEventForDatabase(event: Partial<Event>): any {
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

export async function getEvents(): Promise<Event[]> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return data.map(formatEventForFrontend);
}

export async function getEventById(id: string): Promise<Event> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user", user.id)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    throw error;
  }

  return formatEventForFrontend(data);
}

export async function createEvent(event: Omit<Event, "id">): Promise<Event> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const newEvent = {
    ...formatEventForDatabase(event),
    id: uuidv4(),
    source: event.source || "app",
    user: user.id
  };

  const { data, error } = await supabase
    .from("events")
    .insert(newEvent)
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }

  // Sync to Google Calendar if connected
  try {
    await saveEventToGoogleCalendar(formatEventForFrontend(data));
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return formatEventForFrontend(data);
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<Event> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const dbEvent = formatEventForDatabase(event);

  const { data, error } = await supabase
    .from("events")
    .update(dbEvent)
    .eq("id", id)
    .eq("user", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }

  // Sync to Google Calendar if connected
  try {
    await saveEventToGoogleCalendar(formatEventForFrontend(data));
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return formatEventForFrontend(data);
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

export async function getGoogleCalendarEvents(): Promise<Event[]> {
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

  return data.map(formatEventForFrontend);
}
