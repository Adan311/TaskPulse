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
  message: string
): Promise<CommandDetectionResult> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for command detection");
      return { hasCommand: false, commandType: null, entities: null };
    }

    // Create a specialized command detection prompt
    const commandPrompt: FormattedMessage = {
      role: "user",
      content: `Analyze this message and determine if it contains a command to create a task, event, or set a reminder:
      
      "${message}"
      
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
          
          // For reminders:
          "task_id": null, // This will be filled in later
          "reminder_time": "YYYY-MM-DDTHH:MM:SS"
        }
      }
      
      Only return hasCommand: true if the message is clearly an instruction to create something.
      Examples of commands:
      - "Create a task to finish the report by Friday"
      - "Schedule a meeting with John tomorrow at 3pm"
      - "Remind me about the presentation on Monday morning"
      
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
    
    // Check for required fields
    if (!entities.title) {
      return { success: false, error: "Event title is required" };
    }
    
    if (!entities.start_time) {
      return { success: false, error: "Event start time is required" };
    }
    
    // Set end time if not provided (default to 1 hour)
    const startTime = new Date(entities.start_time);
    let endTime;
    
    if (entities.end_time) {
      endTime = new Date(entities.end_time);
    } else {
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
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
      title: entities.title,
      description: entities.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      source: 'app',
      project: projectId,
      participants: [],
    });
    
    // Format time for response
    const timeStr = `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return { success: true, title: event.title, time: timeStr };
  } catch (error) {
    console.error("Error creating event from command:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating event" 
    };
  }
}; 