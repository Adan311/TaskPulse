import { Task } from '@/backend/database/schema';
import { TaskCard } from './TaskCard';
import { motion } from 'framer-motion';
import { Draggable } from '@hello-pangea/dnd';

// Removed Draggable import; disabling drag functionality temporarily

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onArchive: (taskId: string) => void;
  isSelectionMode: boolean;
  selectedTasks: string[];
  onTaskSelect: (taskId: string) => void;
}

export function TaskList({ 
  tasks, 
  onEdit, 
  onDelete,
  onArchive,
  isSelectionMode,
  selectedTasks,
  onTaskSelect
}: TaskListProps) {
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
        <Draggable key={task.id} draggableId={task.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`mb-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
              style={provided.draggableProps.style}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <TaskCard 
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTasks.includes(task.id)}
                  onSelect={() => onTaskSelect(task.id)}
                />
              </motion.div>
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
}
