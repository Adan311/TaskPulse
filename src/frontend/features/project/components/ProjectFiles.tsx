import React, { useState, useCallback } from 'react';
import { useToast } from '@/frontend/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload as UploadIcon, File as FileIcon, Trash2 as TrashIcon, FileText, Image as ImageIcon, Archive as ArchiveIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/frontend/lib/utils';

interface ProjectFilesProps {
  projectId: string;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
}

export const ProjectFiles: React.FC<ProjectFilesProps> = ({ projectId }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
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

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (fileType.includes('text') || fileType.includes('document')) {
      return <FileText className="h-8 w-8 text-yellow-500" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <ArchiveIcon className="h-8 w-8 text-purple-500" />;
    } else {
      return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No files uploaded yet</p>
          <Button className="relative" disabled={uploading}>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              accept="*/*"
            />
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button className="relative" disabled={uploading}>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept="*/*"
              />
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
          
          <div className="grid gap-4">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className="mr-4">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium truncate">{file.name}</h3>
                      <div className="flex text-xs text-muted-foreground mt-1 space-x-4">
                        <span>{formatFileSize(file.size)}</span>
                        {file.created_at && (
                          <span>Uploaded {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => handleDelete(file.id, file.path)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}; 