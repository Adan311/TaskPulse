import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">{task.description}</p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline">{task.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}