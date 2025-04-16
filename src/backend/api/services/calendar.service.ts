
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from "uuid";
import { Database } from '@/integrations/supabase/types';

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

  // Use column name instead of equality filter for improved type safety
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user", user.id);

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
  
  // Create a new event object with the correct field names to match the database
  const newEvent = {
    id: uuidv4(),
    title: event.title,
    description: event.description,
    start_time: event.start_time,
    end_time: event.end_time,
    color: event.color,
    project: event.project_id, // Map project_id to project for the database
    user: user.id, // Map to the database field 'user'
  } as Database['public']['Tables']['events']['Insert'];

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

  // Transform the data to match CalendarEvent interface
  const createdEvent = data[0];
  return {
    id: createdEvent?.id ?? '',
    title: createdEvent?.title ?? '',
    description: createdEvent?.description,
    start_time: createdEvent?.start_time ?? '',
    end_time: createdEvent?.end_time ?? '',
    all_day: false, // Default value since it's not in the database
    color: createdEvent?.color,
    project_id: createdEvent?.project,
    user_id: createdEvent?.user ?? user.id,
  };
};
