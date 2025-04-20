
import { useState, useEffect } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { File, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/frontend/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  file: string;
  type: string;
  created_at?: string;
}

interface FileListProps {
  relatedId?: string;
  relatedType?: 'task' | 'event' | 'project';
}

export function FileList({ relatedId, relatedType }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [relatedId, relatedType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      let query = supabase
        .from('files')
        .select('*')
        .eq('user', user.id);

      if (relatedId && relatedType) {
        query = query.eq(relatedType, relatedId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(files.filter(f => f.id !== fileId));
      
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading files...</div>;
  }

  return (
    <div className="space-y-2">
      {files.length > 0 ? (
        files.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center">
              <File className="h-4 w-4 mr-2" />
              <a
                href={supabase.storage.from('files').getPublicUrl(file.file).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {file.name}
              </a>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(file.id, file.file)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet
        </div>
      )}
    </div>
  );
}
