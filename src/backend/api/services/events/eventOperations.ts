import { supabase } from "../../../database/client";
import { Database } from "../../../database/types";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "../googleCalendar/googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { DatabaseEvent, DatabaseEventInsert, DatabaseEventUpdate } from "@/backend/database/schema";

type DbEvent = Database['public']['Tables']['events']['Row'];

// Convert database event to frontend event format
export function formatEventForFrontend(dbEvent: DatabaseEvent): FrontendEvent {
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
    participants: [], // Initialize with empty array
    isRecurring: dbEvent.is_recurring || undefined,
    recurrencePattern: dbEvent.recurrence_pattern as any || undefined,
    recurrenceDays: dbEvent.recurrence_days as string[] || undefined,
    recurrenceEndDate: dbEvent.recurrence_end_date || undefined,
    recurrenceCount: dbEvent.recurrence_count || undefined,
    parentId: dbEvent.parent_id || undefined
  };
}

// Convert frontend event to database format
export function formatEventForDatabase(event: Partial<FrontendEvent>): DatabaseEventUpdate {
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
  if (event.isRecurring !== undefined) dbEvent.is_recurring = event.isRecurring;
  if (event.recurrencePattern !== undefined) dbEvent.recurrence_pattern = event.recurrencePattern;
  if (event.recurrenceDays !== undefined) dbEvent.recurrence_days = event.recurrenceDays as any;
  if (event.recurrenceEndDate !== undefined) dbEvent.recurrence_end_date = event.recurrenceEndDate;
  if (event.recurrenceCount !== undefined) dbEvent.recurrence_count = event.recurrenceCount;
  if (event.parentId !== undefined) dbEvent.parent_id = event.parentId;
  
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
    // Convert to DbEvent format for Google Calendar sync
    const formattedData = data[0] as unknown as DatabaseEvent;
    if (formattedData) {
      await saveEventToGoogleCalendar(formattedData);
    }
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  const returnedEvent = data[0] as unknown as DatabaseEvent;
  return formatEventForFrontend(returnedEvent);
}

export async function updateEvent(
  id: string, 
  event: Partial<FrontendEvent> & { updateMode?: 'this' | 'all' }
): Promise<FrontendEvent> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Extract the update mode and remove it from the database update
  const updateMode = event.updateMode || 'all';
  const { updateMode: _, ...eventDataToUpdate } = event;

  // Format the event for the database update
  const dbEvent = formatEventForDatabase(eventDataToUpdate);
  
  // Ensure the project is properly set (handles undefined vs null)
  if (event.project === undefined) {
    dbEvent.project = null;
  }
  
  // Remove the updated_at field as it doesn't exist in the schema
  const updateData = {
    ...dbEvent
  };

  console.log(`Updating event: ${id}, mode: ${updateMode}`, updateData);

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

    // Check if this is a recurring event parent and update all instances if it is
    const updatedEvent = data[0] as unknown as DatabaseEvent;
    const frontendEvent = formatEventForFrontend(updatedEvent);
    
    if (frontendEvent.isRecurring && updateMode === 'all') {
      // Import and call recurring event functions - using dynamic import to avoid circular dependency
      const eventRecurrenceModule = await import('./eventRecurrence.js');
      
      // Update all future instances of this recurring event
      await eventRecurrenceModule.updateRecurringEventInstances(id, eventDataToUpdate);
      
      // Regenerate future instances with updated recurrence pattern
      await eventRecurrenceModule.generateFutureRecurringEventInstances(id);
    }

    // Sync to Google Calendar if connected
    try {
      // Convert to DbEvent format for Google Calendar sync
      const formattedData = data[0] as unknown as DatabaseEvent;
      if (formattedData) {
        await saveEventToGoogleCalendar(formattedData);
      }
    } catch (syncError) {
      console.error("Error syncing to Google Calendar:", syncError);
      // Continue even if sync fails
    }

    return frontendEvent;
  } catch (error) {
    console.error("Exception in updateEvent:", error);
    throw error;
  }
}

export async function deleteEvent(
  id: string,
  options?: { deleteMode?: 'this' | 'all' }
): Promise<boolean> {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Determine delete mode - default to 'this' for safety
  const deleteMode = options?.deleteMode || 'this';
  
  // Get event details to check if it's recurring
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq('id', id)
    .eq('user', user.id)
    .single();
    
  if (!eventData) {
    throw new Error(`Event with id ${id} not found or you don't have permission to delete it`);
  }
  
  const event = eventData as unknown as DatabaseEvent;
  const isRecurringParent = event.is_recurring;

  // Delete from Google Calendar first if it's linked
  try {
    await deleteEventFromGoogleCalendar(id);
  } catch (syncError) {
    console.error("Error deleting from Google Calendar:", syncError);
    // Continue even if sync fails
  }

  // For recurring events, handle according to the delete mode
  if (isRecurringParent && deleteMode === 'all') {
    // Delete the parent and all its instances
    // First get all the instances
    const { data: instances } = await supabase
      .from("events")
      .select("id")
      .eq('parent_id', id)
      .eq('user', user.id);
      
    // Delete all instances
    if (instances && instances.length > 0) {
      const instanceIds = instances.map(instance => instance.id);
      
      const { error: instancesError } = await supabase
        .from("events")
        .delete()
        .in('id', instanceIds)
        .eq('user', user.id);
        
      if (instancesError) {
        console.error("Error deleting recurring event instances:", instancesError);
        // Continue with parent deletion even if instance deletion fails
      }
      
      console.log(`Deleted ${instances.length} instances of recurring event ${id}`);
    }
  }

  // Delete the specified event
  const { error } = await supabase
    .from("events")
    .delete()
    .eq('id', id)
    .eq('user', user.id);

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