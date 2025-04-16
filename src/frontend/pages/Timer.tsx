
import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";

export default function Timer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning) {
      interval = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Timer</h1>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Focus Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl font-mono text-center py-8">
              {formatTime(time)}
            </div>
            
            <div className="flex justify-center gap-4">
              <Button 
                onClick={handleStartStop}
                variant={isRunning ? "destructive" : "default"}
              >
                {isRunning ? "Stop" : "Start"}
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                disabled={time === 0}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
