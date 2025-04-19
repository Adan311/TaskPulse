import { useState, useEffect } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useToast } from '@/frontend/hooks/use-toast';
import { 
  Task, 
  fetchTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  updateTaskStatus 
} from '@/backend/api/services/task.service';
import { supabase } from '@/backend/api/client/supabase';

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
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
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchTasks();
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

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'user' | 'created_at' | 'updated_at'>) => {
    try {
      await createTask(taskData);
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

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'user' | 'created_at' | 'updated_at'>) => {
    if (!selectedTask) return;
    
    try {
      await updateTask({
        id: selectedTask.id,
        ...taskData,
      });
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
            ? { ...task, status: newStatus, updated_at: new Date().toISOString() } 
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

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'user' | 'created_at' | 'updated_at'>) => {
    if (selectedTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
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
    onDragEnd
  };
}
