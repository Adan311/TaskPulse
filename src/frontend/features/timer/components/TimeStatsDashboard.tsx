import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';
import { Clock, Target, Calendar, TrendingUp, Activity, Zap } from 'lucide-react';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { getTimeLogs, TimeLog, TimeLogFilters } from '@/backend/api/services/timeTracking/timeTrackingService';
import { cn } from '@/frontend/lib/utils';

interface TimeStatsDashboardProps {
  className?: string;
  showDetailedStats?: boolean;
}

interface DailyStats {
  date: string;
  minutes: number;
  sessions: number;
}

export const TimeStatsDashboard: React.FC<TimeStatsDashboardProps> = ({ 
  className,
  showDetailedStats = true 
}) => {
  const { timeStats, refreshStats } = useTimeTracking();
  const [recentLogs, setRecentLogs] = useState<TimeLog[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDetailedStats();
  }, []);

  const loadDetailedStats = async () => {
    if (!showDetailedStats) return;
    
    try {
      setIsLoading(true);
      
      const recent = await getTimeLogs({ 
        status: 'completed',
        // Fetch a bit wider range to ensure all UTC logs for local days are caught
        startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), 
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) 
      });
      setRecentLogs(recent.slice(0, 5));
      
      // Determine the week range based on the user's local 'today',
      // but define day buckets by their UTC start.
      const localToday = new Date();
      const localCurrentDayOfWeek = localToday.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const daysToSubtractForLocalMonday = localCurrentDayOfWeek === 0 ? 6 : localCurrentDayOfWeek - 1;
      
      const localMonday = new Date(localToday);
      localMonday.setDate(localToday.getDate() - daysToSubtractForLocalMonday);
      localMonday.setHours(0, 0, 0, 0); // Start of local Monday

      const dailyStats: DailyStats[] = [];
      for (let i = 0; i < 7; i++) {
        // Current day in the local week (Mon, Tue, ... Sun)
        const currentLocalDateInLoop = new Date(localMonday);
        currentLocalDateInLoop.setDate(localMonday.getDate() + i);
        
        // Define the bucket by the START of this local day in UTC terms
        // This ensures the bucket is tied to a fixed UTC point for global consistency
        const bucketUTCDayStart = new Date(Date.UTC(
          currentLocalDateInLoop.getFullYear(),
          currentLocalDateInLoop.getMonth(),
          currentLocalDateInLoop.getDate(),
          0, 0, 0, 0
        ));
        const bucketUTCDayStartString = bucketUTCDayStart.toISOString().split('T')[0]; // YYYY-MM-DD (UTC)

        const dayLogs = recent.filter(log => {
          // log.start_time is a UTC ISO string, e.g., "2025-05-28T21:36:04.214Z"
          const logUTCDateString = log.start_time.substring(0, 10); // Extracts YYYY-MM-DD part from UTC string
          return logUTCDateString === bucketUTCDayStartString;
        });
        
        const totalMinutes = dayLogs.reduce(
          (sum, logEntry) => sum + (logEntry.duration_seconds || 0) / 60, 
          0
        );
        
        dailyStats.push({
          // Store the representative date for this bucket.
          // Using the UTC day start. UI will localize it for display name.
          date: bucketUTCDayStart.toISOString(), 
          minutes: Math.round(totalMinutes),
          sessions: dayLogs.length
        });
      }
      
      setWeeklyStats(dailyStats); // weeklyStats is [MonData, TueData, ..., SunData] (based on UTC day starts)
    } catch (error) {
      console.error('Error loading detailed stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getProductivityMessage = (): { message: string; color: string; icon: React.ReactNode } => {
    if (!timeStats) return { message: 'No data yet', color: 'text-muted-foreground', icon: <Clock className="h-4 w-4" /> };
    
    const { todayMinutes, averageSessionMinutes } = timeStats;
    
    if (todayMinutes > 240) { // 4+ hours
      return { 
        message: 'Excellent productivity!', 
        color: 'text-green-600', 
        icon: <Zap className="h-4 w-4" /> 
      };
    } else if (todayMinutes > 120) { // 2+ hours
      return { 
        message: 'Good progress today', 
        color: 'text-blue-600', 
        icon: <TrendingUp className="h-4 w-4" /> 
      };
    } else if (todayMinutes > 60) { // 1+ hour
      return { 
        message: 'Keep it up!', 
        color: 'text-orange-600', 
        icon: <Target className="h-4 w-4" /> 
      };
    } else {
      return { 
        message: 'Time to get started', 
        color: 'text-muted-foreground', 
        icon: <Activity className="h-4 w-4" /> 
      };
    }
  };

  const productivity = getProductivityMessage();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">
                  {timeStats ? formatDuration(timeStats.todayMinutes) : '--'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {timeStats ? formatDuration(timeStats.weekMinutes) : '--'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">
                  {timeStats?.totalSessions || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">
                  {timeStats ? formatDuration(timeStats.averageSessionMinutes) : '--'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Message */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={productivity.color}>
              {productivity.icon}
            </div>
            <div>
              <p className={cn("font-medium", productivity.color)}>
                {productivity.message}
              </p>
              <p className="text-sm text-muted-foreground">
                {timeStats?.todayMinutes ? 
                  `You've logged ${formatDuration(timeStats.todayMinutes)} today` : 
                  'Start tracking time to see your progress'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetailedStats && (
        <>
          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
              <CardDescription>Daily time tracking breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {weeklyStats.map((day, index) => {
                  const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                  const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                  const maxMinutes = Math.max(...weeklyStats.map(d => d.minutes));
                  const height = maxMinutes > 0 ? Math.max((day.minutes / maxMinutes) * 100, 8) : 8;
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-muted-foreground font-medium">
                        {dayName}
                      </div>
                      <div 
                        className={cn(
                          "w-8 rounded-t-sm transition-all duration-200",
                          day.minutes > 0 ? "bg-primary" : "bg-muted",
                          isToday && "ring-2 ring-primary ring-offset-2"
                        )}
                        style={{ height: `${height}px` }}
                        title={`${formatDuration(day.minutes)} in ${day.sessions} sessions`}
                      />
                      <div className="text-xs text-center">
                        {day.minutes > 0 ? formatDuration(day.minutes) : '0m'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          {recentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
                <CardDescription>Your latest time tracking sessions</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs">
                          {log.session_type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.description || 'Time tracking session'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.start_time).toLocaleDateString()} at{' '}
                            {new Date(log.start_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatDuration(Math.round((log.duration_seconds || 0) / 60))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}; 