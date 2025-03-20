
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderPlus, Trash2, Edit, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  createdAt: Date;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Website Redesign",
      description: "Redesign the company website with a modern UI and improved UX.",
      status: "active",
      createdAt: new Date(2023, 5, 12)
    },
    {
      id: "2",
      title: "Mobile App Development",
      description: "Create a mobile app for both iOS and Android platforms.",
      status: "on-hold",
      createdAt: new Date(2023, 7, 24)
    },
    {
      id: "3",
      title: "Brand Identity Update",
      description: "Update the company brand identity including logo and style guide.",
      status: "completed",
      createdAt: new Date(2023, 3, 8)
    }
  ]);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    status: "active" as const
  });

  const handleCreateProject = () => {
    const project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      status: newProject.status,
      createdAt: new Date()
    };
    setProjects([...projects, project]);
    setNewProject({
      title: "",
      description: "",
      status: "active" as const
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-500 hover:bg-green-600";
      case "completed": return "bg-blue-500 hover:bg-blue-600";
      case "on-hold": return "bg-amber-500 hover:bg-amber-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new project</DialogTitle>
                <DialogDescription>
                  Add a new project to your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    placeholder="Enter project title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Enter project description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{project.title}</CardTitle>
                  <Badge 
                    className={getStatusColor(project.status)}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  Created on {project.createdAt.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          <Card className="border-dashed flex flex-col items-center justify-center h-[300px] bg-muted/40">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-full w-full flex flex-col gap-4">
                  <FolderPlus className="h-12 w-12 text-muted-foreground" />
                  <span className="text-muted-foreground">Add New Project</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new project</DialogTitle>
                  <DialogDescription>
                    Add a new project to your workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title-2">Title</Label>
                    <Input 
                      id="title-2" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      placeholder="Enter project title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description-2">Description</Label>
                    <Textarea 
                      id="description-2" 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Enter project description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
