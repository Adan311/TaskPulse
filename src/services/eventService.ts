
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  user?: string;
  project?: string;
}

export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return data || [];
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    throw error;
  }

  return data;
}

export async function createEvent(event: Omit<Event, "id">) {
  const newEvent = {
    ...event,
    id: uuidv4(),
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

  return data;
}

export async function updateEvent(id: string, event: Partial<Event>) {
  const { data, error } = await supabase
    .from("events")
    .update(event)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating event:", error);
    throw error;
  }

  return data;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }

  return true;
}
