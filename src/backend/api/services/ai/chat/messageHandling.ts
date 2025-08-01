import { supabase } from "../../../../database/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage, getAiSettings } from "../core/geminiService";
import { validateUser } from "@/shared/utils/authUtils";
import { analyzeConversation, saveTaskSuggestions, saveEventSuggestions, requestSuggestions } from "../suggestions/suggestionService";
import { 
  detectCommandIntent, 
  createTaskFromCommand, 
  createEventFromCommand, 
  createProjectFromCommand,
  deleteTaskFromCommand,
  deleteEventFromCommand,
  deleteProjectFromCommand,
  updateTaskFromCommand,
  updateEventFromCommand
} from "../commands/commandService";
import { buildContextualPrompt } from "../core/contextService";
import { ChatMessage, generateConversationTitle } from "./conversationLifecycle";
import { handleUserDataQuery } from "./dataQuerying/queryHandlers";
import { ClarifyingQuestion } from "../suggestions/suggestionService";

/**
 * Helper function to create and save AI messages to the database
 */
async function saveAiMessage(
  message: ChatMessage,
  metadata?: any
): Promise<void> {
  const insertData: any = {
    id: message.id,
    conversation_id: message.conversationId,
    user_id: message.userId,
    content: message.content,
    role: message.role,
    created_at: message.createdAt
  };
  
  if (metadata) {
    insertData.metadata = metadata;
  }
  
  const { error } = await supabase.from('ai_messages').insert(insertData);
  if (error) throw error;
}

interface ConversationMemory {
  recentTopics: string[];
  userPreferences: {
    preferredTaskPriority?: string;
    preferredMeetingDuration?: number;
    commonProjects?: string[];
  };
  followUpSuggestions: string[];
}

interface FollowUpSuggestion {
  text: string;
  type: 'question' | 'action' | 'clarification';
  relevance: number;
}

/**
 * Generate intelligent follow-up suggestions based on conversation context
 */
const generateFollowUpSuggestions = (
  userMessage: string, 
  aiResponse: string, 
  conversationHistory: ChatMessage[]
): FollowUpSuggestion[] => {
  const suggestions: FollowUpSuggestion[] = [];
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();
  
  // Task-related follow-ups
  if (message.includes('task') || message.includes('todo')) {
    if (response.includes('created') || response.includes('added')) {
      suggestions.push({
        text: "Would you like to set a reminder for this task?",
        type: 'question',
        relevance: 0.8
      });
      suggestions.push({
        text: "Should I create any related subtasks?",
        type: 'question',
        relevance: 0.7
      });
    }
    if (!message.includes('priority')) {
      suggestions.push({
        text: "What priority should this task have?",
        type: 'clarification',
        relevance: 0.6
      });
    }
  }
  
  // Event/meeting follow-ups
  if (message.includes('meeting') || message.includes('event') || message.includes('schedule')) {
    if (response.includes('created') || response.includes('scheduled')) {
      suggestions.push({
        text: "Should I send calendar invites to attendees?",
        type: 'action',
        relevance: 0.8
      });
      suggestions.push({
        text: "Would you like me to create an agenda for this meeting?",
        type: 'question',
        relevance: 0.7
      });
    }
  }
  
  // Project-related follow-ups
  if (message.includes('project')) {
    suggestions.push({
      text: "Would you like to break this down into smaller tasks?",
      type: 'question',
      relevance: 0.7
    });
    suggestions.push({
      text: "Should I set up milestones for this project?",
      type: 'action',
      relevance: 0.6
    });
  }
  
  // General productivity follow-ups
  if (response.includes('completed') || response.includes('done')) {
    suggestions.push({
      text: "What would you like to work on next?",
      type: 'question',
      relevance: 0.6
    });
  }
  
  // Time-based follow-ups
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 16 && hour <= 18) { // Late afternoon
    suggestions.push({
      text: "Would you like a summary of what you accomplished today?",
      type: 'question',
      relevance: 0.5
    });
  }
  
  // Sort by relevance and return top 3
  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
};

/**
 * Build conversation memory from recent messages
 */
const buildConversationMemory = (history: ChatMessage[]): ConversationMemory => {
  const recentMessages = history.slice(-10); // Last 10 messages
  const topics = new Set<string>();
  const preferences = {
    preferredTaskPriority: undefined as string | undefined,
    preferredMeetingDuration: undefined as number | undefined,
    commonProjects: [] as string[]
  };
  
  recentMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // Extract topics
    if (content.includes('task') || content.includes('todo')) topics.add('tasks');
    if (content.includes('meeting') || content.includes('event')) topics.add('meetings');
    if (content.includes('project')) topics.add('projects');
    if (content.includes('deadline') || content.includes('due')) topics.add('deadlines');
    if (content.includes('calendar')) topics.add('calendar');
    
    // Extract preferences
    if (content.includes('high priority') || content.includes('urgent')) {
      preferences.preferredTaskPriority = 'high';
    } else if (content.includes('low priority')) {
      preferences.preferredTaskPriority = 'low';
    }
    
    // Extract common project names (simple pattern matching)
    const projectMatches = content.match(/project\s+([a-zA-Z0-9\s]+)/g);
    if (projectMatches) {
      projectMatches.forEach(match => {
        const projectName = match.replace('project ', '').trim();
        if (projectName && !preferences.commonProjects.includes(projectName)) {
          preferences.commonProjects.push(projectName);
        }
      });
    }
  });
  
  return {
    recentTopics: Array.from(topics),
    userPreferences: preferences,
    followUpSuggestions: []
  };
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
  newSuggestions?: {type: 'task'|'event', id: string, title: string}[];
  hasOverallSuggestions?: boolean;
  clarifyingQuestions?: ClarifyingQuestion[];
  pendingConfirmation?: {
    type: string;
    entities: any;
    message: string;
  };
  followUpSuggestions?: FollowUpSuggestion[];
  conversationMemory?: ConversationMemory;
} | null> => {
  try {
    // Validate inputs to prevent UUID errors
    if (!conversationId || conversationId.trim() === '') {
      throw new Error("Invalid conversation ID provided");
    }
    if (!message || message.trim() === '') {
      throw new Error("Message cannot be empty");
    }

    const user = await validateUser();

    const userMessage: ChatMessage = {
      id: uuidv4(),
      conversationId,
      userId: user.id,
      content: message,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    await saveAiMessage(userMessage);

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
        
        await saveAiMessage(aiResponseMessage);
        
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
        
        await saveAiMessage(aiResponseMessage);
        
        return { userMessage, aiMessage: aiResponseMessage };
      }
    }

    // Handle explicit commands first
    const commandResult = await detectCommandIntent(message, history);
    
    if (commandResult.hasCommand && commandResult.commandType) {
      // Handle suggestion requests
      if (commandResult.commandType === 'request_suggestions') {
        try {
          const result = await requestSuggestions(conversationId);
          
          let responseText = "";
          if (result.hasSuggestions) {
            responseText = "✅ I've analyzed your conversation and generated new suggestions! Check the suggestions page to see them.";
          } else {
            responseText = "I couldn't find any actionable tasks or events to suggest from our conversation. Try discussing specific projects, goals, or upcoming activities.";
          }
          
          const aiSuggestionResponseMessage: ChatMessage = {
            id: uuidv4(),
            conversationId,
            userId: user.id,
            content: responseText,
            role: 'assistant',
            createdAt: new Date().toISOString(),
          };
          
          await saveAiMessage(aiSuggestionResponseMessage);
          
          return { userMessage, aiMessage: aiSuggestionResponseMessage };
        } catch (error) {
          console.error("Error handling suggestion request:", error);
          const errorMessage = "Sorry, I couldn't generate suggestions right now. Please try again later.";
          
          const aiErrorMessage: ChatMessage = {
            id: uuidv4(),
            conversationId,
            userId: user.id,
            content: errorMessage,
            role: 'assistant',
            createdAt: new Date().toISOString(),
          };
          
          await saveAiMessage(aiErrorMessage);
          
          return { userMessage, aiMessage: aiErrorMessage };
        }
      }
      
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
        await saveAiMessage(aiConfirmationMessage, JSON.parse(pendingCommandInfo));
        
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
        const taskResult = await createTaskFromCommand(user.id, commandResult.entities, history);
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
        const updateResult = await updateEventFromCommand(user.id, commandResult.entities);
        commandResponseText = updateResult.success 
          ? `✅ Updated event: "${updateResult.title}"${updateResult.time ? ` for ${updateResult.time}` : ''}`
          : `❌ Failed to update event: ${updateResult.error}`;
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
      await saveAiMessage(aiCommandResponseMessage);
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
      await saveAiMessage(aiDataResponseMessage);
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

    await saveAiMessage(aiMessage);

    // Generate title for new conversations (after first AI response)
    if (history.length <= 2) { // Allow for user message + AI response
      try {
        await generateConversationTitle(conversationId, [...history, userMessage, aiMessage]);
      } catch (error) {
        console.error("Error generating conversation title:", error);
        // Don't fail the whole message if title generation fails
      }
    }

    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Check user settings before analyzing conversation for passive suggestions
    let hasOverallSuggestions = false;
    let clarifyingQuestions: ClarifyingQuestion[] | undefined = undefined;
    
    try {
      const aiSettings = await getAiSettings();
      const suggestionsEnabled = aiSettings?.ai_suggestions_enabled !== false; // Default to true if not set
      
      if (suggestionsEnabled) {
        const updatedHistoryWithAiResponse = [...history, aiMessage]; // Use history *including* the latest AI response
        console.log("Analyzing conversation for passive suggestions after AI response...");
        const extractionResult = await analyzeConversation(user.id, updatedHistoryWithAiResponse);
        
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
      } else {
        console.log("AI suggestions disabled by user, skipping passive suggestion analysis.");
      }
    } catch (error) {
      console.error("Error extracting passive suggestions:", error);
    }

    // Generate conversation intelligence features
    const updatedHistoryWithBoth = [...history, userMessage, aiMessage];
    const conversationMemory = buildConversationMemory(updatedHistoryWithBoth);
    const followUpSuggestions = generateFollowUpSuggestions(message, aiResponseText, updatedHistoryWithBoth);

    return { 
      userMessage, 
      aiMessage, 
      hasOverallSuggestions, 
      clarifyingQuestions,
      followUpSuggestions: followUpSuggestions.length > 0 ? followUpSuggestions : undefined,
      conversationMemory
    };
  } catch (error) {
    console.error("Error sending message:", error);

    // Throwing will allow ChatWindow to display a generic error toast
    throw error;
  }
}; 