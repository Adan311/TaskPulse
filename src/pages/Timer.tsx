import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TimerDisplay } from "@/components/Timer/TimerDisplay";
import { TimerControls } from "@/components/Timer/TimerControls";
import { useToast } from "@/components/ui/use-toast";

export default function Timer() {
  const [mode, setMode] = useState<string>("timer");
  const [duration, setDuration] = useState<number>(1500); // 25 minutes default
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            toast({
              title: "Timer Complete!",
              description: "Your time is up!",
            });
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, toast]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Timer</h1>
            <p className="text-muted-foreground">
              Stay focused and track your time
            </p>
          </div>

          <TimerDisplay
            time={formatTime(timeLeft)}
            isRunning={isRunning}
            mode={mode.toUpperCase()}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />

          <TimerControls
            mode={mode}
            onModeChange={setMode}
            duration={duration}
            onDurationChange={handleDurationChange}
          />
        </div>
      </div>
    </AppLayout>
  );
}