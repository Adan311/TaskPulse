
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { TaskColumn } from './TaskColumn';
import { Task } from '@/backend/api/services/task.service';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <DragDropContext onDragEnd={onDragEnd}>
        {columns.map((column, index) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <TaskColumn
              id={column.id}
              title={column.title}
              tasks={tasks}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          </motion.div>
        ))}
      </DragDropContext>
    </motion.div>
  );
}
