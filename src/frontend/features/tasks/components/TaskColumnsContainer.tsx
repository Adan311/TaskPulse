import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { TaskColumn } from './TaskColumn';
import { Task } from '@/backend/database/schema';
import { motion } from 'framer-motion';

interface TaskColumnsContainerProps {
  tasks: Task[];
  columns: { id: string; title: string }[];
  onDragEnd: (result: DropResult) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  isSelectionMode: boolean;
  selectedTasks: string[];
  onTaskSelect: (taskId: string) => void;
}

export function TaskColumnsContainer({ 
  tasks, 
  columns, 
  onDragEnd, 
  onEditTask, 
  onDeleteTask,
  onArchiveTask,
  isSelectionMode,
  selectedTasks,
  onTaskSelect
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
              onArchive={onArchiveTask}
              isSelectionMode={isSelectionMode}
              selectedTasks={selectedTasks}
              onTaskSelect={onTaskSelect}
            />
          </motion.div>
        ))}
      </DragDropContext>
    </motion.div>
  );
}
