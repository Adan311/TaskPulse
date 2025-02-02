import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Implement authentication",
    description: "Add user login and registration",
    status: "todo",
  },
  {
    id: "2",
    title: "Create dashboard",
    description: "Design and implement main dashboard",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Write documentation",
    description: "Document the API endpoints",
    status: "done",
  },
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { toast } = useToast();

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
    toast({
      title: "Task moved",
      description: "Task has been successfully moved to new position",
    });
  };

  const columns = ["todo", "in-progress", "done"];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((column) => (
            <div key={column} className="bg-card rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {column.replace("-", " ")}
              </h2>
              <Droppable droppableId={column}>
                {(provided) => (
                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {tasks
                        .filter((task) => task.status === column)
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
                                <Card>
                                  <CardHeader>
                                    <CardTitle>{task.title}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
};

export default Tasks;