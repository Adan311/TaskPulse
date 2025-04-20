
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { Label } from '@/frontend/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '@/backend/api/services/project.service';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadSection() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">File Manager</h2>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Upload and manage your documents, images and other files.
            <br />
            Allowed file types: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX
            <br />
            Maximum file size: 10 MB
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Link to Project (Optional)</Label>
              <Select 
                onValueChange={(value) => setSelectedProject(value)} 
                value={selectedProject || ""}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FileUpload 
              allowedTypes={ALLOWED_FILE_TYPES}
              maxFileSize={MAX_FILE_SIZE}
              relatedId={selectedProject || undefined}
              relatedType={selectedProject ? "project" : undefined}
              onUploadComplete={() => setFileUploaded(true)}
            />
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="text-sm font-medium mb-3">Supported File Types</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">PDF</span>
                <span>Documents</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">JPG/PNG</span>
                <span>Images</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">DOC/DOCX</span>
                <span>Word</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">XLS/XLSX</span>
                <span>Excel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-medium mb-4">Your Files</h3>
        <FileList 
          relatedId={selectedProject || undefined} 
          relatedType={selectedProject ? "project" : undefined} 
          key={fileUploaded ? "updated" : "initial"} 
        />
      </div>
    </motion.div>
  );
}
