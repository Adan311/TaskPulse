import React from 'react';
import { Project } from '@/backend/database/schema';
import { ProjectTasks } from './ProjectTasks';
import { ProjectEvents } from './ProjectEvents';
import { ProjectFiles } from './ProjectFiles';
import { ProjectNotes } from './ProjectNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/frontend/components/ui/collapsible';

interface ProjectDashboardViewProps {
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

export const ProjectDashboardView: React.FC<ProjectDashboardViewProps> = ({
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
  // Default open states for each section
  const [openSections, setOpenSections] = React.useState({
    tasks: true,
    events: true,
    files: true,
    notes: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tasks Section */}
      <Card>
        <Collapsible open={openSections.tasks} onOpenChange={() => toggleSection('tasks')}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={onAddTask}>Add Task</Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                  {openSections.tasks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ProjectTasks ref={projectTasksRef} projectId={project.id} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Events Section */}
      <Card>
        <Collapsible open={openSections.events} onOpenChange={() => toggleSection('events')}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Events</CardTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={onAddEvent}>Add Event</Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                  {openSections.events ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ProjectEvents ref={projectEventsRef} projectId={project.id} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Files Section */}
      <Card>
        <Collapsible open={openSections.files} onOpenChange={() => toggleSection('files')}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Files</CardTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={onUploadFile}>Upload</Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                  {openSections.files ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ProjectFiles ref={projectFilesRef} projectId={project.id} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Notes Section */}
      <Card>
        <Collapsible open={openSections.notes} onOpenChange={() => toggleSection('notes')}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Notes</CardTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={onAddNote}>Add Note</Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                  {openSections.notes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ProjectNotes ref={projectNotesRef} projectId={project.id} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};