
import { useState, useCallback } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
  relatedId?: string;
  relatedType?: 'task' | 'event' | 'project';
  allowedTypes?: string[];
  maxFileSize?: number;
}

export function FileUpload({ 
  onUploadComplete, 
  relatedId, 
  relatedType, 
  allowedTypes,
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const fileId = uuidv4();

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: file.name,
          file: filePath,
          user: user.id,
          type: file.type,
          ...(relatedId && relatedType && {
            [relatedType]: relatedId
          })
        });

      if (dbError) {
        throw dbError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      if (onUploadComplete) {
        onUploadComplete(publicUrl, file.name);
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });

      // Reset the input value to allow re-uploading the same file
      if (event.target.form) {
        event.target.form.reset();
      } else {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete, relatedId, relatedType, toast, allowedTypes, maxFileSize]);

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
