import { supabase } from "../../../../database/client";
import { v4 as uuidv4 } from "uuid";
import { getGeminiApiKey, callGeminiApiDirectly, FormattedMessage } from "../core/geminiService";
import { getCurrentUser } from "@/shared/utils/authUtils";

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
    const user = await getCurrentUser();
    
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
    const user = await getCurrentUser();
    
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
    const user = await getCurrentUser();
    
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
    
    const titlePrompt: FormattedMessage = {
      role: "user",
      content: `Based on this conversation, generate a short, concise title (5 words or less). Just return the title with no quotes or additional text.`
    };
    
    // Call Gemini API
    const title = await callGeminiApiDirectly(apiKey, [...formattedHistory, titlePrompt], {
      temperature: 0.2,
      maxOutputTokens: 20
    });
    
    if (!title) {
      return "New Conversation";
    }
    
    // Clean up the title (remove quotes if present)
    const cleanTitle = title.replace(/^["']|["']$/g, '').trim();
    
    // Update the conversation title in the database
    await updateConversationTitle(conversationId, cleanTitle);
    
    return cleanTitle;
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Conversation";
  }
};

/**
 * Update a conversation's title
 */
export const updateConversationTitle = async (
  conversationId: string, 
  title?: string
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User must be authenticated to update conversation title");
      return false;
    }
    
    if (!title) {
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
      console.error("Error updating conversation title:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating conversation title:", error);
    return false;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User must be authenticated to delete a conversation");
      return false;
    }
    
    // First delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .eq('conversation_id', conversationId);
      
    if (messagesError) {
      console.error("Error deleting conversation messages:", messagesError);
      return false;
    }
    
    // Then delete the conversation itself
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