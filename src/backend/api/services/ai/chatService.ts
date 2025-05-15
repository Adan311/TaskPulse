import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "./geminiService";

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
 * Update conversation title
 */
export const updateConversationTitle = async (conversationId: string, title: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to update a conversation");
      return false;
    }
    
    const { error } = await supabase
      .from('ai_conversations')
      .update({ 
        title,
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
): Promise<{userMessage: ChatMessage; aiMessage: ChatMessage} | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to send a message");
      return null;
    }
    
    console.log("Saving user message to conversation:", conversationId);
    
    // Save user message
    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      conversation_id: conversationId,
      user_id: user.id,
      content: message,
      role: 'user' as const,
      created_at: new Date().toISOString()
    };
    
    const { error: userMessageError } = await supabase
      .from('ai_messages')
      .insert(userMessage);
      
    if (userMessageError) {
      console.error("Error saving user message:", userMessageError);
      return null;
    }
    
    console.log("Updating conversation timestamp");
    
    // Update conversation updated_at time
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error("Error updating conversation timestamp:", updateError);
      // Don't return null here, we can still try to get an AI response
    }
    
    console.log("Getting Gemini API key");
    
    // Get API key from user settings - now mandatory
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      console.error("No Gemini API key found for user");
      throw new Error("You need to add your Gemini API key in settings to use the AI chat. Go to Settings > AI Settings to add your key.");
    }
    
    console.log("Getting previous messages for context");
    
    // Get previous messages for context
    const { data: messagesData, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error("Error retrieving conversation messages:", messagesError);
      throw new Error("Could not retrieve conversation history.");
    }
    
    console.log(`Found ${messagesData?.length || 0} previous messages`);
    
    // Format messages for Gemini API
    const formattedMessages: FormattedMessage[] = (messagesData || []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));
    
    console.log("Calling Gemini API directly");
    
    // Generate AI message ID in advance
    const aiMessageId = uuidv4();
    
    try {
      // Make a direct call to the Gemini API
      const aiResponse = await callGeminiApiDirectly(apiKey, formattedMessages);
      
      if (!aiResponse) {
        throw new Error("No response received from AI. Please try again later.");
      }
      
      console.log("AI response received, saving to database");
      
      // Save AI response
      const aiMessage = {
        id: aiMessageId,
        conversation_id: conversationId,
        user_id: user.id,
        content: aiResponse,
        role: 'assistant' as const,
        created_at: new Date().toISOString()
      };
      
      const { error: aiMessageError } = await supabase
        .from('ai_messages')
        .insert(aiMessage);
        
      if (aiMessageError) {
        console.error("Error saving AI message:", aiMessageError);
        // Still return the AI response even if we couldn't save it
      }
      
      // Analyze message for potential task/event suggestions
      // This will be implemented in Phase 2
      
      return {
        userMessage: {
          id: userMessageId,
          conversationId,
          userId: user.id,
          content: message,
          role: 'user',
          createdAt: userMessage.created_at
        },
        aiMessage: {
          id: aiMessageId,
          conversationId,
          userId: user.id,
          content: aiResponse,
          role: 'assistant',
          createdAt: aiMessage.created_at
        }
      };
    } catch (error) {
      console.error("Exception calling Gemini API:", error);
      throw error; // Rethrow so the UI can handle it
    }
  } catch (error) {
    console.error("Exception sending message:", error);
    throw error; // Rethrow so the UI can handle it
  }
}; 