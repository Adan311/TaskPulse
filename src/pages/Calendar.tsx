import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { CalendarSidebar } from "@/components/Calendar/CalendarSidebar";
import { EventList } from "@/components/Calendar/EventList";
import { TimelineView } from "@/components/Calendar/TimelineView";
import { Event } from "@/types/calendar";

const events: Event[] = [
  {
    id: "1",
    title: "Weekly Project Review",
    startTime: "09:00",
    endTime: "12:00",
    participants: [
      { name: "John", avatar: "/placeholder.svg" },
      { name: "Sarah", avatar: "/placeholder.svg" }
    ],
    color: "bg-pink-100 dark:bg-pink-900/20"
  },
  {
    id: "2",
    title: "Collaboration Session",
    startTime: "10:30",
    endTime: "13:30",
    participants: [
      { name: "Mike", avatar: "/placeholder.svg" },
      { name: "Lisa", avatar: "/placeholder.svg" }
    ],
    color: "bg-purple-100 dark:bg-purple-900/20"
  }
];

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("day");

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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent>
                {view === "list" ? (
                  <EventList events={events} />
                ) : (
                  <TimelineView events={events} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}