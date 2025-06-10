import React from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../hooks/useDashboardData';

interface QuickStatsWidgetProps {
  dashboardData: DashboardData;
  className?: string;
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  dashboardData,
  className
}) => {
  const navigate = useNavigate();
  const { stats } = dashboardData;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getCompletionPercentage = () => {
    if (!stats || stats.tasksTotal === 0) return 0;
    return Math.round((stats.tasksCompleted / stats.tasksTotal) * 100);
  };

  const statsCards = [
    {
      title: 'Tasks',
      value: `${stats.tasksCompleted}/${stats.tasksTotal}`,
      subtitle: `${getCompletionPercentage()}% completed`,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      trend: stats.tasksCompleted > 0 ? '+' + stats.tasksCompleted : '0',
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Weekly Progress',
      value: `${stats.weeklyProgress}%`,
      subtitle: 'Task completion',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      trend: stats.weeklyProgress > 70 ? 'Great' : stats.weeklyProgress > 40 ? 'Good' : 'Focus',
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Time Today',
      value: formatTime(stats.timeLoggedToday),
      subtitle: 'Logged time',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      trend: stats.timeLoggedToday > 0 ? 'Active' : 'Idle',
      onClick: () => navigate('/timer')
    },
    {
      title: 'Projects',
      value: stats.activeProjects.toString(),
      subtitle: 'Active projects',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      trend: 'Active',
      onClick: () => navigate('/projects')
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card 
            key={card.title}
            className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-[1.02] border-0 shadow-sm"
            onClick={card.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.onClick();
              }
            }}
            aria-label={`View ${card.title}: ${card.value}`}
          >
            <CardContent className="p-6">
              {/* Background gradient */}
              <div className={`absolute inset-0 ${card.bgColor} opacity-10 group-hover:opacity-20 transition-opacity`} />
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {card.trend}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                </div>

                {/* Progress bar for tasks */}
                {card.title === 'Tasks' && stats.tasksTotal > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${getCompletionPercentage()}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Progress bar for weekly progress */}
                {card.title === 'Weekly Progress' && (
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${stats.weeklyProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Activity indicator for time */}
                {card.title === 'Time Today' && stats.timeLoggedToday > 0 && (
                  <div className="mt-3 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Active session</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 