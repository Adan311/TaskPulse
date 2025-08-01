import { supabase } from "../../../../database/client";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "../core/geminiService";
import { validateUser } from "@/shared/utils/authUtils";
import { createTask, deleteTask, updateTask } from "../../task.service";
import { createEvent, deleteEvent, updateEvent } from "../../event.service";
import { createProject, deleteProject, updateProject } from "../../project.service";

/**
 * Helper function for common validation and error responses
 */
const createErrorResponse = (error: string) => ({ success: false, error });

/**
 * Helper function to find an item (task/event/project) by ID or name
 */
const findItemByIdOrName = async (
  table: 'tasks' | 'events' | 'projects',
  userId: string,
  entities: { id?: string; item_name?: string }
): Promise<{ success: boolean; item?: any; error?: string }> => {
  try {
    if (!entities.id && !entities.item_name) {
      return createErrorResponse(`${table.slice(0, -1)} ID or name is required`);
    }

    let item;
    
    if (entities.id) {
      // Find by ID
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", entities.id)
        .eq("user", userId)
        .single();
      
      if (error) throw error;
      item = data;
    } else {
      // Find by name (title)
      const titleColumn = table === 'projects' ? 'name' : 'title';
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user", userId)
        .ilike(titleColumn, `%${entities.item_name}%`)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        return createErrorResponse(`${table.slice(0, -1)} "${entities.item_name}" not found`);
      }
      item = data[0];
    }

    if (!item) {
      return createErrorResponse(`${table.slice(0, -1)} not found`);
    }

    return { success: true, item };
  } catch (error) {
    console.error(`Error finding ${table.slice(0, -1)}:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : `Unknown error finding ${table.slice(0, -1)}`
    );
  }
};

/**
 * Interface for command detection results
 */
export interface CommandDetectionResult {
  hasCommand: boolean;
  commandType: 'create_task' | 'create_event' | 'create_project' | 'set_reminder' | 'delete_task' | 'delete_event' | 'delete_project' | 'update_task' | 'update_event' | 'update_project' | 'request_suggestions' | null;
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
        "commandType": one of ["create_task", "create_event", "create_project", "set_reminder", "delete_task", "delete_event", "delete_project", "update_task", "update_event", "update_project", "request_suggestions"] or null,
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
          
          // For reminders (can be added to tasks/events):
          "reminder_time": "YYYY-MM-DDTHH:MM:SS", // When to send reminder
          "due_date": "YYYY-MM-DD", // Set due date when reminder is specified
          
          // For suggestion requests:
          "type": "tasks" or "events" or "both" // What type of suggestions to generate
        }
      }
      
      IMPORTANT: ONLY return hasCommand: true if the message is CLEARLY and EXPLICITLY an instruction to create, update, delete something, OR request suggestions.
      The message must include a direct command verb like "create", "add", "make", "schedule", "set up", "delete", "remove", "update", "change", "suggest", "generate", etc.
      
      Special cases: 
      - If user says something like "create the event" without specifics, set hasCommand: true and commandType: "create_event", and extract any event details from the conversation context.
      - If user says "create a task" without specifics, use conversation context to infer a reasonable title. If no context available, set title to "New Task" and let the system ask for details.
      - For suggestion requests like "suggest me tasks", "generate suggestions", "give me task suggestions", set commandType: "request_suggestions".
      
      Examples of commands that should return hasCommand: true:
      - "Create a task to finish the report by Friday"
      - "Add a meeting with John tomorrow at 3pm"
      - "Make a reminder for the presentation on Monday"
      - "Schedule a call with the team next week"
      - "Remind me to submit the report by 5pm"
      - "Set a reminder to call mom at 7pm"
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
      - "Create a task" (use context or set generic title)
      - "Suggest me tasks"
      - "Generate task suggestions"
      - "Give me some suggestions"
      - "Show me suggestions"
      - "Remind me to call John at 3pm tomorrow"
      - "Set a reminder for the meeting in 30 minutes"
      - "Create a task with reminder for next week"
      
      For time parsing, convert common formats to ISO format:
      - "2pm" or "2 pm" → "14:00:00"
      - "3:30pm" → "15:30:00"
      - "9am" → "09:00:00"
      - "noon" → "12:00:00"
      - "midnight" → "00:00:00"
      
      IMPORTANT: When a reminder is specified, ALWAYS set a due_date as well:
      - If reminder is "tomorrow at 3pm", set due_date to tomorrow's date
      - If reminder is "in 30 minutes", set due_date to current date 
      - If reminder is "next Friday", set due_date to next Friday
      - The frontend requires due_date to properly display reminders
      
      For event updates, use the "updates" field to specify what changed:
      - If user says "change time to 3pm", set updates: {"time": "YYYY-MM-DDTHH:MM:SS"}
      - If user says "update title to Meeting", set updates: {"title": "Meeting"}
      - If user says "move to tomorrow at 2pm", set updates: {"start_time": "YYYY-MM-DDTHH:MM:SS"}
      
      For task/event identification when user says "it", "this", "that", "the task", etc:
      - Look at recent conversation context to find the most recently created/mentioned task/event
      - If user just created a task called "call mom", and then says "link it to project alpha", 
        set item_name: "call mom" and project_name: "alpha"
      - Use conversation history to infer which item the user is referring to
      
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
  entities: any,
  conversationHistory?: any[]
): Promise<{ success: boolean; title?: string; error?: string }> => {
  try {
    // First check if user is authenticated
    const user = await validateUser(userId);
    
    // Check for required fields
    if (!entities.title) {
      // If no title provided, try to infer from conversation context or provide a default
      if (conversationHistory && conversationHistory.length > 0) {
        // Look for task-related context in recent conversation
        const recentContext = conversationHistory.slice(-3).map(msg => msg.content).join(' ');
        const contextLower = recentContext.toLowerCase();
        
        // Try to extract a task from context
        if (contextLower.includes('japan') || contextLower.includes('trip')) {
          entities.title = "Plan Japan trip";
        } else if (contextLower.includes('project') || contextLower.includes('work')) {
          entities.title = "Work on project";
        } else if (contextLower.includes('meeting') || contextLower.includes('call')) {
          entities.title = "Prepare for meeting";
        } else {
          entities.title = "New Task";
        }
      } else {
        entities.title = "New Task";
      }
    }
    
    // Find project if specified
    let projectId = undefined;
    if (entities.project_name) {
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user", userId)
        .eq("name", entities.project_name)
        .limit(1);
      
      if (!exactError && exactMatch && exactMatch.length > 0) {
        projectId = exactMatch[0].id;
        console.log(`Task linked to project: ${exactMatch[0].name} (ID: ${projectId})`);
      } else {
        // Try case-insensitive match
        const { data: allProjects, error: allError } = await supabase
          .from("projects")
          .select("id, name")
          .eq("user", userId);
        
        if (!allError && allProjects) {
          const matchingProject = allProjects.find(p => 
            p.name.toLowerCase() === entities.project_name.toLowerCase()
          );
          if (matchingProject) {
            projectId = matchingProject.id;
            console.log(`Task linked to project (case-insensitive): ${matchingProject.name} (ID: ${projectId})`);
          } else {
            console.log(`No project found matching: "${entities.project_name}". Available projects:`, allProjects.map(p => p.name));
          }
        }
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
      reminder_at: entities.reminder_time || null,
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
    const user = await validateUser(userId);
    
    // Check for required fields and attempt to auto-complete missing ones
    let eventTitle = entities.title;
    let startTime = entities.start_time;
    
    // If title is missing but we have context, try to create a title
    if (!eventTitle && entities.context) {
      eventTitle = `Event: ${entities.context}`;
    }
    
    // If still no title, provide a generic error
    if (!eventTitle) {
      return createErrorResponse("Event title is required");
    }
    
    // If start time is missing but we have a date, try to set a default time
    if (!startTime && entities.date) {
      const dateObj = new Date(entities.date);
      dateObj.setHours(12, 0, 0); // Default to noon
      startTime = dateObj.toISOString();
    }
    
    if (!startTime) {
      return createErrorResponse("Event start time is required");
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
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user", userId)
        .eq("name", entities.project_name)
        .limit(1);
      
      if (!exactError && exactMatch && exactMatch.length > 0) {
        projectId = exactMatch[0].id;
        console.log(`Event linked to project: ${exactMatch[0].name} (ID: ${projectId})`);
      } else {
        // Try case-insensitive match
        const { data: allProjects, error: allError } = await supabase
          .from("projects")
          .select("id, name")
          .eq("user", userId);
        
        if (!allError && allProjects) {
          const matchingProject = allProjects.find(p => 
            p.name.toLowerCase() === entities.project_name.toLowerCase()
          );
          if (matchingProject) {
            projectId = matchingProject.id;
            console.log(`Event linked to project (case-insensitive): ${matchingProject.name} (ID: ${projectId})`);
          } else {
            console.log(`No project found matching: "${entities.project_name}". Available projects:`, allProjects.map(p => p.name));
          }
        }
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
      reminderAt: entities.reminder_time || undefined,
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
    // Find the task using the helper function
    const result = await findItemByIdOrName('tasks', userId, entities);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const taskToDelete = result.item;
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
    const user = await validateUser(userId);
    
    // Find the event using the helper function
    const result = await findItemByIdOrName('events', userId, entities);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const eventToDelete = result.item;
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
    const user = await validateUser(userId);
    
    // Find the event using the helper function
    const result = await findItemByIdOrName('events', userId, entities);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const eventToUpdate = result.item;
    
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
    // Find the task using the helper function
    const result = await findItemByIdOrName('tasks', userId, entities);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const taskToUpdate = result.item;
    
    // Check if updates are provided
    if (!entities.updates && !entities.title && !entities.description && !entities.due_date && !entities.priority && !entities.status) {
      return { success: false, error: "No updates provided" };
    }
    
    // Prepare updates - start with empty object, not copy of original task
    const updates: any = {};
    
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
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user", userId)
        .eq("name", entities.project_name)
        .limit(1);
      
      if (!exactError && exactMatch && exactMatch.length > 0) {
        updates.project = exactMatch[0].id;
        console.log(`Task linked to project: ${exactMatch[0].name} (ID: ${updates.project})`);
      } else {
        // Try case-insensitive match
        const { data: allProjects, error: allError } = await supabase
          .from("projects")
          .select("id, name")
          .eq("user", userId);
        
        if (!allError && allProjects) {
          const matchingProject = allProjects.find(p => 
            p.name.toLowerCase() === entities.project_name.toLowerCase()
          );
          if (matchingProject) {
            updates.project = matchingProject.id;
            console.log(`Task linked to project (case-insensitive): ${matchingProject.name} (ID: ${updates.project})`);
          } else {
            console.log(`No project found matching: "${entities.project_name}". Available projects:`, allProjects.map(p => p.name));
          }
        }
      }
    }
    
    console.log(`Original task project: ${taskToUpdate.project}`);
    console.log(`Updates object:`, updates);
    
    // Update the task - only pass the fields that have changed
    const updateFields: any = {};
    
    // Only include fields that are different from the original
    if (updates.title && updates.title !== taskToUpdate.title) updateFields.title = updates.title;
    if (updates.description && updates.description !== taskToUpdate.description) updateFields.description = updates.description;
    if (updates.due_date && updates.due_date !== taskToUpdate.due_date) updateFields.due_date = updates.due_date;
    if (updates.priority && updates.priority !== taskToUpdate.priority) updateFields.priority = updates.priority;
    if (updates.status && updates.status !== taskToUpdate.status) updateFields.status = updates.status;
    if (updates.project !== undefined && updates.project !== taskToUpdate.project) updateFields.project = updates.project;
    
    console.log(`Updating task ${taskToUpdate.id} with fields:`, updateFields);
    
    // Only update if there are actually fields to update
    if (Object.keys(updateFields).length === 0) {
      return { success: false, error: "No changes detected - task is already up to date" };
    }
    
    const updatedTask = await updateTask(taskToUpdate.id, updateFields);
    
    return { success: true, title: updatedTask.title };
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
    const user = await validateUser(userId);
    
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
    const user = await validateUser(userId);
    
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