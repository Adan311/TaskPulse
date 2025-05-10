import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project, Task } from '@/backend/types/supabaseSchema';
import { ProjectTasks } from './ProjectTasks';
import { ProjectEvents } from './ProjectEvents';
import { ProjectFiles } from './ProjectFiles';
import { ProjectNotes } from './ProjectNotes';
import { ProjectProgressControl } from './ProjectProgressControl';
import { ProjectOverview } from './ProjectOverview';
import { ProjectTabbedView } from './ProjectTabbedView';
import { ProjectDashboardView } from './ProjectDashboardView';
import { ViewModeToggle } from './ViewModeToggle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { PencilIcon, TrashIcon, Share2Icon } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { useNotes } from '@/frontend/features/notes/hooks/useNotes';
import { NoteViewer } from '@/frontend/features/notes/components/NoteViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/frontend/components/ui/dialog';
import { EventForm } from '@/frontend/features/calendar/components/EventForm';
import { Label } from '@/frontend/components/ui/label';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { createTask } from '@/backend/api/services/task.service';
import { useToast } from '@/frontend/hooks/use-toast';
import { useFiles } from '@/frontend/features/files/hooks/useFiles';
import { useViewMode } from '../hooks/useViewMode';

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
  // Refs for child components
  const projectNotesRef = useRef<{ handleNew: () => void }>(null);
  const projectEventsRef = useRef<{ refreshEvents: () => void }>(null);
  const projectFilesRef = useRef<{ refreshFiles: () => void }>(null);
  const projectTasksRef = useRef<{ refreshTasks: () => void }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for dialogs
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  const { toast } = useToast();
  
  const { uploadFile } = useFiles({ project_id: project.id });
  const [isUploading, setIsUploading] = useState(false);
  
  const [currentProject, setCurrentProject] = useState<Project>(project);
  
  // Get view mode hook
  const { isDashboardView, setDashboardView, setTabbedView } = useViewMode(project.id);
  
  // Update local state when project prop changes
  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  const handleProgressUpdate = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
  };
  
  const handleAddTask = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskStatus('todo');
    setTaskPriority('medium');
    setIsTaskDialogOpen(true);
  };
  
  const handleAddEvent = () => {
    setIsEventDialogOpen(true);
  };
  
  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };
  
  const handleAddNote = () => {
    projectNotesRef.current?.handleNew();
  };
  
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      try {
        await uploadFile(file);
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        // Refresh files list
        projectFilesRef.current?.refreshFiles();
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  
  const handleEventSuccess = () => {
    setIsEventDialogOpen(false);
    // Refresh events list
    projectEventsRef.current?.refreshEvents();
  };

  const handleTaskSuccess = () => {
    setIsTaskDialogOpen(false);
    // Refresh tasks list
    projectTasksRef.current?.refreshTasks();
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    
    setIsCreatingTask(true);
    try {
      await createTask({
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        priority: taskPriority,
        project: project.id
      });
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
      setIsTaskDialogOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      // Refresh tasks
      projectTasksRef.current?.refreshTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleViewMode = (isDashboard: boolean) => {
    if (isDashboard) {
      setDashboardView();
    } else {
      setTabbedView();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl font-bold mb-2 break-words">{currentProject.name}</h1>
        </div>
        <div className="flex flex-shrink-0 space-x-2 self-end sm:self-auto">
          <ViewModeToggle 
            isDashboardView={isDashboardView} 
            onToggle={handleToggleViewMode} 
          />
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <ProjectOverview 
        project={currentProject} 
        onProgressUpdate={handleProgressUpdate}
      />

      {/* Main Content - Either Dashboard or Tabbed View */}
      {isDashboardView ? (
        <ProjectDashboardView
          project={currentProject}
          onAddTask={handleAddTask}
          onAddEvent={handleAddEvent}
          onUploadFile={handleUploadFile}
          onAddNote={handleAddNote}
          projectTasksRef={projectTasksRef}
          projectEventsRef={projectEventsRef}
          projectFilesRef={projectFilesRef}
          projectNotesRef={projectNotesRef}
        />
      ) : (
        <ProjectTabbedView
          project={currentProject}
          onAddTask={handleAddTask}
          onAddEvent={handleAddEvent}
          onUploadFile={handleUploadFile}
          onAddNote={handleAddNote}
          projectTasksRef={projectTasksRef}
          projectEventsRef={projectEventsRef}
          projectFilesRef={projectFilesRef}
          projectNotesRef={projectNotesRef}
        />
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileSelected}
      />
      
      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <EventForm 
            onSuccess={handleEventSuccess}
            onCancel={() => setIsEventDialogOpen(false)}
            initialProjectId={currentProject.id}
          />
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input 
                id="task-title" 
                placeholder="Task title" 
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea 
                id="task-description" 
                placeholder="Task description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-status">Status</Label>
                <Select 
                  value={taskStatus}
                  onValueChange={(value: Task['status']) => setTaskStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select 
                  value={taskPriority}
                  onValueChange={(value: Task['priority']) => setTaskPriority(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={!taskTitle.trim() || isCreatingTask}
            >
              {isCreatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 