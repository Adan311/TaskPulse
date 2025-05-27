import { callGeminiApiDirectly, getGeminiApiKey, FormattedMessage } from "../core/geminiService";
import type { ChatMessage } from "../chat/chatService";

/**
 * Interface for a detected task from AI suggestion (application-facing, camelCase)
 */
export interface TaskSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: "low" | "medium" | "high";
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string; // ISO String
  projectName?: string;
  labels?: string[];
}

/**
 * Interface for a detected event from AI suggestion (application-facing, camelCase)
 */
export interface EventSuggestion {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: "suggested" | "accepted" | "rejected";
  sourceMessageId?: string;
  createdAt: string; // ISO String
  projectName?: string;
}

export interface ClarifyingQuestion {
  question_text: string;
}

/**
 * Interface for the raw extraction result from Gemini (snake_case matching prompt output)
 */
export interface GeminiTaskExtraction {
  title: string;
  description?: string;
  due_date?: string; // YYYY-MM-DD or null
  priority?: "low" | "medium" | "high";
  project_name?: string;
  labels?: string[];
}

export interface GeminiEventExtraction {
  title: string;
  description?: string;
  start_time: string; // YYYY-MM-DDTHH:MM:SS
  end_time: string; // YYYY-MM-DDTHH:MM:SS
  project_name?: string;
}

export interface ExtractionResult {
  tasks: GeminiTaskExtraction[];
  events: GeminiEventExtraction[];
  clarifying_questions?: ClarifyingQuestion[];
}

const BASE_SUGGESTION_PROMPT = `You are an AI assistant integrated into a project management system that includes calendar tasks, project notes, and file uploads. Your job is to analyze the user's conversation and suggest relevant tasks or events based on the context. Follow these guidelines:
- For tasks, provide a clear title, description, and any relevant details (e.g., deadlines, project name, labels).
- For events, include the title, description, date, start time, end time, and project name.
- Ensure suggestions are specific, actionable, and tied to the conversation.
- If the conversation shifts between topics, try to segment it and analyze each part separately if distinct actions can be identified.
- If the intent is unclear for a specific actionable item, suggest a clarifying question instead of guessing.

Return ONLY valid JSON following this exact structure:
{
  "tasks": [
    {
      "title": "Specific task with action verb",
      "description": "Detailed description with context",
      "due_date": "YYYY-MM-DD or null",
      "priority": "low" or "medium" or "high", 
      "project_name": "Project name if mentioned or null",
      "labels": ["label1", "label2"]
    }
  ],
  "events": [
    {
      "title": "Specific event title",
      "description": "Detailed description",
      "start_time": "YYYY-MM-DDTHH:MM:SS",
      "end_time": "YYYY-MM-DDTHH:MM:SS",
      "project_name": "Project name if mentioned or null"
    }
  ],
  "clarifying_questions": [
    {
      "question_text": "A question to clarify user intent for a potential task or event."
    }
  ]
}

If no tasks or events are clearly suggested, return {"tasks":[],"events":[], "clarifying_questions":[]}.
DO NOT include fields with null values in the JSON unless the field itself is optional.
DO NOT make up information not present in the conversation.
Associate suggestions with project names if mentioned. Infer priority based on urgency.
Current date for reference: {{current_date}}.
`;

const CONTEXT_ADDONS = {
  PROJECT_MANAGEMENT: `The conversation seems project-related. Focus on identifying action items, project deliverables, deadlines, and responsibilities. If a project name is mentioned, try to associate the task with it. Suggest tasks like 'Finalize [document] by [date]' or 'Assign [task] to [person].'`,
  CALENDAR_SCHEDULING: `The conversation mentions scheduling or specific times/dates. Prioritize extracting specific dates, times, and the purpose of meetings or events. Suggest events like 'Meeting about [topic] on [date] at [time].'`,
  CASUAL_PERSONAL: `The conversation seems more casual or personal. Identify potential personal tasks or reminders. Only suggest if there seems to be a clear intent or a self-assigned to-do. If vague, prefer asking a clarifying question like, 'Would you like me to create a task for [action]?'`,
  TRAVEL: `The conversation appears to be about travel. Focus on travel-related actions such as booking flights/hotels, creating itineraries, or packing lists. Extract destinations and travel dates. Example: 'Plan trip to [Destination]' or 'Book flight for [Destination] on [Date].'`,
};

const KEYWORD_SETS = {
  PROJECT_MANAGEMENT: ["deadline", "assign", "task", "report", "client", "budget", "milestone", "project", "deliverable", "sprint", "roadmap"],
  CALENDAR_SCHEDULING: ["meeting", "schedule", "call", "event", "appointment", "calendar", "invite", "conference", "webinar", "10am", "2pm", "next week", "tomorrow", "friday"],
  CASUAL_PERSONAL: ["should", "need to", "planning to", "thinking of", "friend", "organize", "personal"],
  TRAVEL: ["trip", "travel", "vacation", "dubai", "flight", "hotel", "itinerary", "booking", "destination", "journey"],
};

/**
 * Detect conversation contexts based on keywords
 */
export function detectConversationContexts(messages: ChatMessage[]): string[] {
  const detectedContexts: Set<string> = new Set();
  const recentMessagesContent = messages.slice(-5).map(msg => msg.content.toLowerCase()).join(" ");
  for (const context in KEYWORD_SETS) {
    if (KEYWORD_SETS[context as keyof typeof KEYWORD_SETS].some(keyword => recentMessagesContent.includes(keyword))) {
      detectedContexts.add(context);
    }
  }
  return Array.from(detectedContexts);
}

/**
 * Analyses a conversation using Gemini API to extract potential tasks and events
 */
export const analyzeConversation = async (
  messages: ChatMessage[]
): Promise<ExtractionResult | null> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for suggestion extraction");
      return null;
    }

    const formattedHistory: FormattedMessage[] = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      content: msg.content
    }));
    
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];

    let dynamicPrompt = BASE_SUGGESTION_PROMPT.replace("{{current_date}}", currentDate);

    const detectedContexts = detectConversationContexts(messages);
    console.log("Detected contexts:", detectedContexts);

    detectedContexts.forEach(context => {
      if (CONTEXT_ADDONS[context as keyof typeof CONTEXT_ADDONS]) {
        dynamicPrompt += "\n\nContextual Guidance: " + CONTEXT_ADDONS[context as keyof typeof CONTEXT_ADDONS];
      }
    });

    // Add the conversation history itself to the prompt
    // For now, we'll append it to the user message that contains the main instructions
    // A more sophisticated approach might involve structuring it as part of the history for Gemini

    const extractionPromptMessage: FormattedMessage = {
      role: "user",
      content: dynamicPrompt + "\n\nConversation to analyze:\n" + formattedHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    };
    
    // The full prompt now consists of only the instruction message,
    // as the conversation is embedded within it.
    // If Gemini performs better with history + new user message, this needs adjustment.
    // For now, assuming Gemini can parse the conversation from the single large prompt.
    const fullPrompt = [extractionPromptMessage];

    // Call Gemini API with specialized parameters for structured output
    const response = await callGeminiApiDirectly(apiKey, fullPrompt, {
      temperature: 0.2, // Slightly higher for more nuanced understanding but still factual
      maxOutputTokens: 1500 // Increased to handle potentially larger JSON
    });

    if (!response) {
      console.error("No response from Gemini API for suggestion extraction");
      return null;
    }

    // Parse the JSON response
    try {
      // Find the JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in Gemini response for suggestion extraction:", response);
        return null;
      }

      const extractionResult: ExtractionResult = JSON.parse(jsonMatch[0]);
      console.log("Suggestion extraction result:", extractionResult);
      return extractionResult;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini suggestion response:", parseError);
      console.error("Raw response:", response);
      return null;
    }
  } catch (error) {
    console.error("Error in analyzeConversation:", error);
    return null;
  }
}; 