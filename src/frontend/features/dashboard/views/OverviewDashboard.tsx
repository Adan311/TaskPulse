import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Calendar, CheckSquare, Clock, TrendingUp, Plus, FolderOpen, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardData } from '../hooks/useDashboardData';

interface OverviewDashboardProps {
  dashboardData: DashboardData;
  onRefreshData: () => void;
  className?: string;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  dashboardData,
  onRefreshData,
  className
}) => {
  const navigate = useNavigate();
  const { todayEvents, recentTasks, stats, activeProjects, recentNotes } = dashboardData;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatDateCompact = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 14) return '1w ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const formatDueDateCompact = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (overdueDays === 1) return 'Overdue';
      if (overdueDays < 7) return `${overdueDays}d overdue`;
      if (overdueDays < 30) return `${Math.floor(overdueDays / 7)}w overdue`;
      return 'Overdue';
    }
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due ${diffDays}d`;
    if (diffDays < 30) return `Due ${Math.floor(diffDays / 7)}w`;
    return `Due ${Math.floor(diffDays / 30)}mo`;
  };


  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Row 1: Today's Agenda */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Agenda
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/calendar')}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No events scheduled for today
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/calendar')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.slice(0, 3).map((event, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                const bgColors = ['bg-blue-50 dark:bg-blue-950', 'bg-green-50 dark:bg-green-950', 'bg-purple-50 dark:bg-purple-950'];
                
                return (
                  <div 
                    key={event.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${bgColors[index % 3]} border border-opacity-20 hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`w-3 h-10 ${colors[index % 3]} rounded-full shadow-sm`}></div>
                                         <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                         <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                         <Badge variant="secondary" className="text-xs ml-2">
                           {formatDate(event.startTime)}
                         </Badge>
                       </div>
                       <p className="text-xs text-muted-foreground mb-1">
                         {formatTime(event.startTime)} - {formatTime(event.endTime)}
                       </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {todayEvents.length > 3 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{todayEvents.length - 3} more events
                </p>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => navigate('/calendar')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 1: Active Tasks */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Active Tasks
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/tasks')}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No active tasks
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/tasks')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.slice(0, 3).map((task, index) => {
                const priorityColors = {
                  high: { bg: 'bg-red-50 dark:bg-red-950', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
                  medium: { bg: 'bg-yellow-50 dark:bg-yellow-950', dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
                  low: { bg: 'bg-green-50 dark:bg-green-950', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
                  none: { bg: 'bg-blue-50 dark:bg-blue-950', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' }
                };
                
                const statusColors = {
                  done: { bg: 'bg-green-50 dark:bg-green-950', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
                  in_progress: { bg: 'bg-blue-50 dark:bg-blue-950', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
                  todo: { bg: 'bg-gray-50 dark:bg-gray-950', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
                };
                
                const colorScheme = task.priority && task.priority !== 'none' 
                  ? priorityColors[task.priority as keyof typeof priorityColors] 
                  : statusColors[task.status as keyof typeof statusColors] || statusColors.todo;
                
                return (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${colorScheme.bg} border border-opacity-20 hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`w-3 h-8 ${colorScheme.dot} rounded-full shadow-sm`}></div>
                                         <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                         <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                         <div className="flex items-center gap-1">
                           {task.priority && task.priority !== 'none' && (
                             <Badge className={`text-xs ${colorScheme.badge}`}>
                               {task.priority}
                             </Badge>
                           )}
                           {task.due_date && (
                             <Badge variant="outline" className="text-xs">
                               {formatDueDateCompact(task.due_date)}
                             </Badge>
                           )}
                         </div>
                       </div>
                       <div className="flex items-center gap-2 mb-1">
                         <p className="text-xs text-muted-foreground capitalize">
                           {task.status.replace('_', ' ')}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           Created {formatDateCompact(task.created_at)}
                         </p>
                       </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => navigate('/tasks')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 2: Active Projects */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Active Projects
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/projects')}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No active projects
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/projects')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeProjects.slice(0, 3).map((project, index) => {
                const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
                const bgColors = ['bg-purple-50 dark:bg-purple-950', 'bg-indigo-50 dark:bg-indigo-950', 'bg-pink-50 dark:bg-pink-950'];
                
                return (
                  <div 
                    key={project.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${bgColors[index % 3]} border border-opacity-20 hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`w-3 h-8 ${colors[index % 3]} rounded-full shadow-sm`}></div>
                                         <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                         <Badge className="text-xs bg-gray-100 text-gray-700">
                           {project.progress}% complete
                         </Badge>
                       </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                        <div 
                          className={`${colors[index % 3]} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              

            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 2: Recent Notes */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Notes
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/notes')}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No notes yet
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/notes')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentNotes.slice(0, 3).map((note, index) => {
                const colors = ['bg-emerald-500', 'bg-cyan-500', 'bg-amber-500'];
                const bgColors = ['bg-emerald-50 dark:bg-emerald-950', 'bg-cyan-50 dark:bg-cyan-950', 'bg-amber-50 dark:bg-amber-950'];
                
                return (
                  <div 
                    key={note.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${bgColors[index % 3]} border border-opacity-20 hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`w-3 h-8 ${colors[index % 3]} rounded-full shadow-sm`}></div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                         <h4 className="font-semibold text-sm truncate">
                           {note.content?.slice(0, 35) || 'Untitled Note'}...
                         </h4>
                         <div className="flex items-center gap-1">
                           {note.project_data && (
                             <Badge variant="outline" className="text-xs">
                               {note.project_data.name}
                             </Badge>
                           )}
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <p className="text-xs text-muted-foreground">
                           Updated {formatDateCompact(note.last_updated)}
                         </p>
                         {note.content && note.content.length > 35 && (
                           <p className="text-xs text-muted-foreground/80 line-clamp-1 flex-1">
                             {note.content.slice(35, 85)}...
                           </p>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
              

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 