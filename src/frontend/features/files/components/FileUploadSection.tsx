import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { useProjects } from "@/frontend/features/project/hooks/useProjects";
import { Label } from "@/frontend/components/ui/label";
import { Button } from "@/frontend/components/ui/button";
import { ArrowDownAZ, ArrowUpZA, Calendar, Grid, List, FileText, FileImage, FileIcon } from "lucide-react";
import { Separator } from "@/frontend/components/ui/separator";
import { Badge } from "@/frontend/components/ui/badge";

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
type ViewMode = 'list' | 'grid';
type FileTypeFilter = 'all' | 'documents' | 'images' | 'pdf';

export function FileUploadSection() {
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const { projects, loading: projectsLoading } = useProjects();
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all');

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId === "all" ? undefined : projectId);
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case 'name-asc': return <ArrowDownAZ className="h-4 w-4" />;
      case 'name-desc': return <ArrowUpZA className="h-4 w-4" />;
      case 'date-asc': return <Calendar className="h-4 w-4" />;
      case 'date-desc': return <Calendar className="h-4 w-4" />;
      default: return <ArrowDownAZ className="h-4 w-4" />;
    }
  };

  const getFileTypeFilterComponent = () => {
    switch (typeFilter) {
      case 'documents': return <FileText className="h-4 w-4 mr-2" />;
      case 'images': return <FileImage className="h-4 w-4 mr-2" />;
      case 'pdf': return <FileIcon className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center">
                <span className="flex-1">Filters</span>
                {typeFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs" 
                    onClick={() => setTypeFilter('all')}
                  >
                    Clear
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="project-select">Project</Label>
                  <Select onValueChange={handleProjectSelect} defaultValue="all">
                    <SelectTrigger id="project-select" className="focus:ring-0">
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

                <div>
                  <Label className="block mb-2">File Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={typeFilter === 'all' ? "default" : "outline"} 
                      size="sm" 
                      className="justify-start"
                      onClick={() => setTypeFilter('all')}
                    >
                      All Types
                    </Button>
                    <Button 
                      variant={typeFilter === 'documents' ? "default" : "outline"} 
                      size="sm" 
                      className="justify-start"
                      onClick={() => setTypeFilter('documents')}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" /> Docs
                    </Button>
                    <Button 
                      variant={typeFilter === 'images' ? "default" : "outline"} 
                      size="sm" 
                      className="justify-start"
                      onClick={() => setTypeFilter('images')}
                    >
                      <FileImage className="h-3.5 w-3.5 mr-1" /> Images
                    </Button>
                    <Button 
                      variant={typeFilter === 'pdf' ? "default" : "outline"} 
                      size="sm" 
                      className="justify-start"
                      onClick={() => setTypeFilter('pdf')}
                    >
                      <FileIcon className="h-3.5 w-3.5 mr-1" /> PDFs
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="block mb-2">Sort By</Label>
                  <Select onValueChange={(value) => setSortBy(value as SortOption)} defaultValue="date-desc">
                    <SelectTrigger className="w-full focus:ring-0">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="date-desc">Date (Newest)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                      <SelectItem value="size-desc">Size (Largest)</SelectItem>
                      <SelectItem value="size-asc">Size (Smallest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Separator className="my-4" />
                  <Label className="block mb-2">View Options</Label>
                  <div className="flex space-x-2">
                    <Button 
                      variant={viewMode === 'list' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4 mr-1" /> List
                    </Button>
                    <Button 
                      variant={viewMode === 'grid' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1"
                    >
                      <Grid className="h-4 w-4 mr-1" /> Grid
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center pb-2">
              <CardTitle className="text-lg font-medium">
                Your Files
                {typeFilter !== 'all' && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {getFileTypeFilterComponent()}
                    {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  </Badge>
                )}
              </CardTitle>
              
              <div className="ml-auto flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  disabled
                >
                  {getSortIcon()}
                  {sortBy.includes('name') ? 'Name' : sortBy.includes('date') ? 'Date' : 'Size'}
                  {sortBy.includes('asc') ? ' (Asc)' : ' (Desc)'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="files" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="files">All Files</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="files" className="focus:outline-none">
                  <FileList 
                    project_id={selectedProject} 
                    showPreview={true}
                    viewMode={viewMode}
                    sortBy={sortBy}
                    typeFilter={typeFilter}
                  />
                </TabsContent>
                
                <TabsContent value="upload" className="focus:outline-none">
                  <div className="space-y-4">
                    <FileUpload 
                      project_id={selectedProject}
                      onUploadComplete={() => {
                        const fileTabTrigger = document.querySelector('[value="files"][role="tab"]') as HTMLElement;
                        if (fileTabTrigger) {
                          fileTabTrigger.click();
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
