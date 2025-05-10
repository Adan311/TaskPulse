import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { DatabaseEvent, DatabaseEventInsert, DatabaseEventUpdate } from "@/backend/types/supabaseSchema";
import { Database } from '@/integrations/supabase/types';

// Convert database event to frontend event format
function formatEventForFrontend(dbEvent: DatabaseEvent): FrontendEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    startTime: dbEvent.start_time,
    endTime: dbEvent.end_time,
    color: dbEvent.color || undefined,
    project: dbEvent.project || undefined,
    googleEventId: dbEvent.google_event_id || undefined,
    source: dbEvent.source as 'app' | 'google' | undefined,
    reminderAt: dbEvent.reminder_at || undefined,
    reminderSent: dbEvent.reminder_sent || undefined,
    participants: [] // Initialize with empty array
  };
}

// Convert frontend event to database format
function formatEventForDatabase(event: Partial<FrontendEvent>): DatabaseEventUpdate {
  const dbEvent: DatabaseEventUpdate = {};
  
  if (event.title !== undefined) dbEvent.title = event.title;
  if (event.description !== undefined) dbEvent.description = event.description;
  if (event.startTime !== undefined) dbEvent.start_time = event.startTime;
  if (event.endTime !== undefined) dbEvent.end_time = event.endTime;
  if (event.color !== undefined) dbEvent.color = event.color;
  if (event.project !== undefined) dbEvent.project = event.project;
  if (event.googleEventId !== undefined) dbEvent.google_event_id = event.googleEventId;
  if (event.source !== undefined) dbEvent.source = event.source;
  if (event.reminderAt !== undefined) {
    dbEvent.reminder_at = event.reminderAt;
    dbEvent.reminder_sent = false; // Reset reminder_sent when changing reminder time
  }
  
  return dbEvent;
}

export async function getEvents(): Promise<FrontendEvent[]> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Use properly typed query with type casting to address TypeScript errors
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq('user', user.id as any);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  // Type-safe transformation
  return (data || []).map((eventData) => {
    if (!eventData) return {
      id: '',
      title: '',
      startTime: '',
      endTime: '',
      participants: []
    };
    
    // Ensure this is treated as a DatabaseEvent
    const dbEvent = eventData as unknown as DatabaseEvent;
    return formatEventForFrontend(dbEvent);
  });
}

export async function getEventById(id: string): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Use properly typed query with type casting
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq('id', id as any)
    .eq('user', user.id as any)
    .limit(1);

  if (error) {
    console.error("Error fetching event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with id ${id} not found`);
  }

  // Type-safe transformation
  const dbEvent = data[0] as unknown as DatabaseEvent;
  return formatEventForFrontend(dbEvent);
}

export async function createEvent(event: Omit<FrontendEvent, "id">): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const newEventId = uuidv4();
  
  // Create a properly typed database event for insertion
  const newEvent: DatabaseEventInsert = {
    id: newEventId,
    title: event.title,
    description: event.description ?? null,
    start_time: event.startTime,
    end_time: event.endTime,
    color: event.color ?? null,
    project: event.project ?? null,
    source: event.source || "app",
    user: user.id,
    google_event_id: event.googleEventId ?? null,
    reminder_at: event.reminderAt ?? null,
    reminder_sent: false
  };

  console.log("Creating new event:", newEvent);

  // Use type casting to fix TypeScript errors
  const { data, error } = await supabase
    .from("events")
    .insert(newEvent as any)
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
    console.log("Attempting to sync new event to Google Calendar");
    // Convert to DbEvent format for Google Calendar sync
    const formattedData = data[0] as unknown as DatabaseEvent;
    if (formattedData) {
      const syncResult = await saveEventToGoogleCalendar(formattedData);
      console.log("Google Calendar sync result:", syncResult);
    }
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  const returnedEvent = data[0] as unknown as DatabaseEvent;
  return formatEventForFrontend(returnedEvent);
}

export async function updateEvent(id: string, event: Partial<FrontendEvent>): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Format the event for the database update
  const dbEvent = formatEventForDatabase(event);
  
  // Ensure the project is properly set (handles undefined vs null)
  if (event.project === undefined) {
    dbEvent.project = null;
  }
  
  // Remove the updated_at field as it doesn't exist in the schema
  const updateData = {
    ...dbEvent
  };

  console.log("Updating event:", id, updateData);

  try {
    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq('id', id)
      .eq('user', user.id)
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
      console.log("Attempting to sync updated event to Google Calendar");
      // Convert to DbEvent format for Google Calendar sync
      const formattedData = data[0] as unknown as DatabaseEvent;
      if (formattedData) {
        const syncResult = await saveEventToGoogleCalendar(formattedData);
        console.log("Google Calendar sync result:", syncResult);
      }
    } catch (syncError) {
      console.error("Error syncing to Google Calendar:", syncError);
      // Continue even if sync fails
    }

    const updatedEvent = data[0] as unknown as DatabaseEvent;
    return formatEventForFrontend(updatedEvent);
  } catch (error) {
    console.error("Exception in updateEvent:", error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Delete from Google Calendar first if it's linked
  try {
    console.log("Attempting to delete event from Google Calendar:", id);
    const deleteResult = await deleteEventFromGoogleCalendar(id);
    console.log("Google Calendar delete result:", deleteResult);
  } catch (syncError) {
    console.error("Error deleting from Google Calendar:", syncError);
    // Continue even if sync fails
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq('id', id as any)
    .eq('user', user.id as any);

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
    .eq('source', "google" as any)
    .eq('user', user.id as any)
    .order('start_time', { ascending: true });

  if (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }

  return (data || []).map((eventData) => {
    const eventDbData = eventData as unknown as DatabaseEvent;
    return formatEventForFrontend(eventDbData);
  });
}

// Re-export the frontend Event type
export type { FrontendEvent as Event };
