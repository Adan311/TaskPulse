import { supabase } from "../../../../database/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage, getAiSettings } from "../core/geminiService";
import { analyzeConversation, saveTaskSuggestions, saveEventSuggestions } from "../suggestions/suggestionService";
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
import { handleUserDataQuery } from "./dataQuerying";
import { ClarifyingQuestion } from "../suggestions/suggestionService";

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
} | null> => {
  try {
    // Validate inputs to prevent UUID errors
    if (!conversationId || conversationId.trim() === '') {
      throw new Error("Invalid conversation ID provided");
    }
    if (!message || message.trim() === '') {
      throw new Error("Message cannot be empty");
    }

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

    return { userMessage, aiMessage, hasOverallSuggestions, clarifyingQuestions };
  } catch (error) {
    console.error("Error sending message:", error);
    // Return null or throw, depending on desired error handling for the caller (ChatWindow.tsx)
    // Throwing will allow ChatWindow to display a generic error toast
    throw error;
  }
}; 