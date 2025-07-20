# TaskPulse Complete Video Script - 100% Grade Target
## 15-Minute Professional Software Demonstration

**Student:** Adan Naveed (B00905612)  
**Target:** 100/100 marks through comprehensive technical demonstration  
**Duration:** 15 minutes exactly



---

## PART 1: PROBLEM & SOLUTION INTRODUCTION (0:00 - 1:30)

### 🎥 ON-SCREEN ACTION:
- Start with TaskPulse landing page
- Show professional UI with clear value proposition

### 🎙️ EXACT NARRATION:
> "Hello, I'm Adan Naveed, student B00905612. This is my final year project demonstration: TaskPulse, an AI-enhanced productivity dashboard."

> "The problem TaskPulse solves is workflow fragmentation. Research shows modern professionals use 8-12 different productivity tools daily - separate apps for tasks, calendars, notes, files, and time tracking. This creates cognitive overhead, context-switching costs, and reduces productivity by up to 40%."

> "TaskPulse eliminates this fragmentation by unifying task management, calendar scheduling, AI assistance, file organization, and time tracking into one intelligent platform. What you'll see isn't just feature integration - it's professional software engineering with sophisticated AI, comprehensive testing, and production-ready architecture."

**[Click Sign In and demonstrate smooth login flow]**

---

## PART 2: COMPLETE FRONTEND DEMONSTRATION (1:30 - 9:30) - 8 MINUTES

### 2A: Dashboard & Project Overview (1:30 - 2:30)

### 🎥 ON-SCREEN ACTION:
- Show main dashboard with project cards
- Highlight progress indicators and statistics

### 🎙️ NARRATION:
> "The dashboard provides immediate visibility into all work. Notice the project cards show real-time progress calculation, upcoming deadlines, and task distribution. The 'Final Year Project' shows 75% completion - this is automatically calculated from task completion ratios."

**[Point to project cards and statistics]**

> "The quick stats show total tasks, completion rates, and productivity metrics. This unified view eliminates the need to check multiple applications to understand your work status."

### 2B: Project Management Deep Dive (2:30 - 3:30)

### 🎥 ON-SCREEN ACTION:
- Click into "Final Year Project"
- Show all tabs: Tasks, Events, Notes, Files

### 🎙️ NARRATION:
> "Each project is a complete workspace. The tabbed interface integrates tasks, events, notes, and files specific to this project. This context-based organization means everything related to your final year project lives in one place."

**[Navigate through each tab]**

> "The progress tracking can be automatic - calculated from task completion - or manual for non-task-based milestones. This flexibility supports different project management styles while maintaining consistency."

### 2C: AI-Powered Task & Event Creation (3:30 - 5:30)

### 🎥 ON-SCREEN ACTION:
- Open AI chat panel
- Execute the prepared AI commands one by one

### 🎙️ NARRATION:
> "The AI assistant demonstrates sophisticated natural language processing. Watch as I create complex tasks and events using conversational language."

**[Type: "Create a task to prepare slides for final presentation, make it high priority, due tomorrow, assign to Final Year Project"]**

> "Notice the AI correctly parsed multiple parameters: the action, title, priority level, due date, and project assignment. The task appears instantly in both the task board and project view without page refresh."

**[Type: "Schedule a 'Project demonstration practice' for Saturday at 11 AM"]**

> "The AI handles temporal expressions intelligently. 'Saturday at 11 AM' is interpreted as next Saturday, and the event is automatically created with proper formatting."

**[Type: "What tasks do I have due this week?"]**

> "The AI can also query existing data, providing intelligent responses based on your current workload and deadlines."

### 2D: Task Board & Workflow Management (5:30 - 6:30)

### 🎥 ON-SCREEN ACTION:
- Navigate to main Tasks page
- Demonstrate drag-and-drop between columns
- Show task filtering and sorting

### 🎙️ NARRATION:
> "The task board uses modern UX patterns with drag-and-drop functionality. I can move tasks between 'To Do', 'In Progress', and 'Done' columns with immediate visual feedback."

**[Drag a task from To Do to In Progress]**

> "The interface uses optimistic updates - the UI responds immediately while the database update happens asynchronously. If the update fails, the UI reverts. This is professional-grade user experience design."

**[Show filtering options]**

> "Advanced filtering allows viewing tasks by project, priority, or due date. This flexibility scales from personal use to complex project management."

### 2E: Calendar Integration & Multiple Views (6:30 - 7:30)

### 🎥 ON-SCREEN ACTION:
- Navigate to Calendar page
- Show Day, Week, Month, and Timeline views
- Demonstrate Google Calendar sync

### 🎙️ NARRATION:
> "The calendar system provides multiple planning perspectives. The timeline view is particularly powerful for schedule optimization and conflict detection."

**[Switch between view modes]**

> "All events created through AI or manually appear across view modes. The Google Calendar integration is bidirectional - events sync both ways."

**[Click "Sync with Google Calendar"]**

> "The sync process is intelligent, and as I will show in the code review, it prevents data corruption through source tracking. **Crucially, this is a user-initiated sync. The limitation here is that it isn't fully automatic in real-time. A future professional iteration would implement Google Webhooks for an instant, push-based sync. This was a strategic trade-off: building fault-tolerant webhook infrastructure is highly complex, so I prioritized perfecting the project's core innovation—the AI assistant.**"

### 2F: Time Tracking & Productivity Analytics (7:30 - 8:30)

### 🎥 ON-SCREEN ACTION:
- Open a task and start Pomodoro timer
- Navigate between pages showing timer persistence
- Show time tracking analytics

### 🎙️ NARRATION:
> "Time tracking is deeply integrated throughout the application. I can start a Pomodoro timer for any task, and the timer state persists across the entire application."

**[Start timer and navigate between pages]**

> "Notice the timer remains visible and accurate across all pages. This reliability is achieved through localStorage persistence and timestamp calculations - the timer remains accurate even if the browser is closed and reopened."

**[Show analytics dashboard]**

> "The time tracking provides productivity insights: session duration, focus patterns, and project time allocation. This data helps optimize workflow and identify productivity bottlenecks."

### 2G: File Management & Notes Integration (8:30 - 9:30)

### 🎥 ON-SCREEN ACTION:
- Show file attachments to tasks/projects
- Demonstrate notes functionality
- Show search and organization features

### 🎙️ NARRATION:
> "File management is contextual - files can be attached to specific tasks, events, or projects. This eliminates the 'where did I save that file?' problem by organizing files within their work context."

**[Upload a file to a task]**

> "The notes system supports rich text editing and is fully integrated with projects. Notes can be pinned for quick access and are automatically timestamped for version tracking."

**[Show notes interface]**

> "This unified approach means all work artifacts - tasks, events, files, notes, and time logs - are connected and easily accessible."

---

## PART 3: SUPABASE BACKEND OVERVIEW (9:30 - 10:30) - 1 MINUTE

### 🎥 ON-SCREEN ACTION:
- Quickly show backend folder structure
- Show database/client.ts file
- Quick glimpse of Supabase features

### 🎙️ NARRATION:
> "TaskPulse runs entirely on Supabase - the open-source Firebase alternative with PostgreSQL at its core. Four key services power everything: PostgreSQL database with 12 tables, built-in authentication, Edge Functions for Google Calendar OAuth, and file storage."

**[Show src/backend/ folder structure]**

> "The backend architecture leverages Supabase's enterprise features - typed database schemas, Row Level Security, real-time subscriptions, and globally distributed edge functions. This eliminates server management while providing production-grade reliability."

**[Show database/client.ts quickly]**

> "Every service follows consistent patterns: user authentication, error handling, and typed operations. This isn't just a prototype - it's production-ready infrastructure supporting complex AI workflows and real-time collaboration."

---

## PART 4: PROJECT ARCHITECTURE (10:30 - 11:00) - 30 SECONDS

### 🎥 ON-SCREEN ACTION:
- Show project folder structure in VS Code
- Quick navigation through Plan&DOC, src/backend, src/frontend, tests

### 🎙️ NARRATION:
> "The project is well-organized. Plan&DOC folder tracks my progress with markdown files. Source splits into backend services and frontend features - each feature gets its own folder with components and hooks."

**[Show Plan&DOC folder with .md files]**

> "Testing covers everything - 217 tests across unit, integration, security, and end-to-end. This structure makes development fast and maintenance easy."

**[Navigate quickly through src/backend/, src/frontend/features/, tests/]**

---

## PART 5: CODE DEEP DIVE - PROFESSIONAL ENGINEERING (11:00 - 14:30) - 3.5 MINUTES

### 5A: AI Prompt Engineering (11:00 - 12:00)

### 🎥 ON-SCREEN ACTION:
**Open:** `src/backend/api/services/ai/core/contextService.ts`  
**Lines 543-580**

### 🎙️ NARRATION:
> "The AI demonstrates sophisticated prompt engineering - the key difference between a basic chatbot and production-ready AI. Most developers just send raw user input to the API, which gives unpredictable, unreliable responses. My approach injects comprehensive contextual data to create deterministic, reliable AI behavior."

### 📝 EXACT CODE TO SHOW:
```typescript
export const buildContextualPrompt = async (
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<ContextualPrompt> => {
  const result = await withErrorHandling(async () => {
    // Detect AI mode first
    const aiMode = detectAIMode(userMessage);
    
    const userContext = await getUserContext(userId);
    
    // Build different prompts based on AI mode
    let basePrompt = '';
    let userContextString = '';
    let relevantDataContext = '';
    
    if (aiMode.mode === 'general') {
      basePrompt = `You are a helpful AI assistant. You can have general conversations and also help with productivity tasks when asked.

Current user message: "${userMessage}"`;
      
      // For greetings, add personalized context
      if (aiMode.reasoning === 'Simple greeting detected') {
        const greetingContext = await buildGreetingContext(userId);
        basePrompt += `\n\nGreeting context: ${greetingContext}`;
      }
    } else if (aiMode.mode === 'project_focused') {
      // Full user context for project mode
      userContextString = userContext ? `
**User Context:**
- Working hours: ${userContext.workingHours.start} - ${userContext.workingHours.end}
- Active projects: ${userContext.currentProjects.map(p => `${p.name} (${p.progress}%)`).join(', ')}
- Recent tasks: ${userContext.recentActivity.recentTasks.length}` : '';
    }
```

**[Show lines 543-580: Context injection logic]**

> "This function builds different prompts based on AI mode detection - general conversation versus project-focused assistance. Notice the sophisticated context injection: working hours, active projects with completion percentages, recent tasks, and user preferences. The AI knows if you prefer detailed or concise responses, your timezone, and your current workload."

> "This transforms an unpredictable language model into a reliable command executor that understands your personal workflow. When you ask 'What should I work on?', it doesn't just give generic advice - it analyzes your active projects, upcoming deadlines, and work patterns to provide personalized recommendations."

### 5B: Google Calendar Sync (12:00 - 12:45)

### 🎥 ON-SCREEN ACTION:
**Open:** `src/backend/api/services/googleCalendar/googleCalendarSync.ts`  
**Lines 20-50**

### 🎙️ NARRATION:
> "Google Calendar sync demonstrates enterprise-grade data integrity patterns. The challenge with bidirectional sync is preventing catastrophic infinite loops - events bouncing back and forth between systems, creating duplicates and corrupting data. Many developers don't handle this properly."

### 📝 EXACT CODE TO SHOW:
```typescript
// Check if this is a Google-sourced event, if so, don't sync back
if (event.source === 'google') {
  console.log("Event is from Google, skipping sync back to avoid duplicates");
  return false;
}

console.log("Syncing event to Google Calendar:", {
  id: event.id,
  title: event.title,
  start: event.start_time,
  end: event.end_time
});

// Call the edge function to save the event to Google Calendar
const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
  body: { 
    action: event.google_event_id ? 'updateEvent' : 'createEvent', 
    event: event,
    userId: user.id
  },
});

// If this was a new event and we got a Google event ID back, update our local record
if (!event.google_event_id && data && data.google_event_id) {
  const { error: updateError } = await supabase
    .from("events")
    .update({ 
      google_event_id: data.google_event_id,
      source: 'app_synced'
    })
    .eq('id', event.id);
}
```

**[Show lines 20-50: Source tracking and Edge Function integration]**

> "My solution uses source tracking - every event has a 'source' field indicating its origin. Events from Google stay marked as 'google' and never sync back, preventing loops. App-created events become 'app_synced' when sent to Google. This single line of code prevents data corruption that could destroy user trust."

> "Notice the Supabase Edge Function integration for OAuth handling. Instead of managing Google OAuth tokens in the frontend - which would be insecure - I use serverless Edge Functions. This ensures secure token management while maintaining the seamless user experience. The function handles both creating new events and updating existing ones based on the google_event_id presence."

### 5C: Recurring Tasks Logic (12:45 - 13:15)

### 🎥 ON-SCREEN ACTION:
**Open:** `src/backend/api/services/recurrence.service.ts`  
**Lines 25-60**

### 🎙️ NARRATION:
> "Recurring tasks showcase sophisticated scheduling algorithms. Most apps have basic daily/weekly repeats, but real-world scheduling is complex. Users say 'every Monday and Wednesday' or 'monthly on the 15th' - this requires intelligent parsing and robust date calculations that handle edge cases like month boundaries and leap years."

### 📝 EXACT CODE TO SHOW:
```typescript
export const getNextOccurrenceDate = (
  fromDate: Date,
  config: RecurrenceConfig
): Date | null => {
  const baseDate = new Date(fromDate);
  let nextDate: Date;

  switch (config.pattern) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekly':
      if (config.days && config.days.length > 0) {
        const currentDay = baseDate.getDay();
        
        // Normalize day names and convert to indices
        const selectedDayIndices = config.days.map(day => {
          const normalizedDay = day.toLowerCase();
          const dayMap: { [key: string]: number } = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          return dayMap[normalizedDay];
        }).filter(index => index !== undefined).sort((a, b) => a - b);

        // Find the next day in the current week
        let nextDay = selectedDayIndices.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          nextDate = addDays(baseDate, nextDay - currentDay);
        } else {
          // Move to next week, first selected day
          nextDate = addWeeks(baseDate, 1);
          nextDate = addDays(nextDate, selectedDayIndices[0] - nextDate.getDay());
        }
      }
```

**[Show lines 25-60: Intelligent day parsing and scheduling]**

> "This code demonstrates professional date handling using the date-fns library for reliable calculations. Notice the intelligent day parsing - it normalizes both 'Monday' and 'monday' formats, converts to numerical indices, and handles the complex logic of finding the next occurrence. If today is Wednesday and you want 'Monday, Friday', it correctly finds Friday this week, not Monday next week."

> "The algorithm sorts selected days, finds the next day in the current week, or rolls over to the first selected day of next week. This unified service eliminates code duplication between tasks and events while handling edge cases that break simpler implementations."

### 5D: Timer Persistence (13:15 - 13:45)

### 🎥 ON-SCREEN ACTION:
**Open:** `src/frontend/hooks/usePomodoroTimer.ts`  
**Lines 35-70**

### 🎙️ NARRATION:
> "Timer persistence showcases professional frontend state management. The naive approach is storing remaining seconds in localStorage - but this fails catastrophically when users close their browser. Imagine starting a 25-minute Pomodoro, closing your laptop, and returning to find the timer reset. User trust destroyed."

### 📝 EXACT CODE TO SHOW:
```typescript
// Load initial state from localStorage with proper time calculation
const loadInitialState = (): PomodoroState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: StoredPomodoroState = JSON.parse(saved);
      
      // Calculate actual time left if timer was running
      if (parsed.isRunning && parsed.startTimestamp) {
        const now = Date.now();
        const elapsed = Math.floor((now - parsed.startTimestamp) / 1000);
        const actualTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
        
        return {
          mode: parsed.mode || 'focus',
          timeLeft: actualTimeLeft,
          isRunning: actualTimeLeft > 0 ? true : false,
          sessionCount: parsed.sessionCount || 0,
          timerContext: parsed.timerContext || null,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
        };
      }
      
      // Timer was paused or stopped
      return {
        mode: parsed.mode || 'focus',
        timeLeft: parsed.timeLeft || DEFAULT_SETTINGS.focusDuration,
        isRunning: false,
        sessionCount: parsed.sessionCount || 0,
        timerContext: parsed.timerContext || null,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
      };
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
```

**[Show lines 35-70: Timestamp-based accuracy calculation]**

> "My solution stores the start timestamp, not remaining time. When loading, it calculates elapsed milliseconds using `Date.now()`, subtracts from the original duration, and reconstructs the exact timer state. Close your browser for 3 hours? It knows exactly how much time remains. This timestamp-based approach guarantees accuracy regardless of browser state."

> "Notice the defensive programming - error handling for corrupted localStorage, fallback to default settings, and the conditional logic for running versus paused states. This reliability pattern is fundamental in production applications where user trust and data integrity are paramount."

### 5E: Other Professional Features (13:45 - 14:15)

### 🎥 ON-SCREEN ACTION:
**Quick glimpses of multiple files showing breadth of features**

### 🎙️ NARRATION:
> "TaskPulse demonstrates enterprise-grade feature breadth beyond core functionality. The real-time notification system uses database polling with intelligent filtering:"

**[Show `src/frontend/hooks/useReminders.ts` lines 15-25]**
```typescript
const checkReminders = useCallback(async () => {
  const now = new Date();
  const { data: dueReminders } = await supabase
    .from('events')
    .select('*')
    .lte('reminder_at', now.toISOString())
    .eq('reminder_sent', false);
    
  dueReminders?.forEach(event => {
    showNotification(`Reminder: ${event.title}`);
  });
}, []);
```

> "GDPR compliance is legally required for EU users. My implementation provides comprehensive data export using parallel database queries:"

**[Show `src/backend/api/services/gdpr/gdprService.ts` lines 20-35]**
```typescript
export const exportUserData = async (): Promise<UserDataExport> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const [tasks, events, notes, projects] = await Promise.all([
    supabase.from('tasks').select('*').eq('user', user.id),
    supabase.from('events').select('*').eq('user', user.id),
    supabase.from('notes').select('*').eq('user', user.id),
    supabase.from('projects').select('*').eq('user', user.id)
  ]);
```

> "The file attachment system demonstrates contextual organization - files belong to specific tasks, events, or projects, not just floating in storage:"

**[Show `src/backend/api/services/file.service.ts` lines 40-55]**
```typescript
export const attachFileToEntity = async (
  fileId: string, 
  entityType: 'task' | 'event' | 'project',
  entityId: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const { error } = await supabase
    .from('files')
    .update({ [entityType]: entityId })
    .eq('id', fileId)
    .eq('user', user.id);
```

> "These features showcase professional software development - real-time systems, legal compliance, contextual data organization, and robust error handling. This comprehensive scope demonstrates enterprise-ready engineering, not just basic CRUD operations."

### 5F: Comprehensive Testing (14:15 - 14:30)

### 🎥 ON-SCREEN ACTION:
**Terminal:** `npm run test:all`  
**Show:** `src/tests/` folder structure

### 🎙️ NARRATION:
> "The testing strategy demonstrates production-grade quality assurance - 217 automated tests across five critical categories. Unit tests verify individual functions work correctly, integration tests ensure workflows operate together, end-to-end tests validate complete user journeys, security tests check for vulnerabilities, and accessibility tests ensure compliance with web standards."

**[Show test execution results and folder structure]**

> "Every complex feature has comprehensive test coverage - AI prompt engineering accuracy, Google Calendar sync data integrity, timer persistence reliability, recurring task calculations. This multi-layered testing approach catches bugs before users see them and demonstrates the professional development practices required for production software that users depend on daily."

---

## PART 6: CONCLUSION & PROJECT OVERVIEW (14:30 - 15:00)

### 🎥 ON-SCREEN ACTION:
- Show README.md file
- Scroll through project overview and features
- Return to dashboard showing complete application

### 🎙️ NARRATION:
> "TaskPulse successfully eliminates workflow fragmentation through intelligent integration. From AI-powered task creation to Google Calendar sync, every feature demonstrates professional engineering."

**[Show README.md with project overview]**

> "This project represents a complete solution: sophisticated AI prompt engineering, comprehensive testing with 217 tests, bidirectional data sync, and production-ready architecture. All goals achieved."

**[Return to dashboard]**

> "TaskPulse: where productivity meets professional software engineering. Thank you for your attention."

---

## 🎯 EXACT FILES TO HAVE OPEN IN ORDER:

1. **`src/backend/api/services/ai/core/contextService.ts`** (Lines 543-580)
2. **`src/backend/api/services/googleCalendar/googleCalendarSync.ts`** (Lines 20-35)
3. **`src/backend/api/services/recurrence.service.ts`** (Lines 25-50)
4. **`src/frontend/hooks/usePomodoroTimer.ts`** (Lines 35-55)
5. **`src/frontend/hooks/useReminders.ts`** (Lines 15-25)
6. **`src/backend/api/services/gdpr/gdprService.ts`** (Lines 20-30)
7. **`src/backend/api/services/file.service.ts`** (Lines 40-50)
8. **`src/tests/` folder** (For structure overview)
9. **`README.md`** (For conclusion)

## 🎬 TERMINAL COMMANDS TO RUN:
```bash
npm run test:all
```

**Total Time: Exactly 3.5 minutes of focused, direct code demonstration showcasing your professional engineering skills!**

---

## 🎯 TESTING COMMANDS TO RUN LIVE 



```bash
# Show comprehensive test results
npm run test:all

# Show specific categories
npm run test:unit
npm run test:security  
npm run test:e2e
```

---

## 🗃️ SUPABASE DASHBOARD TO SHOW (Show at 11:00 if time permits)

### Tables to Highlight:
- **projects** (15 columns, all relationships)
- **tasks** (26 columns, full lifecycle)  
- **events** (18 columns, sync source tracking)
- **ai_conversations** & **ai_messages** (AI system)

## 🎬 RECORDING SETUP

### Resolution: 1920x1080 at 30fps
### Browser Tabs Ready:
1. TaskPulse app (main demo)
2. VS Code (code examination)  
3. Terminal (test execution)
4. Supabase dashboard (optional)

This script focuses 8+ minutes on frontend demonstration, then 3.5 minutes on code, ensuring you show complete mastery for 100/100 marks. 
