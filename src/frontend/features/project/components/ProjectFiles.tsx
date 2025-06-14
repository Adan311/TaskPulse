import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useFiles } from '@/frontend/features/files/hooks/useFiles';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { 
  File as FileIcon, 
  Trash2 as TrashIcon, 
  FileText, 
  Image as ImageIcon, 
  Archive as ArchiveIcon,
  ExternalLink,
  Unlink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/frontend/lib/utils';
import { useToast } from '@/frontend/hooks/use-toast';
import { formatFileSize } from "@/shared/utils/fileUtils";


interface ProjectFilesProps {
  projectId: string;
}

// File Icon based on file type
const getFileIcon = (fileType: string, className = "h-5 w-5", withColor = true) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={cn(className, withColor ? "text-blue-500" : "")} />;
  } else if (fileType === 'application/pdf') {
    return <FileIcon className={cn(className, withColor ? "text-red-500" : "")} />;
  } else if (
    fileType === 'text/plain' || 
    fileType === 'application/msword' || 
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <FileText className={cn(className, withColor ? "text-green-500" : "")} />;
  } else {
    return <FileIcon className={cn(className, withColor ? "text-gray-500" : "")} />;
  }
};



export const ProjectFiles = forwardRef<{ refreshFiles: () => void }, ProjectFilesProps>(({ projectId }, ref) => {
  const { 
    files, 
    loading, 
    deleteFile, 
    getDownloadUrl,
    loadFiles,
    detachFile
  } = useFiles({ project_id: projectId, autoLoad: true });
  
  const { toast } = useToast();

  // Expose the refresh method through the ref
  useImperativeHandle(ref, () => ({
    refreshFiles: loadFiles
  }));

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      
      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const url = await getDownloadUrl(fileId);
      
      // Create an anchor element and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUnlink = async (fileId: string) => {
    try {
      await detachFile(fileId, 'project');
      
      toast({
        title: 'File unlinked',
        description: 'The file has been removed from this project.',
      });
      
      // Refresh the file list
      loadFiles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to unlink file from project. Please try again.',
        variant: 'destructive',
      });
    }
  };



  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && !files.length ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No files uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="mr-4">
                    {getFileIcon(file.type, "h-8 w-8", false)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium truncate">{file.name}</h3>
                    <div className="flex text-xs text-muted-foreground mt-1 space-x-4">
                      <span>{formatFileSize(file.size)}</span>
                      {file.uploaded_at && (
                        <span>Uploaded {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDownload(file.id, file.name)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleUnlink(file.id)}
                    >
                      <Unlink className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Unlink from project</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => handleDelete(file.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-warning" 
                      onClick={() => handleUnlink(file.id)}
                    >
                      <Unlink className="h-4 w-4" />
                      <span className="sr-only">Unlink</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});