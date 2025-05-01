import { useState, useEffect } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/frontend/hooks/use-toast';
import { Task } from '@/backend/types/supabaseSchema';
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
import { supabase } from '@/integrations/supabase/client';
import { TaskFilters } from '../components/TaskFilterBar';

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState<TaskFilters | undefined>(undefined);
  const { toast } = useToast();

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
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
        const newStatus = destination.droppableId as Task['status'];
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
    filters
  };
}
