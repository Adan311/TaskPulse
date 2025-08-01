import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { Task } from '@/backend/database/schema';
import { fetchProjectTasks, createTask, updateTask, deleteTask, updateTaskStatus, unlinkTaskFromProject } from '@/backend/api/services/task.service';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/frontend/lib/utils';
import { PencilIcon, Trash2Icon, PlusIcon, CheckCircleIcon, CircleIcon, ArrowRightIcon, ArrowLeftIcon, Unlink } from 'lucide-react';
import { useToast } from '@/frontend/hooks/use-toast';
import { TaskDialog } from '@/frontend/features/tasks/components/TaskDialog';

// Status mapping functions to handle UI vs database format differences
const mapUiStatusToDb = (status: string): Task['status'] => {
  if (status === 'in-progress') return 'in_progress';
  return status as Task['status'];
};

const mapDbStatusToUi = (status: string): string => {
  if (status === 'in_progress') return 'in-progress';
  return status;
};

interface ProjectTasksProps {
  projectId: string;
}

export const ProjectTasks = forwardRef<{ refreshTasks: () => void }, ProjectTasksProps>(({ projectId }, ref) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading tasks:', err);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);
  
  // Expose the refreshTasks method through the ref
  useImperativeHandle(ref, () => ({
    refreshTasks: loadTasks
  }));

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, "id" | "user">) => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, {
          ...taskData,
          project: projectId,
        });
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        await createTask({
          ...taskData,
          project: projectId,
        });
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveTask = async (task: Task, newStatus: Task['status']) => {
    try {
      // Ensure the status is in the correct DB format
      const dbStatus = mapUiStatusToDb(newStatus);
      
      await updateTaskStatus(task.id, dbStatus);
      await loadTasks();
      toast({
        title: "Status Updated",
        description: `Task moved to ${newStatus.replace('_', ' ')}`,
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await updateTaskStatus(task.id, newStatus);
      await loadTasks();
      toast({
        title: "Status Updated",
        description: `Task marked as ${newStatus === 'done' ? 'complete' : 'incomplete'}`,
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      loadTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkTask = async (taskId: string) => {
    try {
      await unlinkTaskFromProject(taskId);
      toast({
        title: "Success",
        description: "Task unlinked from project successfully",
      });
      loadTasks();
    } catch (err) {
      console.error('Error unlinking task:', err);
      toast({
        title: "Error",
        description: "Failed to unlink task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Ensure tasks are correctly filtered by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  if (isLoading) {
    return <div className="py-3 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
    </div>;
  }

  if (error && tasks.length === 0) {
    return <div className="py-3 text-center text-destructive">Error loading tasks. Please try again.</div>;
  }
  
  const renderTaskColumn = (title: string, columnTasks: Task[], status: Task['status']) => (
    <div className="space-y-4">
      <div className="font-medium">{title} ({columnTasks.length})</div>
      {columnTasks.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No tasks
        </div>
      ) : (
        columnTasks.map((task) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={handleToggleStatus}
            onMoveTask={(newStatus) => handleMoveTask(task, newStatus)}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onUnlink={handleUnlinkTask}
            currentStatus={status}
          />
        ))
      )}
      {status === 'todo' && (
        <Button variant="outline" size="sm" className="w-full" onClick={handleCreateTask}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No tasks added yet</p>
          <Button onClick={handleCreateTask}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add your first task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              {renderTaskColumn("To Do", todoTasks, "todo")}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              {renderTaskColumn("In Progress", inProgressTasks, "in_progress")}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              {renderTaskColumn("Done", doneTasks, "done")}
            </CardContent>
          </Card>
        </div>
      )}

      <TaskDialog
        task={selectedTask}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
      />
    </div>
  );
});

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onMoveTask: (newStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUnlink: (taskId: string) => void;
  currentStatus: Task['status'];
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onMoveTask,
  onEdit, 
  onDelete,
  onUnlink,
  currentStatus
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'medium':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case 'low':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const renderMoveButtons = () => {
    return (
      <div className="flex space-x-1 mt-2">
        {currentStatus !== 'todo' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMoveTask(currentStatus === 'in_progress' ? 'todo' : 'in_progress')}
            className="h-6 px-2"
          >
            <ArrowLeftIcon className="h-3 w-3 mr-1" />
            {currentStatus === 'in_progress' ? 'To Do' : 'In Progress'}
          </Button>
        )}
        
        {currentStatus !== 'done' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMoveTask(currentStatus === 'todo' ? 'in_progress' : 'done')}
            className="h-6 px-2"
          >
            {currentStatus === 'todo' ? 'In Progress' : 'Done'}
            <ArrowRightIcon className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className={cn(
      "border-l-4", 
      task.priority === 'high' ? "border-l-red-500" : 
      task.priority === 'medium' ? "border-l-amber-500" : "border-l-green-500"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start">
          <div 
            className="flex-shrink-0 mt-0.5 mr-2 cursor-pointer"
            onClick={() => onToggle(task)}
          >
            {task.status === 'done' ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CircleIcon className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className={cn(
              "font-medium text-sm",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-xs text-muted-foreground truncate mt-1 pr-6">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center mt-2 space-x-2">
              <div className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                getPriorityColor(task.priority || 'medium')
              )}>
                {task.priority}
              </div>
              
              {task.due_date && (
                <div className="text-xs">
                  Due: {format(new Date(task.due_date), 'MMM d')}
                </div>
              )}
            </div>
            
            {renderMoveButtons()}
          </div>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
              <PencilIcon className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUnlink(task.id)} title="Unlink from project">
              <Unlink className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
              <Trash2Icon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};