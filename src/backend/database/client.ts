import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Define the Supabase URL and key with fallback values
const supabaseUrl = "https://haghjmyeiaeubrfkuqts.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZ2hqbXllaWFldWJyZmt1cXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTg3MzgsImV4cCI6MjA1NTk5NDczOH0.vlgh-ZBtiFx62I5h5ojFBfAIx4z2mHy-TUsteFo2CH4";

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or key!");
  throw new Error("Supabase configuration is incomplete. Please check your environment variables.");
}

// Updated client configuration options without custom headers
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
  // Removed the global headers section that was causing CORS issues
};

/**
 * Supabase client instance with type safety.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, supabaseOptions);

// Utility function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('tasks').select('count').limit(1);
    return !error;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
};
