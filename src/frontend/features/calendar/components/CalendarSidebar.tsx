import { useState, useEffect } from "react";
import { Calendar } from "@/frontend/components/ui/calendar";
import { cn } from "@/frontend/lib/utils";
import { Card } from "@/frontend/components/ui/card";
import { CheckCircle, ChevronDown, ChevronUp, RefreshCw, LogOut, Calendar as CalendarIcon } from "lucide-react";
import { GoogleCalendarButton } from "@/frontend/features/calendar/components/GoogleCalendarButton";
import { DisconnectGoogleCalendarButton } from "@/frontend/features/calendar/components/DisconnectGoogleCalendarButton";
import { getConnectedCalendars } from "@/backend/api/services/googleCalendar/googleCalendarService";
import { supabase } from "@/backend/database/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { syncWithGoogleCalendar } from "@/backend/api/services/googleCalendar/googleCalendarService";
import { SyncGoogleCalendarButton } from "@/frontend/features/calendar/components/SyncGoogleCalendarButton";

interface CalendarSidebarProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function CalendarSidebar({ date, setDate }: CalendarSidebarProps) {
  const [googleOpen, setGoogleOpen] = useState(true);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getCurrentUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkGoogleCalendar = async () => {
    try {
      if (!user) {
        setHasGoogleCalendar(false);
        setCalendarId(null);
        return;
      }
      const calendars = await getConnectedCalendars();
      setHasGoogleCalendar(calendars.length > 0);
      setCalendarId(calendars.length > 0 ? calendars[0].id : null);
    } catch (error) {
      setCalendarId(null);
    }
  };

  useEffect(() => {
    if (user) {
      checkGoogleCalendar();
    }
  }, [user]);

  const handleSyncSuccess = async () => {
    try {
      await syncWithGoogleCalendar();
      setLastSynced(new Date());
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="hidden lg:block w-64 space-y-6">
      {/* Mini Calendar */}
      <div className="flex flex-col items-start pl-0">
        <div className="rounded-xl border bg-card w-[290px] p-6 flex justify-center items-center ml-[-32px] shadow">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            weekStartsOn={1}
            className={cn("rounded-xl bg-card shadow-none w-[260px] mx-auto p-0 border-none")}
          />
        </div>
      </div>

      {/* Google Calendar Modern Card */}
      <div className="rounded-xl border bg-card w-[290px] p-6 ml-[-32px] shadow transition-all duration-300">
        {/* Header Row */}
        <button
          className="flex w-full items-center justify-between px-0 py-0 focus:outline-none"
          onClick={() => setGoogleOpen((prev) => !prev)}
          aria-expanded={googleOpen}
        >
          <span className="flex items-center gap-2 text-base font-semibold text-primary">
            {hasGoogleCalendar && calendarId ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <LogOut className="w-5 h-5 text-red-500" />
            )}
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
          {user && hasGoogleCalendar && calendarId && (
            <div className="mb-2 flex flex-col gap-3 items-stretch">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Connected</span>
              </div>
              <SyncGoogleCalendarButton
                variant="outline"
                size="default"
                className="w-full border border-border rounded-lg bg-transparent text-foreground hover:bg-accent focus:ring-2 focus:ring-primary focus:outline-none py-3 text-base font-semibold"
                onSuccess={handleSyncSuccess}
              />
              <DisconnectGoogleCalendarButton
                calendarId={calendarId}
                onSuccess={() => {
                  setHasGoogleCalendar(false);
                  setCalendarId(null);
                }}
              />
              {lastSynced && (
                <div className="text-xs text-muted-foreground pt-1 text-center">Last synced: {lastSynced.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
              )}
            </div>
          )}
          {user && !hasGoogleCalendar && (
            <div className="mb-2 flex flex-col gap-3 items-stretch">
              <div className="flex items-center gap-2 mb-1">
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">Not connected</span>
              </div>
              <GoogleCalendarButton onSuccess={checkGoogleCalendar} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
