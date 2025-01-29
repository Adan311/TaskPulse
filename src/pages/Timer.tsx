import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TimerDisplay } from "@/components/Timer/TimerDisplay";
import { TimerControls } from "@/components/Timer/TimerControls";
import { useToast } from "@/components/ui/use-toast";

export default function Timer() {
  const [mode, setMode] = useState<string>("timer");
  const [duration, setDuration] = useState<number>(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        if (mode === "timer") {
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
        } else {
          setStopwatchTime((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode, toast]);

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
    if (mode === "timer") {
      setTimeLeft(duration);
    } else {
      setStopwatchTime(0);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "timer") {
      setTimeLeft(duration);
    } else {
      setStopwatchTime(0);
    }
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
            time={formatTime(mode === "timer" ? timeLeft : stopwatchTime)}
            isRunning={isRunning}
            mode={mode.toUpperCase()}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />

          <TimerControls
            mode={mode}
            onModeChange={handleModeChange}
            duration={duration}
            onDurationChange={handleDurationChange}
          />
        </div>
      </div>
    </AppLayout>
  );
}