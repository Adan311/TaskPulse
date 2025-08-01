import { TaskDialog } from './TaskDialog';
import { TaskBoardHeader } from './TaskBoardHeader';
import { TaskColumnsContainer } from './TaskColumnsContainer';
import { TaskBoardLoader } from './TaskBoardLoader';
import { TaskFilterBar, TaskFilters } from './TaskFilterBar';
import { useTaskBoard } from '../hooks/useTaskBoard';
import { restoreTask, deleteTaskPermanently } from '@/backend/api/services/task.service';
import { ErrorBoundary } from '@/frontend/components/ErrorBoundary';
import { Button } from '@/frontend/components/ui/button';
import { Archive } from 'lucide-react';
import { useState } from 'react';

function ArchivedTaskList({ tasks, onRestore, onDelete }) {
  if (!tasks.length) {
    return <div className="p-4 text-center text-muted-foreground">No archived tasks</div>;
  }
  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center justify-between bg-muted rounded p-4">
          <div>
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-muted-foreground">{task.description}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onRestore(task.id)}>Restore</Button>
            <Button variant="destructive" onClick={() => onDelete(task.id)}>Delete Permanently</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskBoard() {
  const {
    tasks,
    loading,
    user,
    columns,
    dialogOpen,
    selectedTask,
    setDialogOpen,
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleSaveTask,
    handleArchiveTask,
    handleBulkArchive,
    onDragEnd,
    applyFilters,
    filters
  } = useTaskBoard();

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleBulkArchiveClick = async () => {
    await handleBulkArchive(selectedTasks);
    setSelectedTasks([]);
    setIsSelectionMode(false);
  };

  const handleRestoreTask = async (taskId: string) => {
    await restoreTask(taskId);
    await applyFilters({ ...filters }); // reload tasks
  };

  const handleDeleteTaskPermanently = async (taskId: string) => {
    await deleteTaskPermanently(taskId);
    await applyFilters({ ...filters }); // reload tasks
  };

  // If no user is logged in, show login message
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">Please sign in to view and manage your tasks.</p>
        <a href="/auth/SignIn" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          Sign In
        </a>
      </div>
    );
  }

  const archivedTasks = tasks.filter(t => t.archived);

  return (
    <ErrorBoundary>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <TaskBoardHeader 
            onAddTask={handleAddTask}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelectedTasks([]);
              }
            }}
          />
          {isSelectionMode && selectedTasks.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkArchiveClick}
              className="ml-2"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Selected ({selectedTasks.length})
            </Button>
          )}
        </div>

        <TaskFilterBar onFilterChange={applyFilters} />

        {loading ? (
          <TaskBoardLoader />
        ) : (
          filters?.showArchived ? (
            <ArchivedTaskList
              tasks={archivedTasks}
              onRestore={handleRestoreTask}
              onDelete={handleDeleteTaskPermanently}
            />
          ) : (
            <TaskColumnsContainer
              tasks={tasks}
              columns={columns}
              onDragEnd={onDragEnd}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onArchiveTask={handleArchiveTask}
              isSelectionMode={isSelectionMode}
              selectedTasks={selectedTasks}
              onTaskSelect={toggleTaskSelection}
            />
          )
        )}

        <TaskDialog
          task={selectedTask}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveTask}
        />
      </div>
    </ErrorBoundary>
  );
}
