import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Button, Menu, MenuItem, Dialog, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectCard } from './ProjectCard';
import { useProjects } from '../hooks/useProjects';
import { Project } from '@/backend/types/supabaseSchema';
import { CreateProjectModal } from './CreateProjectModal';

export const Projects: React.FC = () => {
  const theme = useTheme();
  const { projects, isLoading, error } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    // TODO: Navigate to project detail view
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

  if (isLoading) {
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
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard
                project={project}
                onClick={() => handleProjectClick(project)}
                onMenuClick={(e) => handleMenuClick(e, project)}
              />
            </Grid>
          ))}
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
