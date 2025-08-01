import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";

interface TimerSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  onChange: (settings: {
    focusDuration: number;
    shortBreak: number;
    longBreak: number;
    sessionsBeforeLongBreak: number;
  }) => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  open,
  onOpenChange,
  focusDuration,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  onChange,
}) => {
  const [localSettings, setLocalSettings] = React.useState({
    focusDuration,
    shortBreak,
    longBreak,
    sessionsBeforeLongBreak,
  });

  React.useEffect(() => {
    setLocalSettings({ focusDuration, shortBreak, longBreak, sessionsBeforeLongBreak });
  }, [focusDuration, shortBreak, longBreak, sessionsBeforeLongBreak]);

  const handleSave = () => {
    onChange(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Focus Session (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              className="input input-bordered w-full"
              value={localSettings.focusDuration}
              onChange={e => setLocalSettings(s => ({ ...s, focusDuration: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Break (minutes)</label>
            <input
              type="number"
              min={1}
              max={30}
              className="input input-bordered w-full"
              value={localSettings.shortBreak}
              onChange={e => setLocalSettings(s => ({ ...s, shortBreak: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Long Break (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              className="input input-bordered w-full"
              value={localSettings.longBreak}
              onChange={e => setLocalSettings(s => ({ ...s, longBreak: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Long Break After (sessions)</label>
            <input
              type="number"
              min={1}
              max={10}
              className="input input-bordered w-full"
              value={localSettings.sessionsBeforeLongBreak}
              onChange={e => setLocalSettings(s => ({ ...s, sessionsBeforeLongBreak: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
