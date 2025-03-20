
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Generate a random state for OAuth security
function generateRandomString(length: number) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Get events from Google Calendar
async function getGoogleCalendarEvents(accessToken: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&timeMin=" + 
      new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
}

// Import Google Calendar events to Supabase
async function importGoogleCalendarEvents(accessToken: string, email: string) {
  try {
    // Get events from Google Calendar
    const googleEvents = await getGoogleCalendarEvents(accessToken);
    
    // Transform Google Calendar events to our format
    const eventsToInsert = googleEvents
      .filter((event: any) => event.status !== "cancelled" && event.start && event.end)
      .map((event: any) => {
        // Handle different date formats (dateTime or date for all-day events)
        const startTime = event.start.dateTime || `${event.start.date}T00:00:00`;
        const endTime = event.end.dateTime || `${event.end.date}T23:59:59`;
        
        return {
          id: crypto.randomUUID(),
          title: event.summary || "Untitled Event",
          description: event.description || "",
          start_time: startTime,
          end_time: endTime,
          color: "#3b82f6", // Default blue color
          google_event_id: event.id,
          source: "google",
        };
      });

    if (eventsToInsert.length === 0) {
      return { count: 0 };
    }

    // First, check for existing Google Calendar events to avoid duplicates
    const { data: existingEvents } = await supabase
      .from("events")
      .select("google_event_id")
      .eq("source", "google")
      .in(
        "google_event_id",
        eventsToInsert.map((e) => e.google_event_id)
      );

    const existingEventIds = new Set(existingEvents?.map((e) => e.google_event_id) || []);
    
    // Filter out events that already exist
    const newEvents = eventsToInsert.filter(
      (event) => !existingEventIds.has(event.google_event_id)
    );

    if (newEvents.length === 0) {
      return { count: 0 };
    }

    // Insert new events
    const { error } = await supabase.from("events").insert(newEvents);

    if (error) {
      throw error;
    }

    return { count: newEvents.length };
  } catch (error) {
    console.error("Error importing Google Calendar events:", error);
    throw error;
  }
}

serve(async (req) => {
  try {
    const { action, origin, code, redirectUri, calendarId } = await req.json();

    // Initialize the OAuth flow
    if (action === "init") {
      const state = generateRandomString(16);
      const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly email");
      const redirectUri = `${origin}/api/google-calendar-callback`;
      
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=code&` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `scope=${scope}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle the OAuth callback
    if (action === "callback") {
      if (!code) {
        throw new Error("Authorization code is required");
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
      }

      const tokens = await tokenResponse.json();
      
      // Get user email from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user information");
      }

      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;

      if (!email) {
        throw new Error("Failed to get user email");
      }

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      // Store tokens in Supabase
      const { error: tokenError } = await supabase
        .from("google_calendar_tokens")
        .upsert(
          {
            email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (tokenError) {
        throw new Error(`Failed to store tokens: ${tokenError.message}`);
      }

      // Import events from Google Calendar
      const importResult = await importGoogleCalendarEvents(tokens.access_token, email);

      return new Response(
        JSON.stringify({
          success: true,
          email,
          events_imported: importResult.count,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Revoke access to Google Calendar
    if (action === "revoke") {
      if (!calendarId) {
        throw new Error("Calendar ID is required");
      }

      // Get the token from the database
      const { data: tokenData, error: tokenError } = await supabase
        .from("google_calendar_tokens")
        .select("access_token")
        .eq("id", calendarId)
        .single();

      if (tokenError || !tokenData) {
        throw new Error("Failed to retrieve token");
      }

      // Revoke the token with Google
      const revokeResponse = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Delete the token from the database
      const { error: deleteError } = await supabase
        .from("google_calendar_tokens")
        .delete()
        .eq("id", calendarId);

      if (deleteError) {
        throw new Error(`Failed to delete token: ${deleteError.message}`);
      }

      // Delete associated events
      const { error: deleteEventsError } = await supabase
        .from("events")
        .delete()
        .eq("source", "google");

      if (deleteEventsError) {
        throw new Error(`Failed to delete events: ${deleteEventsError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Google Calendar disconnected successfully",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Invalid action",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
