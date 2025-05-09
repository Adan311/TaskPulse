import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project } from '@/backend/types/supabaseSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { cn } from '@/frontend/lib/utils';
import { ProjectProgressControl } from './ProjectProgressControl';

interface ProjectOverviewProps {
  project: Project;
  onProgressUpdate: (updatedProject: Project) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ 
  project, 
  onProgressUpdate 
}) => {
  const daysRemaining = project.due_date 
    ? differenceInDays(new Date(project.due_date), new Date())
    : null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Overview</CardTitle>
        <p className="text-muted-foreground">{project.description}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>

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