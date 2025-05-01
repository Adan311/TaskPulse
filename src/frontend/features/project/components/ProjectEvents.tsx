import React, { useEffect, useState } from 'react';
import { Event } from '@/frontend/types/calendar';
import { EventList } from '@/frontend/features/calendar/components/EventList';
import { getEvents } from '@/backend/api/services/eventService';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProjectEventsProps {
  projectId: string;
}

export const ProjectEvents: React.FC<ProjectEventsProps> = ({ projectId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const allEvents = await getEvents();
        setEvents(allEvents.filter(e => e.project === projectId));
      } catch (err: any) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [projectId]);

  if (loading) {
    return <Box py={3} textAlign="center"><CircularProgress /></Box>;
  }
  if (error) {
    return <Box py={3} textAlign="center"><Typography color="error">{error}</Typography></Box>;
  }
  if (events.length === 0) {
    return <Box py={3} textAlign="center"><Typography>No events for this project.</Typography></Box>;
  }
  return <EventList events={events} />;
}; 