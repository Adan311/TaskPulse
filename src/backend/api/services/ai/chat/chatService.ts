import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "../core/geminiService";
import { analyzeConversation, saveTaskSuggestions, saveEventSuggestions, ClarifyingQuestion } from "../suggestions/suggestionService";
import { 
  detectCommandIntent, 
  createTaskFromCommand, 
  createEventFromCommand,
  createProjectFromCommand,
  deleteTaskFromCommand,
  deleteEventFromCommand,
  deleteProjectFromCommand,
  updateTaskFromCommand,
  CommandDetectionResult 
} from "../commands/commandService";
import { getUserEvents, getUserTasks, formatDateForUser, formatTimeForUser, getUserProjects, getProjectItems, getProjectProgress, getProjectTimeline, getUserFiles, getUserNotes } from "../core/userDataService";
import { buildContextualPrompt } from "../core/contextService";

/**
 * Types for chat messages
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

/**
 * Create a new conversation
 */
export const createConversation = async (title?: string): Promise<ChatConversation | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to create a conversation");
      return null;
    }
    
    const newConversation = {
      id: uuidv4(),
      user_id: user.id,
      title: title || "New Conversation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert(newConversation)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error("Exception creating conversation:", error);
    return null;
  }
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (): Promise<ChatConversation[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to get conversations");
      return [];
    }
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error("Error getting conversations:", error);
      return [];
    }
    
    return (data || []).map(conv => ({
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at
    }));
  } catch (error) {
    console.error("Exception getting conversations:", error);
    return [];
  }
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<ChatConversation | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to get a conversation");
      return null;
    }
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error("Error getting conversation:", error);
      return null;
    }
    
    // Get messages for this conversation
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (messagesError) {
      console.error("Error getting conversation messages:", messagesError);
      return null;
    }
    
    const messages = (messagesData || []).map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      userId: msg.user_id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant' | 'system',
      createdAt: msg.created_at
    }));
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messages
    };
  } catch (error) {
    console.error("Exception getting conversation:", error);
    return null;
  }
};

/**
 * Generate a title for a conversation based on its content
 */
export const generateConversationTitle = async (
  conversationId: string, 
  messages: ChatMessage[]
): Promise<string> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey || messages.length === 0) {
      return "New Conversation";
    }
    
    // Prepare a prompt for title generation using the first few messages
    const messagesToUse = messages.slice(0, Math.min(messages.length, 4));
    
    const formattedHistory: FormattedMessage[] = messagesToUse.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));
    
    // Add the title generation instruction
    formattedHistory.push({
      role: 'user',
      content: "Based on the above conversation, generate a short, descriptive title (5 words or less). Return ONLY the title text, nothing else."
    });
    
    // Get a title suggestion from Gemini
    const response = await callGeminiApiDirectly(apiKey, formattedHistory, {
      temperature: 0.7,
      maxOutputTokens: 30
    });
    
    if (!response) {
      return "New Conversation";
    }
    
    // Clean up the response (remove quotes, periods, etc.)
    const cleanTitle = response.replace(/^["']|["']$|[.:]$/g, '').trim();
    return cleanTitle || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Conversation";
  }
};

/**
 * Update conversation title
 */
export const updateConversationTitle = async (
  conversationId: string, 
  title?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to update a conversation");
      return false;
    }
    
    // If no title is provided, get the conversation to generate one
    let newTitle = title;
    if (!newTitle) {
      const conversation = await getConversation(conversationId);
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        newTitle = await generateConversationTitle(conversationId, conversation.messages);
      } else {
        newTitle = "New Conversation";
      }
    }
    
    const { error } = await supabase
      .from('ai_conversations')
      .update({ 
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', user.id);
      
    if (error) {
      console.error("Error updating conversation:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating conversation:", error);
    return false;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to delete a conversation");
      return false;
    }
    
    // First delete all messages (this could be handled by cascade delete in the database)
    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .eq('conversation_id', conversationId);
      
    if (messagesError) {
      console.error("Error deleting conversation messages:", messagesError);
      return false;
    }
    
    // Then delete the conversation
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);
      
    if (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception deleting conversation:", error);
    return false;
  }
};

/**
 * Send a message and get AI response
 */
export const sendMessage = async (
  conversationId: string, 
  message: string
): Promise<{
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  newSuggestions?: {type: 'task'|'event', id: string, title: string}[]; // This might be complex to populate accurately without more info from suggestion service
  hasOverallSuggestions?: boolean;
  clarifyingQuestions?: ClarifyingQuestion[];
  pendingConfirmation?: {
    type: string;
    entities: any;
    message: string;
  };
} | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const userMessage: ChatMessage = {
      id: uuidv4(),
      conversationId,
      userId: user.id,
      content: message,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const { error: userMessageError } = await supabase.from('ai_messages').insert({
      id: userMessage.id,
      conversation_id: conversationId,
      user_id: user.id,
      content: message,
      role: 'user',
      created_at: userMessage.createdAt
    });

    if (userMessageError) throw userMessageError;

    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesError) throw messagesError;

    const history: ChatMessage[] = messagesData.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      userId: msg.user_id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant' | 'system',
      createdAt: msg.created_at
    }));

    // Check if this is a confirmation for a pending operation
    // Enhanced pattern to catch more variations of confirmation responses
    const confirmationMatch = message.match(/^(?:yes|yea|confirm|ok|sure|go ahead|proceed|y|yep|yeah|do it|fine|agreed|alright|let's do it|i confirm|approved|i agree|absolutely|definitely)$/i);
    // Enhanced pattern to catch more variations of rejection responses
    const rejectionMatch = message.match(/^(?:no|na|cancel|don't|abort|stop|dont|nope|n|nevermind|decline|reject|negative|i don't want to|don't do it|i decline)$/i);
    
    const lastAssistantMessage = history
      .filter(msg => msg.role === 'assistant')
      .pop();
      
    // Check for pending confirmation based on message content
    const hasPendingConfirmation = lastAssistantMessage?.content.includes("Are you sure you want to delete");
    
    if (hasPendingConfirmation && (confirmationMatch || rejectionMatch)) {
      // Extract the stored command from the previous message
      let commandInfo: { type: string; entities: any } | null = null;
      
      try {
        // Get command info from the metadata field if the message content suggests a deletion confirmation
        if (lastAssistantMessage && 
            lastAssistantMessage.content.includes("Are you sure you want to delete")) {
          
          // Query for the metadata field that contains the command info
          const { data, error } = await supabase
            .from('ai_messages')
            .select('metadata')
            .eq('id', lastAssistantMessage.id)
            .single();
          
          if (error) {
            console.error("Error retrieving message metadata:", error);
          } else if (data && data.metadata) {
            // Get command info from the metadata
            commandInfo = data.metadata;
          } else {
            // Fallback for older messages that might still use HTML comments
            const jsonMatch = lastAssistantMessage.content.match(/<!-- COMMAND_DATA: (.*?) -->/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                commandInfo = JSON.parse(jsonMatch[1]);
              } catch (parseError) {
                console.error("Failed to parse legacy command info:", parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to retrieve command info:", error);
      }
      
      if (rejectionMatch) {
        // User canceled the operation
        const aiResponseMessage: ChatMessage = {
          id: uuidv4(),
          conversationId,
          userId: user.id,
          content: "Operation canceled.",
          role: 'assistant',
          createdAt: new Date().toISOString(),
        };
        
        await supabase.from('ai_messages').insert({
          id: aiResponseMessage.id,
          conversation_id: conversationId,
          user_id: user.id,
          content: aiResponseMessage.content,
          role: 'assistant',
          created_at: aiResponseMessage.createdAt
        });
        
        return { userMessage, aiMessage: aiResponseMessage };
      }
      
      if (confirmationMatch && commandInfo) {
        // User confirmed, proceed with the operation
        let commandResponseText = "";
        
        switch (commandInfo.type) {
          case 'delete_task':
            const taskResult = await deleteTaskFromCommand(user.id, commandInfo.entities);
            commandResponseText = taskResult.success 
              ? `✅ Deleted task: "${taskResult.title}"`
              : `❌ Failed to delete task: ${taskResult.error}`;
            break;
            
          case 'delete_event':
            const eventResult = await deleteEventFromCommand(user.id, commandInfo.entities);
            commandResponseText = eventResult.success 
              ? `✅ Deleted event: "${eventResult.title}"`
              : `❌ Failed to delete event: ${eventResult.error}`;
            break;
            
          case 'delete_project':
            const projectResult = await deleteProjectFromCommand(user.id, commandInfo.entities);
            commandResponseText = projectResult.success 
              ? `✅ Deleted project: "${projectResult.title}"`
              : `❌ Failed to delete project: ${projectResult.error}`;
            break;
            
          default:
            commandResponseText = "Unknown command type. Operation canceled.";
        }
        
        const aiResponseMessage: ChatMessage = {
          id: uuidv4(),
          conversationId,
          userId: user.id,
          content: commandResponseText,
          role: 'assistant',
          createdAt: new Date().toISOString(),
        };
        
        await supabase.from('ai_messages').insert({
          id: aiResponseMessage.id,
          conversation_id: conversationId,
          user_id: user.id,
          content: commandResponseText,
          role: 'assistant',
          created_at: aiResponseMessage.createdAt
        });
        
        return { userMessage, aiMessage: aiResponseMessage };
      }
    }

    // Handle explicit commands first
    const commandResult = await detectCommandIntent(message, history);
    
    if (commandResult.hasCommand && commandResult.commandType) {
      // If the command requires confirmation (e.g., delete operations)
      if (commandResult.requiresConfirmation) {
        let itemType = "item";
        let itemName = "unknown";
        
        if (commandResult.entities.item_name) {
          itemName = commandResult.entities.item_name;
        }
        
        if (commandResult.commandType === 'delete_task') {
          itemType = "task";
        } else if (commandResult.commandType === 'delete_event') {
          itemType = "event";
        } else if (commandResult.commandType === 'delete_project') {
          itemType = "project";
        }
        
        // Store command info in a hidden comment
        const commandInfo = JSON.stringify({
          type: commandResult.commandType,
          entities: commandResult.entities
        });
        
        // Create confirmation message with the data stored in a special format
        // We'll use a separate field in the database rather than embedded HTML comments
        const visibleMessage = `Are you sure you want to delete the ${itemType} "${itemName}"? Please confirm with "yes" or cancel with "no".`;
        
        // Store command info as a separate metadata property in memory
        const pendingCommandInfo = commandInfo;
        
        const aiConfirmationMessage: ChatMessage = {
          id: uuidv4(),
          conversationId,
          userId: user.id,
          content: visibleMessage, // Only store the visible message
          role: 'assistant',
          createdAt: new Date().toISOString(),
        };
        
        // Store command data in the metadata column that won't be shown in the UI
        await supabase.from('ai_messages').insert({
          id: aiConfirmationMessage.id,
          conversation_id: conversationId,
          user_id: user.id,
          content: visibleMessage, // Only the visible message here
          role: 'assistant',
          created_at: aiConfirmationMessage.createdAt,
          metadata: JSON.parse(pendingCommandInfo) // Store command info in metadata
        });
        
        return { 
          userMessage, 
          aiMessage: aiConfirmationMessage,
          pendingConfirmation: {
            type: commandResult.commandType,
            entities: commandResult.entities,
            message: visibleMessage // Just use the visible message here
          }
        };
      }
      
      // For non-confirmation commands, process immediately
      let commandResponseText = "";
      if (commandResult.commandType === 'create_task') {
        const taskResult = await createTaskFromCommand(user.id, commandResult.entities);
        commandResponseText = taskResult.success 
          ? `✅ Created task: "${taskResult.title}"`
          : `❌ Failed to create task: ${taskResult.error}`;
      } else if (commandResult.commandType === 'create_event') {
        const eventResult = await createEventFromCommand(user.id, commandResult.entities);
        commandResponseText = eventResult.success 
          ? `✅ Created event: "${eventResult.title}" for ${eventResult.time}`
          : `❌ Failed to create event: ${eventResult.error}`;
      } else if (commandResult.commandType === 'create_project') {
        const projectResult = await createProjectFromCommand(user.id, commandResult.entities);
        commandResponseText = projectResult.success 
          ? `✅ Created project: "${projectResult.name}"`
          : `❌ Failed to create project: ${projectResult.error}`;
      } else if (commandResult.commandType === 'set_reminder') {
        commandResponseText = "Setting reminders directly is not fully implemented yet. You can create a task with a due date instead.";
      } else if (commandResult.commandType === 'update_task') {
        const updateResult = await updateTaskFromCommand(user.id, commandResult.entities);
        commandResponseText = updateResult.success 
          ? `✅ Updated task: "${updateResult.title}"`
          : `❌ Failed to update task: ${updateResult.error}`;
      } else if (commandResult.commandType === 'update_event') {
        commandResponseText = "Updating events is not fully implemented yet. You can delete and recreate the event instead.";
      } else if (commandResult.commandType === 'update_project') {
        commandResponseText = "Updating projects is not fully implemented yet. Please use the project settings page.";
      }

      const aiCommandResponseMessage: ChatMessage = {
        id: uuidv4(),
        conversationId,
        userId: user.id, // Attributed to user for consistency in Supabase, but role is assistant
        content: commandResponseText,
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };
      await supabase.from('ai_messages').insert({
        id: aiCommandResponseMessage.id,
        conversation_id: conversationId,
        user_id: user.id,
        content: commandResponseText,
        role: 'assistant',
        created_at: aiCommandResponseMessage.createdAt
      });
      return { userMessage, aiMessage: aiCommandResponseMessage };
    }

    // If not a command, check if it's a user data query (like asking about calendar events)
    const userDataResponse = await handleUserDataQuery(user.id, message);
    if (userDataResponse) {
      const aiDataResponseMessage: ChatMessage = {
        id: uuidv4(),
        conversationId,
        userId: user.id,
        content: userDataResponse,
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };
      await supabase.from('ai_messages').insert({
        id: aiDataResponseMessage.id,
        conversation_id: conversationId,
        user_id: user.id,
        content: userDataResponse,
        role: 'assistant',
        created_at: aiDataResponseMessage.createdAt
      });
      return { userMessage, aiMessage: aiDataResponseMessage };
    }

    // If not a command or user data query, proceed with contextual AI chat and passive suggestion analysis
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key available. Please add your API key in the settings.");
    }

    // Build contextual prompt with user data and conversation context
    const contextualPrompt = await buildContextualPrompt(user.id, conversationId, message);
    
    // Combine the contextual information with the conversation history
    const systemPrompt = `${contextualPrompt.basePrompt}${contextualPrompt.userContext}${contextualPrompt.conversationContext}${contextualPrompt.relevantData}${contextualPrompt.responseGuidelines}`;
    
    // Format history for Gemini, but prepend the contextual system message
    const formattedHistoryForGemini: FormattedMessage[] = [
      {
        role: 'user' as const,
        content: systemPrompt
      },
      ...history.map(msg => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      content: msg.content
      }))
    ];

    const aiResponseText = await callGeminiApiDirectly(apiKey, formattedHistoryForGemini);
    if (!aiResponseText) {
      throw new Error("Failed to get response from Gemini API");
    }

    const aiMessage: ChatMessage = {
      id: uuidv4(),
      conversationId,
      userId: user.id, 
      content: aiResponseText,
      role: 'assistant',
      createdAt: new Date().toISOString(),
    };

    const { error: aiMessageError } = await supabase.from('ai_messages').insert({
      id: aiMessage.id,
      conversation_id: conversationId,
      user_id: user.id,
      content: aiResponseText,
      role: 'assistant',
      created_at: aiMessage.createdAt
    });

    if (aiMessageError) throw aiMessageError;

    if (history.length <= 1) {
      await updateConversationTitle(conversationId);
    }

    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Analyze conversation for passive suggestions
    let hasOverallSuggestions = false;
    let clarifyingQuestions: ClarifyingQuestion[] | undefined = undefined;
    try {
      const updatedHistoryWithAiResponse = [...history, aiMessage]; // Use history *including* the latest AI response
      console.log("Analyzing conversation for passive suggestions after AI response...");
      const extractionResult = await analyzeConversation(updatedHistoryWithAiResponse);
      
      if (extractionResult) {
        console.log(`Passive extraction found ${extractionResult.tasks?.length || 0} tasks, ${extractionResult.events?.length || 0} events, ${extractionResult.clarifying_questions?.length || 0} questions.`);
        const hasActualSuggestions = (extractionResult.tasks && extractionResult.tasks.length > 0) || 
                                   (extractionResult.events && extractionResult.events.length > 0);

        if (hasActualSuggestions) {
          if (extractionResult.tasks && extractionResult.tasks.length > 0) {
            await saveTaskSuggestions(user.id, extractionResult.tasks, aiMessage.id);
          }
          if (extractionResult.events && extractionResult.events.length > 0) {
            await saveEventSuggestions(user.id, extractionResult.events, aiMessage.id);
          }
          hasOverallSuggestions = true;
        }
        if (extractionResult.clarifying_questions && extractionResult.clarifying_questions.length > 0) {
          clarifyingQuestions = extractionResult.clarifying_questions;
          // Potentially set hasOverallSuggestions to true even for questions, if UI should react
        }
      } else {
        console.log("No passive extraction result from analysis.");
      }
    } catch (error) {
      console.error("Error extracting passive suggestions:", error);
    }

    return { userMessage, aiMessage, hasOverallSuggestions, clarifyingQuestions };
  } catch (error) {
    console.error("Error sending message:", error);
    // Return null or throw, depending on desired error handling for the caller (ChatWindow.tsx)
    // Throwing will allow ChatWindow to display a generic error toast
    throw error;
  }
};

/**
 * Handle queries about user data like "What events do I have on June 5th?"
 */
export const handleUserDataQuery = async (
  userId: string,
  query: string
): Promise<string | null> => {
  try {
    // Check if query is about calendar/events
    const calendarEventKeywords = [
      'event', 'calendar', 'schedule', 'appointment', 'meeting', 'have on', 
      'what do i have', 'what\'s on', 'what is on', 'happening on', 'planned for'
    ];
    
    // Check if query is about tasks
    const taskKeywords = [
      'task', 'to-do', 'to do', 'todo', 'need to do', 'should do', 
      'assignment', 'work', 'project tasks'
    ];

    // Check if query is about projects
    const projectKeywords = [
      'project', 'projects', 'working on', 'current projects', 'active projects',
      'completed projects', 'project status'
    ];

    // Check if query is about project progress/analytics
    const progressKeywords = [
      'progress', 'analytics', 'status', 'stats', 'statistics', 'overview',
      'how is', 'how are', 'performance', 'completion', 'summary'
    ];
    
    // Check if query is about project timeline
    const timelineKeywords = [
      'timeline', 'deadline', 'deadlines', 'schedule', 'upcoming', 'due dates',
      'when is', 'when are', 'calendar', 'dates'
    ];
    
    // Check if query is about files
    const fileKeywords = [
      'file', 'files', 'document', 'documents', 'upload', 'uploads', 'attachment', 'attachments',
      'pdf', 'image', 'images', 'photo', 'photos', 'video', 'videos'
    ];
    
    // Check if query is about events/calendar
    const eventKeywords = [
      'event', 'events', 'meeting', 'meetings', 'appointment', 'appointments', 'calendar',
      'schedule', 'scheduled', 'when', 'today', 'tomorrow', 'this week', 'next week',
      'yesterday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
    
    // Check if query is about notes
    const noteKeywords = [
      'note', 'notes', 'written', 'wrote', 'remember', 'recorded', 'documented',
      'jotted', 'memo', 'memos', 'notebook', 'journal', 'ideas', 'thoughts'
    ];
    
    // Check if query is about tasks
    const taskQueryKeywords = [
      'task', 'tasks', 'todo', 'todos', 'to-do', 'to-dos', 'assignment', 'assignments',
      'work', 'job', 'complete', 'completed', 'done', 'pending', 'overdue', 'due'
    ];

    // Question words that should NOT be treated as project names
    const questionWords = ['what', 'which', 'how', 'when', 'where', 'who', 'why', 'tell', 'show', 'list', 'get', 'give'];

    // ENHANCED PROJECT NAME AND ITEM TYPE EXTRACTION
    let projectNameFromQuery = null;
    let requestedItemType = null; // 'tasks', 'events', 'notes', 'files', or null for all
    
    // Pattern 1: "what tasks do I have in the AUTO project"
    const pattern1 = /(?:what|which|list|show|get|any|all)?\s*(items?|tasks?|events?|notes?|files?)\s+(?:do\s+i\s+have\s+)?(?:in|for|from|of)\s+(?:the\s+)?([\w\s'-]+?)\s+project/i;
    
    // Pattern 2: "tasks in AUTO project" or "tasks for AUTO"
    const pattern2 = /(items?|tasks?|events?|notes?|files?)\s+(?:in|for|from|of|linked\s+to|related\s+to|assigned\s+to)\s+(?:the\s+)?([\w\s'-]+?)(?:\s+project|\s*$|\?|\.)/i;
    
    // Pattern 3: "AUTO project tasks" or "AUTO tasks"
    const pattern3 = /([\w\s'-]+?)\s+(?:project\s+)?(items?|tasks?|events?|notes?|files?)/i;
    
    // Pattern 4: "in the AUTO project, what tasks" (project mentioned first)
    const pattern4 = /(?:in|for|about)\s+(?:the\s+)?([\w\s'-]+?)\s+project[,\s]+(?:what|which|list|show|any|all)?\s*(items?|tasks?|events?|notes?|files?)/i;
    
    // Pattern 5: "tasks that are in AUTO" or "tasks that belong to AUTO"
    const pattern5 = /(items?|tasks?|events?|notes?|files?)\s+(?:that\s+)?(?:are|is|belong\s+to|linked\s+to|related\s+to)\s+(?:in\s+)?(?:the\s+)?([\w\s'-]+?)(?:\s+project|\s*$|\?|\.)/i;
    
    // Pattern 6: General project content queries - "what's in AUTO project", "everything in AUTO"
    const pattern6 = /(?:what|everything|all|anything).*?(?:in|for|from|of)\s+(?:the\s+)?([\w\s'-]+?)\s+project/i;
    
    // Try all patterns and get the first match
    const patterns = [
      { pattern: pattern1, projectIndex: 2, itemIndex: 1 },
      { pattern: pattern2, projectIndex: 2, itemIndex: 1 },
      { pattern: pattern3, projectIndex: 1, itemIndex: 2 },
      { pattern: pattern4, projectIndex: 1, itemIndex: 2 },
      { pattern: pattern5, projectIndex: 2, itemIndex: 1 },
      { pattern: pattern6, projectIndex: 1, itemIndex: null } // General content query
    ];
    
    for (const { pattern, projectIndex, itemIndex } of patterns) {
      const match = query.match(pattern);
      if (match && match[projectIndex]) {
        let extractedName = match[projectIndex].trim();
        
        // Clean up common words that might be captured
        const stopWords = ['my', 'the', 'a', 'an', 'this', 'that', 'these', 'those', 'all', 'some', 'any'];
        const words = extractedName.split(/\s+/);
        const cleanedWords = words.filter(word => !stopWords.includes(word.toLowerCase()));
        
        if (cleanedWords.length > 0) {
          const candidateProjectName = cleanedWords.join(' ');
          
          // CRITICAL FIX: Filter out question words that are not project names
          if (!questionWords.includes(candidateProjectName.toLowerCase())) {
            projectNameFromQuery = candidateProjectName;
            
            // Extract item type if available
            if (itemIndex && match[itemIndex]) {
              const itemType = match[itemIndex].toLowerCase();
              if (itemType.includes('task')) requestedItemType = 'tasks';
              else if (itemType.includes('event')) requestedItemType = 'events';
              else if (itemType.includes('note')) requestedItemType = 'notes';
              else if (itemType.includes('file')) requestedItemType = 'files';
              else if (itemType.includes('item')) requestedItemType = null; // all items
            }
            break;
          }
        }
      }
    }
    
    // Additional validation: if we extracted a very common word, it's probably not a project name
    if (projectNameFromQuery) {
      const commonWords = ['tasks', 'task', 'items', 'item', 'events', 'event', 'notes', 'note', 'files', 'file', 'work', 'working', 'do', 'have', 'get', 'show', 'list'];
      if (commonWords.includes(projectNameFromQuery.toLowerCase())) {
        projectNameFromQuery = null;
        requestedItemType = null;
      }
    }

    // Check if query is specifically about status
    const todoStatusKeywords = ['to do', 'todo', 'to-do list', 'pending', 'not done'];
    const inProgressStatusKeywords = ['in progress', 'ongoing', 'working on', 'started'];
    const doneStatusKeywords = ['done', 'completed', 'finished'];
    
    // ENHANCED DATE PARSING - Support for relative dates and ranges
    let targetDate = null;
    let startDate = null;
    let endDate = null;
    let dateFilters: string[] = [];
    
    const lowercaseQuery = query.toLowerCase();
    
    // Declare monthMatch at function scope for later access
    let monthMatch: RegExpMatchArray | null = null;
    
    // Check for relative date ranges
    if (lowercaseQuery.includes('this week')) {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday of this week
      
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
      dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
    } else if (lowercaseQuery.includes('next week')) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const nextMondayOffset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Get Monday of next week
      
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + nextMondayOffset);
      nextMonday.setHours(0, 0, 0, 0);
      
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      nextSunday.setHours(23, 59, 59, 999);
      
      startDate = nextMonday.toISOString().split('T')[0];
      endDate = nextSunday.toISOString().split('T')[0];
      dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
    } else if (lowercaseQuery.includes('today')) {
        targetDate = new Date().toISOString().split('T')[0];
    } else if (lowercaseQuery.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
    } else if (lowercaseQuery.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split('T')[0];
    } else {
      // Check for month names first (for month range queries like "events in August")
      const monthNames = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      };
      
      // Pattern to detect month-only queries with various natural language forms
      // Matches: "events in august", "what do I have in May", "in august", "for May", etc.
      const monthOnlyPattern = /(?:in|during|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s|$|\?|\.)/i;
      monthMatch = lowercaseQuery.match(monthOnlyPattern);
      
      if (monthMatch && monthMatch[1]) {
        const monthName = monthMatch[1].toLowerCase();
        const monthIndex = monthNames[monthName];
        
        if (monthIndex !== undefined) {
        const currentYear = new Date().getFullYear();
          
          // Create start of month
          const monthStart = new Date(currentYear, monthIndex, 1);
          
          // Create end of month (first day of next month minus 1 day)
          const monthEnd = new Date(currentYear, monthIndex + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
          console.log(`Month query detected: ${monthName} -> Date range: ${startDate} to ${endDate}`);
        }
      } else {
        // Try to detect specific dates and other date formats
        const dateRegex = /(?:on|for|due|in)?\s*(?:the\s*)?(\d{1,2}(?:st|nd|rd|th)?\s*(?:of\s*)?(?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|(?:\d{1,2}[-/\.]\d{1,2}(?:[-/\.]\d{2,4})?)|(?:january|february|march|april|may|june|july|august|september|october|november|december))/i;
        const dateMatch = query.match(dateRegex);
        
        if (dateMatch && dateMatch[1]) {
          const dateText = dateMatch[1].toLowerCase();
          try {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            targetDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log("Failed to parse date:", dateText);
        }
      }
      }
    }
    
    // PRIORITY 1: Time-based queries (highest priority to prevent misclassification)
    const hasTimeReference = targetDate || startDate || endDate || dateFilters.length > 0 || 
      lowercaseQuery.includes('this week') || lowercaseQuery.includes('next week') || 
      lowercaseQuery.includes('today') || lowercaseQuery.includes('tomorrow') || 
      lowercaseQuery.includes('yesterday') || lowercaseQuery.includes('due') ||
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)/.test(lowercaseQuery);
    
    if (hasTimeReference && (taskQueryKeywords.some(keyword => lowercaseQuery.includes(keyword)) || eventKeywords.some(keyword => lowercaseQuery.includes(keyword)))) {
      // This is a time-based query about tasks or events
      if (taskQueryKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
      try {
        // Determine which task status to filter by
        let statusFilter: string | undefined = undefined;
        let statusLabel = "pending";
        
        if (todoStatusKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
          statusFilter = 'todo';
          statusLabel = "to do";
        } else if (inProgressStatusKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
          statusFilter = 'in_progress';
          statusLabel = "in progress";
        } else if (doneStatusKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
          statusFilter = 'done';
          statusLabel = "completed";
        }
        
          // Use enhanced date filtering with range support
          const tasks = await getUserTasks(userId, statusFilter, targetDate, undefined, dateFilters);
        
        if (tasks.length === 0) {
            if (targetDate || dateFilters.length > 0) {
              const timeRef = targetDate ? formatDateForUser(targetDate) : "this week";
            return statusFilter 
                ? `You don't have any ${statusLabel} tasks due ${timeRef}.`
                : `You don't have any tasks due ${timeRef}.`;
          } else {
            return statusFilter 
              ? `You don't have any ${statusLabel} tasks.`
              : "You don't have any pending tasks.";
          }
        }
        
        const formattedTasks = tasks.map(task => {
          let statusDisplay = "";
          if (task.status && !statusFilter) {
            statusDisplay = ` (${task.status === 'in_progress' ? 'in progress' : task.status})`;
          }
          return `- ${task.title}${statusDisplay}`;
        }).join('\n');
        
        let responsePrefix = "Here are your ";
        if (statusFilter) {
          responsePrefix += `${statusLabel} tasks`;
        } else {
          responsePrefix += "tasks";
        }
        
          if (targetDate || dateFilters.length > 0) {
            const timeRef = targetDate ? formatDateForUser(targetDate) : "this week";
            return `${responsePrefix} due ${timeRef}:\n${formattedTasks}`;
          } else {
            return `${responsePrefix}:\n${formattedTasks}`;
          }
      } catch (error) {
          console.error("Error handling time-based task query:", error);
        return "I couldn't retrieve your task information. Please try again later.";
      }
      } else if (eventKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
        try {
          // Determine the date range for the query
          let queryStartDate = targetDate || startDate;
          let queryEndDate = targetDate || endDate;
          
          // For month queries, don't filter by upcoming/past - show all events in that month
          let filters = [];
          if (startDate && endDate) {
            // This is a month range query, don't apply upcoming/past filters
            filters = [];
          } else {
            // For other date queries, apply upcoming/past logic
            filters = lowercaseQuery.includes('past') ? ['past'] : ['upcoming'];
          }
          
          const events = await getUserEvents(userId, queryStartDate, queryEndDate, undefined, filters);
          
          if (events.length === 0) {
            let timeRef = "";
            if (targetDate) {
              timeRef = formatDateForUser(targetDate);
            } else if (startDate && endDate) {
              // Use the detected month name for consistency
              const detectedMonth = monthMatch && monthMatch[1] ? monthMatch[1] : null;
              if (detectedMonth) {
                const monthNames = {
                  'january': 'January', 'jan': 'January',
                  'february': 'February', 'feb': 'February', 
                  'march': 'March', 'mar': 'March',
                  'april': 'April', 'apr': 'April',
                  'may': 'May',
                  'june': 'June', 'jun': 'June',
                  'july': 'July', 'jul': 'July',
                  'august': 'August', 'aug': 'August',
                  'september': 'September', 'sep': 'September', 'sept': 'September',
                  'october': 'October', 'oct': 'October',
                  'november': 'November', 'nov': 'November',
                  'december': 'December', 'dec': 'December'
                };
                const fullMonthName = monthNames[detectedMonth.toLowerCase()] || detectedMonth;
                const year = new Date().getFullYear();
                timeRef = `${fullMonthName} ${year}`;
              } else {
                // Fallback to parsing startDate
                const startMonth = new Date(startDate + 'T00:00:00').toLocaleString('default', { month: 'long' });
                const startYear = new Date(startDate + 'T00:00:00').getFullYear();
                timeRef = `${startMonth} ${startYear}`;
              }
            } else {
              timeRef = "upcoming";
            }
            
            if (filters.includes('past')) {
              return `You don't have any past events ${timeRef ? `for ${timeRef}` : ''}.`;
            } else {
              return `You don't have any events scheduled ${timeRef ? `for ${timeRef}` : ''}.`;
            }
          }
          
          const formattedEvents = events.map(event => {
            const startDate = formatDateForUser(event.startTime);
            const endDate = event.endTime ? formatDateForUser(event.endTime) : null;
            const startTime = formatTimeForUser(event.startTime);
            const endTime = event.endTime ? formatTimeForUser(event.endTime) : null;
            
            if (endDate && endDate !== startDate) {
              // Multi-day event
              return `- ${event.title} (${startDate} to ${endDate})`;
            } else {
              // Single day event
              return `- ${event.title} at ${startTime}${endTime && endTime !== startTime ? ` - ${endTime}` : ''}`;
            }
          }).join('\n');
          
          let timeRef = "";
          if (targetDate) {
            timeRef = formatDateForUser(targetDate);
          } else if (startDate && endDate) {
            // Use the detected month name instead of parsing startDate
            const detectedMonth = monthMatch && monthMatch[1] ? monthMatch[1] : null;
            if (detectedMonth) {
              const monthNames = {
                'january': 'January', 'jan': 'January',
                'february': 'February', 'feb': 'February', 
                'march': 'March', 'mar': 'March',
                'april': 'April', 'apr': 'April',
                'may': 'May',
                'june': 'June', 'jun': 'June',
                'july': 'July', 'jul': 'July',
                'august': 'August', 'aug': 'August',
                'september': 'September', 'sep': 'September', 'sept': 'September',
                'october': 'October', 'oct': 'October',
                'november': 'November', 'nov': 'November',
                'december': 'December', 'dec': 'December'
              };
              const fullMonthName = monthNames[detectedMonth.toLowerCase()] || detectedMonth;
              const year = new Date().getFullYear();
              timeRef = `${fullMonthName} ${year}`;
            } else {
              // Fallback to parsing startDate
              const startMonth = new Date(startDate + 'T00:00:00').toLocaleString('default', { month: 'long' });
              const startYear = new Date(startDate + 'T00:00:00').getFullYear();
              timeRef = `${startMonth} ${startYear}`;
            }
          }
          
          if (filters.includes('past')) {
            return timeRef
              ? `Here are your past events for ${timeRef}:\n${formattedEvents}`
              : `Here are your past events:\n${formattedEvents}`;
          } else {
            return timeRef
              ? `Here are your events for ${timeRef}:\n${formattedEvents}`
              : `Here are your upcoming events:\n${formattedEvents}`;
          }
        } catch (error) {
          console.error("Error handling time-based event query:", error);
          return "I couldn't retrieve your calendar information. Please try again later.";
        }
      }
    }
    
    // PRIORITY 2: Project-specific item queries (e.g., "tasks in AUTO project")
    if (projectNameFromQuery) {
      try {
        const projectItems = await getProjectItems(userId, projectNameFromQuery);
        
        // Check if no items found
        if (!projectItems.tasks.length && !projectItems.events.length && !projectItems.notes.length && !projectItems.files.length) {
          return `I couldn't find any items linked to project "${projectNameFromQuery}".`;
        }
        
        // Filter by requested item type if specified
        let response = "";
        let hasResults = false;
        
        if (!requestedItemType) {
          // Return all items (user asked for "everything" or general query)
          const hasMultipleTypes = 
            (projectItems.tasks.length > 0 ? 1 : 0) + 
            (projectItems.events.length > 0 ? 1 : 0) + 
            (projectItems.notes.length > 0 ? 1 : 0) + 
            (projectItems.files.length > 0 ? 1 : 0) > 1;
          
          response = `Here are the items linked to project "${projectNameFromQuery}":\n\n`;
          
          if (projectItems.tasks.length > 0) {
            if (hasMultipleTypes) response += `Tasks:\n`;
            projectItems.tasks.forEach(task => {
              response += `- ${task.title} (${task.status})\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.events.length > 0) {
            if (hasMultipleTypes) response += `Events:\n`;
            projectItems.events.forEach(event => {
              response += `- ${event.title} (${formatDateForUser(event.start_time)} at ${formatTimeForUser(event.start_time)})\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.notes.length > 0) {
            if (hasMultipleTypes) response += `Notes:\n`;
            projectItems.notes.forEach(note => {
              const notePreview = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'No content';
              response += `- Note: ${notePreview}\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.files.length > 0) {
            if (hasMultipleTypes) response += `Files:\n`;
            projectItems.files.forEach(file => {
              response += `- File: ${file.name} (${formatFileSize(file.size)})\n`;
            });
            hasResults = true;
          }
        } else {
          // Return only the requested item type
          switch (requestedItemType) {
            case 'tasks':
              if (projectItems.tasks.length > 0) {
                response = `Here are the tasks in project "${projectNameFromQuery}":\n\n`;
                projectItems.tasks.forEach(task => {
                  response += `- ${task.title} (${task.status})\n`;
                });
                hasResults = true;
              } else {
                return `No tasks found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'events':
              if (projectItems.events.length > 0) {
                response = `Here are the events in project "${projectNameFromQuery}":\n\n`;
                projectItems.events.forEach(event => {
                  response += `- ${event.title} (${formatDateForUser(event.start_time)} at ${formatTimeForUser(event.start_time)})\n`;
                });
                hasResults = true;
              } else {
                return `No events found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'notes':
              if (projectItems.notes.length > 0) {
                response = `Here are the notes in project "${projectNameFromQuery}":\n\n`;
                projectItems.notes.forEach(note => {
                  const notePreview = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'No content';
                  response += `- Note: ${notePreview}\n`;
                });
                hasResults = true;
              } else {
                return `No notes found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'files':
              if (projectItems.files.length > 0) {
                response = `Here are the files in project "${projectNameFromQuery}":\n\n`;
                projectItems.files.forEach(file => {
                  response += `- File: ${file.name} (${formatFileSize(file.size)})\n`;
                });
                hasResults = true;
              } else {
                return `No files found in project "${projectNameFromQuery}".`;
              }
              break;
          }
        }
        
        return hasResults ? response : `I couldn't find any items linked to project "${projectNameFromQuery}".`;
      } catch (error) {
        console.error("Error handling project items query:", error);
        return "I couldn't retrieve the items linked to that project. Please try again later.";
      }
    }

    // PRIORITY 3: General project queries (e.g., "what projects am I working on")
    if (projectKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase())) &&
        !projectNameFromQuery) {
      try {
        // Determine which project status to filter by
        let statusFilter: string | undefined = undefined;
        
        if (lowercaseQuery.includes('active') || lowercaseQuery.includes('current')) {
          statusFilter = 'active';
        } else if (lowercaseQuery.includes('completed') || lowercaseQuery.includes('finished')) {
          statusFilter = 'completed';
        } else if (lowercaseQuery.includes('on hold') || lowercaseQuery.includes('paused')) {
          statusFilter = 'on-hold';
        }
        
        const projects = await getUserProjects(userId, statusFilter);
        
        if (projects.length === 0) {
          return statusFilter
            ? `You don't have any ${statusFilter} projects.`
            : "You don't have any projects yet.";
        }
        
        const formattedProjects = projects.map(project => {
          let dueInfo = '';
          if (project.due_date) {
            const dueDate = new Date(project.due_date);
            dueInfo = ` (due ${formatDateForUser(project.due_date)})`;
          }
          
          let progressInfo = '';
          if (typeof project.progress === 'number') {
            progressInfo = ` - ${project.progress}% complete`;
          }
          
          return `- ${project.name}${dueInfo}${progressInfo}`;
        }).join('\n');
        
        let responsePrefix = "Here are your ";
        if (statusFilter) {
          responsePrefix += `${statusFilter} projects:`;
        } else {
          responsePrefix += "projects:";
        }
        
        return `${responsePrefix}\n${formattedProjects}`;
      } catch (error) {
        console.error("Error handling project query:", error);
        return "I couldn't retrieve your project information. Please try again later.";
      }
    }

    // PRIORITY 4: Calendar/Event queries
    if (calendarEventKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // If not explicitly asking for past events, default to upcoming
        const filters = query.toLowerCase().includes('past') ? ['past'] : ['upcoming'];
        const events = await getUserEvents(userId, targetDate, targetDate || endDate, undefined, filters);
        
        if (events.length === 0) {
          if (filters.includes('past')) {
            return targetDate 
              ? `You don't have any past events on ${formatDateForUser(targetDate)}.` 
              : "You don't have any past events.";
          } else {
            return targetDate 
              ? `You don't have any events scheduled on ${formatDateForUser(targetDate)}.` 
              : "You don't have any upcoming events scheduled.";
          }
        }
        
        const formattedEvents = events.map(event => (
          `- ${event.title}${event.startTime ? ` at ${formatTimeForUser(event.startTime)}` : ''}`
        )).join('\n');
        
        if (filters.includes('past')) {
          return targetDate
            ? `Here are your past events for ${formatDateForUser(targetDate)}:\n${formattedEvents}`
            : `Here are your past events:\n${formattedEvents}`;
        } else {
          return targetDate
            ? `Here are your events for ${formatDateForUser(targetDate)}:\n${formattedEvents}`
            : `Here are your upcoming events:\n${formattedEvents}`;
        }
      } catch (error) {
        console.error("Error handling calendar query:", error);
        return "I couldn't retrieve your calendar information. Please try again later.";
      }
    }
    
    // Check if query is about notes
    if (noteKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse search parameters from query
        let contentSearch: string | undefined = undefined;
        let projectNameForNotes: string | undefined = undefined;
        let pinnedOnly = false;
        
        const lowercaseQuery = query.toLowerCase();
        
        // Check for pinned notes
        if (lowercaseQuery.includes('pinned') || lowercaseQuery.includes('important')) {
          pinnedOnly = true;
        }
        
        // Extract search terms
        const searchMatch = lowercaseQuery.match(/about\s+(.+?)(?:\s+in\s+|$)/);
        if (searchMatch) {
          contentSearch = searchMatch[1];
        }
        
        // Check for project mentions
        const projectMatch = lowercaseQuery.match(/(?:in|for|from)\s+(?:project\s+)?(.+?)(?:\s|$)/);
        if (projectMatch) {
          projectNameForNotes = projectMatch[1];
        }
        
        const notes = await getUserNotes(userId, contentSearch, projectNameForNotes, pinnedOnly);
        
        if (notes.length === 0) {
          let noResultsMessage = "I couldn't find any notes";
          if (contentSearch) noResultsMessage += ` about "${contentSearch}"`;
          if (projectNameForNotes) noResultsMessage += ` in project "${projectNameForNotes}"`;
          if (pinnedOnly) noResultsMessage += " that are pinned";
          return noResultsMessage + ".";
        }
        
        // Format notes response with markdown
        let response = `## 📝 Notes Found (${notes.length} notes)\n\n`;
        
        notes.forEach((note, index) => {
          const lastUpdated = formatDateForUser(note.last_updated);
          
          response += `### ${index + 1}. Note ${note.pinned ? '📌' : ''}\n`;
          
          // Truncate content if too long
          let content = note.content || '';
          if (content.length > 200) {
            content = content.substring(0, 200) + '...';
          }
          
          response += `**Content:** ${content}\n`;
          response += `**📅 Last Updated:** ${lastUpdated}\n`;
          
          if (note.project && note.project.name) {
            response += `**Project:** ${note.project.name}\n`;
          }
          
          if (note.pinned) {
            response += `**📌 Status:** Pinned\n`;
          }
          
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying notes:', error);
        return "I encountered an error while searching for notes. Please try again.";
      }
    }
    
    // Check if query is about project progress/analytics with a specific project
    if (projectNameFromQuery && progressKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        const progressData = await getProjectProgress(userId, projectNameFromQuery);
        
        if (!progressData) {
          return `I couldn't find a project named "${projectNameFromQuery}".`;
        }
        
        const { project, progress, totalTasks, completedTasks, pendingTasks, overdueTasks, upcomingEvents, notes, files } = progressData;
        
        let response = `**${project.name} Project Progress:**\n\n`;
        response += `📊 **Overall Progress:** ${progress}% complete\n\n`;
        
        if (totalTasks > 0) {
          response += `**Tasks Summary:**\n`;
          response += `• Total: ${totalTasks}\n`;
          response += `• Completed: ${completedTasks}\n`;
          response += `• Pending: ${pendingTasks}\n`;
          if (overdueTasks > 0) {
            response += `• ⚠️ Overdue: ${overdueTasks}\n`;
          }
            response += '\n';
          }
        
        if (upcomingEvents > 0) {
          response += `📅 **Upcoming Events:** ${upcomingEvents} in the next 30 days\n\n`;
        }
        
        if (notes > 0 || files > 0) {
          response += `**Additional Resources:**\n`;
          if (notes > 0) response += `• Notes: ${notes}\n`;
          if (files > 0) response += `• Files: ${files}\n`;
          response += '\n';
        }
        
        if (project.due_date) {
          const dueDate = new Date(project.due_date);
          const isOverdue = dueDate < new Date() && project.status !== 'completed';
          response += `**Project Deadline:** ${formatDateForUser(project.due_date)}`;
          if (isOverdue) {
            response += ` ⚠️ (Overdue)`;
          }
            response += '\n';
        }
        
        return response;
      } catch (error) {
        console.error("Error handling project progress query:", error);
        return "I couldn't retrieve the project progress information. Please try again later.";
      }
    }
    
    // Check if query is about project timeline with a specific project
    if (projectNameFromQuery && timelineKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        const timelineData = await getProjectTimeline(userId, projectNameFromQuery);
        
        if (!timelineData) {
          return `I couldn't find a project named "${projectNameFromQuery}".`;
        }
        
        const { projectName, timeline } = timelineData;
        
        if (timeline.length === 0) {
          return `No upcoming deadlines or events found for project "${projectName}".`;
        }
        
        let response = `**${projectName} Project Timeline:**\n\n`;
        
        timeline.forEach(item => {
          const date = formatDateForUser(item.date);
          const isOverdue = item.isOverdue ? ' ⚠️ (Overdue)' : '';
          
          switch (item.type) {
            case 'task':
              response += `📋 **Task:** ${item.title} - Due ${date}${isOverdue}\n`;
              if (item.status) {
                response += `   Status: ${item.status === 'in_progress' ? 'In Progress' : item.status}\n`;
              }
              break;
            case 'event':
              response += `📅 **Event:** ${item.title} - ${date}\n`;
              break;
            case 'project_deadline':
              response += `🎯 **Project Deadline:** ${date}${isOverdue}\n`;
              break;
          }
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error("Error handling project timeline query:", error);
        return "I couldn't retrieve the project timeline information. Please try again later.";
      }
    }
    
    // Check if query is about files
    if (fileKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Extract search parameters from the query
        let nameSearch: string | undefined = undefined;
        let fileType: string | undefined = undefined;
        let projectNameForFiles: string | undefined = undefined;
        
        // Check for file type mentions
        if (lowercaseQuery.includes('pdf')) fileType = 'pdf';
        else if (lowercaseQuery.includes('image') || lowercaseQuery.includes('photo')) fileType = 'image';
        else if (lowercaseQuery.includes('video')) fileType = 'video';
        else if (lowercaseQuery.includes('document') || lowercaseQuery.includes('doc')) fileType = 'application';
        
        // Check for project-specific file queries
        const projectFilePattern = /(?:files?|documents?|uploads?)\s+(?:(?:in|from|for|of|linked to|attached to|related to)\s+)?(?:(?:project|the project)\s+)?([\w\s'-]+?)(?:\s+project|$|\?|\.)/i;
        const projectFileMatch = query.match(projectFilePattern);
        if (projectFileMatch) {
          projectNameForFiles = projectFileMatch[1].trim();
        }
        
        // Check for name-based searches
        const namePattern = /(?:file|document|upload|attachment)\s+(?:named|called|titled)\s+["']?([^"']+?)["']?(?:\?|$|\.)/i;
        const nameMatch = query.match(namePattern);
        if (nameMatch) {
          nameSearch = nameMatch[1].trim();
        }
        
        const files = await getUserFiles(userId, nameSearch, fileType, projectNameForFiles);
        
        if (files.length === 0) {
          let responseMessage = "You don't have any files";
          if (fileType) responseMessage += ` of type ${fileType}`;
          if (projectNameForFiles) responseMessage += ` in project "${projectNameForFiles}"`;
          if (nameSearch) responseMessage += ` named "${nameSearch}"`;
          responseMessage += ".";
          
          return responseMessage;
        }
        
        let response = "Here are your files";
        if (fileType) response += ` (${fileType} files)`;
        if (projectNameForFiles) response += ` from project "${projectNameForFiles}"`;
        response += ":\n\n";
        
        files.forEach(file => {
          const uploadDate = formatDateForUser(file.uploaded_at);
          const fileSize = formatFileSize(file.size);
          let fileInfo = `📄 **${file.name}** (${fileSize})`;
          
          if (file.project && typeof file.project === 'object' && 'name' in file.project) {
            fileInfo += `\n   📁 Project: ${file.project.name}`;
          }
          
          if (file.task && typeof file.task === 'object' && 'title' in file.task) {
            fileInfo += `\n   📋 Task: ${file.task.title}`;
          }
          
          if (file.event && typeof file.event === 'object' && 'title' in file.event) {
            fileInfo += `\n   📅 Event: ${file.event.title}`;
          }
          
          fileInfo += `\n   📅 Uploaded: ${uploadDate}\n`;
          
          response += fileInfo + '\n';
        });
        
        return response;
      } catch (error) {
        console.error("Error handling file query:", error);
        return "I couldn't retrieve your file information. Please try again later.";
      }
    }
    
    // Check if query is about events
    if (eventKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse date range from query
        let eventStartDate: string | undefined = undefined;
        let eventEndDate: string | undefined = undefined;
        let eventQuery: string | undefined = undefined;
        
        // Extract search terms and dates
        if (lowercaseQuery.includes('today')) {
          const today = new Date();
          eventStartDate = today.toISOString().split('T')[0];
          eventEndDate = eventStartDate;
        } else if (lowercaseQuery.includes('tomorrow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          eventStartDate = tomorrow.toISOString().split('T')[0];
          eventEndDate = eventStartDate;
        } else if (lowercaseQuery.includes('this week')) {
          const today = new Date();
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          eventStartDate = startOfWeek.toISOString().split('T')[0];
          eventEndDate = endOfWeek.toISOString().split('T')[0];
        } else if (lowercaseQuery.includes('next week')) {
          const today = new Date();
          const startOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
          const endOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 13));
          eventStartDate = startOfNextWeek.toISOString().split('T')[0];
          eventEndDate = endOfNextWeek.toISOString().split('T')[0];
        }
        
        // If no specific date is mentioned, default to upcoming events (next 30 days)
        if (!eventStartDate) {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          eventStartDate = today.toISOString().split('T')[0];
          eventEndDate = thirtyDaysFromNow.toISOString().split('T')[0];
        }
        
        // Check for meeting/event type or title search
        const meetingTypes = ['meeting', 'call', 'standup', 'review', 'planning'];
        for (const type of meetingTypes) {
          if (lowercaseQuery.includes(type)) {
            eventQuery = type;
            break;
          }
        }
        
        const events = await getUserEvents(userId, eventStartDate, eventEndDate, eventQuery);
        
        if (events.length === 0) {
          return "I couldn't find any events matching your criteria.";
        }
        
        // Format events response with markdown
        let response = `## 📅 Events Found (${events.length} events)\n\n`;
        
        events.forEach((event, index) => {
          const startTime = formatTimeForUser(event.start_time);
          const endTime = formatTimeForUser(event.end_time);
          const eventDate = formatDateForUser(event.start_time);
          
          response += `### ${index + 1}. ${event.title}\n`;
          response += `**📅 Date:** ${eventDate}\n`;
          response += `**⏰ Time:** ${startTime} - ${endTime}\n`;
          
          if (event.description) {
            response += `**📝 Description:** ${event.description}\n`;
          }
          
          if (event.project && event.project.name) {
            response += `**📁 Project:** ${event.project.name}\n`;
          }
          
          if (event.google_event_id) {
            response += `**🔗 Source:** Google Calendar\n`;
          }
          
            response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying events:', error);
        return "I encountered an error while searching for events. Please try again.";
      }
    }
    
    // Check if query is about tasks (fallback for general task queries)
    if (taskQueryKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse search parameters from query
        let status: string | undefined = undefined;
        let dueDate: string | undefined = undefined;
        let taskQuery: string | undefined = undefined;
        let projectNameForTasks: string | undefined = undefined;
        
        // Check for status filters
        if (lowercaseQuery.includes('completed') || lowercaseQuery.includes('done')) {
          status = 'done';
        } else if (lowercaseQuery.includes('pending') || lowercaseQuery.includes('todo') || lowercaseQuery.includes('in progress')) {
          status = 'todo';
        } else if (lowercaseQuery.includes('overdue')) {
          // We'll handle overdue in the service function
          const today = new Date().toISOString().split('T')[0];
          dueDate = `<${today}`;
        }
        
        // Check for due date filters
        if (lowercaseQuery.includes('today')) {
          const today = new Date().toISOString().split('T')[0];
          dueDate = today;
        } else if (lowercaseQuery.includes('tomorrow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueDate = tomorrow.toISOString().split('T')[0];
        } else if (lowercaseQuery.includes('this week')) {
          // Set due date to end of week
          const today = new Date();
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          dueDate = `<=${endOfWeek.toISOString().split('T')[0]}`;
        }
        
        // Extract search terms
        const searchMatch = lowercaseQuery.match(/(?:about|for|titled)\s+(.+?)(?:\s+(?:in|due|overdue)|$)/);
        if (searchMatch) {
          taskQuery = searchMatch[1];
        }
        
        // Check for project mentions
        const projectMatch = lowercaseQuery.match(/(?:in|for|from)\s+(?:project\s+)?(.+?)(?:\s|$)/);
        if (projectMatch) {
          projectNameForTasks = projectMatch[1];
        }
        
        const tasks = await getUserTasks(userId, status, dueDate, taskQuery);
        
        // Filter by project if specified
        let filteredTasks = tasks;
        if (projectNameForTasks && tasks.length > 0) {
          filteredTasks = tasks.filter(task => {
            const project = task.project as unknown as { name: string } | null;
            return project && 
                   project.name && 
                   project.name.toLowerCase().includes(projectNameForTasks.toLowerCase());
          });
        }
        
        if (filteredTasks.length === 0) {
          let noResultsMessage = "I couldn't find any tasks";
          if (status) noResultsMessage += ` with status "${status}"`;
          if (taskQuery) noResultsMessage += ` about "${taskQuery}"`;
          if (projectNameForTasks) noResultsMessage += ` in project "${projectNameForTasks}"`;
          return noResultsMessage + ".";
        }
        
        // Format tasks response with markdown
        let response = `## ✅ Tasks Found (${filteredTasks.length} tasks)\n\n`;
        
        filteredTasks.forEach((task, index) => {
          response += `### ${index + 1}. ${task.title}\n`;
          
          // Status with emoji
          let statusEmoji = '';
          switch (task.status) {
            case 'done': statusEmoji = '✅'; break;
            case 'in-progress': statusEmoji = '🔄'; break;
            case 'todo': statusEmoji = '📋'; break;
            default: statusEmoji = '❓'; break;
          }
          
          response += `**Status:** ${statusEmoji} ${task.status || 'Unknown'}\n`;
          
          if (task.description) {
            response += `**📝 Description:** ${task.description}\n`;
          }
          
          if (task.due_date) {
            const dueDate = formatDateForUser(task.due_date);
            const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';
            response += `**📅 Due Date:** ${dueDate}${isOverdue ? ' ⚠️ OVERDUE' : ''}\n`;
          }
          
          if (task.priority) {
            let priorityEmoji = '';
            switch (task.priority) {
              case 'high': priorityEmoji = '🔴'; break;
              case 'medium': priorityEmoji = '🟡'; break;
              case 'low': priorityEmoji = '🟢'; break;
            }
            response += `**Priority:** ${priorityEmoji} ${task.priority}\n`;
          }
          
          if (task.project && task.project.name) {
            response += `**📁 Project:** ${task.project.name}\n`;
          }
          
          if (task.labels && task.labels.length > 0) {
            response += `**🏷️ Labels:** ${task.labels.join(', ')}\n`;
          }
          
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying tasks:', error);
        return "I encountered an error while searching for tasks. Please try again.";
      }
    }
    
    return null; // Not a user data query
  } catch (error) {
    console.error("Error handling user data query:", error);
    return null;
  }
};

/**
 * Format file size to a human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};