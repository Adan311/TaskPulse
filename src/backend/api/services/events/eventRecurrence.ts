import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Event as FrontendEvent } from "@/frontend/types/calendar";
import { DatabaseEvent, DatabaseEventInsert } from "@/backend/types/supabaseSchema";
import { formatEventForFrontend } from './eventOperations';
import { 
  addDays, addWeeks, addMonths, addYears, 
  isBefore, parseISO, startOfDay, isAfter,
  format 
} from 'date-fns';

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