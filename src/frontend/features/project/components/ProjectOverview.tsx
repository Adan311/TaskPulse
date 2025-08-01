import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project } from '@/backend/database/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';
import { ProjectProgressControl } from './ProjectProgressControl';
import { useTimeTracking } from '@/frontend/hooks/useTimeTracking';
import { getProjectTimeStats } from '@/backend/api/services/timeTracking/timeTrackingService';
import { Clock, Play, Pause, Square, Timer, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectOverviewProps {
  project: Project;
  onProgressUpdate: (updatedProject: Project) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ 
  project, 
  onProgressUpdate 
}) => {
  const [projectTimeStats, setProjectTimeStats] = useState<{
    totalMinutes: number;
    sessionsCount: number;
    thisWeekMinutes: number;
    averageSessionMinutes: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);

  const {
    activeTimeLog,
    isActive,
    isPaused,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    isLoading,
    formattedElapsedTime
  } = useTimeTracking();

  const daysRemaining = project.due_date 
    ? differenceInDays(new Date(project.due_date), new Date())
    : null;

  // Check if currently tracking this project
  const isTrackingThisProject = activeTimeLog?.project_id === project.id;

  // Auto-expand when timer is active for this project
  useEffect(() => {
    if (isTrackingThisProject) {
      setIsTimerExpanded(true);
    }
  }, [isTrackingThisProject]);

  // Load project time stats
  useEffect(() => {
    const loadProjectStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await getProjectTimeStats(project.id);
        setProjectTimeStats(stats);
      } catch (error) {
        console.error('Error loading project stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadProjectStats();
  }, [project.id, activeTimeLog]);

  const formatHours = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleStartTimer = async () => {
    try {
      await startTracking({
        projectId: project.id,
        description: `Project: ${project.name}`,
        sessionType: 'work'
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTracking();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const handlePauseResumeTimer = async () => {
    try {
      if (isPaused) {
        await resumeTracking();
      } else {
        await pauseTracking();
      }
    } catch (error) {
      console.error('Failed to pause/resume timer:', error);
    }
  };

  const toggleTimerSection = () => {
    setIsTimerExpanded(!isTimerExpanded);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Overview</CardTitle>
        <p className="text-muted-foreground">{project.description}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status:</p>
            <div className={cn(
              "text-sm font-medium rounded-full px-2 py-1 inline-block",
              project.status === 'active' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              project.status === 'on-hold' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            )}>
              {project.status === 'active' ? 'In Progress' : 
               project.status === 'on-hold' ? 'On Hold' : 'Completed'}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Priority:</p>
            <div className={cn(
              "text-sm font-medium rounded-full px-2 py-1 inline-block",
              project.priority === 'high' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
              project.priority === 'medium' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            )}>
              {project.priority === 'high' ? 'High' : 
               project.priority === 'medium' ? 'Medium' : 'Low'}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Due:</p>
            <div className={cn(
              "text-sm",
              daysRemaining !== null && daysRemaining < 3 ? "text-red-600 dark:text-red-400" : ""
            )}>
              {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : 'No due date'}
              {daysRemaining !== null && daysRemaining >= 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">Time Spent:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTimerSection}
                className="h-5 w-5 p-0 bg-muted/40 hover:bg-muted/60 border border-muted-foreground/20 hover:border-muted-foreground/40 rounded-sm transition-all"
                title={isTimerExpanded ? "Collapse timer section" : "Expand timer section"}
              >
                {isTimerExpanded ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="text-sm">
              {statsLoading ? (
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : projectTimeStats && projectTimeStats.totalMinutes > 0 ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {formatHours(projectTimeStats.totalMinutes)}
                  {isTrackingThisProject && (
                    <div className="ml-2 flex items-center gap-1">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        isPaused ? "bg-orange-500" : "bg-green-500 animate-pulse"
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {formattedElapsedTime}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">No time logged</span>
                  {!isTimerExpanded && (
                    <span className="text-xs text-muted-foreground opacity-70">(click ⬇️ to expand)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Timer Section */}
        {isTimerExpanded && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Time Tracking</h3>
                  {isTrackingThisProject ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        isPaused ? "bg-orange-500" : "bg-green-500 animate-pulse"
                      )} />
                      <span className="text-sm text-muted-foreground">
                        {isPaused ? 'Paused' : 'Active'} - {formattedElapsedTime}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Track time spent on this project
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isTrackingThisProject ? (
                  <Button
                    onClick={handleStartTimer}
                    disabled={isLoading || (activeTimeLog !== null && !isTrackingThisProject)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePauseResumeTimer}
                      disabled={isLoading}
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleStopTimer}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Time Stats */}
            {projectTimeStats && projectTimeStats.totalMinutes > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatHours(projectTimeStats.totalMinutes)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {projectTimeStats.sessionsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatHours(projectTimeStats.thisWeekMinutes)}
                  </div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatDuration(projectTimeStats.averageSessionMinutes)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Session</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {project.progress}% 
                {project.auto_progress === false && <span className="text-xs ml-1 text-muted-foreground">(Manual)</span>}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4">
            <ProjectProgressControl 
              project={project} 
              onProgressUpdate={onProgressUpdate} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 