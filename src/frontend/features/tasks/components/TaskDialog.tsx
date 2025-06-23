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
import { Task } from '@/backend/database/schema';
import { useToast } from "@/frontend/hooks/use-toast";
import { useState, useEffect } from "react";
import { Calendar } from '@/frontend/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/frontend/components/ui/popover';
import { CalendarIcon, X, Bell, Repeat } from 'lucide-react';
import { format, parseISO, addMinutes, addHours, addDays } from "date-fns";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group";
import * as projectService from '@/backend/api/services/project.service';

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

// Reminder options for tasks
const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "at_time", label: "At due date/time" },
  { value: "5_min", label: "5 minutes before" },
  { value: "15_min", label: "15 minutes before" },
  { value: "30_min", label: "30 minutes before" },
  { value: "1_hour", label: "1 hour before" },
  { value: "2_hour", label: "2 hours before" },
  { value: "1_day", label: "1 day before" }
];

// Recurrence patterns
const RECURRENCE_PATTERNS = [
  { value: "none", label: "Not recurring" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

// Days of the week for weekly recurrence
const DAYS_OF_WEEK = [
  { value: "Sunday", label: "Sunday" },
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" }
];

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
  const [reminderAt, setReminderAt] = useState<string | null>(task?.reminder_at || null);
  const [reminderOption, setReminderOption] = useState<string>("none");
  
  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState<string>(task?.recurrence_pattern || "none");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(task?.recurrence_days || []);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task?.recurrence_end_date ? new Date(task.recurrence_end_date) : undefined);
  const [recurrenceCount, setRecurrenceCount] = useState<number | undefined>(task?.recurrence_count || undefined);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'on_date' | 'after_occurrences'>(
    task?.recurrence_end_date ? 'on_date' : (task?.recurrence_count ? 'after_occurrences' : 'never')
  );
  const [recurrenceMode, setRecurrenceMode] = useState<'clone' | 'refresh'>(
    task?.recurrence_mode || 'clone'
  );

  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setStatus(task?.status || "todo");
      setPriority(task?.priority || "medium");
      setProjectId(task?.project || "none");
      setDueDate(task?.due_date ? new Date(task.due_date) : undefined);
      setLabels(task?.labels || []);
      setReminderAt(task?.reminder_at || null);
      setReminderOption(task?.reminder_at ? getInitialReminderOption() : "none");
      
      // Set recurrence states
      setIsRecurring(task?.is_recurring || false);
      setRecurrencePattern(task?.recurrence_pattern || "none");
      setRecurrenceDays(task?.recurrence_days || []);
      setRecurrenceEndDate(task?.recurrence_end_date ? new Date(task.recurrence_end_date) : undefined);
      setRecurrenceCount(task?.recurrence_count || undefined);
      setRecurrenceEndType(
        task?.recurrence_end_date ? 'on_date' : (task?.recurrence_count ? 'after_occurrences' : 'never')
      );
      setRecurrenceMode(task?.recurrence_mode || 'clone');
      
      fetchProjects();
    }
  }, [open, task]);

  const getInitialReminderOption = () => {
    if (!task?.reminder_at || !task.due_date) return "none";
    
    const reminderTime = new Date(task.reminder_at);
    const dueTime = new Date(task.due_date);
    const diffMinutes = Math.round((dueTime.getTime() - reminderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return "at_time";
    if (diffMinutes === 5) return "5_min";
    if (diffMinutes === 15) return "15_min";
    if (diffMinutes === 30) return "30_min";
    if (diffMinutes === 60) return "1_hour";
    if (diffMinutes === 120) return "2_hour";
    if (diffMinutes === 1440) return "1_day";
    
    return "1_hour"; // Default fallback
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Use backend service instead of direct database access
      const projectsData = await projectService.fetchProjects();
      setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
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

  // Calculate reminder time based on due date and selected option
  const calculateReminderTime = (option: string): string | null => {
    if (!dueDate || option === "none") return null;
    
    let reminderDate = new Date(dueDate);
    
    switch (option) {
      case "at_time":
        return reminderDate.toISOString();
      case "5_min":
        return addMinutes(reminderDate, -5).toISOString();
      case "15_min":
        return addMinutes(reminderDate, -15).toISOString();
      case "30_min":
        return addMinutes(reminderDate, -30).toISOString();
      case "1_hour":
        return addHours(reminderDate, -1).toISOString();
      case "2_hour":
        return addHours(reminderDate, -2).toISOString();
      case "1_day":
        return addDays(reminderDate, -1).toISOString();
      default:
        return null;
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

    if (isRecurring && !dueDate) {
      toast({
        title: "Error",
        description: "Due date is required for recurring tasks",
        variant: "destructive",
      });
      return;
    }

    // Calculate the reminder time if needed
    const calculatedReminderAt = reminderOption !== "none" && dueDate 
      ? calculateReminderTime(reminderOption)
      : null;

    // Prepare recurrence data
    let recurrenceData = {};
    
    if (isRecurring) {
      recurrenceData = {
        is_recurring: true,
        recurrence_pattern: recurrencePattern,
        recurrence_days: recurrencePattern === "weekly" ? recurrenceDays : null,
        recurrence_end_date: recurrenceEndType === 'on_date' && recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
        recurrence_count: recurrenceEndType === 'after_occurrences' ? recurrenceCount : null,
        recurrence_mode: recurrenceMode
      };
    } else {
      recurrenceData = {
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_days: null,
        recurrence_end_date: null,
        recurrence_count: null,
        recurrence_mode: null
      };
    }

    const taskData = {
      title,
      description,
      status,
      priority,
      project: projectId === "none" ? null : projectId,
      due_date: dueDate ? dueDate.toISOString() : null,
      labels,
      reminder_at: calculatedReminderAt,
      ...recurrenceData
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

  const handleDayToggle = (day: string) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter(d => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status || "todo"}
                  onValueChange={(value) => setStatus(value as Task["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
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
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="labels">Labels</Label>
              <div className="flex mt-1">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Add label"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddLabel}
                  className="ml-2"
                  disabled={!labelInput.trim()}
                >
                  Add
                </Button>
              </div>
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {labels.map((label) => (
                    <div
                      key={label}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center text-sm"
                    >
                      {label}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveLabel(label)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="reminder">Reminder</Label>
              <Select value={reminderOption} onValueChange={setReminderOption}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Set a reminder" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {option.value !== "none" && <Bell className="w-4 h-4 mr-2" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reminderOption !== "none" && !dueDate && (
                <p className="text-sm text-orange-500 mt-1">
                  Please set a due date to enable reminders
                </p>
              )}
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="recurrence">
                <AccordionTrigger className="py-2">
                  <div className="flex items-center">
                    <Repeat className="w-4 h-4 mr-2" />
                    <span>Recurrence</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isRecurring}
                        onCheckedChange={(checked) => setIsRecurring(!!checked)}
                        id="recurring"
                      />
                      <Label htmlFor="recurring">Make this task recurring</Label>
                    </div>
                    
                    {isRecurring && (
                      <>
                        <div className="space-y-2">
                          <Label>Recurrence Pattern</Label>
                          <Select
                            value={recurrencePattern}
                            onValueChange={setRecurrencePattern}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              {RECURRENCE_PATTERNS.slice(1).map(pattern => (
                                <SelectItem key={pattern.value} value={pattern.value}>
                                  {pattern.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {recurrencePattern === "weekly" && (
                          <div className="space-y-2">
                            <Label>Repeat on</Label>
                            <div className="grid grid-cols-7 gap-2">
                              {DAYS_OF_WEEK.map(day => (
                                <div key={day.value} className="flex flex-col items-center">
                                  <Checkbox
                                    checked={recurrenceDays.includes(day.value)}
                                    onCheckedChange={() => handleDayToggle(day.value)}
                                    id={`day-${day.value}`}
                                  />
                                  <Label htmlFor={`day-${day.value}`} className="text-xs mt-1">
                                    {day.label.substring(0, 1)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>End</Label>
                          <RadioGroup value={recurrenceEndType} onValueChange={(value) => setRecurrenceEndType(value as any)}>
                            <div className="flex items-center space-x-2 py-1">
                              <RadioGroupItem value="never" id="recurrence-end-never" />
                              <Label htmlFor="recurrence-end-never">Never</Label>
                            </div>
                            <div className="flex items-center space-x-2 py-1">
                              <RadioGroupItem value="on_date" id="recurrence-end-date" />
                              <Label htmlFor="recurrence-end-date">On date</Label>
                              {recurrenceEndType === 'on_date' && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="ml-2 h-8"
                                    >
                                      {recurrenceEndDate ? format(recurrenceEndDate, "PP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={recurrenceEndDate}
                                      onSelect={setRecurrenceEndDate}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 py-1">
                              <RadioGroupItem value="after_occurrences" id="recurrence-end-occurrences" />
                              <Label htmlFor="recurrence-end-occurrences">After</Label>
                              {recurrenceEndType === 'after_occurrences' && (
                                <div className="flex items-center ml-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    className="w-16 h-8"
                                    value={recurrenceCount || ""}
                                    onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || undefined)}
                                  />
                                  <span className="ml-2">occurrences</span>
                                </div>
                              )}
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Recurrence Mode</Label>
                          <Select
                            value={recurrenceMode}
                            onValueChange={(value) => setRecurrenceMode(value as 'clone' | 'refresh')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clone">Create new tasks</SelectItem>
                              <SelectItem value="refresh">Refresh this task</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            {recurrenceMode === 'clone' 
                              ? "New tasks will be created for each recurrence."
                              : "This task will be reset to 'To Do' for each recurrence."}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
