import { useState, useCallback } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { Upload } from "lucide-react";
import { useFiles } from "../hooks/useFiles";
import { useToast } from "@/frontend/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
  project_id?: string;
  task_id?: string;
  event_id?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
}

export function FileUpload({ 
  onUploadComplete, 
  project_id, 
  task_id, 
  event_id, 
  allowedTypes,
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { uploadFile, getDownloadUrl } = useFiles({
    project_id,
    task_id,
    event_id,
    autoLoad: false // Don't load files automatically, we just need the upload function
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // File type validation
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `Allowed file types are: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // File size validation
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `Maximum file size is ${maxFileSize / (1024 * 1024)} MB`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      // Upload using our hook
      const uploadedFile = await uploadFile(file);
      
      // Get download URL for the uploaded file
      const downloadUrl = await getDownloadUrl(uploadedFile.id);

      if (onUploadComplete) {
        onUploadComplete(downloadUrl, file.name);
      }

      // Reset the input value to allow re-uploading the same file
      if (event.target.form) {
        event.target.form.reset();
      } else {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Error is already handled in the hook with toast
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete, toast, uploadFile, getDownloadUrl, allowedTypes, maxFileSize]);

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        disabled={uploading}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
      <input
        type="file"
        id="fileInput"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
        accept={allowedTypes?.join(',')}
      />
    </div>
  );
}
