/**
 * Context Service for AI Chat
 * Manages conversation memory, user preferences, and contextual information
 */

import { supabase } from "../../../../database/client";
import { withErrorHandling } from "./errorService";

interface UserContext {
  userId: string;
  preferences: UserPreferences;
  workingHours: WorkingHours;
  currentProjects: ProjectSummary[];
  recentActivity: ActivitySummary;
  timezone: string;
}

interface UserPreferences {
  preferredResponseStyle: 'detailed' | 'concise' | 'casual' | 'professional';
  taskPriorities: string[];
  reminderSettings: {
    defaultReminderTime: number; // minutes before
    preferredReminderTypes: ('email' | 'in_app' | 'push')[];
  };
  workflowPreferences: {
    defaultProjectStructure: 'agile' | 'traditional' | 'kanban';
    autoCreateSubtasks: boolean;
    suggestDeadlines: boolean;
  };
}

interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "17:00"
  timezone: string;
  workDays: number[]; // [1,2,3,4,5] for Mon-Fri
}

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  nextDeadline?: string;
}

interface ActivitySummary {
  recentTasks: Array<{id: string; title: string; completed: boolean; due_date?: string}>;
  recentEvents: Array<{id: string; title: string; start_time: string}>;
  recentNotes: Array<{id: string; title: string; updated_at: string}>;
  suggestionHistory: Array<{type: string; accepted: boolean; created_at: string}>;
}

interface ConversationContext {
  conversationId: string;
  messageHistory: Array<{role: string; content: string; timestamp: string}>;
  extractedEntities: ExtractedEntity[];
  conversationSummary: string;
  topicFlow: string[];
  lastActivity: string;
}

interface ExtractedEntity {
  type: 'person' | 'project' | 'task' | 'event' | 'date' | 'location' | 'technology';
  value: string;
  confidence: number;
  mentions: number;
  firstMentioned: string;
  lastMentioned: string;
}

interface ContextualPrompt {
  basePrompt: string;
  userContext: string;
  conversationContext: string;
  relevantData: string;
  responseGuidelines: string;
}

interface AIMode {
  mode: 'general' | 'project_focused' | 'hybrid';
  confidence: number;
  reasoning: string;
}

/**
 * Get comprehensive user context
 */
export const getUserContext = async (userId: string): Promise<UserContext | null> => {
  const result = await withErrorHandling(async () => {
    // Get user preferences
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Get current projects with progress
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        created_at,
        updated_at
      `)
      .eq('user', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    // Calculate project progress and get next deadlines
    const projectSummaries: ProjectSummary[] = [];
    if (projects) {
      for (const project of projects) {
        // Get task counts for progress calculation
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('status')
          .eq('project', project.id);
        
        const totalTasks = allTasks?.length || 0;
        const completedTasks = allTasks?.filter(t => t.status === 'done').length || 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Get next deadline
        const { data: nextDeadline } = await supabase
          .from('tasks')
          .select('due_date')
          .eq('project', project.id)
          .not('due_date', 'is', null)
          .eq('status', 'todo')
          .order('due_date', { ascending: true })
          .limit(1);
        
        projectSummaries.push({
          id: project.id,
          name: project.name,
          status: project.status,
          progress: Math.round(progress),
          nextDeadline: nextDeadline?.[0]?.due_date
        });
      }
    }
    
    // Get recent activity
    const recentActivity = await getRecentActivity(userId);
    
    // Default preferences if none exist
    const defaultPreferences: UserPreferences = {
      preferredResponseStyle: 'professional',
      taskPriorities: ['high', 'medium', 'low'],
      reminderSettings: {
        defaultReminderTime: 15,
        preferredReminderTypes: ['in_app']
      },
      workflowPreferences: {
        defaultProjectStructure: 'agile',
        autoCreateSubtasks: false,
        suggestDeadlines: true
      }
    };
    
    const userPrefs = settings?.ai_preferences || defaultPreferences;
    
    return {
      userId,
      preferences: userPrefs,
      workingHours: settings?.working_hours || {
        start: "09:00",
        end: "17:00",
        timezone: "UTC",
        workDays: [1, 2, 3, 4, 5]
      },
      currentProjects: projectSummaries,
      recentActivity,
      timezone: settings?.timezone || 'UTC'
    };
  }, 'get_user_context');

  return result.success ? result.data : null;
};

/**
 * Get recent user activity for context
 */
const getRecentActivity = async (userId: string): Promise<ActivitySummary> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateFilter = sevenDaysAgo.toISOString();
  
  // Run all queries in parallel for better performance
  const [
    { data: recentTasks },
    { data: recentEvents },
    { data: recentNotes },
    { data: suggestionHistory }
  ] = await Promise.all([
    // Recent tasks
    supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .eq('user', userId)
      .gte('updated_at', dateFilter)
      .order('updated_at', { ascending: false })
      .limit(10),
    
    // Recent events
    supabase
      .from('events')
      .select('id, title, start_time')
      .eq('user', userId)
      .gte('start_time', dateFilter)
      .order('start_time', { ascending: false })
      .limit(10),
    
    // Recent notes
    supabase
      .from('notes')
      .select('id, title, updated_at')
      .eq('user', userId)
      .gte('updated_at', dateFilter)
      .order('updated_at', { ascending: false })
      .limit(10),
    
    // Suggestion history
    supabase
      .from('suggestion_feedback')
      .select('suggestion_type, accepted, created_at')
      .eq('user_id', userId)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);
  
  return {
    recentTasks: recentTasks?.map(task => ({
      id: task.id,
      title: task.title,
      completed: task.status === 'done',
      due_date: task.due_date
    })) || [],
    recentEvents: recentEvents?.map(event => ({
      id: event.id,
      title: event.title,
      start_time: event.start_time
    })) || [],
    recentNotes: recentNotes?.map(note => ({
      id: note.id,
      title: note.title,
      updated_at: note.updated_at
    })) || [],
    suggestionHistory: suggestionHistory?.map(feedback => ({
      type: feedback.suggestion_type,
      accepted: feedback.accepted,
      created_at: feedback.created_at
    })) || []
  };
};

/**
 * Detect AI mode based on user message and conversation context
 */
const detectAIMode = (userMessage: string, conversationHistory?: any[]): AIMode => {
  const message = userMessage.toLowerCase().trim();
  
  // Project update/status keywords - these override greeting patterns
  const projectUpdatePatterns = [
    /update/,
    /status/,
    /progress/,
    /overview/,
    /summary/,
    /what's.*going.*on/,
    /catch.*up/,
    /brief.*me/,
    /fill.*me.*in/,
    /what.*happening/,
    /dashboard/,
    /report/
  ];
  
  // Simple greeting patterns - general mode (unless combined with project keywords)
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/,
    /^(hi|hello|hey)\s*[.!]*$/,
    /^how are you\??$/,
    /^what's up\??$/,
    /^how's it going\??$/
  ];
  
  // General conversation patterns
  const generalPatterns = [
    /weather/,
    /how are you/,
    /tell me a joke/,
    /what can you do/,
    /help me understand/,
    /explain/,
    /what is/,
    /who is/,
    /when is/,
    /where is/
  ];
  
  // Project-focused patterns
  const projectPatterns = [
    /create.*task/,
    /add.*task/,
    /schedule.*meeting/,
    /create.*event/,
    /my.*project/,
    /show.*task/,
    /list.*task/,
    /deadline/,
    /due date/,
    /project.*status/,
    /task.*status/,
    /calendar/,
    /meeting/,
    /event/,
    /reminder/,
    /priority/
  ];
  
  // Check for project update keywords first (highest priority)
  if (projectUpdatePatterns.some(pattern => pattern.test(message))) {
    return {
      mode: 'project_focused',
      confidence: 0.95,
      reasoning: 'Project update/status request detected'
    };
  }
  
  // Check for greeting patterns
  if (greetingPatterns.some(pattern => pattern.test(message))) {
    return {
      mode: 'general',
      confidence: 0.9,
      reasoning: 'Simple greeting detected'
    };
  }
  
  // Check for explicit project-related requests
  if (projectPatterns.some(pattern => pattern.test(message))) {
    return {
      mode: 'project_focused',
      confidence: 0.8,
      reasoning: 'Project-related keywords detected'
    };
  }
  
  // Check for general conversation
  if (generalPatterns.some(pattern => pattern.test(message))) {
    return {
      mode: 'general',
      confidence: 0.7,
      reasoning: 'General conversation pattern detected'
    };
  }
  
  // Default to hybrid for ambiguous cases
  return {
    mode: 'hybrid',
    confidence: 0.5,
    reasoning: 'Ambiguous intent, using hybrid mode'
  };
};

/**
 * Build greeting context based on user's current state
 */
const buildGreetingContext = async (userId: string): Promise<string> => {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based greeting
    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = 'Good morning!';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon!';
    } else {
      timeGreeting = 'Good evening!';
    }
    
    // Get today's tasks and events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [tasksResult, eventsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('title, due_date, priority')
        .eq('user', userId)
        .eq('status', 'todo')
        .gte('due_date', today.toISOString())
        .lt('due_date', tomorrow.toISOString())
        .limit(3),
      supabase
        .from('events')
        .select('title, start_time')
        .eq('user', userId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time')
        .limit(3)
    ]);
    
    let contextInfo = '';
    
    if (tasksResult.data && tasksResult.data.length > 0) {
      contextInfo += ` You have ${tasksResult.data.length} task${tasksResult.data.length > 1 ? 's' : ''} due today.`;
    }
    
    if (eventsResult.data && eventsResult.data.length > 0) {
      const nextEvent = eventsResult.data[0];
      const eventTime = new Date(nextEvent.start_time);
      contextInfo += ` Your next meeting is "${nextEvent.title}" at ${eventTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`;
    }
    
    return timeGreeting + contextInfo;
  } catch (error) {
    console.error('Error building greeting context:', error);
    return 'Hello! How can I help you today?';
  }
};

/**
 * Build comprehensive project status overview
 */
const buildProjectOverview = async (userId: string): Promise<string> => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get comprehensive project data
    const [projectsResult, tasksResult, eventsResult, overdueTasks] = await Promise.all([
      // Active projects with progress
      supabase
        .from('projects')
        .select('name, status, progress, due_date')
        .eq('user', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5),
      
      // Upcoming tasks
      supabase
        .from('tasks')
        .select('title, due_date, priority, status')
        .eq('user', userId)
        .in('status', ['todo', 'in_progress'])
        .not('due_date', 'is', null)
        .gte('due_date', now.toISOString())
        .lte('due_date', nextWeek.toISOString())
        .order('due_date')
        .limit(5),
      
      // Upcoming events
      supabase
        .from('events')
        .select('title, start_time')
        .eq('user', userId)
        .gte('start_time', now.toISOString())
        .lte('start_time', nextWeek.toISOString())
        .order('start_time')
        .limit(5),
      
      // Overdue tasks
      supabase
        .from('tasks')
        .select('title, due_date, priority')
        .eq('user', userId)
        .eq('status', 'todo')
        .not('due_date', 'is', null)
        .lt('due_date', now.toISOString())
        .order('due_date')
        .limit(3)
    ]);
    
    let overview = '';
    
    // Projects overview
    if (projectsResult.data && projectsResult.data.length > 0) {
      overview += '\n**📊 Active Projects:**\n';
      projectsResult.data.forEach(project => {
        const dueInfo = project.due_date ? ` (due ${new Date(project.due_date).toLocaleDateString()})` : '';
        overview += `• ${project.name}: ${project.progress}% complete${dueInfo}\n`;
      });
    }
    
    // Overdue tasks (high priority)
    if (overdueTasks.data && overdueTasks.data.length > 0) {
      overview += '\n**⚠️ Overdue Tasks:**\n';
      overdueTasks.data.forEach(task => {
        const daysOverdue = Math.floor((now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
        overview += `• ${task.title} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)\n`;
      });
    }
    
    // Upcoming tasks
    if (tasksResult.data && tasksResult.data.length > 0) {
      overview += '\n**📋 Upcoming Tasks:**\n';
      tasksResult.data.forEach(task => {
        const dueDate = new Date(task.due_date);
        const isToday = dueDate.toDateString() === now.toDateString();
        const dateStr = isToday ? 'today' : dueDate.toLocaleDateString();
        overview += `• ${task.title} (${task.priority} priority, due ${dateStr})\n`;
      });
    }
    
    // Upcoming events
    if (eventsResult.data && eventsResult.data.length > 0) {
      overview += '\n**📅 Upcoming Events:**\n';
      eventsResult.data.forEach(event => {
        const eventDate = new Date(event.start_time);
        const isToday = eventDate.toDateString() === now.toDateString();
        const dateStr = isToday ? 'today' : eventDate.toLocaleDateString();
        const timeStr = eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        overview += `• ${event.title} (${dateStr} at ${timeStr})\n`;
      });
    }
    
    if (!overview) {
      overview = '\n**✅ All caught up!** No urgent tasks or upcoming deadlines.';
    }
    
    return overview;
  } catch (error) {
    console.error('Error building project overview:', error);
    return '\n**📊 Project Overview:** Unable to load project data at the moment.';
  }
};

/**
 * Build contextual prompt with user and conversation context
 */
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
      // General conversation mode
      basePrompt = `You are a helpful AI assistant. You can have general conversations and also help with productivity tasks when asked.

Current user message: "${userMessage}"`;
      
      // For greetings, add personalized context
      if (aiMode.reasoning === 'Simple greeting detected') {
        const greetingContext = await buildGreetingContext(userId);
        basePrompt += `\n\nGreeting context: ${greetingContext}`;
      }
      
      // Minimal user context for general mode
      userContextString = userContext ? `
**User Preferences:**
- Response style: ${userContext.preferences.preferredResponseStyle}
` : '';
      
    } else if (aiMode.mode === 'project_focused') {
      // Project-focused mode
      basePrompt = `You are an AI assistant specialized in productivity, project management, and personal organization. You help users manage their tasks, projects, calendar events, notes, and files efficiently.

Current user message: "${userMessage}"`;
      
      // For project update requests, add comprehensive overview
      if (aiMode.reasoning === 'Project update/status request detected') {
        const projectOverview = await buildProjectOverview(userId);
        basePrompt += `\n\nProject Overview: ${projectOverview}`;
      }
      
      // Full user context for project mode
      userContextString = userContext ? `
**User Context:**
- Preferred response style: ${userContext.preferences.preferredResponseStyle}
- Working hours: ${userContext.workingHours.start} - ${userContext.workingHours.end} (${userContext.timezone})
- Active projects (${userContext.currentProjects.length}): ${userContext.currentProjects.map(p => `${p.name} (${p.progress}% complete)`).join(', ')}
- Recent activity: ${userContext.recentActivity.recentTasks.length} tasks, ${userContext.recentActivity.recentEvents.length} events
` : '';
      
      // Generate relevant data context
      relevantDataContext = await generateRelevantDataContext(userId, userMessage);
      
    } else {
      // Hybrid mode - balanced approach
      basePrompt = `You are an AI assistant that can help with both general questions and productivity tasks. Adapt your response based on what the user is asking for.

Current user message: "${userMessage}"`;
      
      // Moderate user context for hybrid mode
      userContextString = userContext ? `
**User Context:**
- Response style: ${userContext.preferences.preferredResponseStyle}
- Active projects: ${userContext.currentProjects.length}
- Recent activity: ${userContext.recentActivity.recentTasks.length} tasks, ${userContext.recentActivity.recentEvents.length} events
` : '';
      
      // Generate relevant data context
      relevantDataContext = await generateRelevantDataContext(userId, userMessage);
    }
    
    // Build response guidelines based on user preferences
    const responseGuidelines = buildResponseGuidelines(userContext?.preferences);
    
    return {
      basePrompt,
      userContext: userContextString,
      conversationContext: `AI Mode: ${aiMode.mode} (${aiMode.reasoning})`,
      relevantData: relevantDataContext,
      responseGuidelines
    };
  }, 'build_contextual_prompt');

  return result.success ? result.data : {
    basePrompt: `You are an AI assistant. User message: "${userMessage}"`,
    userContext: '',
    conversationContext: '',
    relevantData: '',
    responseGuidelines: ''
  };
};

/**
 * Generate relevant data context based on user message
 */
const generateRelevantDataContext = async (
  userId: string,
  userMessage: string
): Promise<string> => {
  const message = userMessage.toLowerCase();
  let context = '';
  
  // Check if user is asking about specific projects
  if (message.includes('project')) {
    const { data: projects } = await supabase
      .from('projects')
      .select('name, status, created_at')
      .eq('user', userId)
      .limit(10);
      
    if (projects && projects.length > 0) {
      context += `\n**User's Projects:**\n${projects.map(p => `- ${p.name} (${p.status})`).join('\n')}`;
    }
  }
  
  // Check if user is asking about upcoming events
  if (message.includes('meeting') || message.includes('event') || message.includes('calendar')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('title, start_time, project')
      .eq('user', userId)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', nextWeek.toISOString())
      .order('start_time')
      .limit(5);
      
    if (upcomingEvents && upcomingEvents.length > 0) {
      context += `\n**Upcoming Events:**\n${upcomingEvents.map(e => `- ${e.title} (${new Date(e.start_time).toLocaleDateString()})`).join('\n')}`;
    }
  }
  
  // Check if user is asking about tasks
  if (message.includes('task') || message.includes('todo') || message.includes('deadline')) {
    const { data: urgentTasks } = await supabase
      .from('tasks')
      .select('title, due_date, priority, project')
      .eq('user', userId)
      .eq('status', 'todo')
      .not('due_date', 'is', null)
      .order('due_date')
      .limit(5);
      
    if (urgentTasks && urgentTasks.length > 0) {
      context += `\n**Upcoming Tasks:**\n${urgentTasks.map(t => `- ${t.title} (due: ${new Date(t.due_date).toLocaleDateString()}, priority: ${t.priority})`).join('\n')}`;
    }
  }
  
  return context;
};

/**
 * Build response guidelines based on user preferences
 */
const buildResponseGuidelines = (preferences?: UserPreferences): string => {
  if (!preferences) {
    return `\n**Response Guidelines:**\n- Be helpful and professional\n- Provide actionable suggestions\n- Format responses clearly`;
  }
  
  let guidelines = `\n**Response Guidelines:**\n`;
  
  switch (preferences.preferredResponseStyle) {
    case 'detailed':
      guidelines += '- Provide comprehensive, detailed explanations\n- Include step-by-step instructions\n- Offer multiple options when applicable\n';
      break;
    case 'concise':
      guidelines += '- Keep responses brief and to the point\n- Focus on key actionable items\n- Use bullet points for clarity\n';
      break;
    case 'casual':
      guidelines += '- Use a friendly, conversational tone\n- Include encouraging language\n- Make suggestions feel approachable\n';
      break;
    case 'professional':
      guidelines += '- Use a professional, business-appropriate tone\n- Focus on productivity and efficiency\n- Provide structured recommendations\n';
      break;
  }
  
  if (preferences.workflowPreferences.suggestDeadlines) {
    guidelines += '- Suggest realistic deadlines for tasks and projects\n';
  }
  
  if (preferences.workflowPreferences.autoCreateSubtasks) {
    guidelines += '- Break down complex tasks into subtasks when appropriate\n';
  }
  
  return guidelines;
};

/**
 * Save user preferences
 */
export const saveUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> => {
  const result = await withErrorHandling(async () => {
    // Get current settings or create new
    const { data: currentSettings } = await supabase
      .from('user_settings')
      .select('ai_preferences')
      .eq('user_id', userId)
      .single();
    
    const updatedPreferences = {
      ...currentSettings?.ai_preferences,
      ...preferences
    };
    
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ai_preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      });
    
    return true;
  }, 'save_user_preferences');

  return result.success;
}; 