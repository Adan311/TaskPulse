
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Create Supabase client with admin privileges 
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle authorization initiation
    if (action === "init") {
      const { origin } = await req.json();
      
      // Generate a random state for security
      const state = crypto.randomUUID();
      
      // Create authorization URL
      const redirectUri = `${origin}/api/google-calendar-callback`;
      const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&state=${state}&prompt=consent`;
      
      return new Response(
        JSON.stringify({
          authUrl,
          state,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle callback from Google OAuth
    if (action === "callback") {
      const { code, redirectUri } = await req.json();
      
      if (!code) {
        throw new Error("Authorization code is required");
      }

      // Exchange authorization code for tokens
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

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error("Token exchange error:", tokenData);
        throw new Error(`Failed to exchange auth code: ${tokenData.error}`);
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      
      // Get user info to determine which Google account was connected
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      const userInfo = await userInfoResponse.json();
      
      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info");
      }

      // Store tokens in the database (you would typically use RLS and get user ID from auth)
      // In this example, we're using the email as an identifier
      const { error: tokenStoreError } = await supabase
        .from("google_calendar_tokens")
        .upsert({
          email: userInfo.email,
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        });

      if (tokenStoreError) {
        console.error("Token storage error:", tokenStoreError);
        throw new Error("Failed to store tokens");
      }

      // Now fetch and import the calendar events
      const primaryCalendarResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const calendarData = await primaryCalendarResponse.json();
      
      if (!primaryCalendarResponse.ok) {
        console.error("Calendar fetch error:", calendarData);
        throw new Error("Failed to fetch calendar events");
      }

      // Map and store events
      const events = calendarData.items.map((event: any) => ({
        id: crypto.randomUUID(),
        title: event.summary || "Untitled Event",
        description: event.description || null,
        start_time: event.start?.dateTime || `${event.start?.date}T00:00:00`,
        end_time: event.end?.dateTime || `${event.end?.date}T23:59:59`,
        color: "#4285F4", // Google blue color
        user: null, // This would typically be the authenticated user's ID
        google_event_id: event.id,
        source: "google_calendar",
      }));

      // Insert events
      if (events.length > 0) {
        const { error: eventsError } = await supabase.from("events").insert(events);
        
        if (eventsError) {
          console.error("Events insert error:", eventsError);
          throw new Error("Failed to import events");
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Google Calendar connected successfully",
          events_imported: events.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle fetching latest events (for manual sync)
    if (action === "sync") {
      const { email } = await req.json();
      
      // Get tokens for the user
      const { data: tokenData, error: tokenError } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .eq("email", email)
        .single();
        
      if (tokenError || !tokenData) {
        throw new Error("No Google Calendar connection found");
      }
      
      // Check if token is expired and refresh if needed
      let accessToken = tokenData.access_token;
      
      if (new Date(tokenData.expires_at) < new Date()) {
        // Token is expired, refresh it
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokenData.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        
        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh token");
        }
        
        accessToken = refreshData.access_token;
        
        // Update token in database
        await supabase
          .from("google_calendar_tokens")
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq("email", email);
      }
      
      // Fetch events from Google Calendar
      const eventsResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const eventsData = await eventsResponse.json();
      
      if (!eventsResponse.ok) {
        throw new Error("Failed to fetch calendar events");
      }
      
      // Map and store events (similar to callback handler)
      const events = eventsData.items.map((event: any) => ({
        id: crypto.randomUUID(),
        title: event.summary || "Untitled Event",
        description: event.description || null,
        start_time: event.start?.dateTime || `${event.start?.date}T00:00:00`,
        end_time: event.end?.dateTime || `${event.end?.date}T23:59:59`,
        color: "#4285F4", // Google blue color
        user: null,
        google_event_id: event.id,
        source: "google_calendar",
      }));
      
      // Before inserting new events, remove previously imported Google events to avoid duplicates
      await supabase
        .from("events")
        .delete()
        .eq("source", "google_calendar");
      
      // Insert new events
      if (events.length > 0) {
        await supabase.from("events").insert(events);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Calendar synced successfully",
          events_imported: events.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in google-calendar-auth function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
