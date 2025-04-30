import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { File, Trash2, Download, Eye, FileText, FileImage, FileIcon } from "lucide-react";
import { useFiles } from "../hooks/useFiles";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { FilePreview } from "./FilePreview";
import { 
  Dialog,
  DialogContent
} from "@/frontend/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

interface FileListProps {
  project_id?: string;
  task_id?: string;
  event_id?: string;
  showPreview?: boolean;
  viewMode?: 'list' | 'grid';
  sortBy?: 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
  typeFilter?: 'all' | 'documents' | 'images' | 'pdf';
}

export function FileList({ 
  project_id, 
  task_id, 
  event_id, 
  showPreview = true,
  viewMode = 'list',
  sortBy = 'date-desc',
  typeFilter = 'all'
}: FileListProps) {
  const { 
    files, 
    loading, 
    error, 
    loadFiles, 
    deleteFile, 
    getDownloadUrl,
    canPreview
  } = useFiles({
    project_id,
    task_id,
    event_id,
    autoLoad: true
  });

  // Preview state
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    type: string;
    url: string;
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
    }
    return <File className="h-5 w-5 mr-2 text-gray-500" />;
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
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        case 'date-desc':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        // For size, we'd need to have file size in the metadata
        // For now, returning defaults
        default:
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });
  }, [filteredFiles, sortBy]);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const url = await getDownloadUrl(fileId);
      // Create a temporary anchor element for downloading
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = async (fileId: string, fileName: string, fileType: string) => {
    try {
      const url = await getDownloadUrl(fileId);
      setPreviewFile({
        id: fileId,
        name: fileName,
        type: fileType,
        url
      });
    } catch (error) {
      console.error('Error preparing preview:', error);
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
                        onClick={() => handlePreview(file.id, file.name, file.type)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.name)}
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
                    {file.created_at && formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
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
                onClose={() => setPreviewFile(null)}
                onDownload={() => handleDownload(previewFile.id, previewFile.name)}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Default list view
  return (
    <>
      {sortedFiles.length > 0 ? (
        <div className="space-y-1">
          <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Date</div>
          </div>
          {sortedFiles.map((file) => (
            <div key={file.id} className="grid grid-cols-12 items-center p-2 border rounded hover:bg-accent/5 transition-colors">
              <div className="col-span-5 flex items-center min-w-0">
                {getFileIcon(file.type)}
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
              <div className="col-span-3 text-sm text-muted-foreground">
                {file.type.split('/')[1]?.toUpperCase() || file.type}
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {/* TODO: Display file size when available in metadata */}
                ~
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {file.created_at && formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </div>
              <div className="col-span-12 md:col-span-12 flex justify-end space-x-1 mt-2 md:mt-0">
                {showPreview && canPreview(file.type) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(file.id, file.name, file.type)}
                    title="Preview file"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file.id, file.name)}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(file.id)}
                  title="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-8">
          No files uploaded yet
        </div>
      )}

      {/* File Preview Dialog */}
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
              onClose={() => setPreviewFile(null)}
              onDownload={() => handleDownload(previewFile.id, previewFile.name)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
