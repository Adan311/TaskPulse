import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalTimer } from '@/frontend/context/TimerContext';
import { DashboardData } from '../hooks/useDashboardData';

interface TimeTrackerWidgetProps {
  dashboardData: DashboardData;
  className?: string;
}

export const TimeTrackerWidget: React.FC<TimeTrackerWidgetProps> = ({
  dashboardData,
  className
}) => {
  const navigate = useNavigate();
  const { 
    formattedTimeTrackingTime, 
    hasActiveTimer,
    isTimeTrackingActive,
    startTimeTracking,
    stopTimeTracking,
    isLoading
  } = useGlobalTimer();

  const handleQuickStart = async () => {
    try {
      await startTimeTracking({
        description: 'Quick timer session',
        sessionType: 'work'
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimeTracking();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const formatTimeStats = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Timer Display */}
        <div className="text-center space-y-3">
          {hasActiveTimer ? (
            <>
              <div className="text-3xl font-mono font-bold text-green-600">
                {formattedTimeTrackingTime}
              </div>
              
              {/* Animated pulse indicator */}
              <div className="w-16 h-16 mx-auto relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <p className="text-sm text-green-600 font-medium">
                ⚡ Active Session
              </p>
              
              <Button 
                onClick={handleStop}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Timer
              </Button>
            </>
          ) : (
            <>
              <div className="text-3xl font-mono font-bold text-muted-foreground">
                00:00:00
              </div>
              
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <p className="text-sm text-muted-foreground">
                No active timer
              </p>
              
              <Button 
                onClick={handleQuickStart}
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Quick Start
              </Button>
            </>
          )}
        </div>

        {/* Today's Stats */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Today's Total</span>
            <span className="text-sm font-bold">
              {formatTimeStats(dashboardData.stats.timeLoggedToday)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min((dashboardData.stats.timeLoggedToday / 480) * 100, 100)}%` // 8 hours target
              }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            Target: 8 hours
          </p>
        </div>

        {/* Go to Timer Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/timer')}
        >
          Full Timer View
        </Button>
      </CardContent>
    </Card>
  );
}; 