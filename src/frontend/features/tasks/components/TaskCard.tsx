
import { Task } from '@/backend/api/services/task.service';
import { Card, CardContent, CardFooter, CardHeader } from '@/frontend/components/ui/card';
import { Badge } from '@/frontend/components/ui/badge';
import { Button } from '@/frontend/components/ui/button';
import { Edit, Trash, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'medium':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  return (
    <Card className="mb-2 shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        <div className="font-medium text-sm line-clamp-2">{task.title}</div>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)}>
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {task.description && (
        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
          <p className="line-clamp-2">{task.description}</p>
        </CardContent>
      )}
      <CardFooter className="p-4 pt-0 flex items-center gap-2 flex-wrap">
        {task.priority && (
          <Badge className={`${getPriorityColor(task.priority)} font-normal`} variant="outline">
            {task.priority}
          </Badge>
        )}
        {task.project && (
          <Badge variant="outline" className="font-normal">
            {task.project}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
