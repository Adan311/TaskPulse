import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { File, Trash2, Download, Eye, FileText, FileImage, FileIcon, FolderPlus } from "lucide-react";
import { useFiles } from "../hooks/useFiles";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { FilePreview } from "./FilePreview";
import { 
  Dialog,
  DialogContent
} from "@/frontend/components/ui/dialog";
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from "@/backend/database/client";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/frontend/components/ui/dropdown-menu";
import { useProjects } from "@/frontend/features/project/hooks/useProjects";
import { formatFileSize } from "@/shared/utils/fileUtils";


interface FileListProps {
  project_id?: string;
  task_id?: string;
  event_id?: string;
  showPreview?: boolean;
  viewMode?: 'list' | 'grid';
  sortBy?: 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
  typeFilter?: 'all' | 'documents' | 'images' | 'pdf';
  hideProjectActions?: boolean;
}

export function FileList({ 
  project_id, 
  task_id, 
  event_id, 
  showPreview = true,
  viewMode = 'list',
  sortBy = 'date-desc',
  typeFilter = 'all',
  hideProjectActions = false
}: FileListProps) {
  const { 
    files, 
    loading, 
    error, 
    loadFiles, 
    deleteFile, 
    getDownloadUrl,
    canPreview,
    attachFile
  } = useFiles({
    project_id,
    task_id,
    event_id,
    autoLoad: true
  });

  // For project selection
  const { projects, loading: projectsLoading } = useProjects();

  // Preview state
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    uploadedAt?: string;
  } | null>(null);

  // Reload files if related props change
  useEffect(() => {
    loadFiles();
  }, [project_id, task_id, event_id, loadFiles]);

  // File Icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 mr-2 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileIcon className="h-5 w-5 mr-2 text-red-500" />;
    } else if (
      fileType === 'text/plain' || 
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <FileText className="h-5 w-5 mr-2 text-green-500" />;
    } else {
      return <File className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };





  // Filter files based on type
  const filteredFiles = useMemo(() => {
    if (typeFilter === 'all') return files;
    
    return files.filter(file => {
      switch (typeFilter) {
        case 'images':
          return file.type.startsWith('image/');
        case 'pdf':
          return file.type === 'application/pdf';
        case 'documents':
          return (
            file.type === 'text/plain' || 
            file.type === 'application/msword' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
        default:
          return true;
      }
    });
  }, [files, typeFilter]);



  // Sort files
  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.uploaded_at || '').getTime() - new Date(b.uploaded_at || '').getTime();
        case 'date-desc':
          return new Date(b.uploaded_at || '').getTime() - new Date(a.uploaded_at || '').getTime();
        case 'size-asc':
          return (a.size || 0) - (b.size || 0);
        case 'size-desc':
          return (b.size || 0) - (a.size || 0);
        default:
          return new Date(b.uploaded_at || '').getTime() - new Date(a.uploaded_at || '').getTime();
      }
    });
  }, [filteredFiles, sortBy]);

  // Determine if a file can be previewed
  const canPreviewFile = (fileType: string) => {
    return canPreview(fileType);
  };

  // Open file preview
  const openPreview = async (file: any) => {
    try {
      const url = await getDownloadUrl(file.id);
      setPreviewFile({
        id: file.id,
        name: file.name,
        type: file.type,
        url,
        size: file.size,
        uploadedAt: file.uploaded_at
      });
    } catch (error) {
      console.error("Error getting file URL for preview:", error);
    }
  };

  // Handle download
  const handleDownload = async (file: any) => {
    try {
      const url = await getDownloadUrl(file.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Handle adding file to project
  const handleAddToProject = async (fileId: string, projectId: string) => {
    try {
      await attachFile(fileId, 'project', projectId);
      loadFiles(); // Refresh files list after attachment
    } catch (error) {
      console.error("Error attaching file to project:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
        Error loading files. Please try again.
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <>
        {sortedFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg overflow-hidden flex flex-col h-[220px]">
                <div className="p-3 bg-muted h-[160px] flex items-center justify-center overflow-hidden relative group">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={supabase.storage.from('files').getPublicUrl(file.file).data.publicUrl}
                      alt={file.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        if (img.nextElementSibling) (img.nextElementSibling as HTMLElement).style.display = 'block';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {getFileIcon(file.type)}
                      <div className="text-sm mt-2">{file.name.split('.').pop()?.toUpperCase()}</div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {showPreview && canPreview(file.type) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPreview(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(file.size)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {file.uploaded_at ? format(new Date(file.uploaded_at), 'PPpp') : '~'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            No files uploaded yet
          </div>
        )}

        <Dialog 
          open={previewFile !== null} 
          onOpenChange={(open) => !open && setPreviewFile(null)}
        >
          <DialogContent className="max-w-4xl w-[90vw]">
            {previewFile && (
              <FilePreview
                fileUrl={previewFile.url}
                fileName={previewFile.name}
                fileType={previewFile.type}
                fileSize={previewFile.size}
                uploadedAt={previewFile.uploadedAt}
                onClose={() => setPreviewFile(null)}
                onDownload={() => handleDownload(previewFile)}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Default list view
  return (
    <div>
      {sortedFiles.length > 0 ? (
        <div className="space-y-2">
          {sortedFiles.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-3">
                {getFileIcon(file.type)}
              </div>
              <div className="truncate">
                <h3 className="font-medium truncate">{file.name}</h3>
                <div className="flex text-xs text-muted-foreground">
                  <span className="mr-2">{formatFileSize(file.size)}</span>
                  {file.uploaded_at && (
                    <span>{formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Project association indicator */}
              {file.project && (
                <span className="text-xs bg-primary/20 text-primary rounded px-2 py-0.5 mr-2">
                  Project
                </span>
              )}
              
              {canPreviewFile(file.type) && showPreview && (
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openPreview(file)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Preview</span>
                </Button>
              )}
              
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleDownload(file)}>
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
              
              {!hideProjectActions && !file.project && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <FolderPlus className="h-4 w-4" />
                      <span className="sr-only">Add to project</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {projectsLoading ? (
                      <div className="px-2 py-1.5 text-sm">Loading projects...</div>
                    ) : projects.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm">No projects available</div>
                    ) : (
                      projects.map(project => (
                        <DropdownMenuItem 
                          key={project.id} 
                          onClick={() => handleAddToProject(file.id, project.id)}
                        >
                          {project.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => deleteFile(file.id)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-8">
          No files found
        </div>
      )}
      
      {/* Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <FilePreview 
              fileUrl={previewFile.url}
              fileName={previewFile.name}
              fileType={previewFile.type}
              fileSize={previewFile.size}
              uploadedAt={previewFile.uploadedAt}
              onClose={() => setPreviewFile(null)}
              onDownload={() => handleDownload(previewFile)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
