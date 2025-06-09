import { supabase } from "../../../../database/client";
import { v4 as uuidv4 } from "uuid";
import { createTask } from "@/backend/api/services/task.service";
import { createEvent } from "@/backend/api/services/eventService";
import type { ChatMessage } from "../chat/chatService";
import { 
  TaskSuggestion, 
  EventSuggestion, 
  ClarifyingQuestion, 
  GeminiTaskExtraction, 
  GeminiEventExtraction,
  analyzeConversation 
} from "./suggestionAnalysis";

/**
 * Save task suggestions to database
 */
export const saveTaskSuggestions = async (
  userId: string,
  geminiTasks: GeminiTaskExtraction[],
  messageId: string
): Promise<TaskSuggestion[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch");

  if (geminiTasks.length === 0) return [];

  const savedSuggestions: TaskSuggestion[] = [];

  for (const geminiTask of geminiTasks) {
    const taskId = uuidv4();
    
    const taskSuggestion = {
      id: taskId,
      user_id: userId,
      title: geminiTask.title,
      description: geminiTask.description || null,
      due_date: geminiTask.due_date || null,
      priority: geminiTask.priority || "medium",
      status: "suggested" as const,
      source_message_id: messageId,
      created_at: new Date().toISOString(),
      project_name: geminiTask.project_name || null,
      labels: geminiTask.labels || [],
    };

    const { data, error } = await supabase
      .from('task_suggestions')
      .insert(taskSuggestion)
      .select()
      .single();

    if (error) {
      console.error("Error saving task suggestion:", error);
      continue; // Skip this suggestion but continue with others
    }

    // Convert back to application interface
    savedSuggestions.push({
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      status: data.status,
      sourceMessageId: data.source_message_id,
      createdAt: data.created_at,
      projectName: data.project_name,
      labels: data.labels,
    });
  }

  console.log(`Saved ${savedSuggestions.length} task suggestions for user ${userId}`);
  return savedSuggestions;
};

/**
 * Save event suggestions to database
 */
export const saveEventSuggestions = async (
  userId: string,
  geminiEvents: GeminiEventExtraction[],
  messageId: string
): Promise<EventSuggestion[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch");

  if (geminiEvents.length === 0) return [];

  const savedSuggestions: EventSuggestion[] = [];

  for (const geminiEvent of geminiEvents) {
    const eventId = uuidv4();
    
    const eventSuggestion = {
      id: eventId,
      user_id: userId,
      title: geminiEvent.title,
      description: geminiEvent.description || null,
      start_time: geminiEvent.start_time,
      end_time: geminiEvent.end_time,
      status: "suggested" as const,
      source_message_id: messageId,
      created_at: new Date().toISOString(),
      project_name: geminiEvent.project_name || null,
    };

    const { data, error } = await supabase
      .from('event_suggestions')
      .insert(eventSuggestion)
      .select()
      .single();

    if (error) {
      console.error("Error saving event suggestion:", error);
      continue; // Skip this suggestion but continue with others
    }

    // Convert back to application interface
    savedSuggestions.push({
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      sourceMessageId: data.source_message_id,
      createdAt: data.created_at,
      projectName: data.project_name,
    });
  }

  console.log(`Saved ${savedSuggestions.length} event suggestions for user ${userId}`);
  return savedSuggestions;
};

/**
 * Get counts of pending suggestions for a user
 */
export const getSuggestionCounts = async (userId: string): Promise<{ tasks: number; events: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch");

  const [taskResponse, eventResponse] = await Promise.all([
    supabase.from('task_suggestions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'suggested'),
    supabase.from('event_suggestions').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'suggested')
  ]);

  return {
    tasks: taskResponse.count || 0,
    events: eventResponse.count || 0
  };
};

/**
 * Get all pending task suggestions for a user
 */
export const getTaskSuggestions = async (userId: string): Promise<TaskSuggestion[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch");

    const { data, error } = await supabase
    .from('task_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'suggested');

    if (error) {
      console.error("Error fetching task suggestions:", error);
      throw error;
    }
    return data.map(ts => ({
        id: ts.id,
        userId: ts.user_id,
        title: ts.title,
        description: ts.description,
        dueDate: ts.due_date,
        priority: ts.priority,
        status: ts.status,
        sourceMessageId: ts.source_message_id,
        createdAt: ts.created_at,
        projectName: ts.project_name,
        labels: ts.labels,
    }));
};

/**
 * Get all pending event suggestions for a user
 */
export const getEventSuggestions = async (userId: string): Promise<EventSuggestion[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch");

    const { data, error } = await supabase
    .from('event_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'suggested');

    if (error) {
      console.error("Error fetching event suggestions:", error);
      throw error;
    }
    return data.map(es => ({
        id: es.id,
        userId: es.user_id,
        title: es.title,
        description: es.description,
        startTime: es.start_time,
        endTime: es.end_time,
        status: es.status,
        sourceMessageId: es.source_message_id,
        createdAt: es.created_at,
        projectName: es.project_name,
    }));
};

/**
 * Finds a project ID by its name (fuzzy matching)
 */
export const findProjectIdByName = async (projectName: string): Promise<string | null> => {
  if (!projectName || projectName.trim() === "") {
    return null;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', `%${projectName.trim()}%`) // Case-insensitive search
      .limit(1);

    if (error) {
      console.error('Error fetching project by name:', error);
      return null;
    }
    return projects && projects.length > 0 ? projects[0].id : null;
  } catch (e) {
    console.error('Exception in findProjectIdByName:', e);
    return null;
  }
};

/**
 * Updates the status of a task suggestion and creates a real task if accepted
 */
export const updateTaskSuggestionStatus = async (userId: string, suggestionId: string, status: 'accepted' | 'rejected'): Promise<TaskSuggestion | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch for updateTaskSuggestionStatus");

  // First get the suggestion data
  const { data: suggestionData, error: suggestionError } = await supabase
    .from('task_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .eq('user_id', userId)
    .single();
    
  if (suggestionError) {
    console.error(`Error getting task suggestion ${suggestionId}:`, suggestionError);
    throw suggestionError;
  }
  
  if (!suggestionData) {
    throw new Error(`Task suggestion ${suggestionId} not found`);
  }
  
  // Store a copy for the return value
  const suggestionCopy = { ...suggestionData };
  
  // If accepting, create an actual task
  if (status === 'accepted') {
    try {
      // Look up project ID if project name is provided
      let projectId = null;
      if (suggestionData.project_name) {
        projectId = await findProjectIdByName(suggestionData.project_name);
      }
      
      // Create the task
      await createTask({
        title: suggestionData.title,
        description: suggestionData.description || undefined,
        due_date: suggestionData.due_date || undefined,
        priority: suggestionData.priority || "medium",
        project: projectId,
        status: "todo",
        labels: suggestionData.labels || [],
      });
      
      console.log(`Created task from suggestion: ${suggestionData.title}`);
    } catch (createError) {
      console.error("Error creating task from suggestion:", createError);
      // Continue with status update even if task creation fails
    }
  }

  // For both accepted and rejected, delete the suggestion
  const { error: deleteError } = await supabase
    .from('task_suggestions')
    .delete()
    .eq('id', suggestionId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error(`Error deleting task suggestion ${suggestionId}:`, deleteError);
    throw deleteError;
  }
  
  // Return the original suggestion with updated status for UI consistency
  return {
    id: suggestionCopy.id,
    userId: suggestionCopy.user_id,
    title: suggestionCopy.title,
    description: suggestionCopy.description,
    dueDate: suggestionCopy.due_date,
    priority: suggestionCopy.priority,
    status: status, // Update with the new status
    sourceMessageId: suggestionCopy.source_message_id,
    createdAt: suggestionCopy.created_at,
    projectName: suggestionCopy.project_name,
    labels: suggestionCopy.labels
  };
};

/**
 * Updates the status of an event suggestion and creates a real event if accepted
 */
export const updateEventSuggestionStatus = async (userId: string, suggestionId: string, status: 'accepted' | 'rejected'): Promise<EventSuggestion | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch for updateEventSuggestionStatus");

  // First get the suggestion data
  const { data: suggestionData, error: suggestionError } = await supabase
    .from('event_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .eq('user_id', userId)
    .single();
    
  if (suggestionError) {
    console.error(`Error getting event suggestion ${suggestionId}:`, suggestionError);
    throw suggestionError;
  }
  
  if (!suggestionData) {
    throw new Error(`Event suggestion ${suggestionId} not found`);
  }
  
  // Store a copy for the return value
  const suggestionCopy = { ...suggestionData };
  
  // If accepting, create an actual event
  if (status === 'accepted') {
    try {
      // Look up project ID if project name is provided
      let projectId = null;
      if (suggestionData.project_name) {
        projectId = await findProjectIdByName(suggestionData.project_name);
      }
      
      // Create the event
      await createEvent({
        title: suggestionData.title,
        description: suggestionData.description || undefined,
        startTime: suggestionData.start_time,
        endTime: suggestionData.end_time,
        project: projectId,
        source: "app",
        participants: [] // Add empty participants array to match interface
      });
      
      console.log(`Created event from suggestion: ${suggestionData.title}`);
    } catch (createError) {
      console.error("Error creating event from suggestion:", createError);
      // Continue with status update even if event creation fails
    }
  }

  // For both accepted and rejected, delete the suggestion
  const { error: deleteError } = await supabase
    .from('event_suggestions')
    .delete()
    .eq('id', suggestionId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error(`Error deleting event suggestion ${suggestionId}:`, deleteError);
    throw deleteError;
  }
  
  // Return the original suggestion with updated status for UI consistency
  return {
    id: suggestionCopy.id,
    userId: suggestionCopy.user_id,
    title: suggestionCopy.title,
    description: suggestionCopy.description,
    startTime: suggestionCopy.start_time,
    endTime: suggestionCopy.end_time,
    status: status, // Update with the new status
    sourceMessageId: suggestionCopy.source_message_id,
    createdAt: suggestionCopy.created_at,
    projectName: suggestionCopy.project_name
  };
};

/**
 * Explicitly request AI to analyze a conversation for suggestions
 */
export const requestSuggestions = async (
  conversationId: string
): Promise<{ hasSuggestions: boolean; clarifyingQuestions?: ClarifyingQuestion[] }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    console.log(`Requesting suggestions for conversation: ${conversationId} by user ${user.id}`);
    
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, messagesError);
      throw messagesError;
    }
    
    if (!messagesData || messagesData.length === 0) {
      console.log(`No messages found in conversation ${conversationId} for suggestion request.`);
      return { hasSuggestions: false };
    }
    
    const messages: ChatMessage[] = messagesData.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      userId: msg.user_id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant' | 'system',
      createdAt: msg.created_at,
      metadata: msg.metadata
    }));
    
    // Analyze the conversation for suggestions
    const extractionResult = await analyzeConversation(messages);
    
    if (!extractionResult) {
      console.log(`AI analysis failed for conversation ${conversationId}`);
      return { hasSuggestions: false };
    }
    
    const hasTasks = extractionResult.tasks && extractionResult.tasks.length > 0;
    const hasEvents = extractionResult.events && extractionResult.events.length > 0;
    const hasQuestions = extractionResult.clarifying_questions && extractionResult.clarifying_questions.length > 0;
    
    // If we have clarifying questions but no concrete suggestions, return questions
    if (hasQuestions && !hasTasks && !hasEvents) {
      return { 
        hasSuggestions: false, 
        clarifyingQuestions: extractionResult.clarifying_questions 
      };
    }
    
    // Save suggestions if we have any
    if (hasTasks || hasEvents) {
      const latestMessageId = messages[messages.length - 1].id;
      
      if (hasTasks) {
        await saveTaskSuggestions(user.id, extractionResult.tasks, latestMessageId);
      }
      
      if (hasEvents) {
        await saveEventSuggestions(user.id, extractionResult.events, latestMessageId);
      }
      
      return { hasSuggestions: true };
    }
    
    return { hasSuggestions: false };
  } catch (error) {
    console.error("Error in requestSuggestions:", error);
    return { hasSuggestions: false };
  }
};

export interface SuggestionFeedback {
  id?: string; // Optional for creation, present for retrieval
  userId: string;
  suggestionId: string;
  suggestionType: 'task' | 'event';
  originalSuggestion?: TaskSuggestion | EventSuggestion | GeminiTaskExtraction | GeminiEventExtraction; // Store the original suggestion that was shown to the user
  feedbackType: 'accurate' | 'inaccurate' | 'helpful' | 'unhelpful' | 'other';
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const recordSuggestionFeedback = async (feedback: SuggestionFeedback): Promise<SuggestionFeedback | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== feedback.userId) {
      throw new Error("User not authenticated or ID mismatch");
    }

    const { data, error } = await supabase
      .from('suggestion_feedback')
      .insert({
        user_id: feedback.userId,
        suggestion_id: feedback.suggestionId,
        suggestion_type: feedback.suggestionType,
        original_suggestion: feedback.originalSuggestion,
        feedback_type: feedback.feedbackType,
        comments: feedback.comments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording suggestion feedback:", error);
      throw error;
    }

    // Convert back to application interface
    return {
      id: data.id,
      userId: data.user_id,
      suggestionId: data.suggestion_id,
      suggestionType: data.suggestion_type,
      originalSuggestion: data.original_suggestion,
      feedbackType: data.feedback_type,
      comments: data.comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error("Error in recordSuggestionFeedback:", error);
    return null;
  }
}; 