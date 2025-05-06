import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/frontend/components/ui/radio-group';
import { Label } from '@/frontend/components/ui/label';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';

interface ProjectSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  onSelect: (projectId: string) => void;
  onCancel: () => void;
}

export function ProjectSelectionModal({
  open,
  onOpenChange,
  projects,
  onSelect,
  onCancel
}: ProjectSelectionModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedProjectId) {
      onSelect(selectedProjectId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Project</DialogTitle>
        </DialogHeader>
        
        {projects.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            You don't have any projects yet. Create a project first.
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] mt-4">
            <RadioGroup 
              value={selectedProjectId || ""} 
              onValueChange={setSelectedProjectId}
              className="space-y-2"
            >
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value={project.id} id={`project-${project.id}`} />
                  <Label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-muted-foreground">{project.description}</div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedProjectId || projects.length === 0}>
            Add to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 