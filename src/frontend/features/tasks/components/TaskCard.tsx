import { useState } from 'react';
import { Task } from '@/backend/database/schema';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Edit, Trash2, Calendar, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TaskTimeTracker } from './TaskTimeTracker';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onArchive: (taskId: string) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRestore?: (taskId: string) => void;
  onDeletePermanently?: (taskId: string) => void;
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete,
  onArchive,
  isSelectionMode,
  isSelected,
  onSelect,
  onRestore,
  onDeletePermanently
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await onArchive(task.id);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (onRestore) await onRestore(task.id);
  };

  const handleDeletePermanently = async () => {
    if (onDeletePermanently) await onDeletePermanently(task.id);
  };

  const getPriorityColor = (priority?: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className={`mb-3 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
            )}
            <h3 className="font-medium text-lg">{task.title}</h3>
          </div>
          <div className="flex space-x-1">
            {!isSelectionMode && !task.archived && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={isArchiving}
                  onClick={handleArchive}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {!isSelectionMode && task.archived && (
              <>
                <Button variant="outline" size="sm" onClick={handleRestore}>Restore</Button>
                <Button variant="destructive" size="sm" onClick={handleDeletePermanently}>Delete Permanently</Button>
              </>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                {task.priority}
              </Badge>
            )}
            
            {task.due_date && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>

        {!task.archived && (
          <div className="mt-3 pt-3 border-t">
            <TaskTimeTracker task={task} compact={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
