
import { Button } from "@/frontend/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";

interface CalendarHeaderProps {
  date: Date | undefined;
  view: "month" | "week" | "day" | "list";
  setDate: (date: Date) => void;
  setView: (view: "month" | "week" | "day" | "list") => void;
}

export function CalendarHeader({ date, view, setDate, setView }: CalendarHeaderProps) {
  const navigatePrevious = () => {
    if (!date) return;
    
    switch (view) {
      case "month":
        setDate(subMonths(date, 1));
        break;
      case "week":
        setDate(subWeeks(date, 1));
        break;
      case "day":
        setDate(subDays(date, 1));
        break;
      default:
        setDate(subDays(date, 1));
    }
  };

  const navigateNext = () => {
    if (!date) return;
    
    switch (view) {
      case "month":
        setDate(addMonths(date, 1));
        break;
      case "week":
        setDate(addWeeks(date, 1));
        break;
      case "day":
        setDate(addDays(date, 1));
        break;
      default:
        setDate(addDays(date, 1));
    }
  };

  return (
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
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={navigatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={navigateNext}
          >
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
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
      </div>
    </div>
  );
}
