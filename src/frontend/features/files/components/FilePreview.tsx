import { useState, useEffect } from "react";
import { canPreviewFile } from "@/backend/api/services/file.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Button } from "@/frontend/components/ui/button";
import { Download, X } from "lucide-react";
import { format } from 'date-fns';
import { formatFileSize } from "@/shared/utils/fileUtils";


interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedAt?: string;
  onClose: () => void;
  onDownload: () => void;
}



export function FilePreview({ fileUrl, fileName, fileType, fileSize, uploadedAt, onClose, onDownload }: FilePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'preview' | 'info'>('preview');
  
  // Check if this file type is previewable
  if (!canPreviewFile(fileType)) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6 border rounded-lg">
        <p>This file type cannot be previewed inline.</p>
        <div className="flex space-x-2">
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-muted">
        <h3 className="text-sm font-medium truncate flex-1" title={fileName}>
          {fileName}
        </h3>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={onDownload} title="Download file">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} title="Close preview">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'preview' | 'info')}>
        <TabsList className="w-full bg-background">
          <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          <TabsTrigger value="info" className="flex-1">File Info</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="relative min-h-[60vh] w-full overflow-auto">
          {fileType.startsWith('image/') && (
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-full object-contain mx-auto"
              style={{ maxHeight: "60vh" }}
            />
          )}
          
          {fileType === 'application/pdf' && (
            <iframe 
              src={`${fileUrl}#toolbar=0`} 
              title={fileName}
              className="w-full h-full min-h-[60vh]"
            />
          )}
          
          {fileType.startsWith('video/') && (
            <video 
              src={fileUrl} 
              controls 
              className="max-w-full mx-auto" 
              style={{ maxHeight: "60vh" }}
            >
              Your browser does not support video playback.
            </video>
          )}
          
          {fileType.startsWith('audio/') && (
            <div className="flex items-center justify-center h-full">
              <audio src={fileUrl} controls>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          
          {(fileType === 'text/plain' || fileType === 'text/csv') && (
            <TextFilePreview fileUrl={fileUrl} />
          )}
        </TabsContent>

        <TabsContent value="info" className="p-4">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="font-medium">Name:</dt>
            <dd>{fileName}</dd>
            
            <dt className="font-medium">Type:</dt>
            <dd>{fileType}</dd>
            
            <dt className="font-medium">Size:</dt>
            <dd>{formatFileSize(fileSize)}</dd>
            
            <dt className="font-medium">Uploaded At:</dt>
            <dd>{uploadedAt ? format(new Date(uploadedAt), 'PPpp') : '~'}</dd>
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TextFilePreview({ fileUrl }: { fileUrl: string }) {
  const [content, setContent] = useState<string>('Loading...');
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error("Error fetching text file:", error);
        setContent("Error loading file content.");
      }
    };
    
    fetchContent();
  }, [fileUrl]);
  
  return (
    <pre className="whitespace-pre-wrap p-4 text-sm overflow-auto max-h-[60vh]">
      {content}
    </pre>
  );
} 