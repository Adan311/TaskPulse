# AI-Powered Application with Gemini API - Implementation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Language and Technology Stack](#language-and-technology-stack)
4. [API Key Management Strategies](#api-key-management-strategies)
   - [Client-Side Storage Approach](#client-side-storage-approach)
   - [Supabase Backend Storage Approach](#supabase-backend-storage-approach)
5. [AI Chat Implementation](#ai-chat-implementation)
   - [Basic Chat Interface](#basic-chat-interface)
   - [Message History Management](#message-history-management)
   - [AI Response Processing](#ai-response-processing)
6. [AI Task and Event Suggestions](#ai-task-and-event-suggestions)
   - [Generating Suggestions](#generating-suggestions)
   - [Accept/Reject Mechanism](#acceptreject-mechanism)
   - [Storing Suggestions in Supabase](#storing-suggestions-in-supabase)
7. [Notes and Document Analysis](#notes-and-document-analysis)
   - [AI-Enhanced Note Taking](#ai-enhanced-note-taking)
   - [Document Processing](#document-processing)
8. [Supabase Database Integration](#supabase-database-integration)
   - [Database Schema](#database-schema)
   - [Data Access Patterns](#data-access-patterns)
   - [Security and RLS Policies](#security-and-rls-policies)
9. [Advanced Features](#advanced-features)
   - [Structured Output Parsing](#structured-output-parsing)
   - [Edge Functions for API Security](#edge-functions-for-api-security)
   - [Recurring Tasks and Events](#recurring-tasks-and-events)
10. [Implementation Best Practices](#implementation-best-practices)
   - [Performance Optimization](#performance-optimization)
   - [Error Handling](#error-handling)
   - [Testing Strategies](#testing-strategies)
11. [Appendix: API Reference](#appendix-api-reference)

## Introduction

This documentation provides a comprehensive guide to implementing AI features powered by Google's Gemini API in a web application using React, TypeScript, and Supabase as the backend. It focuses on three key features:

1. **AI Chat**: An interactive chat interface that allows users to discuss tasks, projects, and other topics with an AI assistant.
2. **AI-Suggested Tasks/Events**: Functionality for the AI to proactively or reactively suggest tasks/events based on chat discussions.
3. **Accept/Reject Suggestions**: Mechanisms for users to review, accept, or reject AI-generated suggestions.

The implementation approaches described are adaptable to various application designs and can be integrated into new or existing applications.

## Architecture Overview

The application is built using:

- **Frontend**: React with TypeScript
- **Backend**: Supabase (PostgreSQL database with RESTful API)
- **AI Capabilities**: Google Gemini API
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for files and assets

This architecture offers several benefits:

1. **Serverless Backend**: Minimizes operational overhead
2. **Real-time Capabilities**: Through Supabase's real-time subscriptions
3. **Secure API Key Management**: For protecting sensitive credentials
4. **Scalable Data Storage**: For managing users, tasks, events, and AI interactions

### High-Level Architecture Diagram

```
+-----------------------+      +-------------------------+
|                       |      |                         |
|   React Application   |<---->|   Supabase Backend      |
|                       |      |   (DB + Auth + Storage) |
+-----------+-----------+      +-------------+-----------+
            |                                |
            |                                |
            v                                v
+-------------------------+      +-------------------------+
|                         |      |                         |
|   Google Gemini API     |<---->|   Supabase Edge        |
|                         |      |   Functions            |
+-------------------------+      +-------------------------+
```

## Language and Technology Stack

All features in this implementation will be developed using **TypeScript** for both the frontend and backend. The key technologies include:

- **Frontend**: React with TypeScript for building user interfaces.
- **Backend**: Supabase Edge Functions (TypeScript) for secure API communication and database operations.
- **AI Integration**: Google Gemini API for AI-powered features.

This ensures a consistent and type-safe development experience across the entire application.

## API Key Management Strategies

There are two main approaches to managing Gemini API keys in your application:

### Client-Side Storage Approach

This approach stores API keys in the client's browser and is suitable for simple applications or quick prototypes:

```typescript
// ApiKeyInput.tsx
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const ApiKeyInput = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("gemini_api_key", apiKey);
    onApiKeySubmit(apiKey);
  };
  
  // Component UI...
};

// Hook for accessing the API key
export const useApiKey = () => {
  const [apiKey, setApiKey] = useLocalStorage<string>("gemini_api_key", "");
  return { apiKey, setApiKey };
};
```

**Pros**:
- Simple implementation
- No backend requirements
- User controls their own API key

**Cons**:
- Limited to browser storage
- Key lost if browser storage is cleared
- Not suitable for multi-device access

### Supabase Backend Storage Approach

This approach stores API keys securely in your Supabase backend:

```typescript
// api-key.service.ts
import { supabase } from '@/lib/supabase';

export const saveApiKey = async (userId: string, apiKey: string) => {
  return await supabase
    .from('user_settings')
    .upsert({ user_id: userId, gemini_api_key: apiKey })
    .select();
};

export const getApiKey = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('gemini_api_key')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data?.gemini_api_key;
};
```

**Supabase Table Structure**:

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  gemini_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for secure access
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id);
```

**Alternative: Using Supabase Edge Functions**:

For even more security, use Supabase Edge Functions to avoid exposing API keys to the client:

```typescript
// Client-side code that calls the Edge Function
const generateAIResponse = async (prompt) => {
  const { data, error } = await supabase.functions.invoke('generate-ai-response', {
    body: { prompt }
  });
  
  if (error) throw error;
  return data;
};
```

In your Edge Function (`generate-ai-response.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// Or get user-specific API key from database

serve(async (req) => {
  const { prompt } = await req.json();
  
  // Call Gemini API using the securely stored key
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });
  
  return new Response(JSON.stringify(await response.json()));
});
```

**Providing a Fallback Option**:

Allow users to use either your organization's API key or their own:

```typescript
// ApiKeyManager.tsx
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';

export const ApiKeyManager = () => {
  const { user } = useUser();
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    // Check if user has their own API key saved
    const checkApiKey = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('gemini_api_key')
          .eq('user_id', user.id)
          .single();
        
        if (data?.gemini_api_key) {
          setUseOwnKey(true);
          setApiKey(data.gemini_api_key);
        }
      }
    };
    
    checkApiKey();
  }, [user]);
  
  // Component UI with toggle for using organization key or personal key
  // ...
};
```

## AI Chat Implementation

### Basic Chat Interface

The chat interface consists of:

1. A message display area showing the conversation history
2. An input area for the user to type messages
3. A send button to submit messages to the AI

Here's a simplified implementation:

```typescript
// ChatContainer.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendChatMessage } from '@/lib/gemini-api';

export const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Load messages from Supabase on component mount
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    
    loadMessages();
  }, []);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    
    // Add user message to the list
    const userMessage = {
      id: crypto.randomUUID(),
      content: input,
      role: 'user',
      created_at: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Save to Supabase
      await supabase.from('messages').insert(userMessage);
      
      // Get API key (from user settings or main storage)
      const apiKey = await getApiKey();
      
      // Send to Gemini API
      const aiResponse = await sendChatMessage(
        messages.concat(userMessage),
        apiKey
      );
      
      // Add AI response to messages
      const aiMessage = {
        id: crypto.randomUUID(),
        content: aiResponse.text,
        role: 'assistant',
        created_at: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save to Supabase
      await supabase.from('messages').insert(aiMessage);
      
      // Analyze the message for potential task/event suggestions
      await analyzeForSuggestions(aiResponse.text);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
      setInput('');
    }
  };
  
  // Component UI...
};
```

### Message History Management

For effective AI interactions, managing message history is crucial:

```typescript
// messageManager.ts
import { supabase } from '@/lib/supabase';

export const fetchMessageHistory = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data;
};

export const saveMessage = async (message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const transformMessagesToGeminiFormat = (messages) => {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
};
```

**Supabase Table Structure for Messages**:

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  thread_id UUID REFERENCES message_threads(id),
  metadata JSONB
);

-- For organizing messages in threads/conversations
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add appropriate RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own messages"
  ON public.messages
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own threads"
  ON public.message_threads
  FOR ALL
  USING (auth.uid() = user_id);
```

### AI Response Processing

Process AI responses to extract structured data:

```typescript
// gemini-api.ts
export const sendChatMessage = async (messages, apiKey) => {
  try {
    const geminiMessages = transformMessagesToGeminiFormat(messages);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
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
};

export const extractStructuredData = async (text, type, apiKey) => {
  try {
    const prompt = `
      Extract structured data from the following text for a ${type}.
      If the text contains information relevant to a ${type}, format the output as valid JSON with the following structure:
      
      ${type === 'task' ? 
        `{
          "title": "Task title",
          "description": "Task description",
          "due_date": "YYYY-MM-DD", // Optional
          "priority": "low/medium/high", // Optional
          "is_suggestion": true
        }` :
        `{
          "title": "Event title",
          "description": "Event description",
          "start_time": "YYYY-MM-DDTHH:MM:SS",
          "end_time": "YYYY-MM-DDTHH:MM:SS",
          "is_suggestion": true
        }`
      }
      
      If no relevant information is found, return {"is_suggestion": false}.
      
      Text to analyze:
      ${text}
      
      Output JSON:
    `;

    const response = await sendChatMessage(
      [{ role: 'user', content: prompt }],
      apiKey
    );
    
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON from AI response", e);
      return { is_suggestion: false };
    }
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return { is_suggestion: false };
  }
};
```

## AI Task and Event Suggestions

### Generating Suggestions

AI can suggest tasks and events based on user conversations:

```typescript
// suggestionGenerator.ts
import { supabase } from '@/lib/supabase';
import { extractStructuredData } from '@/lib/gemini-api';
import { getApiKey } from '@/services/api-key.service';

export const analyzeForSuggestions = async (text, userId) => {
  const apiKey = await getApiKey(userId);
  
  // Analyze for task suggestions
  const taskSuggestion = await extractStructuredData(text, 'task', apiKey);
  
  // Analyze for event suggestions
  const eventSuggestion = await extractStructuredData(text, 'event', apiKey);
  
  // Save valid suggestions to the database
  if (taskSuggestion.is_suggestion) {
    await saveSuggestion('task', taskSuggestion, userId);
  }
  
  if (eventSuggestion.is_suggestion) {
    await saveSuggestion('event', eventSuggestion, userId);
  }
  
  return {
    hasSuggestions: taskSuggestion.is_suggestion || eventSuggestion.is_suggestion,
    taskSuggestion: taskSuggestion.is_suggestion ? taskSuggestion : null,
    eventSuggestion: eventSuggestion.is_suggestion ? eventSuggestion : null
  };
};

const saveSuggestion = async (type, data, userId) => {
  if (type === 'task') {
    await supabase.from('task_suggestions').insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      due_date: data.due_date || null,
      priority: data.priority || 'medium',
      status: 'suggested'
    });
  } else if (type === 'event') {
    await supabase.from('event_suggestions').insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      status: 'suggested'
    });
  }
};
```

### Accept/Reject Mechanism

Provide an interface for users to review and act on suggestions:

```typescript
// SuggestionsList.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const SuggestionsList = () => {
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [eventSuggestions, setEventSuggestions] = useState([]);
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Load task suggestions
      const { data: tasks } = await supabase
        .from('task_suggestions')
        .select('*')
        .eq('status', 'suggested');
        
      if (tasks) setTaskSuggestions(tasks);
      
      // Load event suggestions
      const { data: events } = await supabase
        .from('event_suggestions')
        .select('*')
        .eq('status', 'suggested');
        
      if (events) setEventSuggestions(events);
    };
    
    fetchSuggestions();
  }, []);
  
  const handleAcceptTask = async (suggestion) => {
    // Create actual task from suggestion
    const { data, error } = await supabase.from('tasks').insert({
      title: suggestion.title,
      description: suggestion.description,
      due_date: suggestion.due_date,
      priority: suggestion.priority,
      user: supabase.auth.user()?.id
    });
    
    if (!error) {
      // Update suggestion status
      await supabase
        .from('task_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion.id);
        
      // Remove from UI
      setTaskSuggestions(prev => 
        prev.filter(item => item.id !== suggestion.id)
      );
    }
  };
  
  const handleRejectTask = async (suggestion) => {
    // Update suggestion status
    await supabase
      .from('task_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestion.id);
      
    // Remove from UI
    setTaskSuggestions(prev => 
      prev.filter(item => item.id !== suggestion.id)
    );
  };
  
  // Similar functions for event suggestions...
  
  // Component UI with accept/reject buttons for each suggestion...
};
```

### Storing Suggestions in Supabase

Tables for storing AI-generated suggestions:

```sql
-- For task suggestions
CREATE TABLE public.task_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('suggested', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- For event suggestions
CREATE TABLE public.event_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.task_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own task suggestions"
  ON public.task_suggestions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own event suggestions"
  ON public.event_suggestions
  FOR ALL
  USING (auth.uid() = user_id);
```

## Notes and Document Analysis

### AI-Enhanced Note Taking

Implement AI assistance for notes:

```typescript
// NoteEditor.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sendChatMessage } from '@/lib/gemini-api';

export const NoteEditor = ({ note, onUpdate }) => {
  const [content, setContent] = useState(note?.content || '');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleProcessWithAI = async () => {
    setLoading(true);
    
    try {
      const apiKey = await getApiKey();
      
      const response = await sendChatMessage(
        [{
          role: 'user',
          content: `Please analyze, enhance, or provide feedback on the following note:\n\n${content}`
        }],
        apiKey
      );
      
      setAiResponse(response.text);
    } catch (error) {
      console.error("Error processing with AI:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInsertToNote = (text) => {
    const newContent = content + (content ? "\n\n" : "") + text;
    setContent(newContent);
    onUpdate({ ...note, content: newContent });
  };
  
  // Component UI with editor, AI processing button, and response display...
};
```

### Document Processing

Add functionality to analyze uploaded documents:

```typescript
// DocumentAnalyzer.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiKey } from '@/services/api-key.service';

export const DocumentAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };
  
  const handleAnalyzeDocument = async () => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      // Upload file to Supabase Storage
      const filePath = `documents/${supabase.auth.user().id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      // Extract text from document (this would depend on your document processing approach)
      const textContent = await extractTextFromDocument(publicUrl);
      
      // Analyze with Gemini API
      const apiKey = await getApiKey();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `Please analyze the following document content and provide a summary, key points, and any insights:\n\n${textContent}` }]
            }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 2048,
            },
          }),
        }
      );
      
      const data = await response.json();
      setAnalysis(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error("Error analyzing document:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Component UI...
};

// Helper function to extract text from document (simple example)
const extractTextFromDocument = async (url) => {
  // In a real application, you would use OCR or document parsing services
  // This is a simplified example
  const response = await fetch(url);
  const text = await response.text();
  return text;
};
```

## Supabase Database Integration

### Database Schema

Your provided schema includes tables for:
- `ai_metadata`: Stores AI-generated insights linked to tasks
- `tasks`: For task management
- `events`: For calendar events
- `projects`: For grouping tasks and events
- `notes`: For user notes
- `files`: For document storage

Additional tables for AI functionality:

```sql
-- For storing user API keys and preferences
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  gemini_api_key TEXT,
  gemini_use_own_key BOOLEAN DEFAULT false,
  ai_suggestions_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- For chat message storage
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Add RLS policies for these tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own messages"
  ON public.messages
  FOR ALL
  USING (auth.uid() = user_id);
```

### Data Access Patterns

Efficiently query and update the database:

```typescript
// dataAccess.ts
import { supabase } from '@/lib/supabase';

// Tasks
export const getTasks = async (filters = {}) => {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user', supabase.auth.user().id);
    
  // Apply filters
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.project) query = query.eq('project', filters.project);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user: supabase.auth.user().id
    })
    .select();
    
  if (error) throw error;
  return data[0];
};

// Events
export const getEvents = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user', supabase.auth.user().id)
    .gte('start_time', startDate)
    .lte('end_time', endDate);
    
  if (error) throw error;
  return data;
};

export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      user: supabase.auth.user().id
    })
    .select();
    
  if (error) throw error;
  return data[0];
};

// AI Metadata
export const saveAIInsight = async (taskId, insights) => {
  const { data, error } = await supabase
    .from('ai_metadata')
    .upsert({
      task: taskId,
      user: supabase.auth.user().id,
      insights
    })
    .select();
    
  if (error) throw error;
  return data[0];
};

export const getAIInsightsForTask = async (taskId) => {
  const { data, error } = await supabase
    .from('ai_metadata')
    .select('insights')
    .eq('task', taskId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data?.insights || null;
};
```

### Security and RLS Policies

Secure your database with Row Level Security (RLS) policies:

```sql
-- Ensure RLS is enabled on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metadata ENABLE ROW LEVEL SECURITY;

-- Basic policy: users can only access their own data
CREATE POLICY "Users can access own tasks"
  ON public.tasks
  FOR ALL
  USING (auth.uid() = "user");

CREATE POLICY "Users can access own events"
  ON public.events
  FOR ALL
  USING (auth.uid() = "user");

CREATE POLICY "Users can access own projects"
  ON public.projects
  FOR ALL
  USING (auth.uid() = "user");

CREATE POLICY "Users can access own notes"
  ON public.notes
  FOR ALL
  USING (auth.uid() = "user");

CREATE POLICY "Users can access own files"
  ON public.files
  FOR ALL
  USING (auth.uid() = "user");

CREATE POLICY "Users can access own AI metadata"
  ON public.ai_metadata
  FOR ALL
  USING (auth.uid() = "user");
```

## Advanced Features

### Structured Output Parsing

Extract structured information from AI responses:

```typescript
// structuredOutputParser.ts
export interface TaskSuggestion {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  is_suggestion: boolean;
}

export interface EventSuggestion {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_suggestion: boolean;
}

export const extractTasksFromText = async (text: string, apiKey: string): Promise<TaskSuggestion[]> => {
  const prompt = `
    Analyze the following text and extract any tasks mentioned. 
    Format the output as a JSON array of tasks with this structure:
    
    [
      {
        "title": "Task title",
        "description": "Task description",
        "due_date": "YYYY-MM-DD", (optional)
        "priority": "low/medium/high", (optional)
        "is_suggestion": true
      }
    ]
    
    If no tasks are found, return an empty array.
    
    Text to analyze:
    ${text}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for more deterministic output
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const outputText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON part from the response
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return [];
    }
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return [];
  }
};

// Similar function for events...
```

### Edge Functions for API Security

Use Supabase Edge Functions to secure API calls:

```typescript
// Edge Function: generate-ai-response.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  try {
    // Get JWT token from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get request data
    const { prompt } = await req.json();
    
    // First check if user has their own API key
    const { data: userSettings } = await supabaseAdmin
      .from('user_settings')
      .select('gemini_api_key, gemini_use_own_key')
      .eq('user_id', user.id)
      .single();
      
    // Determine which API key to use
    let apiKey;
    
    if (userSettings?.gemini_use_own_key && userSettings?.gemini_api_key) {
      apiKey = userSettings.gemini_api_key;
    } else {
      // Use organization's default API key
      apiKey = Deno.env.get('GEMINI_API_KEY') || '';
    }
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No API key available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );
    
    const geminiData = await response.json();
    
    return new Response(
      JSON.stringify({
        text: geminiData.candidates[0].content.parts[0].text,
        role: 'assistant'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Recurring Tasks and Events

Handle recurring items with AI assistance:

```typescript
// recurringItemsHelper.ts
import { supabase } from '@/lib/supabase';

export const generateRecurrenceInstances = async (recurringItemId, type, count = 10) => {
  // Fetch the recurring item
  const { data: recurringItem } = await supabase
    .from(type === 'task' ? 'tasks' : 'events')
    .select('*')
    .eq('id', recurringItemId)
    .single();
    
  if (!recurringItem || !recurringItem.is_recurring) return [];
  
  // Get recurrence pattern
  const { recurrence_pattern, recurrence_days } = recurringItem;
  
  // Calculate future occurrences based on pattern
  let occurrences = [];
  
  switch (recurrence_pattern) {
    case 'daily':
      occurrences = generateDailyOccurrences(recurringItem, count);
      break;
    case 'weekly':
      occurrences = generateWeeklyOccurrences(recurringItem, count);
      break;
    case 'monthly':
      occurrences = generateMonthlyOccurrences(recurringItem, count);
      break;
    // Other patterns...
  }
  
  return occurrences;
};

// Helper functions for different recurrence patterns...

// Function to automatically create a recurring task/event
export const createRecurringItem = async (data, type) => {
  // Add recurrence fields
  const recurringData = {
    ...data,
    is_recurring: true,
    recurrence_mode: data.recurrence_mode || 'clone',
  };
  
  // Insert the recurring item
  const { data: newItem, error } = await supabase
    .from(type === 'task' ? 'tasks' : 'events')
    .insert(recurringData)
    .select();
    
  if (error) throw error;
  
  return newItem[0];
};
```

## Implementation Best Practices

### Performance Optimization

Optimize your application's performance:

1. **Minimize API calls**:
   ```typescript
   // Use debouncing for real-time analysis
   import { debounce } from 'lodash';

   const debouncedAnalyze = debounce(async (text) => {
     // Make API call
     const analysis = await analyzeText(text);
     setResults(analysis);
   }, 500);
   ```

2. **Cache responses**:
   ```typescript
   // Simple in-memory cache
   const responseCache = new Map();

   export const getCachedResponse = async (cacheKey, fetchFn) => {
     // Check cache first
     if (responseCache.has(cacheKey)) {
       return responseCache.get(cacheKey);
     }
     
     // If not in cache, fetch and store
     const result = await fetchFn();
     responseCache.set(cacheKey, result);
     return result;
   };
   ```

3. **Batch processing**:
   ```typescript
   // Process multiple items together
   export const batchProcessItems = async (items, processFn) => {
     // Process in groups of 5
     const results = [];
     const batchSize = 5;
     
     for (let i = 0; i < items.length; i += batchSize) {
       const batch = items.slice(i, i + batchSize);
       const batchResults = await Promise.all(batch.map(item => processFn(item)));
       results.push(...batchResults);
     }
     
     return results;
   };
   ```

### Error Handling

Implement robust error handling:

```typescript
// errorHandler.ts
export const handleApiError = (error, fallbackMessage = "An error occurred") => {
  console.error("API Error:", error);
  
  let errorMessage = fallbackMessage;
  
  if (error.response) {
    // Server responded with an error
    const status = error.response.status;
    
    switch (status) {
      case 400:
        errorMessage = "Invalid request. Please check your input.";
        break;
      case 401:
        errorMessage = "Authentication failed. Please log in again.";
        // You might want to trigger a logout here
        break;
      case 403:
        errorMessage = "You don't have permission to perform this action.";
        break;
      case 404:
        errorMessage = "The requested resource was not found.";
        break;
      case 429:
        errorMessage = "API rate limit exceeded. Please try again later.";
        break;
      case 500:
        errorMessage = "Server error. Please try again later.";
        break;
      default:
        errorMessage = `Error: ${error.response.data?.message || fallbackMessage}`;
    }
  } else if (error.request) {
    // Request was made but no response
    errorMessage = "No response from server. Please check your connection.";
  }
  
  return {
    message: errorMessage,
    original: error
  };
};

// Usage
try {
  await sendChatMessage(messages, apiKey);
} catch (error) {
  const { message } = handleApiError(error, "Failed to send message");
  toast.error(message);
}
```

### Testing Strategies

Implement effective testing for AI-integrated features:

```typescript
// Example Jest test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { sendChatMessage } from '@/lib/gemini-api';
import ChatContainer from '@/components/ChatContainer';

// Mock API calls
jest.mock('@/lib/gemini-api');

describe('ChatContainer', () => {
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    localStorage.clear();
  });
  
  test('sends message and displays AI response', async () => {
    // Mock the API response
    sendChatMessage.mockResolvedValue({
      text: 'This is a test AI response',
      role: 'model'
    });
    
    render(<ChatContainer apiKey="test-key" />);
    
    // Type a message
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Check user message displayed
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    
    // Check loading state
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('This is a test AI response')).toBeInTheDocument();
    });
    
    // Verify API was called with correct params
    expect(sendChatMessage).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: 'Hello AI', role: 'user' })
      ]),
      'test-key'
    );
  });
});
```

## Appendix: API Reference

### Gemini API Endpoints

**Generate Content Endpoint**:
```
https://generativelanguage.googleapis.com/v1beta/models/MODEL_ID:generateContent
```

**Available Model IDs**:
- `gemini-1.5-flash`: Fast, efficient model suitable for most use cases
- `gemini-1.5-pro`: More capable model for complex tasks
- `gemini-1.0-pro`: Legacy model (first generation)

**Request Parameters**:
- `temperature`: Controls randomness (0.0-1.0)
- `topP`: Token selection strategy (0.0-1.0)
- `topK`: Limits token selection pool size
- `maxOutputTokens`: Controls response length
- `safetySettings`: Content filtering options

**Example Request**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Create a task list for planning a conference"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.95,
    "topK": 40,
    "maxOutputTokens": 2048
  }
}
```

### Supabase Client Methods

**Authentication**:
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Logout
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

**Database Operations**:
```typescript
// Insert data
await supabase.from('tasks').insert({ title: 'New Task' });

// Query data
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('status', 'active');

// Update data
await supabase
  .from('tasks')
  .update({ status: 'completed' })
  .eq('id', taskId);

// Delete data
await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
```

**Real-time Subscriptions**:
```typescript
const subscription = supabase
  .channel('tasks-changes')
  .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
    console.log('Change received!', payload);
    // Update UI based on change
  })
  .subscribe();
```
