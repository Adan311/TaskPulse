import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Calendar, Clock, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../hooks/useDashboardData';
import { Event } from '@/backend/api/services/eventService';

interface TodayAgendaWidgetProps {
  dashboardData: DashboardData;
  className?: string;
}

export const TodayAgendaWidget: React.FC<TodayAgendaWidgetProps> = ({
  dashboardData,
  className
}) => {
  const navigate = useNavigate();
  const { todayEvents } = dashboardData;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'deadline':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'personal':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const isEventSoon = (eventStartTime: string) => {
    const eventTime = new Date(eventStartTime);
    const now = new Date();
    const timeDiff = eventTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff <= 1 && hoursDiff > 0; // Event starts within 1 hour
  };

  const isEventNow = (eventStartTime: string, eventEndTime: string) => {
    const now = new Date();
    const start = new Date(eventStartTime);
    const end = new Date(eventEndTime);
    return now >= start && now <= end;
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Today's Agenda
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {todayEvents.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {todayEvents.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No events today
              </p>
              <p className="text-xs text-muted-foreground">
                You have a free day!
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/calendar')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {todayEvents.slice(0, 4).map((event: Event) => {
                const isSoon = isEventSoon(event.startTime);
                const isNow = isEventNow(event.startTime, event.endTime);
                
                return (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                      isNow 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                        : isSoon 
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                        : 'bg-background border-border hover:bg-muted/50'
                    }`}
                    onClick={() => navigate('/calendar')}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium leading-tight line-clamp-2">
                          {event.title}
                        </h4>
                        {(isNow || isSoon) && (
                          <Badge 
                            variant={isNow ? "default" : "secondary"}
                            className={`text-xs ml-2 flex-shrink-0 ${
                              isNow ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                          >
                            {isNow ? 'Now' : 'Soon'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>
                      
                      {event.description && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.description}</span>
                        </div>
                      )}
                      
                      {event.project && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs w-fit bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200`}
                        >
                          {event.project}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {todayEvents.length > 4 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/calendar')}
                >
                  View All Events ({todayEvents.length})
                </Button>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/calendar')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 