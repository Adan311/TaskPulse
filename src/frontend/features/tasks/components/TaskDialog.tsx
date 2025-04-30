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
import { Task } from "@/backend/api/services/task.service";
import { useToast } from "@/frontend/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { FileUpload } from "@/frontend/features/files/components/FileUpload";
import { FileList } from "@/frontend/features/files/components/FileList";
import { Calendar } from '@/frontend/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/frontend/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface TaskDialogProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, "id" | "user">) => void;
}

export function TaskDialog({ task, open, onOpenChange, onSave }: TaskDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<Task["status"]>(task?.status || "todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    (task?.priority as "low" | "medium" | "high") || "medium"
  );
  const [projectId, setProjectId] = useState(task?.project || "none");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date) : undefined);
  const [labels, setLabels] = useState<string[]>(task?.labels || []);
  const [labelInput, setLabelInput] = useState("");

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
      setProjects(data as Project[] || []);
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

    const taskData = {
      title,
      description,
      status,
      priority,
      project: projectId === "none" ? null : projectId,
      due_date: dueDate ? dueDate.toISOString() : undefined,
      labels,
    };

    onSave(taskData);
    onOpenChange(false);
  };

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()]);
      setLabelInput("");
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
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
              <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
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
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="due_date" className="col-span-4">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`col-span-4 w-full justify-start text-left font-normal ${!dueDate ? 'text-muted-foreground' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? dueDate.toLocaleDateString() : 'Pick due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-2 mt-2">
              <Label htmlFor="labels" className="col-span-4">Labels/Tags</Label>
              <div className="col-span-4 flex flex-wrap gap-2 mb-2">
                {labels.map(label => (
                  <span key={label} className="inline-flex items-center bg-muted px-2 py-1 rounded text-xs">
                    {label}
                    <button type="button" className="ml-1 text-destructive" onClick={() => handleRemoveLabel(label)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="col-span-3">
                <Input
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  placeholder="Add label"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLabel(); } }}
                />
              </div>
              <div className="col-span-1">
                <Button type="button" onClick={handleAddLabel} className="w-full">Add</Button>
              </div>
            </div>
          </div>
          {task && (
            <div className="space-y-4 mt-4">
              <Label>Files</Label>
              <FileUpload
                task_id={task.id}
                onUploadComplete={() => {
                  toast({
                    title: "File uploaded",
                    description: "The file has been attached to this task",
                  });
                }}
              />
              <FileList task_id={task.id} />
            </div>
          )}
          <DialogFooter>
            <Button type="submit">{task ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
