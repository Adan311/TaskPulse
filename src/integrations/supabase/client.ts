
import { createClient } from "@supabase/supabase-js";

// Define the Supabase URL and key with fallback values
const supabaseUrl = "https://haghjmyeiaeubrfkuqts.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZ2hqbXllaWFldWJyZmt1cXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTg3MzgsImV4cCI6MjA1NTk5NDczOH0.vlgh-ZBtiFx62I5h5ojFBfAIx4z2mHy-TUsteFo2CH4";

// Check if we have valid values before creating the client
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or key!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
