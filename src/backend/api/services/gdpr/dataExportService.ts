import { supabase } from '../../../database/client';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  profile: any;
  tasks: any[];
  events: any[];
  notes: any[];
  projects: any[];
  files: any[];
  aiConversations: any[];
  aiMessages: any[];
  eventSuggestions: any[];
  taskSuggestions: any[];
  suggestionFeedback: any[];
  googleCalendarTokens: any[];
  userSettings: any[];
  timeLogs: any[];
}

export const exportUserData = async (): Promise<UserDataExport> => {
  try {
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userId = user.id;
    const exportDate = new Date().toISOString();

    // Collect all user data from different tables
    const [
      tasks,
      events, 
      notes,
      projects,
      files,
      aiConversations,
      aiMessages,
      eventSuggestions,
      taskSuggestions,
      suggestionFeedback,
      googleCalendarTokens,
      userSettings,
      timeLogs
    ] = await Promise.all([
      // Core productivity data (use 'user' column)
      supabase.from('tasks').select('*').eq('user', userId),
      supabase.from('events').select('*').eq('user', userId),
      supabase.from('notes').select('*').eq('user', userId),
      supabase.from('projects').select('*').eq('user', userId),
      supabase.from('files').select('*').eq('user', userId),
      
      // AI-related data (use 'user_id' column)
      supabase.from('ai_conversations').select('*').eq('user_id', userId),
      supabase.from('ai_messages').select('*').eq('user_id', userId),
      

      
      // Suggestions data (use 'user_id' column)
      supabase.from('event_suggestions').select('*').eq('user_id', userId),
      supabase.from('task_suggestions').select('*').eq('user_id', userId),
      supabase.from('suggestion_feedback').select('*').eq('user_id', userId),
      
      // Activity and settings (use 'user_id' column)

      supabase.from('google_calendar_tokens').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId),
      supabase.from('time_logs').select('*').eq('user_id', userId)
    ]);

    // Check for errors in any of the queries
    const errors = [
      tasks.error, events.error, notes.error, projects.error, files.error,
      aiConversations.error, aiMessages.error,
      eventSuggestions.error, taskSuggestions.error, suggestionFeedback.error,
      googleCalendarTokens.error, userSettings.error,
      timeLogs.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('Errors during data export:', errors);
      throw new Error('Failed to export some data');
    }

    // Prepare user profile data
    const profile = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    };

    // Compile the complete export
    const exportData: UserDataExport = {
      exportDate,
      userId,
      profile,
      tasks: tasks.data || [],
      events: events.data || [],
      notes: notes.data || [],
      projects: projects.data || [],
      files: files.data || [],
      aiConversations: aiConversations.data || [],
      aiMessages: aiMessages.data || [],
      eventSuggestions: eventSuggestions.data || [],
      taskSuggestions: taskSuggestions.data || [],
      suggestionFeedback: suggestionFeedback.data || [],
      googleCalendarTokens: googleCalendarTokens.data || [],
      userSettings: userSettings.data || [],
      timeLogs: timeLogs.data || []
    };

    return exportData;
  } catch (error) {
    console.error('Data export error:', error);
    throw error;
  }
};

export const downloadDataAsJson = (data: UserDataExport) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskpulse-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
}; 