import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { useProjects } from "@/frontend/features/project/hooks/useProjects";
import { Label } from "@/frontend/components/ui/label";

export function FileUploadSection() {
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const { projects, loading: projectsLoading } = useProjects();

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId === "all" ? undefined : projectId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-select">Project</Label>
                  <Select onValueChange={handleProjectSelect} defaultValue="all">
                    <SelectTrigger id="project-select">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {!projectsLoading && projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="files" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="files">All Files</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="files" className="focus:outline-none">
                  <FileList project_id={selectedProject} showPreview={true} />
                </TabsContent>
                
                <TabsContent value="upload" className="focus:outline-none">
                  <div className="space-y-4">
                    <FileUpload 
                      project_id={selectedProject}
                      onUploadComplete={() => {
                        const tabsElement = document.querySelector('[data-state="active"][role="tab"][aria-selected="true"]') as HTMLElement;
                        if (tabsElement) {
                          const fileTabTrigger = document.querySelector('[value="files"][role="tab"]') as HTMLElement;
                          if (fileTabTrigger) {
                            fileTabTrigger.click();
                          }
                        }
                      }}
                    />
                    <div className="text-sm text-muted-foreground">
                      Upload files up to 10MB. Supported formats include documents, images, PDFs, and more.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
