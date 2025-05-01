import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { useProjects } from '../hooks/useProjects';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const { createProject } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject(name, description);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setPriority('medium');
    } catch (error) {
      // Error is handled by useProjects hook
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Project
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 