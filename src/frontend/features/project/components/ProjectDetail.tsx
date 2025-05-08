import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Project, Task } from '@/backend/types/supabaseSchema';
import { ProjectTasks } from './ProjectTasks';
import { ProjectEvents } from './ProjectEvents';
import { ProjectFiles } from './ProjectFiles';
import { ProjectNotes } from './ProjectNotes';
import { ProjectProgressControl } from './ProjectProgressControl';
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
  
  // Refs for child components
  const projectNotesRef = useRef<{ handleNew: () => void }>(null);
  const projectEventsRef = useRef<{ refreshEvents: () => void }>(null);
  const projectFilesRef = useRef<{ refreshFiles: () => void }>(null);
  const projectTasksRef = useRef<{ refreshTasks: () => void }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for dialogs
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // Event handlers
  const handleAddNote = () => {
    projectNotesRef.current?.handleNew();
    setActiveTab("notes");
  };
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  const { toast } = useToast();
  
  const { uploadFile } = useFiles({ project_id: project.id });
  const [isUploading, setIsUploading] = useState(false);
  
  const [currentProject, setCurrentProject] = useState<Project>(project);
  
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
    setActiveTab("tasks");
  };
  
  const handleAddEvent = () => {
    setIsEventDialogOpen(true);
    setActiveTab("events");
  };
  
  const handleUploadFile = () => {
    fileInputRef.current?.click();
    setActiveTab("files");
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{currentProject.name}</h1>
          <p className="text-muted-foreground">{currentProject.description}</p>
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
                currentProject.status === 'active' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                currentProject.status === 'on-hold' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              )}>
                {currentProject.status === 'active' ? 'In Progress' : 
                 currentProject.status === 'on-hold' ? 'On Hold' : 'Completed'}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Priority:</p>
              <div className={cn(
                "text-sm font-medium rounded-full px-2 py-1 inline-block",
                currentProject.priority === 'high' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                currentProject.priority === 'medium' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              )}>
                {currentProject.priority === 'high' ? 'High' : 
                 currentProject.priority === 'medium' ? 'Medium' : 'Low'}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due:</p>
              <div className={cn(
                "text-sm",
                daysRemaining && daysRemaining < 3 ? "text-red-600 dark:text-red-400" : ""
              )}>
                {currentProject.due_date ? format(new Date(currentProject.due_date), 'MMM d, yyyy') : 'No due date'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {currentProject.progress}% 
                  {currentProject.auto_progress === false && <span className="text-xs ml-1 text-muted-foreground">(Manual)</span>}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${currentProject.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-4">
              <ProjectProgressControl 
                project={currentProject} 
                onProgressUpdate={handleProgressUpdate} 
              />
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
                <Button size="sm" onClick={handleAddTask}>Add Task</Button>
              </div>
              <ProjectTasks ref={projectTasksRef} projectId={currentProject.id} />
            </TabsContent>
            
            <TabsContent value="events">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Events</h2>
                <Button size="sm" onClick={handleAddEvent}>Add Event</Button>
              </div>
              <ProjectEvents ref={projectEventsRef} projectId={currentProject.id} />
            </TabsContent>
            
            <TabsContent value="files">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Files</h2>
                <Button size="sm" onClick={handleUploadFile}>Upload</Button>
              </div>
              <ProjectFiles ref={projectFilesRef} projectId={currentProject.id} />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelected}
              />
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Notes</h2>
                <Button size="sm" onClick={handleAddNote}>Add Note</Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {/* Project-specific notes */}
                  <ProjectNotes ref={projectNotesRef} projectId={currentProject.id} />
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
              <Button size="sm" variant="outline" onClick={handleAddEvent}>Add Event</Button>
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
              <Button size="sm" variant="outline" onClick={handleAddNote}>Add Note</Button>
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