import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { TimerDisplay } from "@/frontend/features/timer/components/TimerDisplay";
import { TimerControls } from "@/frontend/features/timer/components/TimerControls";
import TimerHistory from "@/frontend/features/timer/components/TimerHistory";
import { CircularProgress } from "@/frontend/features/timer/components/CircularProgress";
import { DayView } from "@/frontend/features/calendar/components/DayView";
import { TimerSettings } from "@/frontend/features/timer/components/TimerSettings";
import { Eye, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button"; // Import the Button component
import { getEvents, Event as CalendarEvent } from "@/backend/api/services/eventService";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";

export default function Timer() {
  // Timer state
  const [mode, setMode] = useState<string>("focus");
  const [duration, setDuration] = useState<number>(1500); // 25 min default
  const [shortBreak, setShortBreak] = useState<number>(300); // 5 min
  const [longBreak, setLongBreak] = useState<number>(900); // 15 min
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState<number>(4);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [lastMode, setLastMode] = useState<string>("focus");

  // Calendar events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<any>(null);

  // Fetch user and events like Calendar page
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getCurrentUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => { authListener?.subscription?.unsubscribe(); };
  }, []);

  const fetchEvents = async () => {
    if (!user) { setEvents([]); return; }
    try {
      const data = await getEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => { if (user) fetchEvents(); }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user=eq.${user.id}` }, fetchEvents)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (mode === "focus") setTimeLeft(duration);
    else if (mode === "shortBreak") setTimeLeft(shortBreak);
    else if (mode === "longBreak") setTimeLeft(longBreak);
  }, [duration, shortBreak, longBreak, mode]);

  useEffect(() => {
    if (!isRunning && timeLeft === 0) {
      // When a session ends, auto-switch modes and count sessions
      if (mode === "focus") {
        setSessionCount((prev) => prev + 1);
        if ((sessionCount + 1) % sessionsBeforeLongBreak === 0) {
          setMode("longBreak");
        } else {
          setMode("shortBreak");
        }
      } else {
        setMode("focus");
      }
    }
    // eslint-disable-next-line
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (mode === "focus" && lastMode !== "focus") {
      setLastMode("focus");
    } else if (mode !== "focus" && lastMode === "focus") {
      setLastMode(mode);
    }
    // Reset session count if settings change
  }, [mode]);

  useEffect(() => {
    setSessionCount(0);
  }, [sessionsBeforeLongBreak, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Settings save handler
  const handleSettingsChange = (settings: { focusDuration: number; shortBreak: number; longBreak: number; sessionsBeforeLongBreak: number; }) => {
    setDuration(settings.focusDuration * 60);
    setShortBreak(settings.shortBreak * 60);
    setLongBreak(settings.longBreak * 60);
    setSessionsBeforeLongBreak(settings.sessionsBeforeLongBreak);
  };

  // Date navigation handlers
  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <AppLayout>
      <TimerSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        focusDuration={duration / 60}
        shortBreak={shortBreak / 60}
        longBreak={longBreak / 60}
        sessionsBeforeLongBreak={sessionsBeforeLongBreak}
        onChange={handleSettingsChange}
      />
      <div className="flex flex-col md:flex-row h-full min-h-screen bg-gradient-to-br from-background/90 to-background/70 text-white">
        {/* Timer Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto space-y-10 rounded-3xl bg-gradient-to-br from-background/90 to-background/70 shadow-2xl p-10 border border-white/10">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <CircularProgress value={(timeLeft / (mode === "focus" ? duration : mode === "shortBreak" ? shortBreak : longBreak)) * 100} size={260} color="var(--color-primary, #ff4b2b)" trailColor="var(--color-ring-bg, #373757)">
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="block text-gray-400 mb-1"><Eye className="w-6 h-6" /></span>
                    <span className="text-5xl font-mono font-bold tracking-widest mb-1" style={{letterSpacing: '0.1em'}}>{formatTime(timeLeft)}</span>
                    <span className="text-base font-semibold tracking-widest uppercase text-primary mb-2">{mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}</span>
                    <div className="flex gap-4 mt-2">
                      {!isRunning ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                          onClick={() => setIsRunning(true)}
                          aria-label="Start"
                        >
                          <Play className="h-6 w-6 text-primary" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                          onClick={() => setIsRunning(false)}
                          aria-label="Pause"
                        >
                          <Pause className="h-6 w-6 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                        onClick={() => setTimeLeft(mode === "focus" ? duration : mode === "shortBreak" ? shortBreak : longBreak)}
                        aria-label="Reset"
                      >
                        <RotateCcw className="h-6 w-6 text-primary" />
                      </Button>
                    </div>
                  </div>
                </CircularProgress>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-sm mt-4">
              <span className="rounded-lg px-3 py-1 bg-primary/10 text-primary font-semibold">
                Session {sessionCount % sessionsBeforeLongBreak + 1} / {sessionsBeforeLongBreak}
              </span>
              {mode === "longBreak" && (
                <span className="rounded-lg px-3 py-1 bg-green-500/10 text-green-400 font-semibold">Long Break!</span>
              )}
            </div>
            <TimerControls
              mode={mode}
              onModeChange={setMode}
              duration={mode === "focus" ? duration : mode === "shortBreak" ? shortBreak : longBreak}
              onDurationChange={(val) => {
                if (mode === "focus") setDuration(val);
                else if (mode === "shortBreak") setShortBreak(val);
                else setLongBreak(val);
              }}
            />
            <Button className="w-full mt-2 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition font-semibold text-lg tracking-wide" onClick={() => setSettingsOpen(true)}>
              Settings
            </Button>
          </div>
          <div className="mt-8 w-full max-w-md">
            {/* Removed TimerHistory component */}
          </div>
        </div>
        {/* Calendar Day View Section */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l bg-gradient-to-br from-background/90 to-background/70 border-white/10 p-0 flex flex-col h-full max-h-[100vh] min-h-0 rounded-b-none mb-0" style={{borderBottomLeftRadius: 0, borderBottomRightRadius: 0}}>
          {/* Date navigation header - compact, single row */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-muted-foreground/10 bg-background sticky top-0 z-20 gap-2">
            <button
              className="rounded-full p-2 hover:bg-accent border bg-muted"
              onClick={handlePrevDay}
              aria-label="Previous day"
              type="button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase truncate">{format(selectedDate, 'EEE')}</span>
              <span className="text-base font-bold text-primary truncate">{format(selectedDate, 'MMMM d, yyyy')}</span>
            </div>
            <button
              className="rounded-full p-2 hover:bg-accent border bg-muted"
              onClick={handleNextDay}
              aria-label="Next day"
              type="button"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              className="ml-2 px-3 py-1 rounded-full text-xs font-semibold border bg-background hover:bg-accent whitespace-nowrap"
              onClick={handleToday}
              type="button"
            >
              Today
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <DayView
              date={selectedDate}
              events={events}
              onEditEvent={() => {}}
              hideHeader={true}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
