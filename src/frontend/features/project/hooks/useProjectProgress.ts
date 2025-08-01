import { useState, useEffect } from 'react';
import { Project } from '@/backend/database/schema';
import { setAutoProgress, setManualProgress } from '@/backend/api/services/project.service';
import { useToast } from '@/frontend/hooks/use-toast';

interface UseProjectProgressProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export function useProjectProgress({ project, onUpdate }: UseProjectProgressProps) {
  const [isAutoProgress, setIsAutoProgress] = useState(project.auto_progress !== false);
  const [manualProgressValue, setManualProgressValue] = useState(
    project.manual_progress ?? project.progress
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Update state when project changes
  useEffect(() => {
    setIsAutoProgress(project.auto_progress !== false);
    setManualProgressValue(project.manual_progress ?? project.progress);
  }, [project]);

  const handleAutoProgressToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      let updatedProject: Project;
      
      if (checked) {
        // Switch to auto progress
        updatedProject = await setAutoProgress(project.id);
        toast({
          title: "Auto-progress enabled",
          description: "Progress will now be calculated based on task completion.",
        });
      } else {
        // Keep using the current progress value when switching to manual
        updatedProject = await setManualProgress(project.id, project.progress);
        toast({
          title: "Manual progress enabled",
          description: "You can now set progress manually.",
        });
      }
      
      setIsAutoProgress(checked);
      
      if (onUpdate) {
        onUpdate(updatedProject);
      }
    } catch (error) {
      console.error("Error toggling progress mode:", error);
      toast({
        title: "Error",
        description: "Failed to update progress mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualProgressChange = (value: number | number[]) => {
    const progressValue = Array.isArray(value) ? value[0] : value;
    setManualProgressValue(progressValue);
  };

  const saveManualProgress = async () => {
    if (isAutoProgress) return;
    
    setIsUpdating(true);
    try {
      const updatedProject = await setManualProgress(project.id, manualProgressValue);
      
      toast({
        title: "Progress updated",
        description: `Project progress set to ${manualProgressValue}%.`,
      });
      
      if (onUpdate) {
        onUpdate(updatedProject);
      }
    } catch (error) {
      console.error("Error updating manual progress:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isAutoProgress,
    manualProgressValue,
    isUpdating,
    handleAutoProgressToggle,
    handleManualProgressChange,
    saveManualProgress
  };
} 