// Define calendar-related types
export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  color?: string;
  project?: string;
  googleEventId?: string;
  source?: 'app' | 'google';
  reminderAt?: string;
  reminderSent?: boolean;
  participants: Participant[];
  // Recurrence fields
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceDays?: string[]; // Days of the week for weekly recurrence
  recurrenceEndDate?: string;
  recurrenceCount?: number;
  parentId?: string; // Link to parent recurring event
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MonthViewProps {
  events: Event[];
  date: Date | undefined;
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export interface WeekViewProps {
  events: Event[];
  date: Date | undefined;
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export interface ListViewProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onEventsChange: () => void;
}

export interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  event?: Event;
}
