
// This file sets up the Supabase client for use throughout the application
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://haghjmyeiaeubrfkuqts.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZ2hqbXllaWFldWJyZmt1cXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTg3MzgsImV4cCI6MjA1NTk5NDczOH0.vlgh-ZBtiFx62I5h5ojFBfAIx4z2mHy-TUsteFo2CH4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
