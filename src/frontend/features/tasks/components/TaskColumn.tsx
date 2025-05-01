import { Droppable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { TaskList } from './TaskList';
import { Task } from '@/backend/types/supabaseSchema';

// Removed ScrollArea; use native div with overflow-auto for proper DnD behavior

// Draggable is used in TaskList for drag-and-drop

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onArchive: (taskId: string) => void;
  isSelectionMode: boolean;
  selectedTasks: string[];
  onTaskSelect: (taskId: string) => void;
}

export function TaskColumn({ 
  id, 
  title, 
  tasks, 
  onEdit, 
  onDelete,
  onArchive,
  isSelectionMode,
  selectedTasks,
  onTaskSelect
}: TaskColumnProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={id}>
          {(provided) => (
            <div
              className="h-[calc(100vh-300px)] overflow-auto space-y-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <TaskList 
                tasks={tasks.filter((task) => task.status === id)} 
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                isSelectionMode={isSelectionMode}
                selectedTasks={selectedTasks}
                onTaskSelect={onTaskSelect}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
