import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { ProjectDetail } from '@/frontend/features/project/components/ProjectDetail';
import { useProjects } from '@/frontend/features/project/hooks/useProjects';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useToast } from '@/frontend/hooks/use-toast';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, loading, error, deleteProject, updateProject } = useProjects();
  const navigate = useNavigate();
  const { toast } = useToast();
  const theme = useTheme();

  const project = projects.find((p) => p.id === id);

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

  const handleEdit = async () => {
    // TODO: Implement edit functionality
    toast({
      title: "Coming soon",
      description: "Project editing will be available soon.",
    });
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
    </AppLayout>
  );
} 