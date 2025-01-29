import React from "react";
import { Eye, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  time: string;
  isRunning: boolean;
  mode: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerDisplay({
  time,
  isRunning,
  mode,
  onStart,
  onPause,
  onReset,
}: TimerDisplayProps) {
  return (
    <div className="relative w-64 h-64 mx-auto">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700 dark:border-gray-600" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Eye className="w-6 h-6 mb-2 text-gray-500" />
        <div className="text-4xl font-bold mb-1">{time}</div>
        <div className="text-sm text-gray-500 uppercase tracking-wider mb-4">
          {mode}
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={onStart}
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={onPause}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}