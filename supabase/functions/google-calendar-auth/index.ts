
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Create event in Google Calendar
async function createGoogleCalendarEvent(accessToken: string, event: any) {
  try {
    const googleEvent = {
      summary: event.title,
      description: event.description || "",
      start: {
        dateTime: event.start_time,
        timeZone: "UTC",
      },
      end: {
        dateTime: event.end_time,
        timeZone: "UTC",
      },
      colorId: getGoogleColorId(event.color),
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw error;
  }
}

// Update event in Google Calendar
async function updateGoogleCalendarEvent(accessToken: string, googleEventId: string, event: any) {
  try {
    const googleEvent = {
      summary: event.title,
      description: event.description || "",
      start: {
        dateTime: event.start_time,
        timeZone: "UTC",
      },
      end: {
        dateTime: event.end_time,
        timeZone: "UTC",
      },
      colorId: getGoogleColorId(event.color),
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw error;
  }
}

// Delete event from Google Calendar
async function deleteGoogleCalendarEvent(accessToken: string, googleEventId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 410) { // 410 Gone means already deleted
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    throw error;
  }
}

// Map app color to Google Calendar colorId
function getGoogleColorId(color: string): string {
  // Google Calendar color IDs:
  // 1: Blue, 2: Green, 3: Purple, 4: Red, 5: Yellow, 6: Orange, 7: Turquoise, 8: Gray, 9: Bold Blue, 10: Bold Green, 11: Bold Red
  const colorMap: Record<string, string> = {
    "#3b82f6": "1", // Blue
    "#22c55e": "2", // Green
    "#a855f7": "3", // Purple
    "#ef4444": "4", // Red
    "#eab308": "5", // Yellow
    "#f97316": "6", // Orange
    "#06b6d4": "7", // Cyan/Turquoise
    "#6b7280": "8", // Gray
  };

  return colorMap[color] || "1"; // Default to blue
}

// Import Google Calendar events to Supabase
async function importGoogleCalendarEvents(accessToken: string, email: string, userId: string) {
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
          user: userId, // Link to the authenticated user
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
      .eq("user", userId)
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

// Verify user exists
async function verifyUser(userId: string) {
  if (!userId) return false;
  
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error || !data.user) {
    console.error("Error verifying user:", error);
    return false;
  }
  
  return true;
}

// Get the most recent token for a user
async function getUserToken(userId: string) {
  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    throw new Error(`No valid Google Calendar connection found for this user: ${error.message}`);
  }
  
  return data;
}

// Handler for HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, origin, redirectUri, code, calendarId, event, eventId, userId } = await req.json();

    // Initialize the OAuth flow
    if (action === "init") {
      // Verify user exists if userId is provided
      if (userId) {
        const userExists = await verifyUser(userId);
        if (!userExists) {
          throw new Error("Invalid user ID");
        }
      }
      
      const state = generateRandomString(16);
      const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events email");
      
      // Use the provided redirectUri or construct a default one
      const actualRedirectUri = redirectUri || `${origin}/api/google-calendar-callback`;
      
      console.log("Using redirect URI:", actualRedirectUri);
      
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=code&` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `scope=${scope}&` +
        `redirect_uri=${encodeURIComponent(actualRedirectUri)}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle the OAuth callback
    if (action === "callback") {
      if (!code) {
        throw new Error("Authorization code is required");
      }
      
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      // Verify user exists
      const userExists = await verifyUser(userId);
      if (!userExists) {
        throw new Error("Invalid user ID");
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

      // Store tokens in Supabase with the user_id
      const { error: tokenError } = await supabase
        .from("google_calendar_tokens")
        .upsert(
          {
            email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
            user_id: userId
          },
          { onConflict: "user_id,email" }
        );

      if (tokenError) {
        throw new Error(`Failed to store tokens: ${tokenError.message}`);
      }

      // Import events from Google Calendar
      const importResult = await importGoogleCalendarEvents(tokens.access_token, email, userId);

      return new Response(
        JSON.stringify({
          success: true,
          email,
          events_imported: importResult.count,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create a new event in Google Calendar
    if (action === "createEvent") {
      if (!event) {
        throw new Error("Event data is required");
      }
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get the latest token for the user
      const tokenData = await getUserToken(userId);

      // Create the event in Google Calendar
      const googleEvent = await createGoogleCalendarEvent(tokenData.access_token, event);

      // Update the local event with the Google Calendar ID
      const { error: updateError } = await supabase
        .from("events")
        .update({
          google_event_id: googleEvent.id,
          source: "app_synced"
        })
        .eq("id", event.id)
        .eq("user", userId);

      if (updateError) {
        throw new Error(`Failed to update event with Google Calendar ID: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          google_event_id: googleEvent.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update an event in Google Calendar
    if (action === "updateEvent") {
      if (!event || !event.google_event_id) {
        throw new Error("Event data with Google Calendar ID is required");
      }
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get the latest token for the user
      const tokenData = await getUserToken(userId);

      // Update the event in Google Calendar
      await updateGoogleCalendarEvent(tokenData.access_token, event.google_event_id, event);

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Delete an event from Google Calendar
    if (action === "deleteEvent") {
      if (!eventId) {
        throw new Error("Event ID is required");
      }
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get the event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("google_event_id")
        .eq("id", eventId)
        .eq("user", userId)
        .single();

      if (eventError || !eventData || !eventData.google_event_id) {
        throw new Error("Event not found or not linked to Google Calendar");
      }

      // Get the latest token for the user
      const tokenData = await getUserToken(userId);

      // Delete the event from Google Calendar
      await deleteGoogleCalendarEvent(tokenData.access_token, eventData.google_event_id);

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Revoke access to Google Calendar
    if (action === "revoke") {
      if (!calendarId) {
        throw new Error("Calendar ID is required");
      }
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get the token from the database
      const { data: tokenData, error: tokenError } = await supabase
        .from("google_calendar_tokens")
        .select("access_token")
        .eq("id", calendarId)
        .eq("user_id", userId)
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
        .eq("id", calendarId)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Failed to delete token: ${deleteError.message}`);
      }

      // Delete associated events
      const { error: deleteEventsError } = await supabase
        .from("events")
        .delete()
        .eq("source", "google")
        .eq("user", userId);

      if (deleteEventsError) {
        throw new Error(`Failed to delete events: ${deleteEventsError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Google Calendar disconnected successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Invalid action",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
