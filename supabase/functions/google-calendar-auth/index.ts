
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
    console.log("Fetching events from Google Calendar");
    
    // Get events starting from 3 months ago to include more potential matches
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&timeMin=" + 
      threeMonthsAgo.toISOString(),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch events: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} events from Google Calendar`);
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
}

// Create event in Google Calendar
async function createGoogleCalendarEvent(accessToken: string, event: any) {
  try {
    console.log("Creating event in Google Calendar:", event.title);
    
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
      const errorText = await response.text();
      console.error(`Failed to create event: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Event created in Google Calendar with ID:", data.id);
    return data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw error;
  }
}

// Update event in Google Calendar
async function updateGoogleCalendarEvent(accessToken: string, googleEventId: string, event: any) {
  try {
    console.log("Updating event in Google Calendar:", googleEventId);
    
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
      const errorText = await response.text();
      console.error(`Failed to update event: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Event updated in Google Calendar with ID:", data.id);
    return data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw error;
  }
}

// Delete event from Google Calendar
async function deleteGoogleCalendarEvent(accessToken: string, googleEventId: string) {
  try {
    console.log("Deleting event from Google Calendar:", googleEventId);
    
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
      const errorText = await response.text();
      console.error(`Failed to delete event: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }

    console.log("Event deleted from Google Calendar");
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
    console.log(`Importing events for user ${userId} with email ${email}`);
    
    // Get events from Google Calendar
    const googleEvents = await getGoogleCalendarEvents(accessToken);
    console.log(`Found ${googleEvents.length} events in Google Calendar`);
    
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
      console.log("No events to insert");
      return { count: 0 };
    }

    // First, check for existing Google Calendar events to avoid duplicates
    const { data: existingEvents, error: queryError } = await supabase
      .from("events")
      .select("google_event_id")
      .eq("source", "google")
      .eq("user", userId);
    
    if (queryError) {
      console.error("Error querying existing events:", queryError);
      throw queryError;
    }

    const existingEventIds = new Set(existingEvents?.map((e) => e.google_event_id) || []);
    console.log(`Found ${existingEventIds.size} existing events`);
    
    // Filter out events that already exist
    const newEvents = eventsToInsert.filter(
      (event) => !existingEventIds.has(event.google_event_id)
    );

    console.log(`Inserting ${newEvents.length} new events`);
    
    if (newEvents.length === 0) {
      return { count: 0 };
    }

    // Insert events in batches to avoid request size limits
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < newEvents.length; i += batchSize) {
      const batch = newEvents.slice(i, i + batchSize);
      console.log(`Inserting batch of ${batch.length} events (${i} to ${i + batch.length} of ${newEvents.length})`);
      
      const { error } = await supabase.from("events").insert(batch);
      
      if (error) {
        console.error("Error inserting events batch:", error);
        // Continue with next batch
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully inserted ${insertedCount} events`);
    return { count: insertedCount };
  } catch (error) {
    console.error("Error importing Google Calendar events:", error);
    throw error;
  }
}

// Push app events to Google Calendar
async function pushEventsToGoogleCalendar(accessToken: string, userId: string) {
  try {
    console.log(`Pushing events for user ${userId} to Google Calendar`);
    
    // Get app events that haven't been synced to Google
    const { data: appEvents, error: queryError } = await supabase
      .from("events")
      .select("*")
      .eq("user", userId)
      .is("google_event_id", null) // Events not synced to Google yet
      .eq("source", "app") // Only events created in the app
      .order("start_time", { ascending: false })
      .limit(100); // Limit to avoid rate limits
    
    if (queryError) {
      console.error("Error querying app events:", queryError);
      throw queryError;
    }
    
    if (!appEvents || appEvents.length === 0) {
      console.log("No app events to push to Google Calendar");
      return { count: 0 };
    }
    
    console.log(`Found ${appEvents.length} app events to push to Google Calendar`);
    
    let syncedCount = 0;
    
    // Push each event to Google Calendar with rate limiting
    for (const event of appEvents) {
      try {
        console.log(`Pushing event ${event.id} to Google Calendar: ${event.title}`);
        const googleEvent = await createGoogleCalendarEvent(accessToken, event);
        
        if (googleEvent && googleEvent.id) {
          // Update the local event with the Google Calendar ID
          const { error: updateError } = await supabase
            .from("events")
            .update({
              google_event_id: googleEvent.id,
              source: "app_synced"
            })
            .eq("id", event.id);
            
          if (updateError) {
            console.error("Error updating event with Google ID:", updateError);
          } else {
            syncedCount++;
          }
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (eventError) {
        console.error(`Error pushing event ${event.id} to Google Calendar:`, eventError);
        // Continue with next event
      }
    }
    
    console.log(`Successfully pushed ${syncedCount} events to Google Calendar`);
    return { count: syncedCount };
  } catch (error) {
    console.error("Error pushing events to Google Calendar:", error);
    throw error;
  }
}

// Verify user exists
async function verifyUser(userId: string) {
  if (!userId) {
    console.log("No user ID provided");
    return false;
  }
  
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !data.user) {
      console.error("Error verifying user:", error);
      return false;
    }
    
    console.log(`User verified: ${data.user.id}`);
    return true;
  } catch (error) {
    console.error("Exception verifying user:", error);
    return false;
  }
}

// Get the most recent token for a user
async function getUserToken(userId: string) {
  console.log(`Getting token for user ${userId}`);
  
  const { data, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error(`Error getting token: ${error.message}`);
    throw new Error(`No valid Google Calendar connection found for this user: ${error.message}`);
  }
  
  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  
  if (now > expiresAt) {
    console.log("Token expired, refreshing...");
    
    if (!data.refresh_token) {
      throw new Error("No refresh token available");
    }
    
    const refreshedToken = await refreshGoogleToken(data.refresh_token, userId);
    return refreshedToken;
  }
  
  return data;
}

// Refresh Google Calendar token
async function refreshGoogleToken(refreshToken: string, userId: string) {
  try {
    console.log(`Refreshing token for user ${userId}`);
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh error:", errorText);
      throw new Error(`Failed to refresh token: ${errorText}`);
    }
    
    const tokens = await response.json();
    
    // Calculate new expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    
    // Update token in database
    const { data, error } = await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("refresh_token", refreshToken)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating token:", error);
      throw error;
    }
    
    console.log("Token refreshed successfully");
    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Handle the force sync action
async function handleForceSync(userId: string) {
  try {
    console.log(`Force syncing for user ${userId}`);
    
    // Verify the user exists
    const userExists = await verifyUser(userId);
    if (!userExists) {
      throw new Error("Invalid user ID");
    }
    
    // Get the user's token
    const tokenData = await getUserToken(userId);
    if (!tokenData || !tokenData.access_token) {
      throw new Error("No Google Calendar token found for this user");
    }
    
    // Import events from Google Calendar
    const importResult = await importGoogleCalendarEvents(
      tokenData.access_token,
      tokenData.email,
      userId
    );
    
    // Push app events to Google Calendar
    const pushResult = await pushEventsToGoogleCalendar(
      tokenData.access_token,
      userId
    );
    
    return {
      success: true,
      imported: importResult.count,
      pushed: pushResult.count
    };
  } catch (error) {
    console.error("Error during force sync:", error);
    throw error;
  }
}

// Handler for HTTP requests
serve(async (req) => {
  // Log the request method and path
  console.log(`Request: ${req.method} ${new URL(req.url).pathname}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData;
    
    try {
      requestData = await req.json();
      console.log("Request data:", JSON.stringify(requestData));
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { action, origin, redirectUri, code, calendarId, event, eventId, userId } = requestData;

    // Initialize the OAuth flow
    if (action === "init") {
      console.log("Initializing OAuth flow");
      
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
      console.log("Processing OAuth callback");
      
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

      console.log("Exchanging code for tokens");
      
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
        const errorText = await tokenResponse.text();
        console.error("Token exchange error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
        } catch (e) {
          throw new Error(`Failed to exchange code for tokens: ${errorText}`);
        }
      }

      const tokens = await tokenResponse.json();
      console.log("Got tokens:", tokens.access_token ? "Access token received" : "No access token", 
                               tokens.refresh_token ? "Refresh token received" : "No refresh token");
      
      // Get user email from Google
      console.log("Getting user info from Google");
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error("User info error:", errorText);
        throw new Error(`Failed to get user information: ${errorText}`);
      }

      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;

      console.log(`Got user email: ${email}`);

      if (!email) {
        throw new Error("Failed to get user email");
      }

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
      
      console.log(`Storing tokens for user ${userId} with email ${email}`);

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
        console.error("Error storing tokens:", tokenError);
        throw new Error(`Failed to store tokens: ${tokenError.message}`);
      }

      // Import events from Google Calendar
      console.log("Importing events from Google Calendar");
      const importResult = await importGoogleCalendarEvents(tokens.access_token, email, userId);
      console.log(`Imported ${importResult.count} events`);

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

    // Force sync with Google Calendar
    if (action === "syncEvents") {
      console.log("Handling force sync request");
      
      if (!userId) {
        throw new Error("User ID is required for syncing");
      }
      
      const syncResult = await handleForceSync(userId);
      
      return new Response(
        JSON.stringify(syncResult),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create a new event in Google Calendar
    if (action === "createEvent") {
      console.log("Creating event in Google Calendar");
      
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
        console.error("Error updating event:", updateError);
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
      console.log("Updating event in Google Calendar");
      
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
      console.log("Deleting event from Google Calendar");
      
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
        console.error("Error getting event details:", eventError);
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
      console.log("Revoking Google Calendar access");
      
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
        console.error("Error getting token for revocation:", tokenError);
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
        console.error("Error deleting token:", deleteError);
        throw new Error(`Failed to delete token: ${deleteError.message}`);
      }

      // Delete associated events
      const { error: deleteEventsError } = await supabase
        .from("events")
        .delete()
        .eq("source", "google")
        .eq("user", userId);

      if (deleteEventsError) {
        console.error("Error deleting events:", deleteEventsError);
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

    console.error(`Invalid action: ${action}`);
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
    console.error("Error in edge function:", error.message, error.stack);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
