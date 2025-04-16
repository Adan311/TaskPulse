
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Calendar } from "@/frontend/components/ui/calendar";
import { cn } from "@/frontend/utils/utils";

interface CalendarSidebarProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function CalendarSidebar({ date, setDate }: CalendarSidebarProps) {
  return (
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
  );
}
