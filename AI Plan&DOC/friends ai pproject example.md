
# Gemini Note Scribe - Technical Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Authentication & API Keys](#authentication--api-keys)
4. [Chat Functionality](#chat-functionality)
5. [Notes Functionality](#notes-functionality)
6. [AI Integration with Gemini API](#ai-integration-with-gemini-api)
7. [Local Storage Usage](#local-storage-usage)
8. [Component Structure](#component-structure)
9. [Implementation Guide](#implementation-guide)

## Introduction

Gemini Note Scribe is a React application that provides AI-powered note-taking and chat functionality using Google's Gemini API. The application allows users to:

- Have conversations with the Gemini AI model
- Create, edit, and manage notes
- Get AI-generated responses about their notes
- Store information locally in the browser

This documentation provides a detailed breakdown of how the application works and how to implement similar features in your own applications.

## Architecture Overview

The application is built using:

- **React**: Frontend library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library for UI elements
- **Google Gemini API**: AI capabilities
- **Local Storage**: For persisting user data

The application consists of two main features:
1. Chat interface for direct communication with Gemini AI
2. Notes system for creating and managing notes with AI assistance

## Authentication & API Keys

### API Key Management

The application requires users to provide their own Google Gemini API key. This approach has several benefits:

1. No backend needed to store sensitive API keys
2. Users have control over their own API usage and quotas
3. Better privacy as all interactions happen directly between the user and Google

### Implementation Details

The API key is:
1. Collected through the `ApiKeyInput` component
2. Stored in the browser's localStorage for persistence across sessions
3. Never sent to any server other than Google's API endpoints
4. Can be reset by the user at any time

```typescript
// Example of the API Key input component
const ApiKeyInput = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("gemini_api_key", apiKey);
    onApiKeySubmit(apiKey);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        type="password" 
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your Gemini API key" 
      />
      <Button type="submit">Save API Key</Button>
    </form>
  );
};
```

### How to Implement in Your Own App

1. Create a form for collecting the API key
2. Store the key in localStorage or another secure client-side storage
3. Add functionality to reset/change the key
4. Use the key in all API requests to the Gemini API

## Chat Functionality

### Overview

The chat feature allows users to have a conversation with the Gemini AI model. Messages are displayed in a conversation-like interface with user and AI messages clearly distinguished.

### Implementation Details

The chat functionality is implemented through the following components:

1. `ChatContainer`: Main component managing the chat state and API calls
2. `MessageList`: Renders the list of messages in the conversation
3. `ChatInputForm`: Handles user input and submission

Key aspects of implementation:

```typescript
// Message sending flow
const handleSendMessage = async (content) => {
  // Create new user message
  const newUserMessage = {
    id: uuidv4(),
    content,
    role: "user",
    timestamp: new Date(),
  };

  // Add to message list
  setMessages(prev => [...prev, newUserMessage]);
  
  // Call Gemini API
  setLoading(true);
  try {
    const geminiMessages = transformMessagesToGeminiFormat([...messages, newUserMessage]);
    const response = await sendChatMessage(geminiMessages, apiKey);
    
    // Add AI response to messages
    const newAiMessage = {
      id: uuidv4(),
      content: response.text,
      role: "assistant",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newAiMessage]);
  } catch (error) {
    toast.error("Failed to get a response");
  } finally {
    setLoading(false);
  }
};
```

### Message Format Transformation

The application needs to transform the internal message format to the format expected by the Gemini API:

```typescript
const transformMessagesToGeminiFormat = (messages) => {
  return messages
    .filter(msg => msg.role !== "system")
    .map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
};
```

## Notes Functionality

### Overview

The notes feature allows users to:
1. Create and manage multiple notes
2. Use AI to analyze or enhance note content
3. Copy or insert AI responses into notes

### Implementation Details

The notes functionality is organized into several components:

1. `NotesContainer`: Main component that orchestrates the notes functionality
2. `NotesSidebar`: Shows a list of notes and allows creating new ones
3. `NoteEditor`: For editing an individual note and requesting AI feedback
4. `AIResponseSection`: Displays AI responses with actions like copy, collapse, and insert
5. `EmptyNoteState`: Shown when no note is selected

The state management is handled through the `useNotesManager` custom hook:

```typescript
export const useNotesManager = (apiKey) => {
  const [notes, setNotes] = useLocalStorage("notes", []);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Create, update, delete note functions
  const createNewNote = () => {/* implementation */};
  const updateNoteTitle = (id, title) => {/* implementation */};
  const updateNoteContent = (id, content) => {/* implementation */};
  const deleteNote = (id) => {/* implementation */};
  
  // AI processing function
  const processNoteWithAI = async (noteId) => {
    // Get note content
    // Call Gemini API
    // Update note with response
  };
  
  return {
    notes,
    activeNoteId,
    setActiveNoteId,
    createNewNote,
    updateNoteTitle,
    updateNoteContent,
    deleteNote,
    processNoteWithAI,
    // other states and functions
  };
};
```

### AI Interaction with Notes

When a user wants AI feedback on a note:

1. The note content is sent to the Gemini API
2. The response is stored with the note
3. The user can view, copy, or insert the AI response

## AI Integration with Gemini API

### Overview

The application uses Google's Gemini API for:
1. Chat conversations
2. Analyzing and providing feedback on notes

### API Interaction Details

The main API interaction happens through the `sendChatMessage` function:

```typescript
export async function sendChatMessage(
  messages: GeminiChatMessage[],
  apiKey: string,
  model: string = DEFAULT_MODEL
) {
  try {
    const response = await fetch(
      `${API_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to get response");
    }

    const data = await response.json();
    return {
      text: data.candidates[0].content.parts[0].text,
      role: "model",
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
```

### Gemini API Configuration

The application uses the following constants for API configuration:

```typescript
export const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_MODEL = "gemini-1.5-flash";
```

## Local Storage Usage

### Overview

The application uses browser's localStorage to persist:
1. User's API key
2. Notes data
3. Chat conversation history

### Implementation Details

A custom hook `useLocalStorage` is used to synchronize state with localStorage:

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
```

This hook is used throughout the application to persist state across page refreshes.

## Component Structure

### App Layout

The application uses a tab-based interface with two main sections:
1. Chat tab
2. Notes tab

```
AppLayout
├── ApiKeyInput (if no API key is set)
└── Main Content
    ├── Tabs
    │   ├── Chat Tab
    │   │   └── ChatContainer
    │   │       ├── MessageList
    │   │       └── ChatInputForm
    │   └── Notes Tab
    │       └── NotesContainer
    │           ├── NotesSidebar
    │           │   └── Note items
    │           └── Note editor or empty state
    │               ├── NoteEditor (if note selected)
    │               │   ├── Title input
    │               │   ├── Content textarea
    │               │   ├── AIResponseSection (if AI response exists)
    │               │   └── Action buttons
    │               └── EmptyNoteState (if no note selected)
    └── Toaster for notifications
```

## Implementation Guide

### Step 1: Setup a React Project

1. Create a new React project with TypeScript
2. Install necessary dependencies:
   - UI components (shadcn/ui or similar)
   - uuid for generating unique IDs
   - react-markdown for rendering markdown content

### Step 2: Implement API Key Management

1. Create an API key input component
2. Set up localStorage for storing the key
3. Create a context or state management for accessing the key

### Step 3: Implement Chat Functionality

1. Create message types and interfaces
2. Build the chat UI components
3. Implement sending and receiving messages

### Step 4: Implement Notes System

1. Create a notes data structure
2. Build the notes UI components
3. Implement CRUD operations for notes

### Step 5: Integrate with Gemini API

1. Set up API communication functions
2. Implement error handling for API calls
3. Create response processing utilities

### Step 6: Add Features to AIResponseSection

1. Add copy functionality
2. Add insert into note functionality
3. Add collapse/expand functionality

### Best Practices and Tips

1. **Security**:
   - Never store API keys in your codebase
   - Use environment variables for any backend API keys if you extend with a backend
   - Let users input their own API keys for client-side only applications

2. **Error Handling**:
   - Add proper error handling for API calls
   - Provide clear feedback to users when something fails
   - Handle rate limiting and quota exceeded errors gracefully

3. **Performance**:
   - Implement pagination for long chat histories or many notes
   - Use virtualized lists for long content
   - Optimize component rendering with memoization

4. **Accessibility**:
   - Ensure all interactive elements are keyboard accessible
   - Add proper aria attributes to components
   - Test with screen readers

5. **User Experience**:
   - Add loading states during API calls
   - Provide feedback for actions with toast notifications
   - Implement undo functionality for destructive actions

## Getting a Gemini API Key

To get a Gemini API key:

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create or sign in to a Google account
3. Navigate to the API Keys section
4. Create a new API key
5. Use this key in your application

## Conclusion

This documentation has covered the key aspects of implementing a React application with Google Gemini AI integration. By following these patterns and guides, you can implement similar functionality in your own applications, allowing users to leverage AI capabilities while maintaining control over their API keys and data.

Remember that the Gemini API and its features may evolve over time, so always refer to the [official documentation](https://ai.google.dev/docs) for the most up-to-date information.
