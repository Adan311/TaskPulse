import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  participants: { name: string; avatar: string }[];
  color: string;
}

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

const TimelineEvent = ({ event }: { event: Event }) => (
  <div 
    className={cn(
      "rounded-lg p-3 mb-2",
      event.color
    )}
    style={{
      marginLeft: `${(parseInt(event.startTime.split(':')[0]) - 9) * 100}px`,
      width: `${(parseInt(event.endTime.split(':')[0]) - parseInt(event.startTime.split(':')[0])) * 100}px`
    }}
  >
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-medium text-sm">{event.title}</h4>
        <p className="text-xs text-muted-foreground">
          {event.startTime} - {event.endTime}
        </p>
      </div>
      <div className="flex -space-x-2">
        {event.participants.map((participant, i) => (
          <Avatar key={i} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={participant.avatar} alt={participant.name} />
            <AvatarFallback>{participant.name[0]}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  </div>
);

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("day");

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
              >
                Day
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                List
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="hidden lg:block w-64 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mini Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className={cn("rounded-md border")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">256</div>
                  <div className="text-xs text-muted-foreground">Tasks completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">128</div>
                  <div className="text-xs text-muted-foreground">To-do tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-xs text-muted-foreground">Ongoing tasks</div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Participants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              {event.startTime} - {event.endTime}
                            </div>
                          </TableCell>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>
                            <div className="flex -space-x-2">
                              {event.participants.map((participant, i) => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={participant.avatar} alt={participant.name} />
                                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="relative min-h-[600px]">
                    <div className="absolute inset-0">
                      <div className="grid grid-cols-[repeat(8,1fr)] gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="border-r border-border h-full" />
                        ))}
                      </div>
                      <div className="absolute top-0 left-0 w-full">
                        {events.map((event) => (
                          <TimelineEvent key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}