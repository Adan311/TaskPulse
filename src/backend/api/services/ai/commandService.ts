import { supabase } from "@/integrations/supabase/client";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "./geminiService";
import { createTask } from "../task.service";
import { createEvent } from "../eventService";

/**
 * Interface for command detection results
 */
export interface CommandDetectionResult {
  hasCommand: boolean;
  commandType: 'create_task' | 'create_event' | 'set_reminder' | null;
  entities: any;
}

/**
 * Detect if a message contains a command to create a task, event, or reminder
 */
export const detectCommandIntent = async (
  message: string,
  conversationHistory?: any[]
): Promise<CommandDetectionResult> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for command detection");
      return { hasCommand: false, commandType: null, entities: null };
    }

    // Extract context from conversation history if available
    let context = "";
    if (conversationHistory && conversationHistory.length > 0) {
      // Get the last few messages (up to 3) for context
      const recentMessages = conversationHistory.slice(-3);
      context = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    }

    // Create a specialized command detection prompt
    const commandPrompt: FormattedMessage = {
      role: "user",
      content: `Analyze this message and determine if it contains an EXPLICIT command to create a task, event, or set a reminder:
      
      "${message}"
      
      ${context ? `Recent conversation context:\n${context}\n` : ''}
      
      Return ONLY a JSON object with the following structure:
      {
        "hasCommand": true/false,
        "commandType": "create_task", "create_event", "set_reminder", or null,
        "entities": {
          // For tasks:
          "title": "Task title",
          "description": "Task description",
          "due_date": "YYYY-MM-DD",
          "priority": "low/medium/high",
          "project_name": "Project name if mentioned",
          "labels": ["label1", "label2"] if mentioned,
          
          // For events:
          "title": "Event title",
          "description": "Event description",
          "start_time": "YYYY-MM-DDTHH:MM:SS",
          "end_time": "YYYY-MM-DDTHH:MM:SS",
          "project_name": "Project name if mentioned",
          "context": "Information from recent conversation that provides context",
          "date": "YYYY-MM-DD date extracted from conversation",
          
          // For reminders:
          "task_id": null, // This will be filled in later
          "reminder_time": "YYYY-MM-DDTHH:MM:SS"
        }
      }
      
      IMPORTANT: ONLY return hasCommand: true if the message is CLEARLY and EXPLICITLY an instruction to create something.
      The message must include a direct command verb like "create", "add", "make", "schedule", "set up", etc.
      
      Special case: If user says something like "create the event" without specifics, set hasCommand: true and 
      commandType: "create_event", and extract any event details from the conversation context.
      
      Examples of commands that should return hasCommand: true:
      - "Create a task to finish the report by Friday"
      - "Add a meeting with John tomorrow at 3pm"
      - "Make a reminder for the presentation on Monday"
      - "Schedule a call with the team next week"
      - "Create the event" (when context mentions an event)
      
      Examples of statements that should return hasCommand: false (these are just informational):
      - "I need to research topics about cars and make a ppt"
      - "My presentation is due next Friday"
      - "I have to finish this project soon"
      - "The meeting is tomorrow at 2pm"
      
      If the message just describes something the user needs to do, but doesn't explicitly request creation of a task/event, return hasCommand: false.
      
      Current date for reference: ${new Date().toISOString().split('T')[0]}`
    };

    // Call Gemini API
    const response = await callGeminiApiDirectly(apiKey, [commandPrompt], {
      temperature: 0.1,
      maxOutputTokens: 1024
    });

    if (!response) {
      return { hasCommand: false, commandType: null, entities: null };
    }

    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hasCommand: false, commandType: null, entities: null };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse command detection result:", error);
      return { hasCommand: false, commandType: null, entities: null };
    }
  } catch (error) {
    console.error("Error detecting command intent:", error);
    return { hasCommand: false, commandType: null, entities: null };
  }
};

/**
 * Create a task from command entities
 */
export const createTaskFromCommand = async (
  userId: string, 
  entities: any
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for required fields
    if (!entities.title) {
      return { success: false, error: "Task title is required" };
    }
    
    // Find project if specified
    let projectId = undefined;
    if (entities.project_name) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${entities.project_name}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        projectId = data[0].id;
      }
    }
    
    // Create the task
    const task = await createTask({
      title: entities.title,
      description: entities.description,
      due_date: entities.due_date,
      priority: entities.priority,
      status: 'todo',
      project: projectId,
      labels: entities.labels || [],
    });
    
    return { success: true, title: task.title };
  } catch (error) {
    console.error("Error creating task from command:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating task" 
    };
  }
};

/**
 * Create an event from command entities
 */
export const createEventFromCommand = async (
  userId: string, 
  entities: any
): Promise<{ success: boolean; title?: string; time?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for required fields and attempt to auto-complete missing ones
    let eventTitle = entities.title;
    let startTime = entities.start_time;
    
    // If title is missing but we have context, try to create a title
    if (!eventTitle && entities.context) {
      eventTitle = `Event: ${entities.context}`;
    }
    
    // If still no title, provide a generic error
    if (!eventTitle) {
      return { success: false, error: "Event title is required" };
    }
    
    // If start time is missing but we have a date, try to set a default time
    if (!startTime && entities.date) {
      const dateObj = new Date(entities.date);
      dateObj.setHours(12, 0, 0); // Default to noon
      startTime = dateObj.toISOString();
    }
    
    if (!startTime) {
      return { success: false, error: "Event start time is required" };
    }
    
    // Set end time if not provided (default to 1 hour)
    const startTimeObj = new Date(startTime);
    let endTime;
    
    if (entities.end_time) {
      endTime = new Date(entities.end_time);
    } else {
      endTime = new Date(startTimeObj.getTime() + 60 * 60 * 1000); // Add 1 hour
    }
    
    // Find project if specified
    let projectId = undefined;
    if (entities.project_name) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${entities.project_name}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        projectId = data[0].id;
      }
    }
    
    // Create the event
    const event = await createEvent({
      title: eventTitle,
      description: entities.description,
      startTime: startTimeObj.toISOString(),
      endTime: endTime.toISOString(),
      source: 'app',
      project: projectId,
      participants: [],
    });
    
    // Format time for response
    const timeStr = `${startTimeObj.toLocaleDateString()} at ${startTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return { success: true, title: event.title, time: timeStr };
  } catch (error) {
    console.error("Error creating event from command:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating event" 
    };
  }
}; 