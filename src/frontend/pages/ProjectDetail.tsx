import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { ProjectDetail as ProjectDetailComponent } from '@/frontend/features/project/components/ProjectDetail';
import { useProjects } from '@/frontend/features/project/hooks/useProjects';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useToast } from '@/frontend/hooks/use-toast';
import { Project } from '@/backend/database/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { ProjectFormFields } from '@/frontend/features/project/components/ProjectFormFields';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, loading, error, deleteProject, updateProject } = useProjects();
  const navigate = useNavigate();
  const { toast } = useToast();
  const theme = useTheme();

  const project = projects.find((p) => p.id === id);

  // State for edit form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<Project['status']>('active');
  const [priority, setPriority] = useState<Project['priority']>('medium');
  const [progressValue, setProgressValue] = useState(0);
  const [color, setColor] = useState('#3b82f6');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form fields when project changes
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

  const handleDelete = async () => {
    if (!project) return;
    
    try {
      await deleteProject(project.id);
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
      navigate('/projects');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleSaveProject = async () => {
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
      
      await updateProject(project.id, updates);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Project updated",
        description: "The project has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Box py={4} textAlign="center">
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Box py={4} textAlign="center">
          <Typography color="error">Error loading project: {error.message}</Typography>
        </Box>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <Box py={4} textAlign="center">
          <Typography color="textSecondary">Project not found.</Typography>
        </Box>
      </AppLayout>
    );
  }

  // Ensure all required fields for ProjectDetail
  const projectForDetail = {
    status: 'active' as 'active',
    progress: 0,
    priority: 'medium' as 'medium',
    ...project,
  };

  return (
    <AppLayout>
      <ProjectDetailComponent 
        project={projectForDetail} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
      />

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details. Click save when you're done.
            </DialogDescription>
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
            fieldPrefix="project"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject} 
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 