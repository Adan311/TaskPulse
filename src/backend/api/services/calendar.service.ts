
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from "uuid";
import { Database } from '@/integrations/supabase/types';
import { DatabaseEventInsert } from '@/backend/types/supabaseSchema';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  project_id?: string;
  user_id: string;
}

export const fetchEvents = async (): Promise<CalendarEvent[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching events");
    return [];
  }

  // Use string filters instead of equality operators for proper typing
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .filter('user', 'eq', user.id);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  // Transform the data to match CalendarEvent interface with null checks
  return (data || []).map(event => ({
    id: event?.id ?? '',
    title: event?.title ?? '',
    description: event?.description,
    start_time: event?.start_time ?? '',
    end_time: event?.end_time ?? '',
    all_day: false, // Default value since it's not in the database
    color: event?.color,
    project_id: event?.project,
    user_id: event?.user ?? (user?.id || ''),
  }));
};

export const createEvent = async (event: Omit<CalendarEvent, "id" | "user_id">): Promise<CalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create events");
  }
  
  // Create a properly typed database event for insertion
  const newEvent: DatabaseEventInsert = {
    id: uuidv4(),
    title: event.title,
    description: event.description ?? null,
    start_time: event.start_time,
    end_time: event.end_time,
    color: event.color ?? null,
    project: event.project_id ?? null,
    user: user.id,
    google_event_id: null,
    source: 'app'
  };

  const { data, error } = await supabase
    .from("events")
    .insert([newEvent])
    .select();

  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create event: No data returned");
  }

  // Transform the data to match CalendarEvent interface
  const createdEvent = data[0];
  return {
    id: createdEvent?.id ?? '',
    title: createdEvent?.title ?? '',
    description: createdEvent?.description ?? undefined,
    start_time: createdEvent?.start_time ?? '',
    end_time: createdEvent?.end_time ?? '',
    all_day: false, // Default value since it's not in the database
    color: createdEvent?.color ?? undefined,
    project_id: createdEvent?.project ?? undefined,
    user_id: createdEvent?.user ?? user.id,
  };
};
