import React from "react";
import { Button } from "@/frontend/components/ui/button";

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
    <div className="flex flex-col gap-6 w-full max-w-xs mx-auto">
      {/* Button group */}
      <div className="flex gap-3 bg-background/80 rounded-xl p-1 justify-center">
        <Button
          variant={mode === "focus" ? "default" : "outline"}
          className="flex-1 rounded-lg text-sm px-3 py-2"
          onClick={() => onModeChange("focus")}
        >
          <span className="mr-1">🎯</span>
          Focus
        </Button>
        <Button
          variant={mode === "shortBreak" ? "default" : "outline"}
          className="flex-1 rounded-lg text-sm px-3 py-2"
          onClick={() => onModeChange("shortBreak")}
        >
          <span className="mr-1">☕️</span>
          Short Break
        </Button>
        <Button
          variant={mode === "longBreak" ? "default" : "outline"}
          className="flex-1 rounded-lg text-sm px-3 py-2"
          onClick={() => onModeChange("longBreak")}
        >
          <span className="mr-1">🛌</span>
          Long Break
        </Button>
      </div>
      {/* Input */}
      <div>
        <label className="block text-xs mb-1 opacity-70">
          {mode === "focus" && "Focus Duration"}
          {mode === "shortBreak" && "Short Break Duration"}
          {mode === "longBreak" && "Long Break Duration"}
        </label>
        <input
          type="number"
          min={60}
          max={3600}
          step={60}
          value={duration}
          onChange={e => onDurationChange(Number(e.target.value))}
          className="w-full max-w-xs mx-auto rounded-lg border border-muted bg-background text-primary dark:bg-[#111827] dark:text-white light:bg-white light:text-black px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <span className="text-xs text-muted-foreground block mt-1">
          {Math.floor(duration / 60)} min
        </span>
      </div>
    </div>
  );
}
