/**
 * Context Service for AI Chat
 * Manages conversation memory, user preferences, and contextual information
 */

import { supabase } from "@/integrations/supabase/client";
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
  
  // Recent tasks
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_date')
    .eq('user', userId)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at', { ascending: false })
    .limit(10);
  
  // Recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, title, start_time')
    .eq('user', userId)
    .gte('start_time', sevenDaysAgo.toISOString())
    .order('start_time', { ascending: false })
    .limit(10);
  
  // Recent notes
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, updated_at')
    .eq('user', userId)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at', { ascending: false })
    .limit(10);
  
  // Suggestion history
  const { data: suggestionHistory } = await supabase
    .from('suggestion_feedback')
    .select('suggestion_type, accepted, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);
  
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
 * Build contextual prompt with user and conversation context
 */
export const buildContextualPrompt = async (
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<ContextualPrompt> => {
  const result = await withErrorHandling(async () => {
    const userContext = await getUserContext(userId);
    
    // Build user context string
    const userContextString = userContext ? `
**User Context:**
- Preferred response style: ${userContext.preferences.preferredResponseStyle}
- Working hours: ${userContext.workingHours.start} - ${userContext.workingHours.end} (${userContext.timezone})
- Active projects (${userContext.currentProjects.length}): ${userContext.currentProjects.map(p => `${p.name} (${p.progress}% complete)`).join(', ')}
- Recent activity: ${userContext.recentActivity.recentTasks.length} tasks, ${userContext.recentActivity.recentEvents.length} events
` : '';
    
    // Generate relevant data context
    const relevantDataContext = await generateRelevantDataContext(userId, userMessage);
    
    // Build response guidelines based on user preferences
    const responseGuidelines = buildResponseGuidelines(userContext?.preferences);
    
    const basePrompt = `You are an AI assistant specialized in productivity, project management, and personal organization. You help users manage their tasks, projects, calendar events, notes, and files efficiently.

Current user message: "${userMessage}"`;
    
    return {
      basePrompt,
      userContext: userContextString,
      conversationContext: '', // Simplified for now
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