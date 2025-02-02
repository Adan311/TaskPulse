import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WeekView() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-8 gap-4">
            <div className="sticky top-0 bg-background z-10">Time</div>
            {days.map((day) => (
              <div key={day} className="sticky top-0 bg-background z-10 text-center">
                {day}
              </div>
            ))}
            {hours.map((hour) => (
              <>
                <div key={hour} className="text-sm text-muted-foreground">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
                {days.map((day) => (
                  <div
                    key={`${day}-${hour}`}
                    className="h-12 border-t border-l hover:bg-accent/50 transition-colors"
                  />
                ))}
              </>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}