import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function ListView() {
  const events = [
    {
      id: 1,
      title: 'Team Meeting',
      time: '9:00 AM',
      date: '2024-02-02',
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Client Call',
      time: '2:00 PM',
      date: '2024-02-02',
      type: 'call'
    }
  ];

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.date} at {event.time}
                    </p>
                  </div>
                  <Badge>{event.type}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}