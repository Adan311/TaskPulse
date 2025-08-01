import React, { useState, useEffect } from 'react';
import { Project } from '@/backend/database/schema';
import { useProjects } from '../hooks/useProjects';
import { useProjectProgress } from '../hooks/useProjectProgress';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { ProjectFormFields } from './ProjectFormFields';

interface EditProjectModalProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (project: Project) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  project, 
  open, 
  onClose,
  onUpdate 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<Project['status']>('active');
  const [priority, setPriority] = useState<Project['priority']>('medium');
  const [progressValue, setProgressValue] = useState(0);
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateProject } = useProjects();

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setDueDate(project.due_date || undefined);
      setStatus(project.status || 'active');
      setPriority(project.priority || 'medium');
      setProgressValue(project.progress || 0);
      setColor(project.color || '#3b82f6');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const updates: Partial<Project> = {
        name,
        description,
        due_date: dueDate,
        status,
        priority,
        progress: progressValue,
        manual_progress: progressValue,
        color
      };

      // If the progress is being manually set, update auto_progress flag
      if (project.auto_progress !== false) {
        updates.auto_progress = false;
      }

      const updatedProject = await updateProject(project.id, updates);
      if (onUpdate) {
        onUpdate(updatedProject);
      }
      handleClose();
    } catch (error) {
      // Error is handled by useProjects hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const formatDueDateString = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Don't render if no project is provided
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Project</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update your project details. Click save when you're done.
            </p>
          </DialogHeader>
          
          <ProjectFormFields
            name={name}
            description={description}
            dueDate={dueDate}
            status={status}
            priority={priority}
            color={color}
            progress={progressValue}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onDueDateChange={setDueDate}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onColorChange={setColor}
            onProgressChange={setProgressValue}
            isEditMode={true}
            fieldPrefix="edit"
          />
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 