import { supabase } from "../../../../database/client";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "../core/geminiService";
import { createTask, deleteTask, updateTask } from "../../task.service";
import { createEvent, deleteEvent, updateEvent } from "../../eventService";
import { createProject, deleteProject, updateProject } from "../../project.service";

/**
 * Interface for command detection results
 */
export interface CommandDetectionResult {
  hasCommand: boolean;
  commandType: 'create_task' | 'create_event' | 'create_project' | 'set_reminder' | 'delete_task' | 'delete_event' | 'delete_project' | 'update_task' | 'update_event' | 'update_project' | null;
  entities: any;
  requiresConfirmation?: boolean;
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
      content: `Analyze this message and determine if it contains an EXPLICIT command to create, update or delete a task, event, or set a reminder:
      
      "${message}"
      
      ${context ? `Recent conversation context:\n${context}\n` : ''}
      
      Return ONLY a JSON object with the following structure:
      {
        "hasCommand": true/false,
        "commandType": one of ["create_task", "create_event", "create_project", "set_reminder", "delete_task", "delete_event", "delete_project", "update_task", "update_event", "update_project"] or null,
        "requiresConfirmation": true/false (set to true for all delete operations),
        "entities": {
          // For tasks:
          "title": "Task title",
          "description": "Task description",
          "due_date": "YYYY-MM-DD",
          "priority": "low/medium/high",
          "project_name": "Project name if mentioned",
          "labels": ["label1", "label2"] if mentioned,
          
          // For updates:
          "id": "Item ID if specified",
          "item_name": "Name/title of the item to update",
          "updates": {
            "field_name": "new value"
          },
          
          // For deletions:
          "id": "Item ID if specified",
          "item_name": "Name of the task/event/project to delete",
          
          // For events:
          "title": "Event title",
          "description": "Event description",
          "start_time": "YYYY-MM-DDTHH:MM:SS",
          "end_time": "YYYY-MM-DDTHH:MM:SS",
          "project_name": "Project name if mentioned",
          "context": "Information from recent conversation that provides context",
          "date": "YYYY-MM-DD date extracted from conversation",
          
          // For projects:
          "name": "Project name",
          "description": "Project description",
          "due_date": "YYYY-MM-DD",
          "priority": "low/medium/high",
          "status": "active/completed/on-hold",
          
          // For reminders:
          "task_id": null, // This will be filled in later
          "reminder_time": "YYYY-MM-DDTHH:MM:SS"
        }
      }
      
      IMPORTANT: ONLY return hasCommand: true if the message is CLEARLY and EXPLICITLY an instruction to create, update, or delete something.
      The message must include a direct command verb like "create", "add", "make", "schedule", "set up", "delete", "remove", "update", "change", etc.
      
      Special case: If user says something like "create the event" without specifics, set hasCommand: true and 
      commandType: "create_event", and extract any event details from the conversation context.
      
      Examples of commands that should return hasCommand: true:
      - "Create a task to finish the report by Friday"
      - "Add a meeting with John tomorrow at 3pm"
      - "Make a reminder for the presentation on Monday"
      - "Schedule a call with the team next week"
      - "Create the event" (when context mentions an event)
      - "Create a new project called Website Redesign"
      - "Make a project for the marketing campaign"
      - "Set up a new project with deadline next month"
      - "Delete the task about research"
      - "Remove the meeting with John"
      - "Update the project deadline to next Friday"
      - "Change the task priority to high"
      - "Change the meeting time to 3pm"
      - "Update the event for tomorrow at 2pm"
      - "Move the lunch meeting to 1:30"
      - "Can you edit this for 3pm?"
      - "Reschedule it to 4 o'clock"
      
      For time parsing, convert common formats to ISO format:
      - "2pm" or "2 pm" → "14:00:00"
      - "3:30pm" → "15:30:00"
      - "9am" → "09:00:00"
      - "noon" → "12:00:00"
      - "midnight" → "00:00:00"
      
      For event updates, use the "updates" field to specify what changed:
      - If user says "change time to 3pm", set updates: {"time": "YYYY-MM-DDTHH:MM:SS"}
      - If user says "update title to Meeting", set updates: {"title": "Meeting"}
      - If user says "move to tomorrow at 2pm", set updates: {"start_time": "YYYY-MM-DDTHH:MM:SS"}
      
      Examples of statements that should return hasCommand: false (these are just informational):
      - "I need to research topics about cars and make a ppt"
      - "My presentation is due next Friday"
      - "I have to finish this project soon"
      - "The meeting is tomorrow at 2pm"
      
      If the message just describes something the user needs to do, but doesn't explicitly request creation/modification/deletion of a task/event, return hasCommand: false.
      
      For all delete operations, make sure to set requiresConfirmation: true.
      
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
    
    // Format time for response with consistent 12-hour format
    const timeStr = `${startTimeObj.toLocaleDateString()} at ${startTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}`;
    
    return { success: true, title: event.title, time: timeStr };
  } catch (error) {
    console.error("Error creating event from command:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating event" 
    };
  }
};

/**
 * Create a project from command entities
 */
export const createProjectFromCommand = async (
  userId: string, 
  entities: any
): Promise<{ success: boolean; name?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for required fields
    if (!entities.name) {
      return { success: false, error: "Project name is required" };
    }
    
    // Create the project
    const project = await createProject({
      name: entities.name,
      description: entities.description || "",
      due_date: entities.due_date || null,
      priority: entities.priority || "medium",
      status: entities.status || "active",
    });
    
    return { success: true, name: project.name };
  } catch (error) {
    console.error("Error creating project from command:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating project" 
    };
  }
};

/**
 * Delete a task from command entities
 */
export const deleteTaskFromCommand = async (
  userId: string,
  entities: any
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for task identification info
    if (!entities.id && !entities.item_name) {
      return { success: false, error: "Task ID or name is required for deletion" };
    }
    
    // Try to find the task by ID or name
    let taskToDelete;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      taskToDelete = data;
    } else {
      // Find by name (title)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user", userId)
        .ilike("title", `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: `Task "${entities.item_name}" not found` };
      }
      taskToDelete = data[0];
    }
    
    if (!taskToDelete) {
      return { success: false, error: "Task not found" };
    }
    
    // Store title for response before deletion
    const title = taskToDelete.title;
    
    // Delete the task
    await deleteTask(taskToDelete.id);
    
    return { success: true, title };
  } catch (error) {
    console.error("Error deleting task from command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error deleting task"
    };
  }
};

/**
 * Delete an event from command entities
 */
export const deleteEventFromCommand = async (
  userId: string,
  entities: any
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for event identification info
    if (!entities.id && !entities.item_name) {
      return { success: false, error: "Event ID or name is required for deletion" };
    }
    
    // Try to find the event by ID or name
    let eventToDelete;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      eventToDelete = data;
    } else {
      // Find by name (title)
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user", userId)
        .ilike("title", `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: `Event "${entities.item_name}" not found` };
      }
      eventToDelete = data[0];
    }
    
    if (!eventToDelete) {
      return { success: false, error: "Event not found" };
    }
    
    // Store title for response before deletion
    const title = eventToDelete.title;
    
    // Delete the event
    await deleteEvent(eventToDelete.id);
    
    return { success: true, title };
  } catch (error) {
    console.error("Error deleting event from command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error deleting event"
    };
  }
};

/**
 * Update an event from command entities
 */
export const updateEventFromCommand = async (
  userId: string,
  entities: any
): Promise<{ success: boolean; title?: string; time?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for event identification info
    if (!entities.id && !entities.item_name) {
      return { success: false, error: "Event ID or name is required for updating" };
    }
    
    // Try to find the event by ID or name
    let eventToUpdate;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      eventToUpdate = data;
    } else {
      // Find by name (title)
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user", userId)
        .ilike("title", `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: `Event "${entities.item_name}" not found` };
      }
      eventToUpdate = data[0];
    }
    
    if (!eventToUpdate) {
      return { success: false, error: "Event not found" };
    }
    
    // Check if updates are provided
    if (!entities.updates && !entities.title && !entities.description && !entities.start_time && !entities.end_time) {
      return { success: false, error: "No updates provided" };
    }
    
    // Prepare the update object
    const updateData: any = {};
    
    // Apply updates from entities.updates if provided
    if (entities.updates) {
      Object.keys(entities.updates).forEach(key => {
        const value = entities.updates[key];
        switch (key) {
          case 'title':
          case 'description':
            updateData[key] = value;
            break;
          case 'start_time':
            updateData.start_time = value;
            break;
          case 'end_time':
            updateData.end_time = value;
            break;
          case 'time':
            // Handle "change time to 3pm" - update start time and adjust end time
            const newStartTime = value;
            updateData.start_time = newStartTime;
            // Keep the same duration if possible
            if (eventToUpdate.start_time && eventToUpdate.end_time) {
              const originalDuration = new Date(eventToUpdate.end_time).getTime() - new Date(eventToUpdate.start_time).getTime();
              const newEndTime = new Date(new Date(newStartTime).getTime() + originalDuration);
              updateData.end_time = newEndTime.toISOString();
            }
            break;
        }
      });
    }
    
    // Apply direct updates if provided
    if (entities.title) updateData.title = entities.title;
    if (entities.description) updateData.description = entities.description;
    if (entities.start_time) updateData.start_time = entities.start_time;
    if (entities.end_time) updateData.end_time = entities.end_time;
    
    // Handle project assignment if specified
    if (entities.project_name) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${entities.project_name}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        updateData.project = data[0].id;
      }
    }
    
    // Update the event using the existing updateEvent function
    const updatedEvent = await updateEvent(eventToUpdate.id, updateData);
    
    // Format time for response if time was updated
    let timeStr = undefined;
    if (updateData.start_time) {
      const startTimeObj = new Date(updateData.start_time);
      timeStr = `${startTimeObj.toLocaleDateString()} at ${startTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}`;
    }
    
    return { success: true, title: updatedEvent.title, time: timeStr };
  } catch (error) {
    console.error("Error updating event from command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating event"
    };
  }
};

/**
 * Delete a project from command entities
 */
export const deleteProjectFromCommand = async (
  userId: string,
  entities: any
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for project identification info
    if (!entities.id && !entities.item_name) {
      return { success: false, error: "Project ID or name is required for deletion" };
    }
    
    // Try to find the project by ID or name
    let projectToDelete;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      projectToDelete = data;
    } else {
      // Find by name
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user", userId)
        .ilike("name", `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: `Project "${entities.item_name}" not found` };
      }
      projectToDelete = data[0];
    }
    
    if (!projectToDelete) {
      return { success: false, error: "Project not found" };
    }
    
    // Store title for response before deletion
    const name = projectToDelete.name;
    
    // Check if project has associated items
    const [tasksResult, eventsResult, notesResult] = await Promise.all([
      supabase.from("tasks").select("id").eq("project", projectToDelete.id).limit(1),
      supabase.from("events").select("id").eq("project", projectToDelete.id).limit(1),
      supabase.from("notes").select("id").eq("project", projectToDelete.id).limit(1)
    ]);
    
    if (
      (tasksResult.data && tasksResult.data.length > 0) ||
      (eventsResult.data && eventsResult.data.length > 0) ||
      (notesResult.data && notesResult.data.length > 0)
    ) {
      return { 
        success: false, 
        error: "Project has associated tasks, events, or notes. Remove them first or use another method to delete the project." 
      };
    }
    
    // Delete the project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id)
      .eq("user", userId);
    
    if (error) throw error;
    
    return { success: true, title: name };
  } catch (error) {
    console.error("Error deleting project from command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error deleting project"
    };
  }
};

/**
 * Update a task from command entities
 */
export const updateTaskFromCommand = async (
  userId: string,
  entities: any
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Check for task identification info
    if (!entities.id && !entities.item_name) {
      return { success: false, error: "Task ID or name is required for updating" };
    }
    
    // Try to find the task by ID or name
    let taskToUpdate;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      taskToUpdate = data;
    } else {
      // Find by name (title)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user", userId)
        .ilike("title", `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: `Task "${entities.item_name}" not found` };
      }
      taskToUpdate = data[0];
    }
    
    if (!taskToUpdate) {
      return { success: false, error: "Task not found" };
    }
    
    // Check if updates are provided
    if (!entities.updates && !entities.title && !entities.description && !entities.due_date && !entities.priority && !entities.status) {
      return { success: false, error: "No updates provided" };
    }
    
    // Prepare updates
    const updates: any = { ...taskToUpdate };
    
    // Apply updates from entities.updates if provided
    if (entities.updates) {
      Object.keys(entities.updates).forEach(key => {
        const value = entities.updates[key];
        switch (key) {
          case 'title':
          case 'description':
          case 'priority':
            updates[key] = value;
            break;
          case 'due_date':
            updates.due_date = value;
            break;
          case 'status':
            // Validate status
            if (['todo', 'in_progress', 'done'].includes(value)) {
              updates.status = value;
            }
            break;
        }
      });
    }
    
    // Apply direct updates if provided
    if (entities.title) updates.title = entities.title;
    if (entities.description) updates.description = entities.description;
    if (entities.due_date) updates.due_date = entities.due_date;
    if (entities.priority) updates.priority = entities.priority;
    if (entities.status && ['todo', 'in_progress', 'done'].includes(entities.status)) {
      updates.status = entities.status;
    }
    
    // Handle project assignment if specified
    if (entities.project_name) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${entities.project_name}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        updates.project = data[0].id;
      }
    }
    
    // Update the task
    await updateTask(taskToUpdate.id, updates);
    
    return { success: true, title: updates.title };
  } catch (error) {
    console.error("Error updating task from command:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating task"
    };
  }
};

/**
 * Create a task from a suggestion with modifications
 */
export const createTaskFromSuggestion = async (
  userId: string,
  suggestionId: string,
  modifications: {
    title?: string;
    description?: string;
    due_date?: string;
    priority?: string;
    project_name?: string;
    labels?: string[];
  }
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Fetch the suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from("task_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .eq("user_id", userId)
      .single();
    
    if (suggestionError || !suggestion) {
      return { 
        success: false, 
        error: suggestionError?.message || "Suggestion not found" 
      };
    }
    
    // Find project if specified in modifications or original suggestion
    let projectId = undefined;
    const projectNameToUse = modifications.project_name || suggestion.project_name;
    
    if (projectNameToUse) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${projectNameToUse}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        projectId = data[0].id;
      }
    }
    
    // Create the task with modified values
    const task = await createTask({
      title: modifications.title || suggestion.title,
      description: modifications.description || suggestion.description,
      due_date: modifications.due_date || suggestion.due_date,
      priority: modifications.priority || suggestion.priority,
      status: 'todo',
      project: projectId,
      labels: modifications.labels || suggestion.labels || [],
    });
    
    // Delete the suggestion after creating the task
    await supabase
      .from("task_suggestions")
      .delete()
      .eq("id", suggestionId)
      .eq("user_id", userId);
    
    return { success: true, title: task.title };
  } catch (error) {
    console.error("Error creating task from suggestion:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating task" 
    };
  }
};

/**
 * Create an event from a suggestion with modifications
 */
export const createEventFromSuggestion = async (
  userId: string,
  suggestionId: string,
  modifications: {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    project_name?: string;
    participants?: string[];
  }
): Promise<{ success: boolean; title?: string; time?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");
    
    // Fetch the suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from("event_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .eq("user_id", userId)
      .single();
    
    if (suggestionError || !suggestion) {
      return { 
        success: false, 
        error: suggestionError?.message || "Suggestion not found" 
      };
    }
    
    // Find project if specified in modifications or original suggestion
    let projectId = undefined;
    const projectNameToUse = modifications.project_name || suggestion.project_name;
    
    if (projectNameToUse) {
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user", userId)
        .ilike("name", `%${projectNameToUse}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        projectId = data[0].id;
      }
    }
    
    // Check for start time
    const startTime = modifications.start_time || suggestion.start_time;
    if (!startTime) {
      return { success: false, error: "Event start time is required" };
    }
    
    // Set end time if not provided (default to 1 hour after start)
    let endTime = modifications.end_time || suggestion.end_time;
    if (!endTime) {
      const startTimeObj = new Date(startTime);
      const defaultEndTime = new Date(startTimeObj.getTime() + 60 * 60 * 1000); // Add 1 hour
      endTime = defaultEndTime.toISOString();
    }
    
    // Create the event with modified values
    // Based on the createEvent signature in eventService.ts, participants is just an empty array
    const event = await createEvent({
      title: modifications.title || suggestion.title,
      description: modifications.description || suggestion.description,
      startTime: startTime,
      endTime: endTime,
      source: 'app',
      project: projectId,
      participants: [], // Simplified - participant management handled elsewhere
    });
    
    // Delete the suggestion after creating the event
    await supabase
      .from("event_suggestions")
      .delete()
      .eq("id", suggestionId)
      .eq("user_id", userId);
    
    // Format time for response
    const startTimeObj = new Date(startTime);
    const timeStr = `${startTimeObj.toLocaleDateString()} at ${startTimeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    return { success: true, title: event.title, time: timeStr };
  } catch (error) {
    console.error("Error creating event from suggestion:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating event" 
    };
  }
}; 