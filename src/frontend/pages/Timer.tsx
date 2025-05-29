import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { CircularProgress } from "@/frontend/features/timer/components/CircularProgress";
import { DayView } from "@/frontend/features/calendar/components/DayView";
import { TimerSettings } from "@/frontend/features/timer/components/TimerSettings";
import { ActiveTimeTracker } from "@/frontend/features/timer/components/ActiveTimeTracker";
import { TimeStatsDashboard } from "@/frontend/features/timer/components/TimeStatsDashboard";
import { TimerContextSelector, TimerContext } from "@/frontend/features/timer/components/TimerContextSelector";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, BarChart3, Settings } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { getEvents, Event as CalendarEvent } from "@/backend/api/services/eventService";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { useTimeTracking } from "@/frontend/hooks/useTimeTracking";
import { usePomodoroTimer } from "@/frontend/hooks/usePomodoroTimer";

export default function Timer() {
  // Global Pomodoro timer state
  const {
    mode,
    timeLeft,
    isRunning,
    sessionCount,
    timerContext,
    settings,
    start,
    pause,
    reset,
    updateSettings,
    setTimerContext,
    formattedTime,
    displayModeText,
    sessionDescription,
    progressValue,
    currentDuration
  } = usePomodoroTimer();

  // Local UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("pomodoro");

  // Calendar events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<any>(null);

  // Time tracking hook
  const { 
    activeTimeLog, 
    isActive: isTimeTrackingActive, 
    startTracking, 
    stopTracking,
    pauseTracking,
    resumeTracking,
    refreshStats 
  } = useTimeTracking();

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

  // Simple sync: Start time tracking when Pomodoro focus starts
  useEffect(() => {
    if (isRunning && mode === "focus" && !isTimeTrackingActive) {
      const startTimeTracking = async () => {
        try {
          const trackingData = {
            description: timerContext?.title || `Timer Session`,
            sessionType: 'work' as const,
            ...(timerContext?.type === 'task' && { taskId: timerContext.id }),
            ...(timerContext?.type === 'event' && { eventId: timerContext.id }),
            ...(timerContext?.type === 'project' && { projectId: timerContext.id })
          };
          await startTracking(trackingData);
        } catch (error) {
          console.error('Failed to start time tracking:', error);
        }
      };
      startTimeTracking();
    }
    // eslint-disable-next-line
  }, [isRunning, mode, isTimeTrackingActive]);

  // Settings save handler
  const handleSettingsChange = (newSettings: { focusDuration: number; shortBreak: number; longBreak: number; sessionsBeforeLongBreak: number; }) => {
    updateSettings({
      focusDuration: newSettings.focusDuration * 60,
      shortBreak: newSettings.shortBreak * 60,
      longBreak: newSettings.longBreak * 60,
      sessionsBeforeLongBreak: newSettings.sessionsBeforeLongBreak
    });
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
        focusDuration={settings.focusDuration / 60}
        shortBreak={settings.shortBreak / 60}
        longBreak={settings.longBreak / 60}
        sessionsBeforeLongBreak={settings.sessionsBeforeLongBreak}
        onChange={handleSettingsChange}
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timer & Time Tracking</h1>
            <p className="text-muted-foreground">Focus with Pomodoro technique and track your time</p>
          </div>
        </div>

        {/* Active Time Tracker - shown if there's an active session */}
        {activeTimeLog && (
          <ActiveTimeTracker className="mb-6" />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pomodoro" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pomodoro Timer
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Time Stats
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pomodoro" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pomodoro Timer */}
              <Card className="flex-1">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Timer</CardTitle>
                  <CardDescription>
                    {sessionDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                  <TimerContextSelector 
                    context={timerContext}
                    onContextChange={setTimerContext}
                    className="w-full max-w-md"
                    focusDuration={settings.focusDuration / 60}
                    shortBreak={settings.shortBreak / 60}
                    longBreak={settings.longBreak / 60}
                    onSettingsChange={handleSettingsChange}
                  />

                  <div className="relative">
                    <CircularProgress 
                      value={progressValue} 
                      size={260} 
                      color="var(--color-primary, #ff4b2b)" 
                      trailColor="var(--color-ring-bg, #373757)"
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-5xl font-mono font-bold tracking-widest mb-1" style={{letterSpacing: '0.1em'}}>
                          {formattedTime}
                        </span>
                        <span className="text-base font-semibold tracking-widest uppercase text-primary mb-2">
                          {displayModeText}
                        </span>
                        <div className="flex gap-4 mt-2">
                          {!isRunning ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                              onClick={start}
                              aria-label="Start"
                            >
                              <Play className="h-6 w-6 text-primary" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                              onClick={pause}
                              aria-label="Pause"
                            >
                              <Pause className="h-6 w-6 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/40"
                            onClick={reset}
                            aria-label="Reset"
                          >
                            <RotateCcw className="h-6 w-6 text-primary" />
                          </Button>
                        </div>
                      </div>
                    </CircularProgress>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    {isTimeTrackingActive && timerContext && (
                      <p>⏱️ Tracking time for: {timerContext.title}</p>
                    )}
                    {isTimeTrackingActive && !timerContext && (
                      <p>⏱️ Time tracking active</p>
                    )}
                    {!isTimeTrackingActive && (
                      <p>Start timer to begin time tracking</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <TimeStatsDashboard />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DayView 
                  events={events} 
                  date={selectedDate} 
                  onEditEvent={() => {}}
                  hideHeader={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
