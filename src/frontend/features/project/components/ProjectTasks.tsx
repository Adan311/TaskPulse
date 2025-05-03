import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task } from '@/backend/types/supabaseSchema';
import { fetchProjectTasks, createTask, updateTask, deleteTask } from '@/backend/api/services/task.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/frontend/components/ui/dialog';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Label } from '@/frontend/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { cn } from '@/frontend/lib/utils';
import { PencilIcon, Trash2Icon, PlusIcon, CheckCircleIcon, CircleIcon } from 'lucide-react';

interface ProjectTasksProps {
  projectId: string;
}

export const ProjectTasks: React.FC<ProjectTasksProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    due_date: null as Date | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjectTasks(projectId);
      setTasks(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const handleCreateTask = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
    });
    setIsCreateModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date) : null,
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedTask(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, {
          ...formData,
          due_date: formData.due_date?.toISOString(),
          project: projectId,
        });
      } else {
        await createTask({
          ...formData,
          due_date: formData.due_date?.toISOString(),
          project: projectId,
        });
      }
      handleCloseModal();
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      // TODO: Show error message to user
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      // TODO: Show error message to user
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      // TODO: Show error message to user
    }
  };

  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  if (isLoading) {
    return <div className="py-3 text-center">Loading tasks...</div>;
  }

  if (error) {
    return <div className="py-3 text-center text-red-500">Error loading tasks: {error.message}</div>;
  }

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
        <div className="space-y-4">
          {todoTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={handleToggleStatus}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
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
            
            {/* Due date field would go here, but requires additional date picker component */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSubmit}>{selectedTask ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onEdit, onDelete }) => {
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

  return (
    <div className="flex items-start gap-2 p-3 border rounded-lg bg-card hover:bg-accent/10 transition-colors">
      <div className="flex-shrink-0 pt-1">
        <Checkbox 
          checked={task.status === 'done'} 
          onCheckedChange={() => onToggle(task)}
        />
      </div>
      <div className="flex-grow min-w-0">
        <h3 className={cn(
          "font-medium",
          task.status === 'done' ? "line-through text-muted-foreground" : ""
        )}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex gap-2 mt-2 flex-wrap">
          {task.priority && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              getPriorityColor(task.priority)
            )}>
              {task.priority} priority
            </span>
          )}
          {task.due_date && (
            <span className="text-xs text-muted-foreground">
              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-7 w-7">
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-7 w-7 text-destructive">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}; 