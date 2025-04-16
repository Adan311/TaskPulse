
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TaskBoardHeaderProps {
  onAddTask: () => void;
}

export function TaskBoardHeader({ onAddTask }: TaskBoardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <Button onClick={onAddTask}>
        <Plus className="mr-2 h-4 w-4" /> Add Task
      </Button>
    </div>
  );
}
