import React from 'react';
import { TimeTrackerWidget } from './widgets/TimeTrackerWidget';
import { DashboardData } from './hooks/useDashboardData';
import { Calendar } from '@/frontend/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';

interface QuickInfoPanelProps {
  dashboardData: DashboardData;
  onRefreshData: () => void;
  className?: string;
}

export const QuickInfoPanel: React.FC<QuickInfoPanelProps> = ({
  dashboardData,
  onRefreshData,
  className
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time & Date Display */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-primary">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Calendar */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            weekStartsOn={1}
            className={cn("rounded-lg w-full p-0 border-none")}
          />
        </CardContent>
      </Card>

      <TimeTrackerWidget dashboardData={dashboardData} />
    </div>
  );
}; 