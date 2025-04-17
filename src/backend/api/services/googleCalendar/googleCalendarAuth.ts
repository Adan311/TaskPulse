
import { supabase } from '@/integrations/supabase/client';

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User must be authenticated to connect Google Calendar");
        return null;
      }
      
      // Save user ID for later use in the OAuth callback
      localStorage.setItem('googleCalendarUserId', user.id);
      
      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('googleCalendarState', state);
      
      const origin = window.location.origin;
      const redirectUri = `${origin}/api/google-calendar-callback`;
      
      console.log("Initiating Google Calendar auth with:", {
        userId: user.id,
        origin,
        redirectUri,
        state
      });
      
      // Call the edge function to get the auth URL
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'init',
          userId: user.id,
          origin,
          redirectUri,
          state
        }
      });
      
      if (error) {
        console.error("Error initiating Google Calendar auth:", error);
        return null;
      }
      
      return data?.authUrl || null;
    } catch (err) {
      console.error("Exception initiating Google Calendar auth:", err);
      return null;
    }
  },

  /**
   * Revokes access to Google Calendar
   * Currently not used in the UI but could be added to settings
   */
  revokeGoogleCalendarAccess: async (calendarId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found, cannot revoke Google Calendar");
        return false;
      }

      // Call the edge function to revoke the token
      const { error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'revoke',
          calendarId,
          userId: user.id
        },
      });

      if (error) {
        console.error('Error revoking Google Calendar access:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception revoking Google Calendar access:', error);
      return false;
    }
  }
};
