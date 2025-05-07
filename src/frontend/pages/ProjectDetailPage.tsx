import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { ProjectDetail } from '@/frontend/features/project/components/ProjectDetail';
import { useProjects } from '@/frontend/features/project/hooks/useProjects';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useToast } from '@/frontend/hooks/use-toast';
import { Project } from '@/backend/types/supabaseSchema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { Textarea } from '@/frontend/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar } from '@/frontend/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/frontend/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, loading, error, deleteProject, updateProject } = useProjects();
  const navigate = useNavigate();
  const { toast } = useToast();
  const theme = useTheme();

  const project = projects.find((p) => p.id === id);

  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    due_date: null,
    status: 'active',
    priority: 'medium',
    progress: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!project) return;

    // Initialize form with current project data
    setEditFormData({
      name: project.name,
      description: project.description || '',
      due_date: project.due_date ? project.due_date : null,
      status: project.status || 'active',
      priority: project.priority || 'medium',
      progress: project.progress || 0
    });
    
    setIsEditDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!project || !editFormData.name?.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Only include fields that are in the Project type
      const updates: Partial<Omit<Project, 'id' | 'user'>> = {
        name: editFormData.name,
        description: editFormData.description,
        due_date: editFormData.due_date,
        status: editFormData.status as 'active' | 'completed' | 'on-hold',
        priority: editFormData.priority as 'low' | 'medium' | 'high',
        progress: editFormData.progress
      };
      
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
      <ProjectDetail 
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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Name</Label>
              <Input 
                id="project-name" 
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea 
                id="project-description" 
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Project description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editFormData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFormData.due_date ? (
                      format(new Date(editFormData.due_date), "PPP")
                    ) : (
                      <span>No due date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editFormData.due_date ? new Date(editFormData.due_date) : undefined}
                    onSelect={(date) => setEditFormData({ 
                      ...editFormData, 
                      due_date: date ? date.toISOString() : null 
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => 
                    setEditFormData({ 
                      ...editFormData, 
                      status: value as 'active' | 'completed' | 'on-hold' 
                    })
                  }
                >
                  <SelectTrigger id="project-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-priority">Priority</Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) => 
                    setEditFormData({ 
                      ...editFormData, 
                      priority: value as 'low' | 'medium' | 'high' 
                    })
                  }
                >
                  <SelectTrigger id="project-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-progress">Progress ({editFormData.progress}%)</Label>
              <Input
                id="project-progress"
                type="range"
                min="0"
                max="100"
                value={editFormData.progress}
                onChange={(e) => setEditFormData({ 
                  ...editFormData, 
                  progress: parseInt(e.target.value) 
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
              disabled={!editFormData.name?.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 