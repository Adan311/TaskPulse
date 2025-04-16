
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  user?: string;
  project?: string;
  google_event_id?: string;
  source?: string;
}

export async function getEvents() {
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

  return data || [];
}

export async function getEventById(id: string) {
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

  return data;
}

export async function createEvent(event: Omit<Event, "id">) {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const newEvent = {
    ...event,
    id: uuidv4(),
    source: "app",
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
    await saveEventToGoogleCalendar(data);
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return data;
}

export async function updateEvent(id: string, event: Partial<Event>) {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("events")
    .update(event)
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
    await saveEventToGoogleCalendar(data);
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return data;
}

export async function deleteEvent(id: string) {
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

export async function getGoogleCalendarEvents() {
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

  return data || [];
}
