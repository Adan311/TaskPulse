import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "./geminiService";
import { analyzeConversation, saveTaskSuggestions, saveEventSuggestions } from "./suggestionService";

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
export const updateConversationTitle = async (conversationId: string, title?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User must be authenticated to update a conversation");
      return false;
    }
    
    const { error } = await supabase
      .from('ai_conversations')
      .update({ 
        title: title || "New Conversation",
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
): Promise<{userMessage: ChatMessage; aiMessage: ChatMessage; hasSuggestions?: boolean} | null> => {
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

    // Insert user message
    const { error: userMessageError } = await supabase.from('ai_messages').insert({
      id: userMessage.id,
      conversation_id: conversationId,
      user_id: user.id,
      content: message,
      role: 'user',
      created_at: userMessage.createdAt
    });

    if (userMessageError) throw userMessageError;

    // Get conversation history
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

    // Get API key
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      throw new Error("No Gemini API key available. Please add your API key in the settings.");
    }

    // Format history for Gemini API
    const formattedHistory: FormattedMessage[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));

    // Call Gemini API directly
    const aiResponse = await callGeminiApiDirectly(apiKey, formattedHistory);
    if (!aiResponse) {
      throw new Error("Failed to get response from Gemini API");
    }

    // Create AI message
    const aiMessage: ChatMessage = {
      id: uuidv4(),
      conversationId,
      userId: user.id,
      content: aiResponse,
      role: 'assistant',
      createdAt: new Date().toISOString(),
    };

    // Insert AI message
    const { error: aiMessageError } = await supabase.from('ai_messages').insert({
      id: aiMessage.id,
      conversation_id: conversationId,
      user_id: user.id,
      content: aiResponse,
      role: 'assistant',
      created_at: aiMessage.createdAt
    });

    if (aiMessageError) throw aiMessageError;

    // Update the conversation title if it's the first message
    if (history.length <= 1) {
      await updateConversationTitle(conversationId);
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    // Analyze conversation for suggestions
    let hasSuggestions = false;
    try {
      // Get updated conversation history including the new AI message
      const updatedHistory = [...history, userMessage, aiMessage];
      
      // Analyze the conversation
      const extractionResult = await analyzeConversation(updatedHistory);
      
      if (extractionResult && 
          (extractionResult.tasks.length > 0 || extractionResult.events.length > 0)) {
        // Save task suggestions
        if (extractionResult.tasks.length > 0) {
          await saveTaskSuggestions(user.id, extractionResult.tasks, aiMessage.id);
        }
        
        // Save event suggestions
        if (extractionResult.events.length > 0) {
          await saveEventSuggestions(user.id, extractionResult.events, aiMessage.id);
        }
        
        hasSuggestions = true;
      }
    } catch (error) {
      // Log error but don't fail the entire response if suggestion extraction fails
      console.error("Error extracting suggestions:", error);
    }

    return { userMessage, aiMessage, hasSuggestions };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};