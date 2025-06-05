import { Button } from "@/frontend/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { SyncGoogleCalendarButton } from "./SyncGoogleCalendarButton";

interface CalendarHeaderProps {
  date: Date | undefined;
  view: "month" | "week" | "day" | "list";
  setDate: (date: Date) => void;
  setView: (view: "month" | "week" | "day" | "list") => void;
  hasGoogleCalendar?: boolean;
  onSyncSuccess?: () => void;
}

export function CalendarHeader({ 
  date, 
  view, 
  setDate, 
  setView,
  hasGoogleCalendar = false,
  onSyncSuccess
}: CalendarHeaderProps) {
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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full bg-background/80 rounded-xl border shadow-sm px-0 md:ml-[-32px] md:w-[calc(100%+32px)] py-3 mb-4">
      {/* Left: Month/Year */}
      <div className="flex items-center gap-2 ml-6 flex-shrink-0">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <span className="text-2xl font-semibold text-primary">
          {date ? format(date, view === "month" ? "MMMM, yyyy" : "MMMM d, yyyy") : ""}
        </span>
      </div>
      {/* Center: View Switcher */}
      <div className="flex items-center gap-2 flex-wrap justify-center flex-1 min-w-0">
        {[
          "month",
          "week",
          "day",
          "list"
        ].map((v) => (
          <button
            key={v}
            onClick={() => {
              console.log('CalendarHeader: switching to', v);
              setView(v as "month" | "week" | "day" | "list");
            }}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors border 
              ${view === v
                ? "bg-accent text-primary border-primary shadow"
                : "bg-muted text-muted-foreground border-transparent hover:bg-accent hover:text-primary"}
            `}
            aria-pressed={view === v}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      {/* Right: Navigation & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border bg-muted hover:bg-accent"
          onClick={navigatePrevious}
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border bg-muted hover:bg-accent"
          onClick={navigateNext}
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold px-6 ml-3 whitespace-nowrap"
          onClick={() => date && setDate(new Date())}
        >
          Today
        </Button>
      </div>
    </div>
  );
}
