import React from 'react';
import { Project } from '@/backend/types/supabaseSchema';
import { Slider } from '@/frontend/components/ui/slider';
import { Switch } from '@/frontend/components/ui/switch';
import { Button } from '@/frontend/components/ui/button';
import { Label } from '@/frontend/components/ui/label';
import { useProjectProgress } from '../hooks/useProjectProgress';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-progress">Auto-calculate progress</Label>
          <p className="text-sm text-muted-foreground">
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
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Manual progress: {manualProgressValue}%</Label>
            </div>
            <Slider
              value={[manualProgressValue]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleManualProgressChange}
              disabled={isUpdating}
            />
          </div>
          <Button 
            onClick={saveManualProgress} 
            disabled={isUpdating || isAutoProgress}
            size="sm"
          >
            {isUpdating ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      )}
    </div>
  );
}; 