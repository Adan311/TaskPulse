import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { CheckSquare, Plus, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../hooks/useDashboardData';

interface RecentTasksWidgetProps {
  dashboardData: DashboardData;
  className?: string;
}

export const RecentTasksWidget: React.FC<RecentTasksWidgetProps> = ({
  dashboardData,
  className
}) => {
  const navigate = useNavigate();
  const { recentTasks } = dashboardData;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'todo':
        return <CheckSquare className="h-4 w-4 text-gray-400" />;
      default:
        return <CheckSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {recentTasks.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {recentTasks.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No tasks yet
              </p>
              <p className="text-xs text-muted-foreground">
                Create your first task to get started
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/tasks')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {recentTasks.slice(0, 5).map((task) => (
                <div 
                  key={task.id}
                  className="p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm hover:bg-muted/50"
                  onClick={() => navigate('/tasks')}
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium leading-tight line-clamp-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {task.priority && task.priority !== 'none' && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                        {task.status === 'in_progress' && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                            In Progress
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRelativeDate(task.created_at)}</span>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Due {formatRelativeDate(task.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {recentTasks.length > 5 && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/tasks')}
                >
                  View All Tasks ({recentTasks.length})
                </Button>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/tasks')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 