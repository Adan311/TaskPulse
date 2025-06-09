import React, { useState, useRef } from 'react';
import { Project, Task } from '@/backend/database/schema';
import { ProjectTasks } from './ProjectTasks';
import { ProjectEvents } from './ProjectEvents';
import { ProjectFiles } from './ProjectFiles';
import { ProjectNotes } from './ProjectNotes';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';

interface ProjectTabbedViewProps {
  project: Project;
  onAddTask: () => void;
  onAddEvent: () => void;
  onUploadFile: () => void;
  onAddNote: () => void;
  projectTasksRef: React.RefObject<{ refreshTasks: () => void }>;
  projectEventsRef: React.RefObject<{ refreshEvents: () => void }>;
  projectFilesRef: React.RefObject<{ refreshFiles: () => void }>;
  projectNotesRef: React.RefObject<{ handleNew: () => void }>;
}

export const ProjectTabbedView: React.FC<ProjectTabbedViewProps> = ({
  project,
  onAddTask,
  onAddEvent,
  onUploadFile,
  onAddNote,
  projectTasksRef,
  projectEventsRef,
  projectFilesRef,
  projectNotesRef
}) => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Tasks and Content Section */}
      <div className="lg:col-span-3">
        <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="tasks" className="font-medium">Tasks</TabsTrigger>
            <TabsTrigger value="events" className="font-medium">Events</TabsTrigger>
            <TabsTrigger value="files" className="font-medium">Files</TabsTrigger>
            <TabsTrigger value="notes" className="font-medium">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <Button size="sm" onClick={onAddTask}>Add Task</Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ProjectTasks ref={projectTasksRef} projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Events</h2>
              <Button size="sm" onClick={onAddEvent}>Add Event</Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ProjectEvents ref={projectEventsRef} projectId={project.id} showAllEvents={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Files</h2>
              <Button size="sm" onClick={onUploadFile}>Upload File</Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ProjectFiles ref={projectFilesRef} projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Notes</h2>
              <Button size="sm" onClick={onAddNote}>Add Note</Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ProjectNotes ref={projectNotesRef} projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Upcoming Events Card */}
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upcoming Events</h3>
              <Button size="sm" variant="outline" onClick={onAddEvent}>Add</Button>
            </div>
            <div className="space-y-3">
              <ProjectEvents 
                ref={projectEventsRef} 
                projectId={project.id}
                limit={4} 
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 