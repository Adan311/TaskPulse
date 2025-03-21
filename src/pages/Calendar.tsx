
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { CalendarSidebar } from "@/components/Calendar/CalendarSidebar";
import { MonthView } from "@/components/Calendar/MonthView";
import { WeekView } from "@/components/Calendar/WeekView";
import { ListView } from "@/components/Calendar/ListView";
import { EventDialog } from "@/components/Calendar/EventDialog";
import { GoogleCalendarButton } from "@/components/Calendar/GoogleCalendarButton";
import { getEvents } from "@/services/eventService";
import { getConnectedCalendars } from "@/services/googleCalendarService";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  
  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const checkGoogleCalendar = async () => {
    try {
      const calendars = await getConnectedCalendars();
      setHasGoogleCalendar(calendars.length > 0);
    } catch (error) {
      console.error("Error checking Google Calendar:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    checkGoogleCalendar();
  }, []);

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
                  {!hasGoogleCalendar && <GoogleCalendarButton onSuccess={checkGoogleCalendar} />}
                  <Button size="sm" onClick={() => setEventDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderView()}
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
