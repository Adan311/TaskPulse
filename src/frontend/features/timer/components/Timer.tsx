
import { useState, useEffect } from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { TimerControls } from "@/frontend/features/timer/components/TimerControls";
import { TimerDisplay } from "@/frontend/features/timer/components/TimerDisplay";
import { Separator } from "@/frontend/components/ui/separator";
import TimerHistory from "@/frontend/features/timer/components/TimerHistory";
import { useToast } from "@/frontend/hooks/use-toast";

const Timer = () => {
  // Timer state
  const [mode, setMode] = useState<string>("timer");
  const [duration, setDuration] = useState<number>(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const { toast } = useToast();

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mode change
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setIsRunning(false);
    
    if (newMode === "timer") {
      setTimeLeft(duration);
    } else {
      setElapsedTime(0);
    }
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (!isRunning) {
      setTimeLeft(newDuration);
    }
  };

  // Timer controls
  const handleStart = () => {
    setIsRunning(true);
    if (mode === "stopwatch") {
      setStartTime(Date.now() - elapsedTime * 1000);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === "timer") {
      setTimeLeft(duration);
    } else {
      setElapsedTime(0);
      setStartTime(null);
    }
  };

  // Timer tick effect
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning) {
      interval = window.setInterval(() => {
        if (mode === "timer") {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(interval!);
              setIsRunning(false);
              toast({
                title: "Timer Complete",
                description: "Your timer has finished!",
              });
              return 0;
            }
            return prevTime - 1;
          });
        } else {
          // Stopwatch mode
          const currentTime = Date.now();
          const startTimeValue = startTime || currentTime;
          setElapsedTime(Math.floor((currentTime - startTimeValue) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, startTime, duration, toast]);

  // Get display time based on mode
  const displayTime = mode === "timer" 
    ? formatTime(timeLeft) 
    : formatTime(elapsedTime);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            <TimerDisplay 
              time={displayTime}
              isRunning={isRunning}
              mode={mode}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
            />
            <Separator className="my-6" />
            <TimerControls 
              mode={mode}
              onModeChange={handleModeChange}
              duration={duration}
              onDurationChange={handleDurationChange}
            />
          </div>
        </div>
        
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l">
          <TimerHistory />
        </div>
      </div>
    </AppLayout>
  );
};

export default Timer;
