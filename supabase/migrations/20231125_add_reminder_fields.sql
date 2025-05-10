-- Add reminder fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Add reminder fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Add indexes for faster lookup of pending reminders
CREATE INDEX IF NOT EXISTS idx_task_reminders ON tasks (user, reminder_at) 
WHERE reminder_sent = FALSE AND archived IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_event_reminders ON events (user, reminder_at) 
WHERE reminder_sent = FALSE; 