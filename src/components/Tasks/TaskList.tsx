
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '@/services/taskService';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  return (
    <>
      {tasks.map((task, index) => (
        <Draggable
          key={task.id}
          draggableId={task.id}
          index={index}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <TaskCard 
                task={task} 
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
}
