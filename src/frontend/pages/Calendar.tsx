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
import { getEvents, Event } from "@/backend/api/services/event.service";
import { supabase } from "@/backend/database/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { DayView } from "@/frontend/features/calendar/components/DayView";
import { useAuthCheck } from "@/frontend/hooks/useAuthCheck";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const { user, loading: authLoading } = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchEvents = async () => {
    try {
      if (!user) {
        setEvents([]);
        setLoading(false);
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

  useEffect(() => {
    if (user) {
      fetchEvents();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Subscribe to real-time updates for events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `user=eq.${user.id}` },
        (payload) => {
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
      case "day":
        return date ? <DayView events={events} date={date} onEditEvent={handleEditEvent} /> : null;
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

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <CalendarHeader 
          date={date}
          view={view}
          setDate={setDate}
          setView={setView}
        />

        <div className="flex gap-6 flex-col md:flex-row">
          <div className="md:w-64 w-full">
            <CalendarSidebar date={date} setDate={setDate} />
          </div>

          <div className="flex-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                </CardTitle>
                <Button size="sm" onClick={handleAddEvent} disabled={!user}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
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
