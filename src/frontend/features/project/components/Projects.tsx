import React, { useState } from 'react';
import { Box, Container, Typography, Button, Menu, MenuItem, Dialog, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectCard } from './ProjectCard';
import { useProjects } from '../hooks/useProjects';
import { Project } from '@/backend/types/supabaseSchema';
import { CreateProjectModal } from './CreateProjectModal';
import { useNavigate } from 'react-router-dom';

export const Projects: React.FC = () => {
  const theme = useTheme();
  const { projects, loading, error } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    navigate(`/projects/${project.id}`);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box py={4} textAlign="center">
          <Typography>Loading projects...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box py={4} textAlign="center">
          <Typography color="error">Error loading projects: {error.message}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Projects
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
          >
            Create Project
          </Button>
        </Box>

        <Grid container spacing={3}>
          {projects.map((project) => {
            const projectForCard = {
              status: 'active' as 'active',
              progress: 0,
              priority: 'medium' as 'medium',
              ...project,
            };
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                <ProjectCard
                  project={projectForCard}
                  onClick={() => handleProjectClick(projectForCard)}
                  onMenuClick={(e) => handleMenuClick(e, projectForCard)}
                />
              </Grid>
            );
          })}
        </Grid>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
          <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
        </Menu>

        <CreateProjectModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </Box>
    </Container>
  );
};
