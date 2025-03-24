
import { Droppable } from 'react-beautiful-dnd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from './TaskList';
import { Task } from '@/services/taskService';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskColumn({ id, title, tasks, onEdit, onDelete }: TaskColumnProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={id}>
          {(provided) => (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                <TaskList 
                  tasks={tasks.filter((task) => task.status === id)} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                {provided.placeholder}
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
