import { useState, useEffect } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/frontend/hooks/use-toast';
import { Task } from '@/backend/database/schema';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  archiveTask,
  bulkArchiveTasks,
  autoArchiveOldTasks
} from '@/backend/api/services/task.service';
import { supabase } from '@/backend/database/client';
import { TaskFilters } from '../components/TaskFilterBar';
import { getCurrentUser } from '@/shared/utils/authUtils';

// Status mapping functions to handle UI vs database format differences
const mapUiStatusToDb = (status: string): Task['status'] => {
  if (status === 'in-progress') return 'in_progress';
  return status as Task['status'];
};

const mapDbStatusToUi = (status: string): string => {
  if (status === 'in_progress') return 'in-progress';
  return status;
};

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState<TaskFilters | undefined>(undefined);
  const { toast } = useToast();

  // These IDs are for UI display only - they match the UI column names
  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    checkUser();
    loadTasks();

    // Set up auto-archiving of old tasks
    const autoArchiveInterval = setInterval(async () => {
      try {
        const archivedTasks = await autoArchiveOldTasks();
        if (archivedTasks && archivedTasks.length > 0) {
          await loadTasks();
          toast({
            title: 'Tasks Auto-Archived',
            description: `${archivedTasks.length} completed tasks have been archived`,
          });
        }
      } catch (error) {
        console.error('Error auto-archiving tasks:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run once per day

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Realtime update:', payload);
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(autoArchiveInterval);
    };
  }, []);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Omit<Task, "id" | "user" | "created_at" | "updated_at">>) => {
    try {
      // Convert UI status to DB status if needed
      if (taskData.status) {
        taskData.status = mapUiStatusToDb(taskData.status);
      }
      
      await createTask(taskData as any);
      await loadTasks();
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTask = async (taskData: Partial<Omit<Task, "id" | "user" | "created_at" | "updated_at">>) => {
    if (!selectedTask) return;
    
    try {
      // Convert UI status to DB status if needed
      if (taskData.status) {
        taskData.status = mapUiStatusToDb(taskData.status);
      }
      
      await updateTask(selectedTask.id, taskData);
      await loadTasks();
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await loadTasks();
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await archiveTask(taskId);
      await loadTasks();
      toast({
        title: 'Success',
        description: 'Task archived successfully',
      });
    } catch (error) {
      console.error('Error archiving task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive task',
        variant: 'destructive',
      });
    }
  };

  const handleBulkArchive = async (taskIds: string[]) => {
    try {
      await bulkArchiveTasks(taskIds);
      await loadTasks();
      toast({
        title: 'Success',
        description: `${taskIds.length} tasks archived successfully`,
      });
    } catch (error) {
      console.error('Error bulk archiving tasks:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive tasks',
        variant: 'destructive',
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (destination.droppableId !== source.droppableId) {
      try {
        // Convert UI status (with dash) to DB status (with underscore)
        const newStatus = mapUiStatusToDb(destination.droppableId);
        await updateTaskStatus(draggableId, newStatus);
        
        const updatedTasks = tasks.map(task => 
          task.id === draggableId 
            ? { ...task, status: newStatus } 
            : task
        );
        setTasks(updatedTasks);
        
        toast({
          title: 'Task Updated',
          description: `Task moved to ${destination.droppableId.replace('-', ' ')}`,
        });
      } catch (error) {
        console.error('Error updating task status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update task status',
          variant: 'destructive',
        });
      }
    }
  };

  const applyFilters = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Omit<Task, "id" | "user" | "created_at" | "updated_at">>) => {
    if (selectedTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
    setDialogOpen(false);
  };

  // Get tasks for a specific column, handling the status format difference
  const getColumnTasks = (columnId: string) => {
    return tasks.filter(task => {
      // Map DB status to UI status for comparison
      const uiStatus = mapDbStatusToUi(task.status);
      return uiStatus === columnId;
    });
  };

  return {
    tasks,
    loading,
    user,
    columns,
    dialogOpen,
    selectedTask,
    setDialogOpen,
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleSaveTask,
    handleArchiveTask,
    handleBulkArchive,
    onDragEnd,
    applyFilters,
    filters,
    getColumnTasks // Export the new helper method
  };
}
