import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project } from '@/backend/database/schema';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';
import { MoreVertical, Edit, Trash2, Clock, Play, Square } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/frontend/components/ui/dropdown-menu';
import { Button } from '@/frontend/components/ui/button';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { getProjectTimeStats } from '@/backend/api/services/timeTracking/timeTrackingService';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  onEdit,
  onDelete 
}) => {
  const [projectTimeStats, setProjectTimeStats] = useState<{ totalMinutes: number } | null>(null);
  const {
    activeTimeLog,
    isActive,
    startTracking,
    stopTracking,
    isLoading,
    formattedElapsedTime
  } = useTimeTracking();

  const daysRemaining = project.due_date 
    ? differenceInDays(new Date(project.due_date), new Date())
    : null;

  // Default color if not provided
  const borderColor = project.color || '#3b82f6'; // blue-500

  // Check if currently tracking this project
  const isTrackingThisProject = activeTimeLog?.project_id === project.id;

  // Load project time stats
  useEffect(() => {
    const loadProjectStats = async () => {
      try {
        const stats = await getProjectTimeStats(project.id);
        setProjectTimeStats(stats);
      } catch (error) {
        console.error('Error loading project stats:', error);
      }
    };

    loadProjectStats();
  }, [project.id, activeTimeLog]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(project);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(project);
  };

  const handleTimerClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTrackingThisProject) {
      // Stop tracking this project
      await stopTracking();
    } else {
      // Start tracking this project
      await startTracking({
        projectId: project.id,
        description: `Project: ${project.name}`,
        sessionType: 'work'
      });
    }
  };

  const formatHours = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:translate-y-[-4px]"
      onClick={onClick}
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
        )}
        
        {!project.description && (
          <p className="text-muted-foreground text-sm mb-3">No description</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant={
              project.status === 'active' ? 'default' : 
              project.status === 'on-hold' ? 'outline' : 
              'secondary'
            }
            className={cn(
              project.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
              project.status === 'on-hold' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
              'bg-gray-100 text-gray-800 hover:bg-gray-100'
            )}
          >
            {project.status === 'active' ? 'active' : 
             project.status === 'on-hold' ? 'on hold' : 
             'completed'}
          </Badge>
          
          <Badge 
            variant="outline"
            className={cn(
              project.priority === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-100' : 
              project.priority === 'medium' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
              'bg-green-100 text-green-800 hover:bg-green-100'
            )}
          >
            {project.priority} priority
          </Badge>

          {/* Time Spent Badge */}
          {projectTimeStats && projectTimeStats.totalMinutes > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatHours(projectTimeStats.totalMinutes)} spent
            </Badge>
          )}

          {/* Active Timer Badge */}
          {isTrackingThisProject && (
            <Badge variant="default" className="text-xs bg-blue-600">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
              {formattedElapsedTime}
            </Badge>
          )}

          {/* Quick Timer Start/Stop Button */}
          {project.status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTimerClick}
              disabled={isLoading || (activeTimeLog !== null && !isTrackingThisProject)}
              className="h-6 px-2 text-xs hover:bg-primary/10"
            >
              {isTrackingThisProject ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Start Timer
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className={cn(
                "h-2.5 rounded-full",
                project.progress < 25 ? "bg-red-500" :
                project.progress < 75 ? "bg-amber-500" :
                "bg-green-500"
              )}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {project.due_date && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Due: {format(new Date(project.due_date), 'MMM d, yyyy')}
            </span>
            {daysRemaining !== null && (
              <span className={cn(
                "font-medium",
                daysRemaining < 0 ? "text-red-600 dark:text-red-400" :
                daysRemaining < 3 ? "text-amber-600 dark:text-amber-400" : 
                "text-muted-foreground"
              )}>
                {daysRemaining < 0 
                  ? `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'day' : 'days'} overdue`
                  : daysRemaining === 0
                  ? 'Due today'
                  : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`
                }
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 