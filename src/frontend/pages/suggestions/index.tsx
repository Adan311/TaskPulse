import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { Button } from '@/frontend/components/ui/button';
import { Check, X, CalendarIcon, CheckSquareIcon, LucideIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/frontend/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/frontend/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  getTaskSuggestions, 
  getEventSuggestions, 
  updateTaskSuggestionStatus, 
  updateEventSuggestionStatus,
  TaskSuggestion,
  EventSuggestion
} from '@/backend/api/services/ai/suggestionService';

// Task service imports for accepting suggestions
import { createTask } from '@/backend/api/services/task.service';
import { createEvent } from '@/backend/api/services/eventService';

const SuggestionsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [eventSuggestions, setEventSuggestions] = useState<EventSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Get the current user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ id: data.user.id });
        loadSuggestions(data.user.id);
      } else {
        setLoading(false);
      }
    };
    
    getUser();
  }, []);

  const loadSuggestions = async (userId: string) => {
    setLoading(true);
    try {
      const tasks = await getTaskSuggestions(userId);
      const events = await getEventSuggestions(userId);
      
      setTaskSuggestions(tasks);
      setEventSuggestions(events);
      
      // Set the initial tab to the one with suggestions, or default to tasks
      if (tasks.length === 0 && events.length > 0) {
        setActiveTab('events');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (suggestion: TaskSuggestion) => {
    if (!user) return;
    
    // Mark as processing
    setProcessing(prev => ({ ...prev, [suggestion.id]: true }));
    
    try {
      // Create the actual task with the right parameters
      // String type for due_date in task service
      await createTask({
        title: suggestion.title,
        description: suggestion.description || undefined,
        due_date: suggestion.dueDate || undefined, // Keep as string
        priority: suggestion.priority || undefined,
        status: 'todo',
      });
      
      // Update suggestion status
      await updateTaskSuggestionStatus(user.id, suggestion.id, 'accepted');
      
      // Update the UI
      setTaskSuggestions(prev => prev.filter(item => item.id !== suggestion.id));
      
      toast({
        title: 'Task Created',
        description: 'The task has been added to your task list.',
      });
    } catch (error) {
      console.error('Error accepting task suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove processing state
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[suggestion.id];
        return newState;
      });
    }
  };

  const handleAcceptEvent = async (suggestion: EventSuggestion) => {
    if (!user) return;
    
    // Mark as processing
    setProcessing(prev => ({ ...prev, [suggestion.id]: true }));
    
    try {
      // Create the actual event with required properties
      await createEvent({
        title: suggestion.title,
        description: suggestion.description || undefined,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        source: 'app',
        participants: [], // Required by the Event type
      });
      
      // Update suggestion status
      await updateEventSuggestionStatus(user.id, suggestion.id, 'accepted');
      
      // Update the UI
      setEventSuggestions(prev => prev.filter(item => item.id !== suggestion.id));
      
      toast({
        title: 'Event Created',
        description: 'The event has been added to your calendar.',
      });
    } catch (error) {
      console.error('Error accepting event suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove processing state
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[suggestion.id];
        return newState;
      });
    }
  };

  const handleRejectTask = async (suggestion: TaskSuggestion) => {
    if (!user) return;
    
    // Mark as processing
    setProcessing(prev => ({ ...prev, [suggestion.id]: true }));
    
    try {
      // Update suggestion status
      await updateTaskSuggestionStatus(user.id, suggestion.id, 'rejected');
      
      // Update the UI
      setTaskSuggestions(prev => prev.filter(item => item.id !== suggestion.id));
      
      toast({
        title: 'Suggestion Rejected',
        description: 'The task suggestion has been removed.',
      });
    } catch (error) {
      console.error('Error rejecting task suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove processing state
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[suggestion.id];
        return newState;
      });
    }
  };

  const handleRejectEvent = async (suggestion: EventSuggestion) => {
    if (!user) return;
    
    // Mark as processing
    setProcessing(prev => ({ ...prev, [suggestion.id]: true }));
    
    try {
      // Update suggestion status
      await updateEventSuggestionStatus(user.id, suggestion.id, 'rejected');
      
      // Update the UI
      setEventSuggestions(prev => prev.filter(item => item.id !== suggestion.id));
      
      toast({
        title: 'Suggestion Rejected',
        description: 'The event suggestion has been removed.',
      });
    } catch (error) {
      console.error('Error rejecting event suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // Remove processing state
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[suggestion.id];
        return newState;
      });
    }
  };

  // Helper to render priority badge
  const renderPriority = (priority: string | undefined) => {
    if (!priority) return null;
    
    const colorMap: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={`text-xs ${colorMap[priority] || ''}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Helper to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No date set';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Helper to format time
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'p');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading suggestions...</p>
      </div>
    );
  }

  if (taskSuggestions.length === 0 && eventSuggestions.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">AI Suggestions</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-secondary rounded-full p-3 mb-4">
                <CheckSquareIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No suggestions yet</h3>
              <p className="text-muted-foreground mb-4">
                Chat with the AI assistant to get suggestions for tasks and events.
              </p>
              <Button onClick={() => window.location.href = '/chat'}>
                Go to AI Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">AI Suggestions</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="tasks" className="relative">
            Tasks
            {taskSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {taskSuggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="relative">
            Events
            {eventSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {eventSuggestions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          {taskSuggestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground">No task suggestions available</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {taskSuggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                        {suggestion.priority && (
                          <div className="mt-1">
                            {renderPriority(suggestion.priority)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleRejectTask(suggestion)}
                          disabled={processing[suggestion.id]}
                        >
                          {processing[suggestion.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleAcceptTask(suggestion)}
                          disabled={processing[suggestion.id]}
                        >
                          {processing[suggestion.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestion.description && (
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    )}
                    {suggestion.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>Due: {formatDate(suggestion.dueDate)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="events">
          {eventSuggestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground">No event suggestions available</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {eventSuggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleRejectEvent(suggestion)}
                          disabled={processing[suggestion.id]}
                        >
                          {processing[suggestion.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleAcceptEvent(suggestion)}
                          disabled={processing[suggestion.id]}
                        >
                          {processing[suggestion.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestion.description && (
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <span>
                        {formatDate(suggestion.startTime)} • {formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuggestionsPage; 