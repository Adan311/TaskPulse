import { supabase } from "../../../../database/client";
import { getCurrentUser } from "@/shared/utils/authUtils";

/**
 * Service for interacting with Google's Gemini API
 */

// Base URL for Gemini API
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.0-flash"; // Can be configured based on needs

// Define interfaces for better type safety with Gemini API
export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface FormattedMessage {
  role: 'user' | 'assistant' | 'model';
  content?: string;
  parts?: GeminiPart[];
  text?: string;
}

/**
 * Get the API key for the Gemini API from user settings.
 * The user must provide their own API key.
 */
export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("No authenticated user found when getting Gemini API key");
      return null;
    }

    // Get the user's API key from settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('gemini_api_key, gemini_use_own_key')
      .eq('user_id', user.id)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Error getting user settings:", settingsError);
    }
    
    // User must use their own key
    if (!userSettings?.gemini_api_key) {
      console.log("User has not provided a Gemini API key");
      return null;
      }
      
    return userSettings.gemini_api_key;
  } catch (error) {
    console.error("Exception getting Gemini API key:", error);
    return null;
  }
};

/**
 * Call the Gemini API directly from the client
 */
export const callGeminiApiDirectly = async (
  apiKey: string, 
  messages: FormattedMessage[],
  config?: GenerationConfig
): Promise<string | null> => {
  try {
    console.log("Making direct API call to Gemini with", messages.length, "messages");
    
    // Format the messages for the Gemini API
    const contents = messages.map(msg => {
      // Handle different possible input formats
      const role = msg.role === 'assistant' ? 'model' : 'user';
      let parts: GeminiPart[] = [];
      
      if (Array.isArray(msg.parts) && msg.parts.length > 0) {
        parts = msg.parts;
      } else if (msg.content) {
        parts = [{ text: msg.content }];
      } else if (msg.text) {
        parts = [{ text: msg.text }];
      } else {
        parts = [{ text: "" }];
      }
      
      return { role, parts };
    });
    
    const response = await fetch(
      `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: config || {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}): ${errorText}`);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Direct Gemini API response received");
    
    // Extract the generated text from the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected response format:", JSON.stringify(data).substring(0, 200));
      return null;
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error in direct Gemini API call:", error);
    throw error;
  }
};

/**
 * Save user's own Gemini API key
 */
export const saveGeminiApiKey = async (apiKey: string, useOwnKey: boolean): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User must be authenticated to save API key");
      return false;
    }

    // Check if user already has settings
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          gemini_api_key: apiKey,
          gemini_use_own_key: useOwnKey,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error updating Gemini API key:", error);
        return false;
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          gemini_api_key: apiKey,
          gemini_use_own_key: useOwnKey
        });
        
      if (error) {
        console.error("Error inserting Gemini API key:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Exception saving Gemini API key:", error);
    return false;
  }
};

/**
 * Get user settings for AI features
 */
export const getAiSettings = async () => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("No authenticated user found when getting AI settings");
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('gemini_use_own_key, gemini_api_key, ai_suggestions_enabled, ai_setting_tab_enabled')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected for new users
      console.error("Error getting AI settings:", error);
      return null;
    }
    
    // Return default settings if none exist
    return data || {
      gemini_use_own_key: true, // Default to requiring own key
      gemini_api_key: null,
      ai_suggestions_enabled: true,
      ai_setting_tab_enabled: true
    };
  } catch (error) {
    console.error("Exception getting AI settings:", error);
    return null;
  }
};

/**
 * Update AI feature settings
 */
export const updateAiSettings = async (settings: {
  ai_suggestions_enabled?: boolean;
}): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User must be authenticated to update AI settings");
      return false;
    }

    // Check if user already has settings
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error updating AI settings:", error);
        return false;
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...settings
        });
        
      if (error) {
        console.error("Error inserting AI settings:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Exception updating AI settings:", error);
    return false;
  }
}; 