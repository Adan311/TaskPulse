
import { supabase } from '../../database/client';
import { v4 as uuidv4 } from "uuid";
import { Database } from '../../database/types';
import { DatabaseEvent, DatabaseEventInsert, isDatabaseEvent } from '@/backend/database/schema';

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

  try {
    // Use a type assertion approach to handle TypeScript errors
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq('user', user.id as any);

    if (error) {
      console.error("Error fetching events:", error);
      throw error;
    }

    // Transform the data with proper type checking
    return (data || []).map(event => {
      if (!event) return {
        id: '',
        title: '',
        start_time: '',
        end_time: '',
        user_id: user.id
      };
      
      // Safely access properties with type checking
      const eventData = event as any;
      
      return {
        id: eventData.id || '',
        title: eventData.title || '',
        description: eventData.description || undefined,
        start_time: eventData.start_time || '',
        end_time: eventData.end_time || '',
        all_day: false, // Default value since it's not in the database
        color: eventData.color || undefined,
        project_id: eventData.project || undefined,
        user_id: eventData.user || user.id,
      };
    });
  } catch (error) {
    console.error("Exception fetching events:", error);
    return [];
  }
};

export const createEvent = async (event: Omit<CalendarEvent, "id" | "user_id">): Promise<CalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to create events");
  }
  
  try {
    // Create a properly typed database event for insertion
    const newEvent: DatabaseEventInsert = {
      id: uuidv4(),
      title: event.title,
      description: event.description || null,
      start_time: event.start_time,
      end_time: event.end_time,
      color: event.color || null,
      project: event.project_id || null,
      user: user.id,
      google_event_id: null,
      source: 'app'
    };

    // Insert using type assertion
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

    // Transform with safe checks
    const createdEvent = data[0] as any;
    if (!createdEvent) {
      throw new Error("Failed to retrieve created event data");
    }
    
    return {
      id: createdEvent.id || '',
      title: createdEvent.title || '',
      description: createdEvent.description || undefined,
      start_time: createdEvent.start_time || '',
      end_time: createdEvent.end_time || '',
      all_day: false,
      color: createdEvent.color || undefined,
      project_id: createdEvent.project || undefined,
      user_id: createdEvent.user || user.id,
    };
  } catch (error) {
    console.error("Exception creating event:", error);
    throw error;
  }
};
