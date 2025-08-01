import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { CircularProgress } from "@/frontend/features/timer/components/CircularProgress";
import { DayView } from "@/frontend/features/calendar/components/DayView";
import { ActiveTimeTracker } from "@/frontend/features/timer/components/ActiveTimeTracker";
import { TimeStatsDashboard } from "@/frontend/features/timer/components/TimeStatsDashboard";
import { TimerContextSelector, TimerContext } from "@/frontend/features/timer/components/TimerContextSelector";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { getEvents, Event as CalendarEvent } from "@/backend/api/services/event.service";
import { supabase } from "@/backend/database/client";
import { format, addDays, subDays } from "date-fns";
import { useGlobalTimer } from "@/frontend/context/TimerContext";
import { useAuthCheck } from "@/frontend/hooks/useAuthCheck";

export default function Timer() {
  // Global Timer state from context
  const {
    // Pomodoro state
    pomodoroMode,
    pomodoroTimeLeft,
    pomodoroIsRunning,
    pomodoroSessionCount,
    pomodoroSettings,
    pomodoroContext,
    
    // Time tracking state
    activeTimeLog,
    isTimeTrackingActive,
    formattedTimeTrackingTime,
    
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroContext,
    updatePomodoroSettings,
    startSynchronizedSession,
    stopAllTimers,
    pauseAllTimers,
    resumeAllTimers,
    
    isSynchronized,
    hasActiveTimer,
    getCurrentContext,
    formattedPomodoroTime
  } = useGlobalTimer();

  // Local UI state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("pomodoro");

  // Calendar events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuthCheck();

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

  // Handle timer actions with global context
  const handlePomodoroStart = () => {
    startPomodoro();
  };

  const handlePomodoroPause = () => {
    pausePomodoro();
  };

  const handlePomodoroReset = () => {
    resetPomodoro();
  };

  const handleSynchronizedStart = async (context: TimerContext | null) => {
    await startSynchronizedSession(context);
  };

  // Settings save handler for TimerContextSelector
  const handleSettingsChange = (newSettings: { focusDuration: number; shortBreak: number; longBreak: number; sessionsBeforeLongBreak: number; }) => {
    updatePomodoroSettings({
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

  // Calculate progress for circular progress
  const currentDuration = pomodoroMode === 'focus' ? pomodoroSettings.focusDuration :
                         pomodoroMode === 'shortBreak' ? pomodoroSettings.shortBreak :
                         pomodoroSettings.longBreak;
  const progressValue = currentDuration > 0 ? ((currentDuration - pomodoroTimeLeft) / currentDuration) * 100 : 0;

  // Session description for display
  const sessionDescription = pomodoroMode === 'focus' ? 'Focus Session' :
                           pomodoroMode === 'shortBreak' ? 'Short Break' :
                           'Long Break';

  const displayModeText = `${sessionDescription}${pomodoroSessionCount > 0 ? ` (${pomodoroSessionCount})` : ''}`;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Timer */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Focus Timer</h1>
                <p className="text-muted-foreground">Stay productive with the Pomodoro technique</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pomodoro">Timer</TabsTrigger>
                <TabsTrigger value="tracking">Time Tracking</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="pomodoro" className="space-y-6">
                {/* Main Timer Card */}
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                      {displayModeText}
                      {isSynchronized && (
                        <span className="ml-2 text-sm text-blue-500">• Synchronized</span>
                      )}
                    </CardTitle>
                    {pomodoroContext && (
                      <CardDescription>
                        Working on: {pomodoroContext.title}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Circular Progress */}
                    <div className="flex justify-center">
                      <CircularProgress 
                        value={progressValue}
                        size={200}
                        strokeWidth={8}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-4xl font-mono font-bold">{formattedPomodoroTime}</span>
                          <span className="text-sm text-muted-foreground">{sessionDescription}</span>
                        </div>
                      </CircularProgress>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex justify-center gap-4">
                      {pomodoroIsRunning ? (
                        <Button size="lg" onClick={handlePomodoroPause} variant="outline">
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button size="lg" onClick={handlePomodoroStart}>
                          <Play className="h-5 w-5 mr-2" />
                          {pomodoroTimeLeft === currentDuration ? 'Start' : 'Resume'}
                        </Button>
                      )}
                      
                      <Button size="lg" variant="outline" onClick={handlePomodoroReset}>
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Reset
                      </Button>
                    </div>

                    {/* Context Selector with Integrated Settings */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Choose Your Focus</h3>
                      <TimerContextSelector
                        context={pomodoroContext}
                        onContextChange={setPomodoroContext}
                        focusDuration={Math.round(pomodoroSettings.focusDuration / 60)}
                        shortBreak={Math.round(pomodoroSettings.shortBreak / 60)}
                        longBreak={Math.round(pomodoroSettings.longBreak / 60)}
                        onSettingsChange={handleSettingsChange}
                        onStartWithContext={handleSynchronizedStart}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Session Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Session Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sessions Completed</p>
                        <p className="text-2xl font-bold">{pomodoroSessionCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Mode</p>
                        <p className="text-lg font-medium">{sessionDescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-6">
                <ActiveTimeTracker />
                
                {/* Global Timer Status */}
                {hasActiveTimer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Active Timer Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Context</span>
                          <span className="font-medium">{getCurrentContext()}</span>
                        </div>
                        
                        {isTimeTrackingActive && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Time Tracked</span>
                            <span className="font-mono">{formattedTimeTrackingTime}</span>
                          </div>
                        )}
                        
                        {isSynchronized && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              ✓ Pomodoro and time tracking are synchronized
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={pauseAllTimers}
                          >
                            Pause All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resumeAllTimers}
                          >
                            Resume All
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={stopAllTimers}
                          >
                            Stop All
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <TimeStatsDashboard />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:w-96 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Today's Schedule</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrevDay}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleToday}>
                      Today
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextDay}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DayView 
                  date={selectedDate} 
                  events={events}
                  onEditEvent={() => {}}
                  hideHeader={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
