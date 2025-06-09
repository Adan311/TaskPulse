import { supabase } from "../../../../database/client";
import { v4 as uuidv4 } from "uuid";
import { callGeminiApiDirectly, getGeminiApiKey, FormattedMessage } from "../core/geminiService";
import type { ChatMessage } from "../chat/chatService";
import { createTask } from "@/backend/api/services/task.service";
import { createEvent } from "@/backend/api/services/eventService";

/**
 * Interface for a detected task from AI suggestion (application-facing, camelCase)
 */
export interface TaskSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: "low" | "medium" | "high";
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string; // ISO String
  projectName?: string;
  labels?: string[];
}

/**
 * Interface for a detected event from AI suggestion (application-facing, camelCase)
 */
export interface EventSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string; // ISO String
  projectName?: string;
}

export interface ClarifyingQuestion {
  question_text: string;
}

/**
 * Interface for the raw extraction result from Gemini (snake_case matching prompt output)
 */
interface GeminiTaskExtraction {
  title: string;
  description?: string;
  due_date?: string; // YYYY-MM-DD or null
  priority?: "low" | "medium" | "high";
  project_name?: string;
  labels?: string[];
}

interface GeminiEventExtraction {
  title: string;
  description?: string;
  start_time: string; // YYYY-MM-DDTHH:MM:SS
  end_time: string; // YYYY-MM-DDTHH:MM:SS
  project_name?: string;
}

export interface ExtractionResult {
  tasks: GeminiTaskExtraction[];
  events: GeminiEventExtraction[];
  taskSuggestions: GeminiTaskExtraction[]; // Alias for tasks for better readability
  eventSuggestions: GeminiEventExtraction[]; // Alias for events for better readability
  hasOverallSuggestions: boolean;
  clarifying_questions?: ClarifyingQuestion[];
  clarifyingQuestions?: ClarifyingQuestion[]; // Alias for clarifying_questions for better readability
}

const BASE_SUGGESTION_PROMPT = `You are an AI assistant integrated into a project management system that includes calendar tasks, project notes, and file uploads. Your job is to analyze the user's conversation and suggest relevant tasks or events based on the context. Follow these guidelines:

TASK SUGGESTION GUIDELINES:
- Extract specific, actionable tasks from the conversation
- Look for explicit statements of intention like "I need to", "I should", "I have to", etc.
- Include deadlines if mentioned (e.g., "by Friday", "next week", "tomorrow")
- Identify priority levels based on urgency in the conversation
- Connect tasks to projects when project context is provided
- Add relevant labels based on the task category (e.g., "meeting", "research", "follow-up")

EVENT SUGGESTION GUIDELINES:
- Identify calendar events such as meetings, appointments, calls, or important dates
- Extract specific date and time information whenever possible
- For partial time information, suggest reasonable start/end times
- Include relevant people as part of the event description
- Connect events to projects when project context is provided

GENERAL RULES:
- Prioritize quality over quantity - suggest only clearly indicated tasks/events
- Be specific and actionable rather than vague
- If the conversation shifts between topics, analyze each part separately
- If intent is unclear for a specific item, suggest a clarifying question
- Include enough context in descriptions to make the suggestion useful

Return ONLY valid JSON following this exact structure:
{
  "tasks": [
    {
      "title": "Specific task with action verb",
      "description": "Detailed description with context",
      "due_date": "YYYY-MM-DD or null",
      "priority": "low" or "medium" or "high", 
      "project_name": "Project name if mentioned or null",
      "labels": ["label1", "label2"]
    }
  ],
  "events": [
    {
      "title": "Specific event title",
      "description": "Detailed description",
      "start_time": "YYYY-MM-DDTHH:MM:SS",
      "end_time": "YYYY-MM-DDTHH:MM:SS",
      "project_name": "Project name if mentioned or null"
    }
  ],
  "clarifying_questions": [
    {
      "question_text": "A question to clarify user intent for a potential task or event."
    }
  ]
}

If no tasks or events are clearly suggested, return {"tasks":[],"events":[], "clarifying_questions":[]}.
DO NOT include fields with null values in the JSON unless the field itself is optional.
DO NOT make up information not present in the conversation.
Associate suggestions with project names if mentioned. Infer priority based on urgency.
Current date for reference: {{current_date}}.
`;

const CONTEXT_ADDONS = {
  PROJECT_MANAGEMENT: `The conversation seems project-related. Focus on identifying action items, project deliverables, deadlines, and responsibilities. If a project name is mentioned, try to associate the task with it. Suggest tasks like 'Finalize [document] by [date]' or 'Assign [task] to [person].'`,
  CALENDAR_SCHEDULING: `The conversation mentions scheduling or specific times/dates. Prioritize extracting specific dates, times, and the purpose of meetings or events. Suggest events like 'Meeting about [topic] on [date] at [time].'`,
  CASUAL_PERSONAL: `The conversation seems more casual or personal. Identify potential personal tasks or reminders. Only suggest if there seems to be a clear intent or a self-assigned to-do. If vague, prefer asking a clarifying question like, 'Would you like me to create a task for [action]?'`,
  TRAVEL: `The conversation appears to be about travel. Focus on travel-related actions such as booking flights/hotels, creating itineraries, or packing lists. Extract destinations and travel dates. Example: 'Plan trip to [Destination]' or 'Book flight for [Destination] on [Date].'`,
};

const KEYWORD_SETS = {
  PROJECT_MANAGEMENT: ["deadline", "assign", "task", "report", "client", "budget", "milestone", "project", "deliverable", "sprint", "roadmap"],
  CALENDAR_SCHEDULING: ["meeting", "schedule", "call", "event", "appointment", "calendar", "invite", "conference", "webinar", "10am", "2pm", "next week", "tomorrow", "friday"],
  CASUAL_PERSONAL: ["should", "need to", "planning to", "thinking of", "friend", "organize", "personal"],
  TRAVEL: ["trip", "travel", "vacation", "dubai", "flight", "hotel", "itinerary", "booking", "destination", "journey"],
};

function detectConversationContexts(messages: ChatMessage[]): string[] {
  const detectedContexts: Set<string> = new Set();
  const recentMessagesContent = messages.slice(-5).map(msg => msg.content.toLowerCase()).join(" ");
  for (const context in KEYWORD_SETS) {
    if (KEYWORD_SETS[context as keyof typeof KEYWORD_SETS].some(keyword => recentMessagesContent.includes(keyword))) {
      detectedContexts.add(context);
    }
  }
  return Array.from(detectedContexts);
}

/**
 * Analyses a conversation using Gemini API to extract potential tasks and events
 */
export const analyzeConversation = async (
  userId: string,
  messages: ChatMessage[]
): Promise<ExtractionResult | null> => {
  try {
    // Don't analyze empty conversations
    if (!messages || messages.length === 0) {
      console.log("No messages to analyze for suggestions");
      return {
        tasks: [],
        events: [],
        taskSuggestions: [],
        eventSuggestions: [],
        hasOverallSuggestions: false,
        clarifying_questions: [],
        clarifyingQuestions: []
      };
    }
    
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for suggestion extraction");
      return null;
    }

    // We only need to analyze the most recent messages (last 10 at most)
    const recentMessages = messages.slice(-10);
    const formattedHistory: FormattedMessage[] = recentMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));
    
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];

    let dynamicPrompt = BASE_SUGGESTION_PROMPT.replace("{{current_date}}", currentDate);

    const detectedContexts = detectConversationContexts(messages);
    console.log("Detected contexts:", detectedContexts);

    // Add context-specific guidance to prompt
    if (detectedContexts.length > 0) {
      dynamicPrompt += "\n\nDetected conversation contexts:\n";
      detectedContexts.forEach(context => {
        if (CONTEXT_ADDONS[context as keyof typeof CONTEXT_ADDONS]) {
          dynamicPrompt += "\n- " + CONTEXT_ADDONS[context as keyof typeof CONTEXT_ADDONS];
        }
      });
    }

    // Add the conversation history itself to the prompt
    // For now, we'll append it to the user message that contains the main instructions
    // A more sophisticated approach might involve structuring it as part of the history for Gemini

    const extractionPromptMessage: FormattedMessage = {
      role: "user",
      content: dynamicPrompt + "\n\nConversation to analyze:\n" + formattedHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    };
    
    // The full prompt now consists of only the instruction message,
    // as the conversation is embedded within it.
    const fullPrompt = [extractionPromptMessage];

    // Call Gemini API with specialized parameters for structured output
    const response = await callGeminiApiDirectly(apiKey, fullPrompt, {
      temperature: 0.2, // Slightly higher for more nuanced understanding but still factual
      maxOutputTokens: 1500 // Increased to handle potentially larger JSON
    });

    if (!response) {
      console.error("No response from Gemini API for suggestion extraction");
      return null;
    }

    // Parse the JSON response
    try {
      // Find the JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error("No JSON object found in Gemini response");
        return null;
      }
      
      const extractedData = JSON.parse(jsonMatch[0]) as ExtractionResult;
      
      // For backward compatibility, ensure we have both tasks/events and taskSuggestions/eventSuggestions
      extractedData.taskSuggestions = extractedData.tasks || [];
      extractedData.eventSuggestions = extractedData.events || [];
      extractedData.clarifyingQuestions = extractedData.clarifying_questions || [];
      extractedData.hasOverallSuggestions = 
        (extractedData.tasks && extractedData.tasks.length > 0) || 
        (extractedData.events && extractedData.events.length > 0);
      
      console.log(`Extracted ${extractedData.tasks.length} task suggestions and ${extractedData.events.length} event suggestions`);
      return extractedData;
    } catch (error) {
      console.error("Failed to parse extraction result:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in suggestion extraction:", error);
    return null;
  }
};

/**
 * Save task suggestions to the database
 */
export const saveTaskSuggestions = async (
  userId: string,
  geminiTasks: GeminiTaskExtraction[],
  messageId: string
): Promise<TaskSuggestion[]> => {
  try {
    // Verify the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    if (!geminiTasks || geminiTasks.length === 0) {
      return [];
    }
    
    const tasks: TaskSuggestion[] = geminiTasks.map(task => ({
      id: uuidv4(),
      userId,
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      status: 'suggested',
      sourceMessageId: messageId,
      createdAt: new Date().toISOString(),
      projectName: task.project_name,
      labels: task.labels || []
    }));
    
    const { data, error } = await supabase
      .from('task_suggestions')
      .insert(tasks.map(task => ({
        id: task.id,
        user_id: task.userId,
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
        source_message_id: task.sourceMessageId,
        created_at: task.createdAt,
        project_name: task.projectName,
        labels: task.labels || []
      })))
      .select();
      
    if (error) {
      console.error("Error saving task suggestions:", error);
      return [];
    }
    
    console.log(`Saved ${tasks.length} task suggestions`);
    return tasks;
  } catch (error) {
    console.error("Error in saveTaskSuggestions:", error);
    return [];
  }
};

/**
 * Save event suggestions to the database
 */
export const saveEventSuggestions = async (
  userId: string,
  geminiEvents: GeminiEventExtraction[],
  messageId: string
): Promise<EventSuggestion[]> => {
  try {
    // Verify the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("User not authenticated or ID mismatch");
    }
    
    if (!geminiEvents || geminiEvents.length === 0) {
      return [];
    }
    
    const events: EventSuggestion[] = geminiEvents.map(event => ({
      id: uuidv4(),
      userId,
      title: event.title,
      description: event.description,
      startTime: event.start_time,
      endTime: event.end_time,
      status: 'suggested',
      sourceMessageId: messageId,
      createdAt: new Date().toISOString(),
      projectName: event.project_name
    }));
    
    const { data, error } = await supabase
      .from('event_suggestions')
      .insert(events.map(event => ({
        id: event.id,
        user_id: event.userId,
        title: event.title,
        description: event.description,
        start_time: event.startTime,
        end_time: event.endTime,
        status: event.status,
        source_message_id: event.sourceMessageId,
        created_at: event.createdAt,
        project_name: event.projectName
      })))
      .select();
      
    if (error) {
      console.error("Error saving event suggestions:", error);
      return [];
    }
    
    console.log(`Saved ${events.length} event suggestions`);
    return events;
  } catch (error) {
    console.error("Error in saveEventSuggestions:", error);
    return [];
  }
};

/**
 * Gets all suggestion counts for a user
 */
export const getSuggestionCounts = async (userId: string): Promise<{ tasks: number; events: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch for getSuggestionCounts");

  const [{ count: taskCount, error: taskError }, { count: eventCount, error: eventError }] = await Promise.all([
        supabase.from('task_suggestions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'suggested'),
        supabase.from('event_suggestions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'suggested')
  ]);

  if (taskError || eventError) {
    console.error("Error getting suggestion counts:", taskError || eventError);
    // Return 0 or throw, depending on desired strictness
    return { tasks: 0, events: 0 };
  }
  return { tasks: taskCount || 0, events: eventCount || 0 };
};

/**
 * Gets all task suggestions for a user
 */
export const getTaskSuggestions = async (userId: string): Promise<TaskSuggestion[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch for getTaskSuggestions");

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
      labels: ts.labels
  }));
};

/**
 * Gets all event suggestions for a user
 */
export const getEventSuggestions = async (userId: string): Promise<EventSuggestion[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("User not authenticated or ID mismatch for getEventSuggestions");
    
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
      createdAt: msg.created_at
    }));
    
    console.log(`Analyzing ${messages.length} messages for conversation ${conversationId}...`);
    const extractionResult = await analyzeConversation(user.id, messages);
    
    if (!extractionResult) {
      console.log(`No extraction result from conversation analysis for ${conversationId}.`);
      return { hasSuggestions: false };
    }
    
    const hasActualSuggestions = (extractionResult.tasks && extractionResult.tasks.length > 0) || 
                               (extractionResult.events && extractionResult.events.length > 0);
    
    console.log(`Extraction for ${conversationId} - Tasks: ${extractionResult.tasks?.length || 0}, Events: ${extractionResult.events?.length || 0}, Questions: ${extractionResult.clarifyingQuestions?.length || 0}`);

    if (hasActualSuggestions) {
      const lastMessage = messagesData[messagesData.length - 1];
      if (extractionResult.tasks && extractionResult.tasks.length > 0) {
        console.log(`Saving ${extractionResult.tasks.length} task suggestions for ${conversationId}.`);
        await saveTaskSuggestions(user.id, extractionResult.tasks, lastMessage.id);
      }
      if (extractionResult.events && extractionResult.events.length > 0) {
        console.log(`Saving ${extractionResult.events.length} event suggestions for ${conversationId}.`);
        await saveEventSuggestions(user.id, extractionResult.events, lastMessage.id);
      }
    }
    
    if (extractionResult.clarifyingQuestions && extractionResult.clarifyingQuestions.length > 0) {
      return { hasSuggestions: hasActualSuggestions, clarifyingQuestions: extractionResult.clarifyingQuestions };
    }
    
    return { hasSuggestions: hasActualSuggestions };
  } catch (error) {
    console.error(`Error requesting suggestions for conversation ${conversationId}:`, error);
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
      console.error("User not authenticated or feedback userId mismatch.");
      throw new Error("User not authenticated or feedback user ID mismatch.");
    }

    const feedbackToInsert = {
      user_id: feedback.userId,
      suggestion_id: feedback.suggestionId,
      suggestion_type: feedback.suggestionType,
      original_suggestion: feedback.originalSuggestion, // Will be stored as JSONB
      feedback_type: feedback.feedbackType,
      comments: feedback.comments,
      // created_at and updated_at are handled by DB defaults/triggers
    };

    const { data, error } = await supabase
      .from('suggestion_feedback')
      .insert(feedbackToInsert)
      .select()
      .single(); // Assuming we want to return the created record

    if (error) {
      console.error("Error recording suggestion feedback:", error);
      throw error;
    }

    if (!data) {
        return null;
    }

    // Map snake_case from DB to camelCase for application consistency
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
    console.error("Exception in recordSuggestionFeedback:", error);
    // Depending on how the caller handles errors, you might re-throw or return null
    // For now, re-throwing to let the caller decide.
    throw error;
  }
}; 