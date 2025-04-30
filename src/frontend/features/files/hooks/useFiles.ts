import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/frontend/hooks/use-toast";
import * as fileService from "@/backend/api/services/file.service";

export function useFiles(options?: {
  project_id?: string;
  task_id?: string;
  event_id?: string;
  autoLoad?: boolean;
}) {
  const [files, setFiles] = useState<fileService.FileItem[]>([]);
  const [loading, setLoading] = useState(options?.autoLoad !== false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch files based on options (project, task, event filtering)
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFiles = await fileService.fetchFiles({
        project_id: options?.project_id,
        task_id: options?.task_id,
        event_id: options?.event_id,
      });
      setFiles(fetchedFiles);
    } catch (err: any) {
      console.error("Error loading files:", err);
      setError(err);
      toast({
        title: "Error loading files",
        description: err.message || "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [options?.project_id, options?.task_id, options?.event_id, toast]);

  // Upload a file
  const uploadFile = useCallback(async (file: File, fileName?: string) => {
    try {
      setLoading(true);
      const uploadParams: fileService.FileUploadParams = {
        file,
        name: fileName,
        size: file.size,
        project_id: options?.project_id,
        task_id: options?.task_id,
        event_id: options?.event_id,
      };
      
      const uploadedFile = await fileService.uploadFile(uploadParams);
      setFiles(prevFiles => [uploadedFile, ...prevFiles]);
      
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
      
      return uploadedFile;
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload your file. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options?.project_id, options?.task_id, options?.event_id, toast]);

  // Delete a file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      await fileService.deleteFile(fileId);
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error deleting file:", err);
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get file download URL
  const getDownloadUrl = useCallback(async (fileId: string) => {
    try {
      return await fileService.getFileDownloadUrl(fileId);
    } catch (err: any) {
      console.error("Error getting download URL:", err);
      toast({
        title: "Error",
        description: "Could not generate download link. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Attach file to project/task/event
  const attachFile = useCallback(async (fileId: string, entityType: 'project' | 'task' | 'event', entityId: string) => {
    try {
      setLoading(true);
      const updatedFile = await fileService.attachFile(fileId, entityType, entityId);
      
      setFiles(prevFiles => 
        prevFiles.map(file => file.id === fileId ? updatedFile : file)
      );
      
      toast({
        title: "File attached",
        description: `File successfully attached to ${entityType}.`,
      });
      
      return updatedFile;
    } catch (err: any) {
      console.error(`Error attaching file to ${entityType}:`, err);
      toast({
        title: "Operation failed",
        description: err.message || `Failed to attach file to ${entityType}.`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Detach file from project/task/event
  const detachFile = useCallback(async (fileId: string, entityType: 'project' | 'task' | 'event') => {
    try {
      setLoading(true);
      const updatedFile = await fileService.detachFile(fileId, entityType);
      
      setFiles(prevFiles => 
        prevFiles.map(file => file.id === fileId ? updatedFile : file)
      );
      
      toast({
        title: "File detached",
        description: `File successfully detached from ${entityType}.`,
      });
      
      return updatedFile;
    } catch (err: any) {
      console.error(`Error detaching file from ${entityType}:`, err);
      toast({
        title: "Operation failed",
        description: err.message || `Failed to detach file from ${entityType}.`,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Check if a file can be previewed
  const canPreview = useCallback((fileType: string) => {
    return fileService.canPreviewFile(fileType);
  }, []);

  // Initial load
  useEffect(() => {
    if (options?.autoLoad !== false) {
      loadFiles();
    }
  }, [loadFiles, options?.autoLoad]);

  return {
    files,
    loading,
    error,
    loadFiles,
    uploadFile,
    deleteFile,
    getDownloadUrl,
    attachFile,
    detachFile,
    canPreview,
  };
} 