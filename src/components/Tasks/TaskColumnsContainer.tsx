
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { TaskColumn } from './TaskColumn';
import { Task } from '@/services/taskService';

interface TaskColumnsContainerProps {
  tasks: Task[];
  columns: { id: string; title: string }[];
  onDragEnd: (result: DropResult) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskColumnsContainer({ 
  tasks, 
  columns, 
  onDragEnd, 
  onEditTask, 
  onDeleteTask 
}: TaskColumnsContainerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DragDropContext onDragEnd={onDragEnd}>
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasks}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </DragDropContext>
    </div>
  );
}
