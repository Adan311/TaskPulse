import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskCard } from './TaskCard';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Research competitors',
      description: 'Look into main competitors and their features',
      status: 'todo'
    },
    {
      id: '2',
      title: 'Design system',
      description: 'Create a cohesive design system',
      status: 'in-progress'
    }
  ]);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, {
      ...reorderedItem,
      status: result.destination.droppableId
    });

    setTasks(items);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((column) => (
            <Card key={column.id}>
              <CardHeader>
                <CardTitle>{column.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {tasks
                          .filter((task) => task.status === column.id)
                          .map((task, index) => (
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
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}