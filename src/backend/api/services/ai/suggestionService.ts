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
  }[];
  events: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
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

    // Create a specialized extraction prompt
    const extractionPrompt: FormattedMessage = {
      role: "user",
      content: `Analyze the conversation above and extract any potential tasks or events mentioned. 
      Return ONLY a JSON object with the following structure and nothing else:
      {
        "tasks": [
          {
            "title": "Task title",
            "description": "Task description if available",
            "due_date": "YYYY-MM-DD if mentioned, otherwise null",
            "priority": "low, medium, or high if mentioned, otherwise null"
          }
        ],
        "events": [
          {
            "title": "Event title",
            "description": "Event description if available",
            "start_time": "ISO date string YYYY-MM-DDTHH:MM:SS if mentioned, otherwise null",
            "end_time": "ISO date string YYYY-MM-DDTHH:MM:SS if mentioned, otherwise null"
          }
        ]
      }
      
      If no tasks or events are mentioned, return empty arrays. Don't make up information.
      Only extract tasks and events that are clearly intended to be tracked or scheduled.`
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
      return extractionResult;
    } catch (error) {
      console.error("Failed to parse extraction result:", error);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing conversation for suggestions:", error);
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
      status: "suggested",
      source_message_id: messageId,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from("task_suggestions")
      .insert(taskSuggestions)
      .select();

    if (error) throw error;

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      dueDate: item.due_date,
      priority: item.priority,
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
      status: "suggested",
      source_message_id: messageId,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from("event_suggestions")
      .insert(eventSuggestions)
      .select();

    if (error) throw error;

    // Transform to client format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      startTime: item.start_time,
      endTime: item.end_time,
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
 * Updates the status of a task suggestion
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

    const { error } = await supabase
      .from("task_suggestions")
      .update({ status })
      .eq("id", suggestionId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating task suggestion status:", error);
    return false;
  }
};

/**
 * Updates the status of an event suggestion
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

    const { error } = await supabase
      .from("event_suggestions")
      .update({ status })
      .eq("id", suggestionId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating event suggestion status:", error);
    return false;
  }
}; 