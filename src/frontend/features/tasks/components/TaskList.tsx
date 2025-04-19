
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '@/backend/api/services/task.service';
import { TaskCard } from './TaskCard';
import { motion } from 'framer-motion';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <motion.div 
        className="p-4 text-center text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        No tasks in this column
      </motion.div>
    );
  }

  return (
    <>
      {tasks.map((task, index) => (
        <Draggable
          key={task.id}
          draggableId={task.id}
          index={index}
        >
          {(provided, snapshot) => (
            <motion.div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`mb-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
            >
              <TaskCard 
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.div>
          )}
        </Draggable>
      ))}
    </>
  );
}
