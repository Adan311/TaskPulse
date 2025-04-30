import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box, Chip, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Project } from '@/backend/types/supabaseSchema';
import { format, differenceInDays } from 'date-fns';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  transition: 'transform 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const ColorBar = styled('div')<{ barcolor?: string }>(({ barcolor }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '4px',
  backgroundColor: barcolor || '#1976d2',
}));

const StatusChip = styled(Chip)<{ status: string }>(({ status, theme }) => ({
  backgroundColor: status === 'active' 
    ? theme.palette.success.light 
    : status === 'on-hold'
    ? theme.palette.warning.light
    : theme.palette.grey[400],
  color: theme.palette.getContrastText(
    status === 'active' 
      ? theme.palette.success.light 
      : status === 'on-hold'
      ? theme.palette.warning.light
      : theme.palette.grey[400]
  ),
}));

const PriorityChip = styled(Chip)<{ priority: string }>(({ priority, theme }) => ({
  backgroundColor: priority === 'high' 
    ? theme.palette.error.light 
    : priority === 'medium'
    ? theme.palette.warning.light
    : theme.palette.success.light,
  color: theme.palette.getContrastText(
    priority === 'high'
      ? theme.palette.error.light
      : priority === 'medium'
      ? theme.palette.warning.light
      : theme.palette.success.light
  ),
}));

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMenuClick }) => {
  const daysRemaining = project.due_date 
    ? differenceInDays(new Date(project.due_date), new Date())
    : null;

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onMenuClick(e);
  };

  return (
    <StyledCard onClick={onClick}>
      <ColorBar barcolor={project.color} />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            {project.name}
          </Typography>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom noWrap>
          {project.description || 'No description'}
        </Typography>

        <Box display="flex" gap={1} mb={2}>
          <StatusChip
            status={project.status}
            label={project.status}
            size="small"
          />
          <PriorityChip
            priority={project.priority}
            label={`${project.priority} priority`}
            size="small"
          />
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="textSecondary">
              Progress
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {project.progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={project.progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {project.due_date && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Due: {format(new Date(project.due_date), 'MMM d, yyyy')}
            </Typography>
            <Typography 
              variant="body2" 
              color={daysRemaining && daysRemaining < 3 ? 'error' : 'textSecondary'}
            >
              {daysRemaining ? `${daysRemaining} days left` : 'Due today'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
}; 