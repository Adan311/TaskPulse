
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '@/backend/api/services/task.service';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/frontend/components/ui/card';
import { TaskList } from './TaskList';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskColumn({ id, title, tasks, onEdit, onDelete }: TaskColumnProps) {
  // Filter tasks for this column
  const filteredTasks = tasks.filter(task => task.status === id);
  
  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
            {filteredTasks.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-300px)] pr-4">
          <Droppable droppableId={id}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="min-h-[200px]"
              >
                <TaskList
                  tasks={filteredTasks}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
