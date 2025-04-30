import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Task as TaskIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Project } from '@/backend/types/supabaseSchema';
import { ProjectTasks } from './ProjectTasks';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ProjectDetailProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  onEdit,
  onDelete,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        {/* Header Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" gutterBottom>
                {project.name}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {project.description}
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={onEdit}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={onDelete} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={project.status}
                color={
                  project.status === 'active'
                    ? 'success'
                    : project.status === 'on-hold'
                    ? 'warning'
                    : 'default'
                }
                sx={{ mt: 1 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Priority
              </Typography>
              <Chip
                label={project.priority}
                color={
                  project.priority === 'high'
                    ? 'error'
                    : project.priority === 'medium'
                    ? 'warning'
                    : 'success'
                }
                sx={{ mt: 1 }}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Due Date
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {project.due_date
                  ? format(new Date(project.due_date), 'MMM d, yyyy')
                  : 'No due date'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="textSecondary" align="right" sx={{ mt: 1 }}>
              {project.progress}%
            </Typography>
          </Box>
        </Paper>

        {/* Tabs Section */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<TaskIcon />} label="Tasks" />
            <Tab icon={<EventIcon />} label="Events" />
            <Tab icon={<FolderIcon />} label="Files" />
            <Tab icon={<DescriptionIcon />} label="Notes" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <ProjectTasks projectId={project.id} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Events Component */}
            <Typography>Events will be displayed here</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Files Component */}
            <Typography>Files will be displayed here</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Notes Component */}
            <Typography>Notes will be displayed here</Typography>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}; 