import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/backend/database/client';
import { User } from '@supabase/supabase-js';
import { 
    getTaskSuggestions, 
    getEventSuggestions, 
    updateTaskSuggestionStatus, 
    updateEventSuggestionStatus,
    TaskSuggestion,
    EventSuggestion
} from '@/backend/api/services/ai/suggestions/suggestionService';
import SuggestionItem from '@/frontend/features/ai/components/SuggestionItem';
import { Button } from '@/frontend/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { useToast } from "@/frontend/hooks/use-toast";
import { Separator } from '@/frontend/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface SuggestionListProps {
  className?: string;
}

const SuggestionList: React.FC<SuggestionListProps> = ({ className }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [eventSuggestions, setEventSuggestions] = useState<EventSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" or "events"
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async (user: User) => {
    setIsLoading(true);
    try {
      const [tasks, events] = await Promise.all([
        getTaskSuggestions(user.id),
        getEventSuggestions(user.id)
      ]);
      setTaskSuggestions(tasks || []);
      setEventSuggestions(events || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({ title: "Error", description: "Could not fetch suggestions.", variant: "destructive" });
      setTaskSuggestions([]);
      setEventSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchSuggestions(user);
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        fetchSuggestions(user);
      } else {
        setTaskSuggestions([]);
        setEventSuggestions([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSuggestions]);

  const handleSuggestionStatusChange = async (suggestionId: string, type: 'task' | 'event', status: 'accepted' | 'rejected') => {
    if (!currentUser) return;
    try {
      if (type === 'task') {
        await updateTaskSuggestionStatus(currentUser.id, suggestionId, status);
        setTaskSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        
        if (status === 'accepted') {
          toast({ 
            title: "Task Created", 
            description: "The task has been created successfully and added to your tasks list.", 
          });
        } else {
          toast({ 
            title: "Suggestion Rejected", 
            description: "The task suggestion has been rejected and removed.", 
          });
        }
      } else {
        await updateEventSuggestionStatus(currentUser.id, suggestionId, status);
        setEventSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        
        if (status === 'accepted') {
          toast({ 
            title: "Event Created", 
            description: "The event has been created successfully and added to your calendar.", 
          });
        } else {
          toast({ 
            title: "Suggestion Rejected", 
            description: "The event suggestion has been rejected and removed.", 
          });
        }
      }
    } catch (error) {
      console.error(`Error updating ${type} suggestion status:`, error);
      toast({ title: "Error", description: `Failed to update ${type} suggestion.`, variant: "destructive" });
    }
  };

  if (!currentUser) {
    return (
      <div className={className}>
        <h1 className="text-2xl font-bold mb-4">AI Suggestions</h1>
        <p>Please log in to see your suggestions.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Suggestions</h1>
        <Button onClick={() => currentUser && fetchSuggestions(currentUser)} disabled={isLoading} variant="outline">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh Suggestions
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Task Suggestions ({taskSuggestions.length})</TabsTrigger>
          <TabsTrigger value="events">Event Suggestions ({eventSuggestions.length})</TabsTrigger>
        </TabsList>
        <Separator className="my-4" />

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading suggestions...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <TabsContent value="tasks">
              {taskSuggestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No task suggestions at the moment.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {taskSuggestions.map(suggestion => (
                    <SuggestionItem 
                      key={suggestion.id} 
                      suggestion={suggestion} 
                      type="task" 
                      userId={currentUser.id}
                      onStatusChange={handleSuggestionStatusChange} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="events">
              {eventSuggestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No event suggestions at the moment.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventSuggestions.map(suggestion => (
                    <SuggestionItem 
                      key={suggestion.id} 
                      suggestion={suggestion} 
                      type="event" 
                      userId={currentUser.id}
                      onStatusChange={handleSuggestionStatusChange} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default SuggestionList; 