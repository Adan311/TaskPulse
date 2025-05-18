# AI Suggestion System Enhancement Plan

## Current System Analysis

The current AI suggestion system extracts potential tasks and events from chat conversations and presents them to users for acceptance or rejection. While functional, there are two key areas for improvement:

1. **Quality and Specificity of Suggestions**: Currently, suggestions are too generic (e.g., "plan the project", "make phone calls") and don't fully utilize available fields in the database schema.

2. **Suggestion Lifecycle Management**: Accepted/rejected suggestions remain in the suggestion tables rather than being removed after processing.

## Database Schema Analysis

### Task-Related Tables
- **tasks**: Contains all user tasks with fields for:
  - Core fields: `id`, `title`, `description`, `status`, `priority`
  - Time-related: `due_date`, `completion_date`, `reminder_at`
  - Organization: `project` (UUID linking to projects table), `labels` (array)
  - Recurrence: `is_recurring`, `recurrence_pattern`, `recurrence_days`, etc.

- **task_suggestions**: Contains AI-generated task suggestions with fields:
  - Core fields: `id`, `user_id`, `title`, `description`, `priority`
  - Status tracking: `status` (suggested/accepted/rejected)
  - Source tracking: `source_message_id` (links to ai_messages)
  - Time-related: `due_date`, `created_at`
  - **Missing fields compared to tasks**: `project`, `labels`, `reminder_at`

### Event-Related Tables
- **events**: Contains all calendar events with fields:
  - Core fields: `id`, `title`, `description`, `color`
  - Time-related: `start_time`, `end_time`, `reminder_at`
  - Organization: `project` (UUID linking to projects table)
  - Integration: `google_event_id`, `source` (app/google)
  - Recurrence: `is_recurring`, `recurrence_pattern`, `recurrence_days`, etc.

- **event_suggestions**: Contains AI-generated event suggestions with fields:
  - Core fields: `id`, `user_id`, `title`, `description`
  - Time-related: `start_time`, `end_time`
  - Status tracking: `status` (suggested/accepted/rejected)
  - Source tracking: `source_message_id` (links to ai_messages)
  - **Missing fields compared to events**: `project`, `color`, `reminder_at`

### Project Table
- **projects**: Contains user projects with fields:
  - Core fields: `id`, `name`, `description`, `color`, `status`
  - Organization: `priority`, `progress`, `due_date`

## Enhancement Plan

### 1. Improve Suggestion Quality and Specificity

#### 1.1 Enhanced Prompt Engineering

**Current Limitation**: The current prompt in `analyzeConversation` function doesn't provide enough guidance to generate specific, contextually relevant suggestions.

**Solution**: Refine the extraction prompt with:

```typescript
const extractionPrompt: FormattedMessage = {
  role: "user",
  content: `Analyze the conversation above and extract SPECIFIC, ACTIONABLE tasks or events mentioned. 
  
  IMPORTANT GUIDELINES:
  - Extract only CONCRETE tasks/events, not vague concepts
  - Tasks should be specific actions a person can take (e.g., "Create slide deck for Q3 presentation" instead of "Make presentation")
  - Events should have clear purposes with specific times when mentioned
  - Link suggestions to projects when a project name is mentioned
  - Infer priority based on urgency words ("urgent", "important", "critical", "ASAP", etc.)
  - Infer due dates or event times from context (relative dates like "tomorrow", "next week", specific dates like "May 15th")
  
  Current date for reference: ${new Date().toISOString().split('T')[0]}
  
  Return ONLY a JSON object with the following structure:
  {
    "tasks": [
      {
        "title": "Specific, actionable task title",
        "description": "Detailed description with context from the conversation",
        "due_date": "YYYY-MM-DD if mentioned, otherwise null",
        "priority": "low, medium, or high based on urgency words",
        "project_name": "Project name if mentioned, otherwise null",
        "labels": ["label1", "label2"] if mentioned, otherwise []
      }
    ],
    "events": [
      {
        "title": "Specific event title",
        "description": "Detailed description with context",
        "start_time": "ISO date string YYYY-MM-DDTHH:MM:SS",
        "end_time": "ISO date string YYYY-MM-DDTHH:MM:SS",
        "project_name": "Project name if mentioned, otherwise null"
      }
    ]
  }
  
  If no tasks or events are mentioned, return empty arrays. Don't make up information.
  Only extract tasks and events that are clearly intended to be tracked or scheduled.
  
  EXAMPLES:
  
  For "I need to prepare the Q3 report for the Marketing Campaign project by next Friday":
  {
    "tasks": [
      {
        "title": "Prepare Q3 report for Marketing Campaign",
        "description": "Create the quarterly report for the Marketing Campaign project",
        "due_date": "2023-09-15", // (if next Friday is Sep 15, 2023)
        "priority": "medium",
        "project_name": "Marketing Campaign",
        "labels": []
      }
    ],
    "events": []
  }
  
  For "Let's schedule a team meeting tomorrow at 2pm for about an hour to discuss the website redesign":
  {
    "tasks": [],
    "events": [
      {
        "title": "Team Meeting - Website Redesign Discussion",
        "description": "Meeting with team to discuss the website redesign project",
        "start_time": "2023-09-09T14:00:00", // (if tomorrow is Sep 9, 2023)
        "end_time": "2023-09-09T15:00:00",
        "project_name": "Website Redesign"
      }
    ]
  }`
};
```

#### 1.2 Project Mapping Implementation

**Current Limitation**: Even if the AI extracts a project name, there's no logic to map it to an actual project ID.

**Solution**: Add project name to ID mapping in the suggestion service:

```typescript
// New function to add to suggestionService.ts
async function findProjectIdByName(userId: string, projectName: string): Promise<string | null> {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    // Search for projects with similar names (case insensitive)
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user", userId)
      .ilike("name", `%${projectName}%`)
      .limit(1);

    if (error) throw error;
    
    return data && data.length > 0 ? data[0].id : null;
  } catch (error) {
    console.error("Error finding project by name:", error);
    return null;
  }
}
```

#### 1.3 Enhanced Field Mapping

**Current Limitation**: The current implementation doesn't map all available fields from suggestions to tasks/events.

**Solution**: Update the `saveTaskSuggestions` and `saveEventSuggestions` functions to include additional fields:

```typescript
// In saveTaskSuggestions, modify the taskSuggestions mapping:
const taskSuggestions = tasks.map(task => ({
  id: uuidv4(),
  user_id: userId,
  title: task.title,
  description: task.description || null,
  due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
  priority: task.priority || null,
  project_name: task.project_name || null, // Store project name temporarily
  labels: task.labels || [],
  status: "suggested",
  source_message_id: messageId,
  created_at: new Date().toISOString()
}));

// Similarly for saveEventSuggestions
```

### 2. Suggestion Lifecycle Management

#### 2.1 Delete Suggestions After Processing

**Current Limitation**: Suggestions remain in the database with status changed to 'accepted' or 'rejected'.

**Solution**: Modify the status update functions to delete records instead:

```typescript
// Replace updateTaskSuggestionStatus with:
export const updateTaskSuggestionStatus = async (
  userId: string,
  suggestionId: string,
  status: "accepted" | "rejected"
): Promise<boolean> => {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Ensure the user ID matches
    if (user.id !== userId) throw new Error("User ID mismatch");

    // Instead of updating status, delete the suggestion
    const { error } = await supabase
      .from("task_suggestions")
      .delete()
      .eq("id", suggestionId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error processing task suggestion:", error);
    return false;
  }
};

// Similarly update updateEventSuggestionStatus
```

#### 2.2 Enhanced Accept Flow

**Current Limitation**: When accepting a suggestion, not all fields are mapped to the created task/event.

**Solution**: Enhance the accept handlers to map more fields and handle project mapping:

```typescript
const handleAcceptTask = async (suggestion: TaskSuggestion) => {
  if (!user) return;
  
  // Mark as processing
  setProcessing(prev => ({ ...prev, [suggestion.id]: true }));
  
  try {
    // If suggestion has project_name, try to find matching project
    let projectId = null;
    if (suggestion.project_name) {
      projectId = await findProjectIdByName(user.id, suggestion.project_name);
    }
    
    // Create the actual task with enhanced fields
    await createTask({
      title: suggestion.title,
      description: suggestion.description || undefined,
      due_date: suggestion.dueDate || undefined,
      priority: suggestion.priority || undefined,
      status: 'todo',
      project: projectId || undefined,
      labels: suggestion.labels || [],
      reminder_at: suggestion.dueDate ? new Date(suggestion.dueDate).toISOString() : undefined,
    });
    
    // Delete suggestion
    await updateTaskSuggestionStatus(user.id, suggestion.id, 'accepted');
    
    // Update the UI
    setTaskSuggestions(prev => prev.filter(item => item.id !== suggestion.id));
    
    toast({
      title: 'Task Created',
      description: 'The task has been added to your task list.',
    });
  } catch (error) {
    console.error('Error accepting task suggestion:', error);
    toast({
      title: 'Error',
      description: 'Failed to create task. Please try again.',
      variant: 'destructive',
    });
  } finally {
    // Remove processing state
    setProcessing(prev => {
      const newState = { ...prev };
      delete newState[suggestion.id];
      return newState;
    });
  }
};

// Similarly enhance handleAcceptEvent
```

### 3. Natural Language Creation Integration

Building on the AI suggestion system, we can extend it to support natural language creation (FR-30):

#### 3.1 Command Detection

Add a command detection function that analyzes user messages for explicit creation commands:

```typescript
// New function for suggestionService.ts
export const detectCommandIntent = async (
  message: string
): Promise<{
  hasCommand: boolean;
  commandType: 'create_task' | 'create_event' | 'set_reminder' | null;
  entities: any;
}> => {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      console.error("No Gemini API key found for command detection");
      return { hasCommand: false, commandType: null, entities: null };
    }

    // Create a specialized command detection prompt
    const commandPrompt: FormattedMessage = {
      role: "user",
      content: `Analyze this message and determine if it contains a command to create a task, event, or set a reminder:
      
      "${message}"
      
      Return ONLY a JSON object with the following structure:
      {
        "hasCommand": true/false,
        "commandType": "create_task", "create_event", "set_reminder", or null,
        "entities": {
          // For tasks:
          "title": "Task title",
          "description": "Task description",
          "due_date": "YYYY-MM-DD",
          "priority": "low/medium/high",
          "project_name": "Project name if mentioned",
          
          // For events:
          "title": "Event title",
          "description": "Event description",
          "start_time": "YYYY-MM-DDTHH:MM:SS",
          "end_time": "YYYY-MM-DDTHH:MM:SS",
          "project_name": "Project name if mentioned",
          
          // For reminders:
          "task_id": null, // This will be filled in later
          "reminder_time": "YYYY-MM-DDTHH:MM:SS"
        }
      }
      
      Only return hasCommand: true if the message is clearly an instruction to create something.
      Examples of commands:
      - "Create a task to finish the report by Friday"
      - "Schedule a meeting with John tomorrow at 3pm"
      - "Remind me about the presentation on Monday morning"
      
      Current date for reference: ${new Date().toISOString().split('T')[0]}`
    };

    // Call Gemini API
    const response = await callGeminiApiDirectly(apiKey, [commandPrompt], {
      temperature: 0.1,
      maxOutputTokens: 1024
    });

    if (!response) {
      return { hasCommand: false, commandType: null, entities: null };
    }

    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hasCommand: false, commandType: null, entities: null };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse command detection result:", error);
      return { hasCommand: false, commandType: null, entities: null };
    }
  } catch (error) {
    console.error("Error detecting command intent:", error);
    return { hasCommand: false, commandType: null, entities: null };
  }
};
```

#### 3.2 Integration with Chat Flow

Modify the `sendMessage` function in `chatService.ts` to check for commands before sending to Gemini:

```typescript
// In sendMessage function, add before calling the Gemini API:
// Check if the message contains a command
const commandResult = await detectCommandIntent(message);

if (commandResult.hasCommand && commandResult.commandType) {
  // Handle the command based on its type
  let commandResponse = "";
  
  if (commandResult.commandType === 'create_task') {
    // Create a task from the command
    const taskResult = await createTaskFromCommand(user.id, commandResult.entities);
    commandResponse = taskResult.success 
      ? `✅ Created task: "${taskResult.title}"`
      : `❌ Failed to create task: ${taskResult.error}`;
  } 
  else if (commandResult.commandType === 'create_event') {
    // Create an event from the command
    const eventResult = await createEventFromCommand(user.id, commandResult.entities);
    commandResponse = eventResult.success 
      ? `✅ Created event: "${eventResult.title}" for ${eventResult.time}`
      : `❌ Failed to create event: ${eventResult.error}`;
  }
  else if (commandResult.commandType === 'set_reminder') {
    // Set a reminder from the command
    const reminderResult = await setReminderFromCommand(user.id, commandResult.entities);
    commandResponse = reminderResult.success 
      ? `✅ Set reminder for ${reminderResult.time}`
      : `❌ Failed to set reminder: ${reminderResult.error}`;
  }
  
  // Create AI message with command response
  const aiMessage: ChatMessage = {
    id: uuidv4(),
    conversationId,
    userId: user.id,
    content: commandResponse,
    role: 'assistant',
    createdAt: new Date().toISOString(),
  };

  // Insert AI message
  const { error: aiMessageError } = await supabase.from('ai_messages').insert({
    id: aiMessage.id,
    conversation_id: conversationId,
    user_id: user.id,
    content: commandResponse,
    role: 'assistant',
    created_at: aiMessage.createdAt
  });

  if (aiMessageError) throw aiMessageError;
  
  // Return the user message and AI response
  return { userMessage, aiMessage };
}

// If not a command, continue with regular Gemini API call...
```

## Implementation Priorities

1. **Phase 1: Enhanced Suggestion Quality**
   - Improve extraction prompt with better guidelines and examples
   - Add project name extraction and mapping
   - Enhance field mapping for more complete suggestions

2. **Phase 2: Suggestion Lifecycle Management**
   - Modify suggestion status handling to delete after processing
   - Update accept handlers to map all relevant fields

3. **Phase 3: Natural Language Command Integration**
   - Implement command detection
   - Add command execution handlers
   - Integrate with chat flow

## Technical Considerations

1. **Database Impact**: No schema changes required, only service-level modifications.

2. **Performance**: The enhanced prompts will be larger, which may slightly increase token usage and API response times.

3. **Error Handling**: Add robust error handling for project mapping and command processing.

4. **Testing**: Test with various conversation scenarios to ensure accurate extraction and command detection.

## Conclusion

This enhancement plan addresses the key issues with the current AI suggestion system:

1. **Improved Specificity**: Better prompts and examples will guide the AI to generate more specific, actionable suggestions.

2. **Complete Field Mapping**: Enhanced mapping will utilize more fields from the database schema.

3. **Project Integration**: Adding project name extraction and mapping will connect suggestions to the user's project structure.

4. **Clean Lifecycle**: Deleting processed suggestions will keep the database clean and prevent confusion.

5. **Natural Language Commands**: Building on the suggestion system to support explicit commands will provide a more intuitive user experience.

These improvements will make the AI features more useful and integrated with the rest of the application while maintaining the existing MCP pattern and database structure.

## Recent Improvements to User Data Query System (June 2025)

### Problem Statement

1. When a user asked about upcoming events, the system would show all events, including past ones.
2. Task queries didn't properly filter by status when users asked specifically about "to-do" or "in progress" tasks.
3. The system couldn't provide information about projects or which tasks/events were linked to specific projects.

### Implemented Solutions

#### 1. Improved Event Filtering

- **Default to upcoming events**: Modified `getUserEvents` to automatically filter for future events when no specific filters are set.
- **Smarter date handling**: Enhanced date detection patterns to handle more date formats.
- **Sort direction**: Upcoming events are now sorted from soonest to latest, while past events are sorted from most recent to oldest.
- **Better response formatting**: Clarified responses to indicate when events are upcoming vs past.

```typescript
// Example: Default to upcoming events when no specific filter is set
if (filters?.includes('upcoming') || (!startDate && !endDate && !filters?.includes('past'))) {
  // Default behavior is to show upcoming events if no specific filter is set
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  filteredEvents = filteredEvents.filter(event => {
    const eventStart = new Date(event.startTime);
    return eventStart >= today;
  });
}
```

#### 2. Enhanced Task Status Filtering

- **Improved status keywords**: Expanded the pattern matching to detect more ways users might ask about different task statuses.
- **Fixed status matching**: Corrected the task status values to match database schema ('todo', 'in_progress', 'done').
- **Better response formatting**: Added clearer status labels in responses.

```typescript
// Detect task status from query
const todoStatusKeywords = ['to do', 'todo', 'to-do list', 'pending', 'not done'];
const inProgressStatusKeywords = ['in progress', 'ongoing', 'working on', 'started'];
const doneStatusKeywords = ['done', 'completed', 'finished'];

// Set status filter based on keywords
if (todoStatusKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
  statusFilter = 'todo';
  statusLabel = "to do";
} else if (inProgressStatusKeywords.some(keyword => lowercaseQuery.includes(keyword))) {
  statusFilter = 'in_progress';
  statusLabel = "in progress";
}
```

#### 3. Added Project Query Support

- **New query patterns**: Added detection of project-related queries, including "what projects do I have" and "what's linked to project X".
- **Project information retrieval**: Created new functions to fetch projects and their associated items.
- **Project status filtering**: Added support for filtering projects by status (active, completed, on-hold).

```typescript
// New function to get all items linked to a project
export const getProjectItems = async (
  userId: string,
  projectId: string
): Promise<{tasks: any[], events: any[], notes: any[]}> => {
  // ... implementation details ...
}
```

#### 4. Natural Language Project Relation Detection

- **Enhanced regex patterns**: Added sophisticated pattern matching to detect queries about project-related items.
- **Project name extraction**: Implemented extraction of project names from natural language queries.
- **Organized response formatting**: Added structured responses that group tasks, events, and notes by type when related to a project.

```typescript
// Pattern to detect queries about items linked to a project
const projectItemsPattern = /(?:what|which|list|show|get|any|all|items?|tasks?|events?|notes?).*(?:(?:linked|related|connected|assigned|attached|associated) to|for|in|on) (?:project|the project|my project)(?:[: ]+)?(.*?)(?:\?|$|\.|,)/i;
```

### Benefits of These Improvements

1. **More intuitive responses**: The system now responds with the data users actually want when they ask about events, tasks, or projects.
2. **Context-aware filtering**: Default behavior is smarter - showing upcoming events and properly filtering tasks by status.
3. **Project organization**: Users can now get a complete picture of what's related to their projects.
4. **Better date handling**: Improved date extraction and sorting makes the responses more relevant to users' timeframe.

### Future Improvements

1. **Advanced natural language time understanding**: Implement more sophisticated parsing of relative time expressions ("end of Q2", "next quarter", etc.)
2. **Multi-project filtering**: Support queries like "show tasks in projects X and Y"
3. **Conversation context memory**: Remember which project a user was discussing to improve follow-up queries
4. **Personalized default filters**: Learn user preferences for how they prefer tasks to be filtered 