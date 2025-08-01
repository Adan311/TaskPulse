
import { supabase } from '../../../database/client';
import { validateUser } from '@/shared/utils/authUtils';

/**
 * Authentication related functions for Google Calendar
 */
export const GoogleCalendarAuth = {
  /**
   * Initiates the Google Calendar authorization flow
   * This function is called by the GoogleCalendarButton component
   */
  initiateGoogleCalendarAuth: async (): Promise<string | null> => {
    try {
      const user = await validateUser();
      
      // Clear any existing state to prevent conflicts
      localStorage.removeItem("googleCalendarState");
      localStorage.removeItem("googleCalendarUserId");
      
      // Generate a robust random state parameter for security
      const timestamp = Date.now().toString(36);
      const random1 = Math.random().toString(36).substring(2, 15);
      const random2 = Math.random().toString(36).substring(2, 15);
      const state = `${timestamp}_${random1}_${random2}`;
      
      // Store state and user ID in localStorage for verification during callback
      localStorage.setItem("googleCalendarState", state);
      localStorage.setItem("googleCalendarUserId", user.id);
      
      const origin = window.location.origin;
      
      // Set actual redirect URL from the current origin
      // This is crucial for OAuth to work properly
      const redirectUri = `${origin}/calendar/google-callback`;
      
      console.log("Initiating Google Calendar auth with:", {
        userId: user.id,
        origin,
        redirectUri,
        state
      });
      
      // Call the edge function to get the auth URL
      // Always specify empty headers to avoid CORS issues
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'init',
          userId: user.id,
          origin,
          redirectUri,
          state
        },
        headers: {} // Explicitly set empty headers
      });
      
      if (error) {
        console.error("Error initiating Google Calendar auth:", error);
        return null;
      }
      
      console.log("Google auth URL received:", data?.authUrl ? "URL received" : "No URL");
      
      return data?.authUrl || null;
    } catch (err) {
      console.error("Exception initiating Google Calendar auth:", err);
      return null;
    }
  },

  /**
   * Revokes access to Google Calendar
   */
  revokeGoogleCalendarAccess: async (calendarId: string): Promise<boolean> => {
    try {
      const user = await validateUser();

      console.log("Attempting to revoke Google Calendar access for calendar ID:", calendarId);

      // Call the edge function to revoke the token
      // Always specify empty headers to avoid CORS issues
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'revoke',
          calendarId,
          userId: user.id
        },
        headers: {} // Explicitly set empty headers
      });

      if (error) {
        console.error('Error revoking Google Calendar access:', error);
        return false;
      }

      // Check the response for success
      if (data && data.success) {
        console.log("Successfully revoked Google Calendar access");
        return true;
      } else {
        console.error('Failed to revoke Google Calendar access:', data);
        return false;
      }
    } catch (error) {
      console.error('Exception revoking Google Calendar access:', error);
      return false;
    }
  }
};
