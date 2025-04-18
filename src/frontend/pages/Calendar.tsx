import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Button } from "@/frontend/components/ui/button";
import { Plus } from "lucide-react";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { CalendarHeader } from "@/frontend/features/calendar/components/CalendarHeader";
import { CalendarSidebar } from "@/frontend/features/calendar/components/CalendarSidebar";
import { MonthView } from "@/frontend/features/calendar/components/MonthView";
import { WeekView } from "@/frontend/features/calendar/components/WeekView";
import { ListView } from "@/frontend/features/calendar/components/ListView";
import { EventDialog } from "@/frontend/features/calendar/components/EventDialog";
import { GoogleCalendarButton } from "@/frontend/features/calendar/components/GoogleCalendarButton";
import { DisconnectGoogleCalendarButton } from "@/frontend/features/calendar/components/DisconnectGoogleCalendarButton";
import { SyncGoogleCalendarButton } from "@/frontend/features/calendar/components/SyncGoogleCalendarButton";
import { getEvents, Event } from "@/backend/api/services/eventService";
import { getConnectedCalendars } from "@/backend/api/services/googleCalendarService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/frontend/hooks/use-toast";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Get the current user when component mounts
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getCurrentUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  
  const fetchEvents = async () => {
    try {
      if (!user) {
        setEvents([]);
        return;
      }
      
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Error loading events",
        description: "Failed to load your calendar events. Please try again.",
      });
      setLoading(false);
    }
  };

  const checkGoogleCalendar = async () => {
    try {
      if (!user) {
        setHasGoogleCalendar(false);
        setCalendarId(null);
        return;
      }
      
      const calendars = await getConnectedCalendars();
      setHasGoogleCalendar(calendars.length > 0);
      setCalendarId(calendars.length > 0 ? calendars[0].id : null);
    } catch (error) {
      console.error("Error checking Google Calendar:", error);
      setCalendarId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      checkGoogleCalendar();
    }
  }, [user]);

  // Subscribe to real-time updates for events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `user=eq.${user.id}` },
        (payload) => {
          console.log('Event changed:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (view) {
      case "month":
        return <MonthView events={events} date={date} onEditEvent={handleEditEvent} onEventsChange={fetchEvents} />;
      case "week":
        return <WeekView events={events} date={date} onEditEvent={handleEditEvent} onEventsChange={fetchEvents} />;
      case "list":
        return <ListView events={events} onEditEvent={handleEditEvent} onEventsChange={fetchEvents} />;
      default:
        return <MonthView events={events} date={date} onEditEvent={handleEditEvent} onEventsChange={fetchEvents} />;
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setEventDialogOpen(true);
  };

  const handleSyncSuccess = () => {
    fetchEvents();
    setLastSynced(new Date());
  };

  const handleConnectSuccess = () => checkGoogleCalendar();

  const handleDisconnectSuccess = () => checkGoogleCalendar();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <CalendarHeader 
          date={date}
          view={view}
          setDate={setDate}
          setView={setView}
          hasGoogleCalendar={hasGoogleCalendar}
          onSyncSuccess={fetchEvents}
        />

        <div className="flex gap-6">
          <CalendarSidebar date={date} setDate={setDate} />

          <div className="flex-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                </CardTitle>
                <div className="flex space-x-2 items-center">
                  {/* Google Calendar Sync Status Indicator */}
                  {user && (
                    hasGoogleCalendar && calendarId ? (
                      <span className="flex items-center text-green-500 font-medium mr-2">
                        <CheckCircle className="h-4 w-4 mr-1" /> Synced with Google Calendar
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 font-medium mr-2">
                        <XCircle className="h-4 w-4 mr-1" /> Not synced with Google Calendar
                      </span>
                    )
                  )}
                  {lastSynced && (
                    <span className="text-sm text-gray-500">
                      Last synced at {lastSynced.toLocaleTimeString()}
                    </span>
                  )}
                  {/* Google Calendar Buttons */}
                  {hasGoogleCalendar && calendarId && user ? (
                    <>
                      <SyncGoogleCalendarButton onSuccess={handleSyncSuccess} />
                      <DisconnectGoogleCalendarButton calendarId={calendarId} onSuccess={handleDisconnectSuccess} />
                    </>
                  ) : (
                    user && <GoogleCalendarButton onSuccess={handleConnectSuccess} />
                  )}
                  <Button size="sm" onClick={handleAddEvent} disabled={!user}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">Please sign in to view and manage your calendar.</p>
                  </div>
                ) : (
                  renderView()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EventDialog 
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSuccess={fetchEvents}
        event={selectedEvent}
      />
    </AppLayout>
  );
}
