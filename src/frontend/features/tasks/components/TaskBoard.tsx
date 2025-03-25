
import { TaskDialog } from '@/components/Tasks/TaskDialog';
import { TaskBoardHeader } from './TaskBoardHeader';
import { TaskColumnsContainer } from './TaskColumnsContainer';
import { TaskBoardLoader } from './TaskBoardLoader';
import { useTaskBoard } from '../hooks/useTaskBoard';
import { Task } from '@/backend/api/services/task.service';

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
    onDragEnd
  } = useTaskBoard();

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

  return (
    <div className="p-4">
      <TaskBoardHeader onAddTask={handleAddTask} />

      {loading ? (
        <TaskBoardLoader />
      ) : (
        <TaskColumnsContainer
          tasks={tasks}
          columns={columns}
          onDragEnd={onDragEnd}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <TaskDialog
        task={selectedTask as any}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveTask as any}
      />
    </div>
  );
}
