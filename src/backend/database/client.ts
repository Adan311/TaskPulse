import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Define the Supabase URL and key with placeholder values for submission
const supabaseUrl = "your-supabase-project-url";
const supabaseKey = "your-supabase-anon-key";

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
