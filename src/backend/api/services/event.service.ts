/**
 * Event Service - Re-exports from modular event components
 * This file serves as the main entry point for all event-related functionality
 */

import { supabase } from "../../database/client";
import { Database } from "../../database/types";
import { v4 as uuidv4 } from "uuid";
import { saveEventToGoogleCalendar, deleteEventFromGoogleCalendar } from "./googleCalendar/googleCalendarService";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { DatabaseEvent, DatabaseEventInsert, DatabaseEventUpdate } from "@/backend/database/schema";
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format 
} from 'date-fns';
import { getNextOccurrenceDate as getSharedNextOccurrenceDate } from './recurrence.service';

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
  const user = await getCurrentUser();
  
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
  const user = await validateUser();

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
  const user = await validateUser();

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
  const user = await validateUser();

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

  console.log("Updating event:", id, updateData);

  // Determine which events to update based on updateMode
  let query = supabase
    .from("events")
    .update(updateData as any)
    .eq('user', user.id as any);

  if (updateMode === 'this') {
    // Update only this specific event
    query = query.eq('id', id as any);
  } else {
    // Update all events in the series (parent and all instances)
    // First, get the event to determine if it's a parent or instance
    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("parent_id")
      .eq('id', id as any)
      .eq('user', user.id as any)
      .single();

    if (fetchError) {
      console.error("Error fetching event for update:", fetchError);
      throw fetchError;
    }

    const parentId = eventData?.parent_id || id;
    
    // Update parent and all instances
    query = query.or(`id.eq.${parentId},parent_id.eq.${parentId}`);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with id ${id} not found or could not be updated`);
  }

  // Find the specific event that was requested
  const updatedEvent = data.find(e => e.id === id) || data[0];
  const updatedDbEvent = updatedEvent as unknown as DatabaseEvent;
  
  // Sync to Google Calendar if connected
  try {
    if (updatedDbEvent) {
      await saveEventToGoogleCalendar(updatedDbEvent);
    }
  } catch (syncError) {
    console.error("Error syncing to Google Calendar:", syncError);
    // Continue even if sync fails
  }

  return formatEventForFrontend(updatedDbEvent);
}

export async function deleteEvent(
  id: string,
  options?: { deleteMode?: 'this' | 'all' }
): Promise<boolean> {
  // Get the current user
  const user = await validateUser();

  const deleteMode = options?.deleteMode || 'all';

  // First, get the event to check if it has a Google Calendar ID
  const { data: eventData, error: fetchError } = await supabase
    .from("events")
    .select("google_event_id, parent_id")
    .eq('id', id as any)
    .eq('user', user.id as any)
    .single();

  if (fetchError) {
    console.error("Error fetching event for deletion:", fetchError);
    throw fetchError;
  }

  // Delete from Google Calendar if it exists
  if (eventData?.google_event_id) {
    try {
      await deleteEventFromGoogleCalendar(eventData.google_event_id);
    } catch (syncError) {
      console.error("Error deleting from Google Calendar:", syncError);
      // Continue with local deletion even if Google Calendar sync fails
    }
  }

  // Determine which events to delete based on deleteMode
  let query = supabase
    .from("events")
    .delete()
    .eq('user', user.id as any);

  if (deleteMode === 'this') {
    // Delete only this specific event
    query = query.eq('id', id as any);
  } else {
    // Delete all events in the series (parent and all instances)
    const parentId = eventData?.parent_id || id;
    
    // Delete parent and all instances
    query = query.or(`id.eq.${parentId},parent_id.eq.${parentId}`);
  }

  const { error } = await query;

  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }

  return true;
}

export async function getGoogleCalendarEvents(): Promise<FrontendEvent[]> {
  // Get the current user
  const user = await getCurrentUser();
  
  if (!user) {
    return [];
  }

  // Use properly typed query with type casting to address TypeScript errors
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq('user', user.id as any)
    .eq('source', 'google');

  if (error) {
    console.error("Error fetching Google Calendar events:", error);
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

// Create a recurring event
export async function createRecurringEvent(event: Omit<FrontendEvent, "id">): Promise<FrontendEvent> {
  // Get the current user
  const user = await validateUser();

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

  // Use the shared recurrence service
  return getSharedNextOccurrenceDate(fromDate, {
    pattern: event.recurrencePattern,
    days: event.recurrenceDays,
    endDate: event.recurrenceEndDate,
    count: event.recurrenceCount
  });
};

// Generate recurring event instances for the next 30 days
export const generateFutureRecurringEventInstances = async (eventId: string, daysInFuture: number = 30): Promise<void> => {
  try {
    const user = await validateUser();

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
        const instanceEvent: DatabaseEventInsert = {
          id: uuidv4(),
          title: event.title,
          description: event.description || null,
          start_time: nextDate.toISOString(),
          end_time: newEndTime.toISOString(),
          color: event.color || null,
          project: event.project || null,
          source: event.source || "app",
          user: user.id,
          google_event_id: null, // Instances don't sync to Google Calendar individually
          reminder_at: event.reminderAt || null,
          reminder_sent: false,
          is_recurring: false, // Instances are not recurring themselves
          recurrence_pattern: null,
          recurrence_days: null,
          recurrence_end_date: null,
          recurrence_count: null,
          parent_id: eventId // Link to the parent recurring event
        };

        newInstances.push(instanceEvent);
        generatedCount++;
      }
      
      currentDate = nextDate;
    }

    // Insert all new instances at once
    if (newInstances.length > 0) {
      const { error: insertError } = await supabase
        .from("events")
        .insert(newInstances as any);

      if (insertError) {
        console.error("Error inserting recurring event instances:", insertError);
        throw insertError;
      }

      console.log(`Generated ${newInstances.length} recurring event instances for event ${eventId}`);
    }
  } catch (error) {
    console.error("Error generating recurring event instances:", error);
    throw error;
  }
};

// Process all recurring events to generate future instances
export const processAllRecurringEvents = async (): Promise<void> => {
  try {
    const user = await validateUser();

    // Get all recurring events (parent events only)
    const { data: recurringEvents, error } = await supabase
      .from("events")
      .select("id")
      .eq("is_recurring", true)
      .eq("user", user.id)
      .is("parent_id", null); // Only parent events, not instances

    if (error) {
      console.error("Error fetching recurring events:", error);
      throw error;
    }

    // Generate instances for each recurring event
    for (const event of recurringEvents || []) {
      await generateFutureRecurringEventInstances(event.id);
    }

    console.log(`Processed ${recurringEvents?.length || 0} recurring events`);
  } catch (error) {
    console.error("Error processing recurring events:", error);
    throw error;
  }
};

// Update all instances of a recurring event
export const updateRecurringEventInstances = async (
  parentEventId: string,
  eventUpdates: Partial<FrontendEvent>
): Promise<void> => {
  try {
    const user = await validateUser();

    // Format the updates for the database
    const dbUpdates = formatEventForDatabase(eventUpdates);

    // Update all instances of the recurring event
    const { error } = await supabase
      .from("events")
      .update(dbUpdates as any)
      .eq("parent_id", parentEventId)
      .eq("user", user.id);

    if (error) {
      console.error("Error updating recurring event instances:", error);
      throw error;
    }

    console.log(`Updated all instances of recurring event ${parentEventId}`);
  } catch (error) {
    console.error("Error updating recurring event instances:", error);
    throw error;
  }
};

// Re-export the frontend Event type
export type { Event } from "@/frontend/types/calendar";
