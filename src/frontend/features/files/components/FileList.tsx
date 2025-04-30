import { useEffect, useState } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { File, Trash2, Download, Eye } from "lucide-react";
import { useFiles } from "../hooks/useFiles";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { FilePreview } from "./FilePreview";
import { 
  Dialog,
  DialogContent
} from "@/frontend/components/ui/dialog";

interface FileListProps {
  project_id?: string;
  task_id?: string;
  event_id?: string;
  showPreview?: boolean;
}

export function FileList({ project_id, task_id, event_id, showPreview = true }: FileListProps) {
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

  return (
    <>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center overflow-hidden">
                <File className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
              <div className="flex space-x-1">
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
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No files uploaded yet
          </div>
        )}
      </div>

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
