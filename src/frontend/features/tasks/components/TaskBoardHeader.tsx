import { Button } from '@/frontend/components/ui/button';
import { Plus, CheckSquare } from 'lucide-react';

interface TaskBoardHeaderProps {
  onAddTask: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export function TaskBoardHeader({ 
  onAddTask, 
  isSelectionMode, 
  onToggleSelectionMode 
}: TaskBoardHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          onClick={onToggleSelectionMode}
          className={isSelectionMode ? 'bg-primary text-primary-foreground' : ''}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          {isSelectionMode ? 'Cancel Selection' : 'Select Tasks'}
        </Button>
        <Button onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
    </div>
  );
}
