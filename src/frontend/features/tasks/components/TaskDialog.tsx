
import * as React from "react";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Label } from "@/frontend/components/ui/label";
import { Task } from "@/backend/types/supabaseSchema";
import { useToast } from "@/frontend/hooks/use-toast";
import { supabase } from "@/backend/api/client/supabase";
import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
}

interface TaskDialogProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

export function TaskDialog({ task, open, onOpenChange, onSave }: TaskDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<Task["status"]>(task?.status || "todo");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority || "medium");
  const [projectId, setProjectId] = useState(task?.project || "none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setStatus(task?.status || "todo");
      setPriority(task?.priority || "medium");
      setProjectId(task?.project || "none");
      fetchProjects();
    }
  }, [open, task]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found when fetching projects");
        setProjects([]);
        return;
      }
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user", user.id);
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const taskData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at"> = {
      title,
      description,
      status,
      priority,
      project: projectId === "none" ? null : projectId,
      due_date: undefined
    };

    onSave(taskData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {task ? "Update task details" : "Add a new task to your board"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="title" className="col-span-4">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-4"
                placeholder="Task title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="description" className="col-span-4">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-4"
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="status" className="col-span-4">
                Status
              </Label>
              <Select value={status} onValueChange={(value: Task["status"]) => setStatus(value)}>
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="priority" className="col-span-4">
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: Task["priority"]) => setPriority(value)}>
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="project" className="col-span-4">
                Project
              </Label>
              <Select value={projectId} onValueChange={(value) => setProjectId(value)}>
                <SelectTrigger className="col-span-4" disabled={loading}>
                  <SelectValue placeholder={loading ? "Loading projects..." : "Select project"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{task ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
