
import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Button } from "@/frontend/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { CalendarHeader } from "@/frontend/features/calendar/components/CalendarHeader";
import { CalendarSidebar } from "@/frontend/features/calendar/components/CalendarSidebar";
import { MonthView } from "@/frontend/features/calendar/components/MonthView";
import { WeekView } from "@/frontend/features/calendar/components/WeekView";
import { ListView } from "@/frontend/features/calendar/components/ListView";
import { EventDialog } from "@/frontend/features/calendar/components/EventDialog";
import { GoogleCalendarButton } from "@/frontend/features/calendar/components/GoogleCalendarButton";
import { getEvents } from "@/backend/api/services/eventService";
import { getConnectedCalendars } from "@/backend/api/services/googleCalendarService";
import { supabase } from "@/backend/api/client/supabase";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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
      if (!user) return;
      
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const checkGoogleCalendar = async () => {
    try {
      if (!user) {
        setHasGoogleCalendar(false);
        return;
      }
      
      const calendars = await getConnectedCalendars();
      setHasGoogleCalendar(calendars.length > 0);
    } catch (error) {
      console.error("Error checking Google Calendar:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      checkGoogleCalendar();
    }
  }, [user]);

  const renderView = () => {
    switch (view) {
      case "month":
        return <MonthView />;
      case "week":
        return <WeekView />;
      case "list":
        return <ListView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <CalendarHeader 
          date={date}
          view={view}
          setDate={setDate}
          setView={setView}
        />

        <div className="flex gap-6">
          <CalendarSidebar date={date} setDate={setDate} />

          <div className="flex-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
                </CardTitle>
                <div className="flex space-x-2">
                  {!hasGoogleCalendar && user && <GoogleCalendarButton onSuccess={checkGoogleCalendar} />}
                  <Button size="sm" onClick={() => setEventDialogOpen(true)} disabled={!user}>
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
      />
    </AppLayout>
  );
}
