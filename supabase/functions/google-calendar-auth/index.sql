
-- This SQL will need to be executed in the Supabase SQL Editor

-- Create a table to store Google Calendar tokens
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to the events table to track Google Calendar events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT;

-- Create an index on google_event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON public.events (google_event_id);

-- Create an index on source field
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events (source);
