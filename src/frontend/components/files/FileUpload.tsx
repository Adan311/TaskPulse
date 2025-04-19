
import { useState, useCallback } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/backend/api/client/supabase";
import { useToast } from "@/frontend/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
  relatedId?: string;  // Can be task_id, event_id, or project_id
  relatedType?: 'task' | 'event' | 'project';
}

export function FileUpload({ onUploadComplete, relatedId, relatedType }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      setUploading(true);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files",
          variant: "destructive",
        });
        return;
      }

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Generate a unique ID for the file record
      const fileId = uuidv4();

      // Create a record in the files table
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,  // Add the required id field
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

      // Get the public URL
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
  }, [onUploadComplete, relatedId, relatedType, toast]);

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
      />
    </div>
  );
}
