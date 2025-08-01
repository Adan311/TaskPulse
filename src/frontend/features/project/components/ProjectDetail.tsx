import React, { useState, useRef, useEffect } from 'react';
import { Project, Task } from '@/backend/database/schema';
import { ProjectOverview } from './ProjectOverview';
import { ProjectTabbedView } from './ProjectTabbedView';
import { ProjectDashboardView } from './ProjectDashboardView';
import { ViewModeToggle } from './ViewModeToggle';
import { Button } from '@/frontend/components/ui/button';
import { PencilIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/frontend/components/ui/dialog';
import { EventForm } from '@/frontend/features/calendar/components/EventForm';
import { TaskDialog } from '@/frontend/features/tasks/components/TaskDialog';
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
  
  // Task form state - keeping references for compatibility but we'll use TaskDialog
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

  const handleTaskSuccess = (taskData: Omit<Task, "id" | "user">) => {
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
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={(taskData) => {
          // Add the project ID to the task data
          const taskWithProject = {
            ...taskData,
            project: currentProject.id
          };
          
          handleTaskSuccess(taskWithProject);
        }}
      />
    </div>
  );
}; 