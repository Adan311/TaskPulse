import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { DatabaseEvent, DatabaseEventInsert, DatabaseEventUpdate } from "@/backend/types/supabaseSchema";
import { Database } from '@/integrations/supabase/types';
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format 
} from 'date-fns';

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
      // Update all future instances of this recurring event
      await updateRecurringEventInstances(id, eventDataToUpdate);
      
      // Regenerate future instances with updated recurrence pattern
      await generateFutureRecurringEventInstances(id);
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
    console.log("Attempting to delete event from Google Calendar:", id);
    const deleteResult = await deleteEventFromGoogleCalendar(id);
    console.log("Google Calendar delete result:", deleteResult);
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

// Create a recurring event
export async function createRecurringEvent(event: Omit<FrontendEvent, "id">): Promise<FrontendEvent> {
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
    reminder_sent: false,
    is_recurring: true,
    recurrence_pattern: event.recurrencePattern || null,
    recurrence_days: event.recurrenceDays as any || null,
    recurrence_end_date: event.recurrenceEndDate || null,
    recurrence_count: event.recurrenceCount || null,
    parent_id: null // This is the parent event
  };

  console.log("Creating new recurring event:", newEvent);

  // Use type casting to fix TypeScript errors
  const { data, error } = await supabase
    .from("events")
    .insert(newEvent as any)
    .select();

  if (error) {
    console.error("Error creating recurring event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create recurring event: No data returned");
  }

  const returnedEvent = data[0] as unknown as DatabaseEvent;
  const frontendEvent = formatEventForFrontend(returnedEvent);
  
  // Generate future instances
  await generateFutureRecurringEventInstances(newEventId);
  
  return frontendEvent;
}

// Get the next occurrence date based on recurrence pattern
export const getNextEventOccurrenceDate = (
  event: FrontendEvent,
  fromDate: Date
): Date | null => {
  if (!event.recurrencePattern || !event.startTime) {
    return null;
  }

  const baseDate = parseISO(event.startTime);
  let nextDate: Date;

  switch (event.recurrencePattern) {
    case 'daily':
      nextDate = addDays(fromDate, 1);
      break;
    case 'weekly':
      // If recurrenceDays is specified, find the next day in the list
      if (event.recurrenceDays && event.recurrenceDays.length > 0) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = fromDate.getDay();
        const selectedDays = event.recurrenceDays;
        
        // Convert day names to day indices (0-6)
        const selectedDayIndices = selectedDays.map(day => daysOfWeek.indexOf(day)).sort((a, b) => a - b);
        
        // Find the next day that's in the selected days
        const nextDayIndex = selectedDayIndices.find(day => day > currentDayIndex);
        
        if (nextDayIndex !== undefined) {
          // Found a day later in the same week
          nextDate = addDays(startOfDay(fromDate), nextDayIndex - currentDayIndex);
        } else {
          // Wrap around to the earliest day in the next week
          nextDate = addDays(startOfDay(fromDate), 7 - currentDayIndex + selectedDayIndices[0]);
        }
      } else {
        // Simple weekly recurrence
        nextDate = addWeeks(fromDate, 1);
      }
      break;
    case 'monthly':
      nextDate = addMonths(fromDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(fromDate, 1);
      break;
    default:
      return null;
  }

  // Check if we've exceeded recurrence limits
  if (event.recurrenceEndDate && isAfter(nextDate, parseISO(event.recurrenceEndDate))) {
    return null;
  }

  return nextDate;
};

// Generate recurring event instances for the next 30 days
export const generateFutureRecurringEventInstances = async (eventId: string, daysInFuture: number = 30): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User must be authenticated to generate recurring events");
    }

    // Get the original recurring event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user", user.id)
      .single();

    if (eventError || !eventData) {
      console.error("Error fetching recurring event:", eventError);
      throw eventError || new Error("Event not found");
    }

    const dbEvent = eventData as unknown as DatabaseEvent;
    const event = formatEventForFrontend(dbEvent);
    
    if (!event.isRecurring || !event.startTime) {
      return;
    }

    // Get already generated instances to avoid duplicates
    const { data: instances, error: instancesError } = await supabase
      .from("events")
      .select("start_time")
      .eq("parent_id", eventId)
      .eq("user", user.id);

    if (instancesError) {
      console.error("Error fetching existing recurring instances:", instancesError);
      throw instancesError;
    }

    const existingDates = (instances || []).map(instance => 
      instance.start_time ? format(parseISO(instance.start_time), 'yyyy-MM-dd') : null
    ).filter(Boolean);

    // Calculate end date for instance generation
    const today = new Date();
    const endDate = addDays(today, daysInFuture);
    
    // Keep track of how many instances we've generated
    let generatedCount = 0;
    const maxInstances = event.recurrenceCount || Number.MAX_SAFE_INTEGER;
    
    let currentDate = parseISO(event.startTime);
    let newInstances: any[] = [];

    // Calculate the duration between start and end time
    const startTime = parseISO(event.startTime);
    const endTime = parseISO(event.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();

    while (
      isBefore(currentDate, endDate) && 
      generatedCount < maxInstances && 
      (!event.recurrenceEndDate || isBefore(currentDate, parseISO(event.recurrenceEndDate)))
    ) {
      // Get next occurrence date
      const nextDate = getNextEventOccurrenceDate(event, currentDate);
      
      if (!nextDate) break;
      
      // Skip if we already have an instance for this date
      const nextDateString = format(nextDate, 'yyyy-MM-dd');
      if (!existingDates.includes(nextDateString)) {
        // Calculate the new end time based on the same duration
        const newEndTime = new Date(nextDate.getTime() + durationMs);
        
        // Create a new instance of the event
        const newInstanceId = uuidv4();
        const newInstance = {
          id: newInstanceId,
          title: event.title,
          description: event.description,
          start_time: nextDate.toISOString(),
          end_time: newEndTime.toISOString(),
          color: event.color,
          project: event.project,
          user: user.id,
          source: "app",
          google_event_id: null, // Don't copy the Google Event ID
          parent_id: eventId,
          is_recurring: false, // Instance is not itself recurring
          reminder_at: event.reminderAt ? nextDate.toISOString() : null,
          reminder_sent: false,
        };
        
        newInstances.push(newInstance);
        existingDates.push(nextDateString);
        generatedCount++;
      }
      
      currentDate = nextDate;
    }

    // Insert all new instances at once
    if (newInstances.length > 0) {
      const { error: insertError } = await supabase
        .from("events")
        .insert(newInstances);

      if (insertError) {
        console.error("Error creating recurring event instances:", insertError);
        throw insertError;
      }
    }

  } catch (error) {
    console.error("Error generating recurring event instances:", error);
    throw error;
  }
};

// Process all recurring events (check and generate new instances)
export const processAllRecurringEvents = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found when processing recurring events");
      return;
    }

    // Get all recurring events
    const { data: recurringEvents, error } = await supabase
      .from("events")
      .select("*")
      .eq("user", user.id)
      .eq("is_recurring", true);

    if (error) {
      console.error("Error fetching recurring events:", error);
      throw error;
    }

    if (!recurringEvents || recurringEvents.length === 0) {
      return;
    }

    // Process each recurring event
    for (const event of recurringEvents) {
      const dbEvent = event as unknown as DatabaseEvent;
      await generateFutureRecurringEventInstances(dbEvent.id);
    }
  } catch (error) {
    console.error("Error processing recurring events:", error);
    throw error;
  }
};

// Update all instances of a recurring event when the parent event is updated
export const updateRecurringEventInstances = async (
  parentEventId: string,
  eventUpdates: Partial<FrontendEvent>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User must be authenticated to update recurring event instances");
    }

    // Get all instances of this recurring event
    const { data: instances, error: instancesError } = await supabase
      .from("events")
      .select("*")
      .eq("parent_id", parentEventId)
      .eq("user", user.id);

    if (instancesError) {
      console.error("Error fetching recurring event instances:", instancesError);
      throw instancesError;
    }

    if (!instances || instances.length === 0) {
      // No instances to update
      return;
    }

    console.log(`Updating ${instances.length} instances of recurring event ${parentEventId}`);

    // Fields that should be propagated to all instances
    const updateableFields = {
      title: eventUpdates.title,
      description: eventUpdates.description,
      color: eventUpdates.color,
      project: eventUpdates.project,
    };

    // Filter out undefined values
    const filteredUpdates: Record<string, any> = {};
    Object.entries(updateableFields).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert to database field names
        const dbKey = key === 'title' || key === 'description' ? key : 
                      key === 'color' ? 'color' :
                      key === 'project' ? 'project' : null;
        
        if (dbKey) {
          filteredUpdates[dbKey] = value;
        }
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      // No fields to update
      return;
    }

    // Update all instances at once
    const { error: updateError } = await supabase
      .from("events")
      .update(filteredUpdates)
      .eq("parent_id", parentEventId)
      .eq("user", user.id);

    if (updateError) {
      console.error("Error updating recurring event instances:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated ${instances.length} instances of recurring event ${parentEventId}`);
  } catch (error) {
    console.error("Error updating recurring event instances:", error);
    throw error;
  }
};

// Re-export the frontend Event type
export type { FrontendEvent as Event };
