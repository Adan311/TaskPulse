import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { callGeminiApiDirectly, getGeminiApiKey, FormattedMessage } from "./geminiService";
import { ChatMessage } from "./chatService";

/**
 * Interface for a detected task from AI suggestion
 */
export interface TaskSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string;
  projectName?: string;
  labels?: string[];
}

/**
 * Interface for a detected event from AI suggestion
 */
export interface EventSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string;
  projectName?: string;
}

/**
 * Interface for the extracted entities from a conversation
 */
interface ExtractionResult {
  tasks: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high";
    project_name?: string;
    labels?: string[];
  }[];
  events: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    project_name?: string;
  }[];
}

/**
 * Analyses a conversation using Gemini API to extract potential tasks and events
 */
export const analyzeConversation = async (
  messages: ChatMessage[]
): Promise<ExtractionResult | null> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for suggestion extraction");
      return null;
    }

    // Format the conversation for the Gemini API with correct roles
    const formattedHistory: FormattedMessage[] = messages.map(msg => {
      // Convert role from ChatMessage to FormattedMessage format
      let role: "user" | "assistant" | "model";
      if (msg.role === "user") {
        role = "user";
      } else if (msg.role === "assistant") {
        role = "model";
      } else {
        // Handle system messages as user messages for Gemini compatibility
        role = "user";
      }
      return { role, content: msg.content };
    });

    // Current date for relative time calculations
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create a specialized extraction prompt with enhanced guidance
    const extractionPrompt: FormattedMessage = {
      role: "user",
      content: `Analyze the conversation above and extract SPECIFIC, ACTIONABLE tasks or events mentioned. 
      
      IMPORTANT GUIDELINES:
      1. Extract only CONCRETE tasks/events that are explicitly mentioned, not vague ideas or possibilities
      2. Only extract tasks that a person clearly intends to do or events they plan to attend
      3. Tasks need specific action verbs and clear objectives (e.g., "Create slide deck for Q3 presentation")
      4. Events need clear purpose and timeframe (e.g., "Team meeting on Friday at 2pm")
      5. Project names should be extracted when mentioned (e.g., "Marketing Campaign", "Website Redesign")
      6. Include labels/tags when explicitly mentioned
      7. Infer priority based on urgency words ("urgent", "critical", "ASAP", etc.)
      
      Current date: ${currentDate}
      
      Return ONLY valid JSON following this exact structure:
      {
        "tasks": [
          {
            "title": "Specific task with action verb",
            "description": "Detailed description with context",
            "due_date": "YYYY-MM-DD or null",
            "priority": "low" or "medium" or "high",
            "project_name": "Project name if mentioned or null",
            "labels": ["label1", "label2"] if mentioned, otherwise []
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
        ]
      }
      
      If no tasks or events are mentioned, return {"tasks":[],"events":[]}
      DO NOT include fields with null values except for due_date, project_name and description when appropriate.
      DO NOT make up information not present in the conversation.
      
      EXAMPLES of what to extract:
      
      For "I need to prepare the Q3 report for the Marketing Campaign project by next Friday":
      {
        "tasks": [
          {
            "title": "Prepare Q3 report for Marketing Campaign",
            "description": "Create the quarterly report for the Marketing Campaign project",
            "due_date": "2023-07-14",
            "priority": "medium",
            "project_name": "Marketing Campaign",
            "labels": []
          }
        ],
        "events": []
      }
      
      For "Let's schedule a team meeting tomorrow at 2pm for about an hour to discuss the website redesign":
      {
        "tasks": [],
        "events": [
          {
            "title": "Team Meeting - Website Redesign Discussion",
            "description": "Meeting with team to discuss the website redesign project",
            "start_time": "2023-07-08T14:00:00",
            "end_time": "2023-07-08T15:00:00",
            "project_name": "Website Redesign"
          }
        ]
      }
      
      For "I will review the marketing materials next Tuesday and send feedback by Thursday":
      {
        "tasks": [
          {
            "title": "Review marketing materials",
            "description": "Review the marketing materials and prepare feedback",
            "due_date": "2023-07-11",
            "priority": "medium",
            "project_name": null,
            "labels": []
          },
          {
            "title": "Send feedback on marketing materials",
            "description": "Send the feedback after reviewing marketing materials",
            "due_date": "2023-07-13",
            "priority": "medium",
            "project_name": null,
            "labels": []
          }
        ],
        "events": []
      }`
    };

    // Combine the conversation history with the extraction prompt
    const fullPrompt = [...formattedHistory, extractionPrompt];

    // Call Gemini API with specialized parameters for structured output
    const response = await callGeminiApiDirectly(apiKey, fullPrompt, {
      temperature: 0.1, // Low temperature for more precise extraction
      maxOutputTokens: 1024
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
        console.error("Could not find JSON object in Gemini API response");
        return null;
      }

      const extractionResult: ExtractionResult = JSON.parse(jsonMatch[0]);
      
      // Validate the extraction result format
      if (!extractionResult.tasks) extractionResult.tasks = [];
      if (!extractionResult.events) extractionResult.events = [];
      
      // Log successful extraction
      console.log(`Extracted ${extractionResult.tasks.length} tasks and ${extractionResult.events.length} events`);
      
      return extractionResult;
    } catch (error) {
      console.error("Failed to parse extraction result:", error);
      console.error("Raw response:", response);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing conversation for suggestions:", error);
    return null;
  }
};

/**
 * Finds a project ID by its name (fuzzy matching)
 */
export const findProjectIdByName = async (
  userId: string,
  projectName: string
): Promise<string | null> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Try exact match first
    const { data: exactMatch, error: exactMatchError } = await supabase
      .from("projects")
      .select("id")
      .eq("user", userId)
      .eq("name", projectName)
      .limit(1);
    
    if (exactMatchError) throw exactMatchError;
    
    if (exactMatch && exactMatch.length > 0) {
      return exactMatch[0].id;
    }
    
    // If no exact match, try case-insensitive match
    const { data: ciMatch, error: ciMatchError } = await supabase
      .from("projects")
      .select("id")
      .eq("user", userId)
      .ilike("name", projectName)
      .limit(1);
    
    if (ciMatchError) throw ciMatchError;
    
    if (ciMatch && ciMatch.length > 0) {
      return ciMatch[0].id;
    }
    
    // If still no match, try partial match (contains)
    const { data: partialMatch, error: partialMatchError } = await supabase
      .from("projects")
      .select("id")
      .eq("user", userId)
      .ilike("name", `%${projectName}%`)
      .limit(1);
    
    if (partialMatchError) throw partialMatchError;
    
    if (partialMatch && partialMatch.length > 0) {
      return partialMatch[0].id;
    }
    
    // No matching project found
    return null;
  } catch (error) {
    console.error("Error finding project ID by name:", error);
    return null;
  }
};

/**
 * Stores task suggestions extracted from a conversation
 */
export const saveTaskSuggestions = async (
  userId: string,
  tasks: ExtractionResult["tasks"],
  messageId: string
): Promise<TaskSuggestion[]> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    if (!tasks.length) return [];

    const taskSuggestions = tasks.map(task => ({
      id: uuidv4(),
      user_id: userId,
      title: task.title,
      description: task.description || null,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      priority: task.priority || null,
      project_name: task.project_name || null,
      labels: task.labels || [],
      status: "suggested",
      source_message_id: messageId,
      created_at: new Date().toISOString()
    }));

    // Log task suggestions before insertion
    console.log("Saving task suggestions:", taskSuggestions);

    const { data, error } = await supabase
      .from("task_suggestions")
      .insert(taskSuggestions)
      .select();

    if (error) {
      console.error("Error inserting task suggestions:", error);
      throw error;
    }

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      dueDate: item.due_date,
      priority: item.priority,
      projectName: item.project_name,
      labels: item.labels,
      status: item.status,
      sourceMessageId: item.source_message_id,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Error saving task suggestions:", error);
    return [];
  }
};

/**
 * Stores event suggestions extracted from a conversation
 */
export const saveEventSuggestions = async (
  userId: string,
  events: ExtractionResult["events"],
  messageId: string
): Promise<EventSuggestion[]> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    if (!events.length) return [];

    const eventSuggestions = events.map(event => ({
      id: uuidv4(),
      user_id: userId,
      title: event.title,
      description: event.description || null,
      start_time: event.start_time ? new Date(event.start_time).toISOString() : new Date().toISOString(),
      end_time: event.end_time ? new Date(event.end_time).toISOString() : new Date(Date.now() + 60*60*1000).toISOString(), // Default 1h duration
      project_name: event.project_name || null,
      status: "suggested",
      source_message_id: messageId,
      created_at: new Date().toISOString()
    }));

    // Log event suggestions before insertion
    console.log("Saving event suggestions:", eventSuggestions);

    const { data, error } = await supabase
      .from("event_suggestions")
      .insert(eventSuggestions)
      .select();

    if (error) {
      console.error("Error inserting event suggestions:", error);
      throw error;
    }

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      startTime: item.start_time,
      endTime: item.end_time,
      projectName: item.project_name,
      status: item.status,
      sourceMessageId: item.source_message_id,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Error saving event suggestions:", error);
    return [];
  }
};

/**
 * Gets all suggestion counts for a user
 */
export const getSuggestionCounts = async (userId: string): Promise<{ tasks: number; events: number }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    // Get task suggestions count
    const { count: taskCount, error: taskError } = await supabase
      .from("task_suggestions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "suggested");

    if (taskError) throw taskError;

    // Get event suggestions count
    const { count: eventCount, error: eventError } = await supabase
      .from("event_suggestions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "suggested");

    if (eventError) throw eventError;

    return {
      tasks: taskCount || 0,
      events: eventCount || 0
    };
  } catch (error) {
    console.error("Error getting suggestion counts:", error);
    return { tasks: 0, events: 0 };
  }
};

/**
 * Gets all task suggestions for a user
 */
export const getTaskSuggestions = async (userId: string): Promise<TaskSuggestion[]> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    const { data, error } = await supabase
      .from("task_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "suggested")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      dueDate: item.due_date,
      priority: item.priority,
      projectName: item.project_name,
      labels: item.labels,
      status: item.status,
      sourceMessageId: item.source_message_id,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Error getting task suggestions:", error);
    return [];
  }
};

/**
 * Gets all event suggestions for a user
 */
export const getEventSuggestions = async (userId: string): Promise<EventSuggestion[]> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    const { data, error } = await supabase
      .from("event_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "suggested")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      startTime: item.start_time,
      endTime: item.end_time,
      projectName: item.project_name,
      status: item.status,
      sourceMessageId: item.source_message_id,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Error getting event suggestions:", error);
    return [];
  }
};

/**
 * Updates the status of a task suggestion and deletes it
 */
export const updateTaskSuggestionStatus = async (
  userId: string,
  suggestionId: string,
  status: "accepted" | "rejected"
): Promise<boolean> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    // Instead of updating status, delete the suggestion
    const { error } = await supabase
      .from("task_suggestions")
      .delete()
      .eq("id", suggestionId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error processing task suggestion:", error);
    return false;
  }
};

/**
 * Updates the status of an event suggestion and deletes it
 */
export const updateEventSuggestionStatus = async (
  userId: string,
  suggestionId: string,
  status: "accepted" | "rejected"
): Promise<boolean> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    // Instead of updating status, delete the suggestion
    const { error } = await supabase
      .from("event_suggestions")
      .delete()
      .eq("id", suggestionId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error processing event suggestion:", error);
    return false;
  }
};

/**
 * Explicitly request AI to analyze a conversation for suggestions
 */
export const requestSuggestions = async (
  conversationId: string
): Promise<{ hasSuggestions: boolean }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    console.log(`Requesting suggestions for conversation: ${conversationId}`);
    
    // Get the conversation messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      throw messagesError;
    }
    
    if (!messagesData || messagesData.length === 0) {
      console.log("No messages found in conversation");
      return { hasSuggestions: false };
    }
    
    console.log(`Found ${messagesData.length} messages in conversation`);
    
    // Format messages for analysis
    const messages = messagesData.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      userId: msg.user_id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant' | 'system',
      createdAt: msg.created_at
    }));
    
    // Analyze the conversation
    console.log("Analyzing conversation for suggestions...");
    const extractionResult = await analyzeConversation(messages);
    
    if (!extractionResult) {
      console.log("No extraction result from conversation analysis");
      return { hasSuggestions: false };
    }
    
    console.log(`Extraction result: ${extractionResult.tasks.length} tasks, ${extractionResult.events.length} events`);
    
    if (extractionResult.tasks.length > 0 || extractionResult.events.length > 0) {
      // Get the last message ID to associate suggestions with
      const lastMessage = messagesData[messagesData.length - 1];
      
      // Save task suggestions
      if (extractionResult.tasks.length > 0) {
        console.log(`Saving ${extractionResult.tasks.length} task suggestions`);
        await saveTaskSuggestions(user.id, extractionResult.tasks, lastMessage.id);
      }
      
      // Save event suggestions
      if (extractionResult.events.length > 0) {
        console.log(`Saving ${extractionResult.events.length} event suggestions`);
        await saveEventSuggestions(user.id, extractionResult.events, lastMessage.id);
      }
      
      return { hasSuggestions: true };
    }
    
    console.log("No suggestions found in conversation");
    return { hasSuggestions: false };
  } catch (error) {
    console.error("Error requesting suggestions:", error);
    return { hasSuggestions: false };
  }
}; 