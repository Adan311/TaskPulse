import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimerSession {
  id: string;
  duration: string;
  date: string;
  type: 'timer' | 'stopwatch';
}

export function TimerHistory() {
  const sessions: TimerSession[] = [
    {
      id: '1',
      duration: '25:00',
      date: '2024-02-02',
      type: 'timer'
    },
    {
      id: '2',
      duration: '15:30',
      date: '2024-02-02',
      type: 'stopwatch'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timer History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{session.duration}</p>
                      <p className="text-sm text-muted-foreground">{session.date}</p>
                    </div>
                    <Badge variant="outline">{session.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}