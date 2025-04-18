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
      
      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(2, 15);
      
      const origin = window.location.origin;
      
      // Use the Supabase Edge Function public URL as the redirect URI
      // Hardcode your project ref for reliability
      const redirectUri = "https://b92b88c56ce4albba899d0761d8f1933c010b329d8b.functions.supabase.co/google-calendar-auth";
      
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
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
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

      // Check the response for success
      if (data && data.success) {
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
