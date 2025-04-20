import { useState } from "react";
import { Calendar } from "@/frontend/components/ui/calendar";
import { cn } from "@/frontend/utils/utils";
import { Card } from "@/frontend/components/ui/card";
import { CheckCircle, ChevronDown, ChevronUp, RefreshCw, LogOut } from "lucide-react";

interface CalendarSidebarProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function CalendarSidebar({ date, setDate }: CalendarSidebarProps) {
  const [googleOpen, setGoogleOpen] = useState(true);

  return (
    <div className="hidden lg:block w-64 space-y-6">
      {/* Mini Calendar */}
      <div className="flex flex-col items-start pl-0">
        <div className="rounded-3xl border border-white/10 bg-background w-[290px] p-6 flex justify-center items-center ml-[-32px]">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            weekStartsOn={1}
            className={cn("rounded-3xl bg-background shadow-none w-[260px] mx-auto p-0 border-none")}
          />
        </div>
      </div>

      {/* Google Calendar Modern Card */}
      <div className="rounded-3xl border border-white/10 bg-background w-[290px] p-0 ml-[-32px] transition-all duration-300">
        {/* Header Row */}
        <button
          className="flex w-full items-center justify-between px-6 py-4 focus:outline-none"
          onClick={() => setGoogleOpen((prev) => !prev)}
          aria-expanded={googleOpen}
        >
          <span className="flex items-center gap-2 text-base font-semibold text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Google Calendar
          </span>
          {googleOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
          )}
        </button>
        {/* Collapsible Content */}
        <div
          className={
            googleOpen
              ? "px-6 pb-4 pt-0 opacity-100 max-h-[300px] transition-all duration-300"
              : "px-6 pb-0 pt-0 opacity-0 max-h-0 overflow-hidden transition-all duration-300"
          }
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500 font-medium">Connected</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white bg-background hover:bg-accent transition mb-2">
            <RefreshCw className="w-4 h-4" />
            Sync Calendar
          </button>
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white bg-background hover:bg-accent transition">
            <LogOut className="w-4 h-4" />
            Disconnect Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
