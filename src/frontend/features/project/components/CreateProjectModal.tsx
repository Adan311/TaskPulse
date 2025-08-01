import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Project } from '@/backend/database/schema';
import { ProjectFormFields } from './ProjectFormFields';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<Project['status']>('active');
  const [priority, setPriority] = useState<Project['priority']>('medium');
  const [color, setColor] = useState('#3b82f6'); // Default blue color
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createProject(
        name, 
        description, 
        priority, 
        color,
        dueDate,
        status
      );
      handleClose();
    } catch (error) {
      // Error is handled by useProjects hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setDescription('');
    setDueDate(undefined);
    setStatus('active');
    setPriority('medium');
    setColor('#3b82f6');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Project</DialogTitle>
          </DialogHeader>
          
          <ProjectFormFields
            name={name}
            description={description}
            dueDate={dueDate}
            status={status}
            priority={priority}
            color={color}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onDueDateChange={setDueDate}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onColorChange={setColor}
            fieldPrefix="create"
          />
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 