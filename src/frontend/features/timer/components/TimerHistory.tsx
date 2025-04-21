import React from "react";
import { Badge } from "@/frontend/components/ui/badge";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Clock, Calendar, User } from "lucide-react";

interface TimerSession {
  id: string;
  date: string;
  duration: string;
  task: string;
  project: string;
}

interface TimerHistoryProps {
  history?: TimerSession[];
}

const TimerHistory: React.FC<TimerHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-muted-foreground opacity-60 py-8">
        No timer history yet.
      </div>
    );
  }
  return (
    <div className="space-y-4 p-4 bg-background rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Recent Timers</h3>
        <p className="text-sm text-muted-foreground">Your timer history for the past 7 days</p>
      </div>
      
      <div className="space-y-3">
        {history.map((session) => (
          <Card key={session.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{session.task}</h4>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <User className="mr-1 h-3 w-3" />
                    <span>{session.project}</span>
                  </div>
                </div>
                <Badge variant="outline" className="ml-2">{session.duration}</Badge>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <Calendar className="mr-1 h-3 w-3" />
                <span className="mr-3">{session.date}</span>
                <Clock className="mr-1 h-3 w-3" />
                <span>{session.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimerHistory;
