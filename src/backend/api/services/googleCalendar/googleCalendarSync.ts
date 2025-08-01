
import { supabase } from '../../../database/client';
import { DatabaseEvent } from '@/backend/database/schema';
import { hasGoogleCalendarConnected } from './googleCalendarService';
import { validateUser } from '@/shared/utils/authUtils';

/**
 * Event synchronization functions for Google Calendar
 */
export const GoogleCalendarSync = {
  /**
   * Saves an event to Google Calendar
   */
  saveEventToGoogleCalendar: async (event: DatabaseEvent): Promise<boolean> => {
    try {
      const user = await validateUser();

      // Check if user has connected Google Calendar
      const isConnected = await hasGoogleCalendarConnected();
      if (!isConnected) {
        console.log("Google Calendar not connected, skipping sync");
        return false;
      }
      
      // Check if this is a Google-sourced event, if so, don't sync back
      if (event.source === 'google') {
        console.log("Event is from Google, skipping sync back to avoid duplicates");
        return false;
      }

      console.log("Syncing event to Google Calendar:", {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time
      });

      // Call the edge function to save the event to Google Calendar
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: event.google_event_id ? 'updateEvent' : 'createEvent', 
          event: event,
          userId: user.id
        },
      });

      if (error) {
        console.error('Error saving event to Google Calendar:', error);
        return false;
      }

      console.log("Google Calendar sync response:", data);

      // If this was a new event and we got a Google event ID back, update our local record
      if (!event.google_event_id && data && data.google_event_id) {
        console.log("Updating local event with Google Calendar ID:", data.google_event_id);
        
        const { error: updateError } = await supabase
          .from("events")
          .update({ 
            google_event_id: data.google_event_id,
            source: 'app_synced'
          } as any)
          .eq('id', event.id as any);
          
        if (updateError) {
          console.error('Error updating event with Google Calendar ID:', updateError);
        }
      }

      return true;
    } catch (error) {
      console.error('Exception saving event to Google Calendar:', error);
      return false;
    }
  },

  /**
   * Deletes an event from Google Calendar
   */
  deleteEventFromGoogleCalendar: async (eventId: string): Promise<boolean> => {
    try {
      const user = await validateUser();

      // Check if user has connected Google Calendar
      const isConnected = await hasGoogleCalendarConnected();
      if (!isConnected) {
        console.log("Google Calendar not connected, skipping delete");
        return false;
      }

      // First, get the event to check if it's a Google-sourced event
      const { data, error } = await supabase
        .from('events')
        .select('source, google_event_id')
        .eq('id', eventId as any)
        .limit(1);

      if (error) {
        console.error('Error fetching event for deletion:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.log("Event not found for deletion");
        return false;
      }

      // We need to safely access the properties from the result
      const event = data[0] as any;
      
      // Don't delete Google-sourced events from Google Calendar through this flow
      if (event.source === 'google') {
        console.log("Event is from Google, skipping delete to avoid inconsistency");
        return false;
      }

      // Only proceed if the event has a Google event ID
      if (!event.google_event_id) {
        console.log("Event has no Google ID, skipping delete");
        return false;
      }

      console.log("Deleting event from Google Calendar:", {
        eventId,
        googleEventId: event.google_event_id
      });

      // Call the edge function to delete the event from Google Calendar
      const { error: functionError } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'deleteEvent', 
          eventId,
          googleEventId: event.google_event_id,
          userId: user.id
        },
      });

      if (functionError) {
        console.error('Error deleting event from Google Calendar:', functionError);
        return false;
      }

      console.log("Successfully deleted event from Google Calendar");
      return true;
    } catch (error) {
      console.error('Exception deleting event from Google Calendar:', error);
      return false;
    }
  }
};
