import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");

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
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="hidden lg:block w-64 space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-4">
                <h3 className="font-semibold leading-none tracking-tight">
                  Mini Calendar
                </h3>
              </div>
              <div className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className={cn("rounded-md border shadow-sm")}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {date ? format(date, "MMMM yyyy") : "Select a date"}
                </h2>
              </div>
              {/* Calendar grid will be implemented here */}
              <div className="h-[600px] mt-4 rounded-md border">
                <div className="grid grid-cols-7 gap-px bg-muted">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="bg-background p-2 text-center text-sm font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar days will be implemented here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}