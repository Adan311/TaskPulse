
import { supabase } from '../client/supabase';
import { v4 as uuidv4 } from "uuid";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
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

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return data as CalendarEvent[];
};

export const createEvent = async (event: Omit<CalendarEvent, "id" | "user_id">): Promise<CalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create events");
  }
  
  const newEvent = {
    id: uuidv4(),
    ...event,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("events")
    .insert([newEvent])
    .select();

  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }

  return data![0] as CalendarEvent;
};
