import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useToast } from '@/frontend/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFilesProps {
  projectId: string;
}

export const ProjectFiles: React.FC<ProjectFilesProps> = ({ projectId }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Add file metadata to the files table
      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });

      // Refresh files list
      fetchFiles();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [projectId, toast]);

  const fetchFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive',
      });
    }
  }, [projectId, toast]);

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully.',
      });

      // Refresh files list
      fetchFiles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Project Files</Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadIcon />}
          disabled={uploading}
        >
          Upload File
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
            accept="*/*"
          />
        </Button>
      </Box>

      {files.length === 0 ? (
        <Typography color="textSecondary" align="center">
          No files uploaded yet
        </Typography>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(file.id, file.path)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024).toFixed(2)} KB`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}; 