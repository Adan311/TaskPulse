import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MonthView() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-7 gap-4">
          <div className="lg:col-span-5">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Events Today</h3>
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-start">
                  9:00 AM - Team Meeting
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  2:00 PM - Client Call
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}