
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, User } from "lucide-react";

interface TimerSession {
  id: string;
  date: string;
  duration: string;
  task: string;
  project: string;
}

const mockTimerSessions: TimerSession[] = [
  {
    id: '1',
    date: '2023-05-01',
    duration: '1h 30m',
    task: 'Design homepage',
    project: 'Website Redesign',
  },
  {
    id: '2',
    date: '2023-05-01',
    duration: '45m',
    task: 'Team meeting',
    project: 'Project Management',
  },
  {
    id: '3',
    date: '2023-04-30',
    duration: '2h 15m',
    task: 'Develop API integration',
    project: 'Backend Development',
  },
];

export default function TimerHistory() {
  return (
    <div className="space-y-4 p-4 bg-background rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Recent Timers</h3>
        <p className="text-sm text-muted-foreground">Your timer history for the past 7 days</p>
      </div>
      
      <div className="space-y-3">
        {mockTimerSessions.map((session) => (
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
}
