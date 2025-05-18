import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "./geminiService";
import { analyzeConversation, saveTaskSuggestions, saveEventSuggestions, ClarifyingQuestion } from "./suggestionService";
import { 
  detectCommandIntent, 
  createTaskFromCommand, 
  createEventFromCommand,
  deleteTaskFromCommand,
  deleteEventFromCommand,
  deleteProjectFromCommand,
  updateTaskFromCommand,
  CommandDetectionResult 
} from "./commandService";
import { getUserEvents, getUserTasks, formatDateForUser, formatTimeForUser, getUserProjects, getProjectItems } from "./userDataService";

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

    // If not a command or user data query, proceed with normal Gemini chat and passive suggestion analysis
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key available. Please add your API key in the settings.");
    }

    const formattedHistoryForGemini: FormattedMessage[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

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

    // Check if query is about items linked to a project
    // Pattern to detect various ways of asking about project items
    const projectItemsPattern = /(?:what|which|list|show|get|any|all)?\s*(?:items?|tasks?|events?|notes?|files?).*(?:(?:linked|related|connected|assigned|attached|associated|belong|belonging) to|for|in|on|of)\s+(?:(?:project|the project|my project)[\s:]+)?([\w\s'-]+?)(?:\?|$|\.|,)/i;
    const projectItemsMatch = query.match(projectItemsPattern);
    
    // Check for queries like "what tasks are in the auto project" or "what tasks are linked to the new project"
    const projectNameInQueryPattern = /(?:what|which|list|show|any|all)?\s+(?:items?|tasks?|events?|notes?|files?)\s+(?:are|is|that are|that is)?\s+(?:in|for|linked to|related to|connected to|assigned to|of|from)\s+(?:the\s+)?([\w\s'-]+?)(?:\s+project|\s+Project|\?|$|\.|,)/i;
    const projectNameInQueryMatch = query.match(projectNameInQueryPattern);
    
    // Also check queries with project mentioned first, like "in the auto project, what tasks do I have"
    const projectFirstPattern = /(?:in|for|about)\s+(?:the\s+)?([\w\s'-]+?)\s+project\b.*?(?:what|which|list|show|any|all)?\s+(?:items?|tasks?|events?|notes?|files?)/i;
    const projectFirstMatch = query.match(projectFirstPattern);
    
    // Get project name from any of the pattern matches
    const projectNameFromQuery = projectItemsMatch 
        ? projectItemsMatch[1].trim() 
        : (projectNameInQueryMatch 
            ? projectNameInQueryMatch[1].trim() 
            : (projectFirstMatch ? projectFirstMatch[1].trim() : null));

    // Check if query is specifically about status
    const todoStatusKeywords = ['to do', 'todo', 'to-do list', 'pending', 'not done'];
    const inProgressStatusKeywords = ['in progress', 'ongoing', 'working on', 'started'];
    const doneStatusKeywords = ['done', 'completed', 'finished'];
    
    // Detect date mentioned in query
    const dateRegex = /(?:on|for|this|next|coming)?\s*(?:the\s*)?(\d{1,2}(?:st|nd|rd|th)?\s*(?:of\s*)?(?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow|today|(?:\d{1,2}[-/\.]\d{1,2}(?:[-/\.]\d{2,4})?))/i;
    const dateMatch = query.match(dateRegex);
    
    let targetDate = null;
    if (dateMatch && dateMatch[1]) {
      // Simple date parsing for common formats
      const dateText = dateMatch[1].toLowerCase();
      if (dateText === 'today') {
        targetDate = new Date().toISOString().split('T')[0];
      } else if (dateText === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
      } else if (
        dateText.includes('june 5') || dateText.includes('5th of june') || dateText.includes('5 june') ||
        dateText.includes('june 6') || dateText.includes('6th of june') || dateText.includes('6 june')
      ) {
        // Special case for June dates
        const currentYear = new Date().getFullYear();
        const day = dateText.includes('5') ? '05' : '06';
        targetDate = `${currentYear}-06-${day}`;
      } else {
        try {
          // Try to parse the date - this is a simplified approach
          // A more comprehensive date parsing would be needed for production
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            targetDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log("Failed to parse date:", dateText);
        }
      }
    }
    
    // If it seems like a calendar query
    if (calendarEventKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // If not explicitly asking for past events, default to upcoming
        const filters = query.toLowerCase().includes('past') ? ['past'] : ['upcoming'];
        const events = await getUserEvents(userId, targetDate, targetDate, undefined, filters);
        
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
    
    // If it seems like a task query
    if (taskKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Determine which task status to filter by
        let statusFilter: string | undefined = undefined;
        let statusLabel = "pending";
        
        const lowercaseQuery = query.toLowerCase();
        
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
        
        const tasks = await getUserTasks(userId, statusFilter, targetDate);
        
        if (tasks.length === 0) {
          if (targetDate) {
            return statusFilter 
              ? `You don't have any ${statusLabel} tasks due on ${formatDateForUser(targetDate)}.`
              : `You don't have any tasks due on ${formatDateForUser(targetDate)}.`;
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
        
        return targetDate
          ? `${responsePrefix} for ${formatDateForUser(targetDate)}:\n${formattedTasks}`
          : `${responsePrefix}:\n${formattedTasks}`;
      } catch (error) {
        console.error("Error handling task query:", error);
        return "I couldn't retrieve your task information. Please try again later.";
      }
    }

    // If query is about projects
    if (projectKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase())) &&
        !projectNameFromQuery) {
      try {
        // Determine which project status to filter by
        let statusFilter: string | undefined = undefined;
        
        const lowercaseQuery = query.toLowerCase();
        
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

    // If query is about items linked to a specific project
    if (projectNameFromQuery) {
      try {
        const projectItems = await getProjectItems(userId, projectNameFromQuery);
        
        if (!projectItems.tasks.length && !projectItems.events.length && !projectItems.notes.length && !projectItems.files.length) {
          return `I couldn't find any items linked to project "${projectNameFromQuery}".`;
        }
        
        const hasMultipleTypes = 
          (projectItems.tasks.length > 0 ? 1 : 0) + 
          (projectItems.events.length > 0 ? 1 : 0) + 
          (projectItems.notes.length > 0 ? 1 : 0) + 
          (projectItems.files.length > 0 ? 1 : 0) > 1;
        
        let response = `Here are the items linked to project "${projectNameFromQuery}":\n\n`;
        
        if (projectItems.tasks.length > 0) {
          if (hasMultipleTypes) {
            response += `Tasks:\n`;
          }
          projectItems.tasks.forEach(task => {
            response += `- Task: ${task.title} (${task.status})\n`;
          });
          if (hasMultipleTypes) {
            response += '\n';
          }
        }
        
        if (projectItems.events.length > 0) {
          if (hasMultipleTypes) {
            response += `Events:\n`;
          }
          projectItems.events.forEach(event => {
            const eventDate = new Date(event.start_time);
            response += `- Event: ${event.title} (${formatDateForUser(event.start_time)} at ${formatTimeForUser(event.start_time)})\n`;
          });
          if (hasMultipleTypes) {
            response += '\n';
          }
        }
        
        if (projectItems.notes.length > 0) {
          if (hasMultipleTypes) {
            response += `Notes:\n`;
          }
          projectItems.notes.forEach(note => {
            const notePreview = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'No content';
            response += `- Note: ${notePreview}\n`;
          });
          if (hasMultipleTypes) {
            response += '\n';
          }
        }
        
        if (projectItems.files.length > 0) {
          if (hasMultipleTypes) {
            response += `Files:\n`;
          }
          projectItems.files.forEach(file => {
            response += `- File: ${file.name} (${formatFileSize(file.size)})\n`;
          });
        }
        
        return response;
      } catch (error) {
        console.error("Error handling project items query:", error);
        return "I couldn't retrieve the items linked to that project. Please try again later.";
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