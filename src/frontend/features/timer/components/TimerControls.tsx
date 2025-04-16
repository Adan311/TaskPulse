
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Button } from "@/frontend/components/ui/button";
import { Timer, Clock, AlarmClock } from "lucide-react";

interface TimerControlsProps {
  mode: string;
  onModeChange: (mode: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

export function TimerControls({
  mode,
  onModeChange,
  duration,
  onDurationChange,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
      <div className="flex gap-2">
        <Button
          variant={mode === "timer" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onModeChange("timer")}
        >
          <Timer className="w-4 h-4 mr-2" />
          Timer
        </Button>
        <Button
          variant={mode === "stopwatch" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onModeChange("stopwatch")}
        >
          <Clock className="w-4 h-4 mr-2" />
          Stopwatch
        </Button>
      </div>
      
      {mode === "timer" && (
        <Select
          value={duration.toString()}
          onValueChange={(value) => onDurationChange(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="300">5 minutes</SelectItem>
            <SelectItem value="600">10 minutes</SelectItem>
            <SelectItem value="900">15 minutes</SelectItem>
            <SelectItem value="1200">20 minutes</SelectItem>
            <SelectItem value="1800">30 minutes</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
