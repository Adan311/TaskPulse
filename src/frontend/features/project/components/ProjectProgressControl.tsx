import React from 'react';
import { Project } from '@/backend/database/schema';
import { Slider } from '@/frontend/components/ui/slider';
import { Switch } from '@/frontend/components/ui/switch';
import { Button } from '@/frontend/components/ui/button';
import { Label } from '@/frontend/components/ui/label';
import { useProjectProgress } from '../hooks/useProjectProgress';
import { Save } from 'lucide-react';

interface ProjectProgressControlProps {
  project: Project;
  onProgressUpdate: (updatedProject: Project) => void;
}

export const ProjectProgressControl: React.FC<ProjectProgressControlProps> = ({
  project,
  onProgressUpdate
}) => {
  // Use the custom hook to manage progress state and logic
  const {
    isAutoProgress,
    manualProgressValue,
    isUpdating,
    handleAutoProgressToggle,
    handleManualProgressChange,
    saveManualProgress
  } = useProjectProgress({
    project,
    onUpdate: onProgressUpdate
  });

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-progress" className="text-sm font-medium">Auto-calculate progress</Label>
          <p className="text-xs text-muted-foreground">
            {isAutoProgress 
              ? "Progress is calculated from completed tasks" 
              : "Progress is manually set"}
          </p>
        </div>
        <Switch
          id="auto-progress"
          checked={isAutoProgress}
          onCheckedChange={handleAutoProgressToggle}
          disabled={isUpdating}
        />
      </div>

      {!isAutoProgress && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Manual progress: {manualProgressValue}%</Label>
            </div>
            <Slider
              value={[manualProgressValue]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => handleManualProgressChange(value[0])}
              disabled={isUpdating}
              className="py-1"
            />
          </div>
          <Button 
            onClick={saveManualProgress} 
            disabled={isUpdating || isAutoProgress}
            size="sm"
            className="w-full"
          >
            {isUpdating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Save Progress
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}; 