
export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  color?: string;
  project?: string;
  user?: string;
  googleEventId?: string;
  source?: 'app' | 'google';
}

export interface Participant {
  name: string;
  avatar: string;
}

export interface EventWithParticipants extends Event {
  participants: Participant[];
}
