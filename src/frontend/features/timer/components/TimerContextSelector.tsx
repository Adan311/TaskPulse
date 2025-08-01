import React, { useState, useEffect } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/frontend/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/frontend/components/ui/sheet';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/frontend/components/ui/command';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/frontend/components/ui/popover';
import { 
  Clock, 
  CheckSquare, 
  Calendar, 
  Folder, 
  Search,
  X,
  Timer,
  Coffee,
  Users,
  ClipboardList,
  Play
} from 'lucide-react';
import { Task } from '@/backend/database/schema';
import { Project } from '@/backend/database/schema';
import { Event } from '@/frontend/types/calendar';
import { fetchTasks } from '@/backend/api/services/task.service';
import { fetchProjects } from '@/backend/api/services/project.service';
import { getEvents } from '@/backend/api/services/event.service';
import { cn } from '@/frontend/lib/utils';
import { Separator } from "@/frontend/components/ui/separator";

export type TimerContextType = 'none' | 'task' | 'event' | 'project' | 'custom';

export interface TimerContext {
  type: TimerContextType;
  id?: string;
  title: string;
  description?: string;
  sessionType: 'work' | 'break' | 'meeting' | 'planning';
}

interface TimerContextSelectorProps {
  context: TimerContext | null;
  onContextChange: (context: TimerContext | null) => void;
  className?: string;
  // Timer settings props
  focusDuration?: number; // in minutes
  shortBreak?: number;
  longBreak?: number;
  onSettingsChange?: (settings: { focusDuration: number; shortBreak: number; longBreak: number; sessionsBeforeLongBreak: number }) => void;
  onStartWithContext?: (context: TimerContext | null) => Promise<void>;
}

export const TimerContextSelector: React.FC<TimerContextSelectorProps> = ({
  context,
  onContextChange,
  className,
  // Timer settings props
  focusDuration,
  shortBreak,
  longBreak,
  onSettingsChange,
  onStartWithContext
}) => {
  const [open, setOpen] = useState(false);
  const [customDescription, setCustomDescription] = useState('');
  const [sessionType, setSessionType] = useState<'work' | 'break' | 'meeting' | 'planning'>('work');
  
  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when sheet opens
  useEffect(() => {
    if (open && !loading) {
      loadContextData();
    }
  }, [open]);

  // Update sessionType when context changes to sync the display
  useEffect(() => {
    if (context?.sessionType) {
      setSessionType(context.sessionType);
    }
  }, [context]);

  const loadContextData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, eventsData] = await Promise.all([
        fetchTasks(),
        fetchProjects(),
        getEvents()
      ]);
      
      // Filter for active/relevant items
      setTasks(tasksData.filter(task => !task.archived && task.status !== 'done'));
      setProjects(projectsData.filter(project => project.status === 'active'));
      
      // Filter events for today and upcoming
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowEnd = new Date(todayStart);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      
      setEvents(eventsData.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= todayStart && eventStart <= tomorrowEnd;
      }));
    } catch (error) {
      console.error('Error loading context data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextSelect = (type: TimerContextType, item?: Task | Project | Event) => {
    if (type === 'none') {
      onContextChange({
        type: 'none',
        title: 'Timer Session',
        sessionType
      });
    } else if (type === 'custom') {
      onContextChange({
        type: 'custom',
        title: customDescription || 'Custom Session',
        description: customDescription,
        sessionType
      });
    } else if (item) {
      let title = '';
      let description = '';
      
      if (type === 'task' && 'title' in item) {
        title = item.title;
        description = item.description || '';
      } else if (type === 'project' && 'name' in item) {
        title = item.name;
        description = item.description || '';
      } else if (type === 'event' && 'title' in item) {
        title = item.title;
        description = item.description || '';
      }

      onContextChange({
        type,
        id: item.id,
        title,
        description,
        sessionType: type === 'event' ? 'meeting' : sessionType
      });
    }
    setOpen(false);
  };

  const getContextIcon = (type: TimerContextType) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'event': return Calendar;
      case 'project': return Folder;
      case 'custom': return Clock;
      default: return Timer;
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return Timer;
      case 'break': return Coffee;
      case 'meeting': return Users;
      case 'planning': return ClipboardList;
      default: return Timer;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'work': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'break': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'planning': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">What are you working on?</Label>
        {context && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onContextChange(null)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {context ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
          {React.createElement(getContextIcon(context.type), { className: "h-4 w-4 text-muted-foreground" })}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{context.title}</span>
              <Badge 
                variant="secondary" 
                className={cn("text-xs flex items-center gap-1", getSessionTypeColor(context.sessionType))}
              >
                {React.createElement(getSessionTypeIcon(context.sessionType), { className: "h-3 w-3" })}
                {context.sessionType}
              </Badge>
            </div>
            {context.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {context.description}
              </p>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                Change
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Setup Your Focus Session</SheetTitle>
                <SheetDescription>
                  Choose what you'll work on and adjust your timer settings
                </SheetDescription>
              </SheetHeader>
              <ContextSelector 
                onSelect={handleContextSelect}
                tasks={tasks}
                projects={projects}
                events={events}
                loading={loading}
                customDescription={customDescription}
                setCustomDescription={setCustomDescription}
                sessionType={sessionType}
                setSessionType={setSessionType}
                // Timer settings props
                focusDuration={focusDuration}
                shortBreak={shortBreak}
                longBreak={longBreak}
                onSettingsChange={onSettingsChange}
                onStartWithContext={onStartWithContext}
                currentContext={context}
              />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Select what you're working on...
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Setup Your Focus Session</SheetTitle>
              <SheetDescription>
                Choose what you'll work on and adjust your timer settings
              </SheetDescription>
            </SheetHeader>
            <ContextSelector 
              onSelect={handleContextSelect}
              tasks={tasks}
              projects={projects}
              events={events}
              loading={loading}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
              sessionType={sessionType}
              setSessionType={setSessionType}
              // Timer settings props
              focusDuration={focusDuration}
              shortBreak={shortBreak}
              longBreak={longBreak}
              onSettingsChange={onSettingsChange}
              onStartWithContext={onStartWithContext}
              currentContext={context}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

interface ContextSelectorProps {
  onSelect: (type: TimerContextType, item?: Task | Project | Event) => void;
  tasks: Task[];
  projects: Project[];
  events: Event[];
  loading: boolean;
  customDescription: string;
  setCustomDescription: (desc: string) => void;
  sessionType: 'work' | 'break' | 'meeting' | 'planning';
  setSessionType: (type: 'work' | 'break' | 'meeting' | 'planning') => void;
  focusDuration?: number;
  shortBreak?: number;
  longBreak?: number;
  onSettingsChange?: (settings: { focusDuration: number; shortBreak: number; longBreak: number; sessionsBeforeLongBreak: number }) => void;
  onStartWithContext?: (context: TimerContext | null) => Promise<void>;
  currentContext?: TimerContext | null;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  onSelect,
  tasks,
  projects,
  events,
  loading,
  customDescription,
  setCustomDescription,
  sessionType,
  setSessionType,
  focusDuration,
  shortBreak,
  longBreak,
  onSettingsChange,
  onStartWithContext,
  currentContext
}) => {
  return (
    <div className="space-y-6 mt-6">
      {/* Session Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Session Type</Label>
        <Select value={sessionType} onValueChange={(value: any) => setSessionType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="work">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Work Session
              </div>
            </SelectItem>
            <SelectItem value="break">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Break
              </div>
            </SelectItem>
            <SelectItem value="meeting">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Meeting
              </div>
            </SelectItem>
            <SelectItem value="planning">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Planning
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Timer Settings */}
      {onSettingsChange && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Timer Settings</Label>
          
          {/* Focus Duration Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Focus Duration</Label>
            <div className="flex flex-wrap gap-2">
              {[5, 15, 25, 30, 45, 60].map((minutes) => (
                <Button
                  key={`focus-${minutes}`}
                  variant={focusDuration === minutes ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => onSettingsChange({
                    focusDuration: minutes,
                    shortBreak: shortBreak || 5,
                    longBreak: longBreak || 15,
                    sessionsBeforeLongBreak: 4
                  })}
                >
                  {minutes}m
                </Button>
              ))}
            </div>
          </div>

          {/* Break Duration Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Break Duration</Label>
            <div className="flex flex-wrap gap-2">
              {[3, 5, 10, 15, 20].map((minutes) => (
                <Button
                  key={`break-${minutes}`}
                  variant={shortBreak === minutes ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => onSettingsChange({
                    focusDuration: focusDuration || 25,
                    shortBreak: minutes,
                    longBreak: longBreak || 15,
                    sessionsBeforeLongBreak: 4
                  })}
                >
                  {minutes}m
                </Button>
              ))}
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            Current: {focusDuration || 25}m focus • {shortBreak || 5}m break • {longBreak || 15}m long break
          </div>

          <Separator />
        </div>
      )}

      {/* Quick Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Quick Start</Label>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start h-auto p-3"
            onClick={() => onSelect('none')}
          >
            <Timer className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">No Specific Context</div>
              <div className="text-xs text-muted-foreground">Just start a timer session</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Custom Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Custom Session</Label>
        <div className="space-y-2">
          <Input
            placeholder="What are you working on?"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSelect('custom')}
            disabled={!customDescription.trim()}
          >
            <Clock className="h-4 w-4 mr-2" />
            Start custom session
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Tasks</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tasks.slice(0, 5).map((task) => (
                  <Button
                    key={task.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onSelect('task', task)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Projects</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {projects.slice(0, 5).map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onSelect('project', project)}
                  >
                    <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Today's Events */}
          {events.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Today's Events</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {events.slice(0, 5).map((event) => (
                  <Button
                    key={event.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => onSelect('event', event)}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Start Focus Session Button */}
      {onStartWithContext && (
        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ready to Focus?</Label>
            {currentContext && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <strong>Context:</strong> {currentContext.title}
                <br />
                <strong>Session:</strong> {sessionType} • {focusDuration || 25}m focus
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={async () => {
                try {
                  await onStartWithContext(currentContext);
                } catch (error) {
                  console.error('Failed to start session:', error);
                }
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Focus Session
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 