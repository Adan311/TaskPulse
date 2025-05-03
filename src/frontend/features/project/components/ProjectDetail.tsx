import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project } from '@/backend/types/supabaseSchema';
import { ProjectTasks } from './ProjectTasks';
import { ProjectEvents } from './ProjectEvents';
import { ProjectFiles } from './ProjectFiles';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { PencilIcon, TrashIcon, Share2Icon } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';

interface ProjectDetailProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("tasks");
  const daysRemaining = project.due_date 
    ? differenceInDays(new Date(project.due_date), new Date())
    : null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <Button variant="outline" size="sm">
            <Share2Icon className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Website Redesign Project</CardTitle>
          <CardDescription>Complete overhaul of company website with new branding</CardDescription>
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
                daysRemaining && daysRemaining < 3 ? "text-red-600 dark:text-red-400" : ""
              )}>
                {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : 'No due date'}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tasks and Content Section */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Button size="sm">Add Task</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">To Do</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectTasks projectId={project.id} />
                  </CardContent>
                </Card>
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* In Progress Tasks */}
                  </CardContent>
                </Card>
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Done</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Done Tasks */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Events</h2>
                <Button size="sm">Add Event</Button>
              </div>
              <ProjectEvents projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="files">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Files</h2>
                <Button size="sm">Upload</Button>
              </div>
              <ProjectFiles projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Notes</h2>
                <Button size="sm">Add Note</Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <p>Notes will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
              <Button size="sm" variant="outline">Add Event</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Design Review</h3>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full px-2 py-0.5">
                      Starting Soon
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Today at 2:00 PM · 1h 30m</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Team Sync</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-0.5">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Tomorrow at 10:00 AM · 45m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Notes</CardTitle>
              <Button size="sm" variant="outline">Add Note</Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-3">
                <p className="text-sm">
                  Client requested changes to the navigation menu layout. Need to update wireframes accordingly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 