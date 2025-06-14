import { getUserEvents, getUserTasks, formatDateForUser, formatTimeForUser, getUserProjects, getProjectItems, getProjectProgress, getProjectTimeline, getUserFiles, getUserNotes } from "../../core/userDataService";

/**
 * Query classification keywords and patterns
 */
export const QUERY_KEYWORDS = {
  calendarEvent: [
    'event', 'calendar', 'schedule', 'appointment', 'meeting', 'have on', 
    'what do i have', 'what\'s on', 'what is on', 'happening on', 'planned for'
  ],
  task: [
    'task', 'to-do', 'to do', 'todo', 'need to do', 'should do', 
    'assignment', 'work', 'project tasks'
  ],
  project: [
    'project', 'projects', 'working on', 'current projects', 'active projects',
    'completed projects', 'project status'
  ],
  progress: [
    'progress', 'analytics', 'status', 'stats', 'statistics', 'overview',
    'how is', 'how are', 'performance', 'completion', 'summary'
  ],
  timeline: [
    'timeline', 'deadline', 'deadlines', 'schedule', 'upcoming', 'due dates',
    'when is', 'when are', 'calendar', 'dates'
  ],
  file: [
    'file', 'files', 'document', 'documents', 'upload', 'uploads', 'attachment', 'attachments',
    'pdf', 'image', 'images', 'photo', 'photos', 'video', 'videos'
  ],
  event: [
    'event', 'events', 'meeting', 'meetings', 'appointment', 'appointments', 'calendar',
    'schedule', 'scheduled', 'when', 'today', 'tomorrow', 'this week', 'next week',
    'yesterday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ],
  note: [
    'note', 'notes', 'written', 'wrote', 'remember', 'recorded', 'documented',
    'jotted', 'memo', 'memos', 'notebook', 'journal', 'ideas', 'thoughts'
  ],
  taskQuery: [
    'task', 'tasks', 'todo', 'todos', 'to-do', 'to-dos', 'assignment', 'assignments',
    'work', 'job', 'complete', 'completed', 'done', 'pending', 'overdue', 'due',
    'finished', 'accomplish', 'accomplished', 'completion', 'finished tasks', 'completed tasks'
  ]
};

export const STATUS_KEYWORDS = {
  todo: ['to do', 'todo', 'to-do list', 'pending', 'not done', 'upcoming', 'incomplete', 'unfinished'],
  inProgress: ['in progress', 'ongoing', 'working on', 'started', 'in-progress', 'active', 'current'],
  done: ['done', 'completed', 'finished', 'complete', 'completion', 'accomplished', 'finished tasks', 'completed tasks', 'done tasks']
};

// Question words that should NOT be treated as project names
export const QUESTION_WORDS = ['what', 'which', 'how', 'when', 'where', 'who', 'why', 'tell', 'show', 'list', 'get', 'give', 'suggest', 'generate', 'create'];

// Suggestion request patterns that should NOT be treated as project queries
export const SUGGESTION_PATTERNS = [
  /suggest\s+me\s+(tasks?|events?|suggestions?)/i,
  /generate\s+(tasks?|events?|suggestions?)/i,
  /give\s+me\s+(tasks?|events?|suggestions?)/i,
  /create\s+suggestions?/i,
  /get\s+suggestions?/i,
  /show\s+me\s+suggestions?/i
];

/**
 * Project name extraction patterns
 */
export const PROJECT_PATTERNS = [
  // Pattern 1: "what tasks do I have in the AUTO project"
  { pattern: /(?:what|which|list|show|get|any|all)?\s*(items?|tasks?|events?|notes?|files?)\s+(?:do\s+i\s+have\s+)?(?:in|for|from|of)\s+(?:the\s+)?([\w\s'-]+?)\s+project/i, projectIndex: 2, itemIndex: 1 },
  
  // Pattern 2: "tasks in AUTO project" or "tasks for AUTO"
  { pattern: /(items?|tasks?|events?|notes?|files?)\s+(?:in|for|from|of|linked\s+to|related\s+to|assigned\s+to)\s+(?:the\s+)?([\w\s'-]+?)(?:\s+project|\s*$|\?|\.)/i, projectIndex: 2, itemIndex: 1 },
  
  // Pattern 3: "AUTO project tasks" or "AUTO tasks"
  { pattern: /([\w\s'-]+?)\s+(?:project\s+)?(items?|tasks?|events?|notes?|files?)/i, projectIndex: 1, itemIndex: 2 },
  
  // Pattern 4: "in the AUTO project, what tasks" (project mentioned first)
  { pattern: /(?:in|for|about)\s+(?:the\s+)?([\w\s'-]+?)\s+project[,\s]+(?:what|which|list|show|any|all)?\s*(items?|tasks?|events?|notes?|files?)/i, projectIndex: 1, itemIndex: 2 },
  
  // Pattern 5: "tasks that are in AUTO" or "tasks that belong to AUTO"
  { pattern: /(items?|tasks?|events?|notes?|files?)\s+(?:that\s+)?(?:are|is|belong\s+to|linked\s+to|related\s+to)\s+(?:in\s+)?(?:the\s+)?([\w\s'-]+?)(?:\s+project|\s*$|\?|\.)/i, projectIndex: 2, itemIndex: 1 },
  
  // Pattern 6: General project content queries - "what's in AUTO project", "everything in AUTO"
  { pattern: /(?:what|everything|all|anything).*?(?:in|for|from|of)\s+(?:the\s+)?([\w\s'-]+?)\s+project/i, projectIndex: 1, itemIndex: null }
];

/**
 * Month names mapping for date parsing
 */
export const MONTH_NAMES = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11
};

export const MONTH_DISPLAY_NAMES = {
  'january': 'January', 'jan': 'January',
  'february': 'February', 'feb': 'February', 
  'march': 'March', 'mar': 'March',
  'april': 'April', 'apr': 'April',
  'may': 'May',
  'june': 'June', 'jun': 'June',
  'july': 'July', 'jul': 'July',
  'august': 'August', 'aug': 'August',
  'september': 'September', 'sep': 'September', 'sept': 'September',
  'october': 'October', 'oct': 'October',
  'november': 'November', 'nov': 'November',
  'december': 'December', 'dec': 'December'
};

/**
 * Extract project name and item type from query
 */
export function extractProjectInfo(query: string): { projectName: string | null; itemType: string | null } {
  // Skip project extraction for suggestion requests and command queries
  if (isSuggestionRequest(query) || isCommandQuery(query)) {
    return { projectName: null, itemType: null };
  }

  let projectNameFromQuery: string | null = null;
  let requestedItemType: string | null = null;
  
  for (const { pattern, projectIndex, itemIndex } of PROJECT_PATTERNS) {
    const match = query.match(pattern);
    if (match && match[projectIndex]) {
      let extractedName = match[projectIndex].trim();
      
      // Clean up common words that might be captured
      const stopWords = ['my', 'the', 'a', 'an', 'this', 'that', 'these', 'those', 'all', 'some', 'any'];
      const words = extractedName.split(/\s+/);
      const cleanedWords = words.filter(word => !stopWords.includes(word.toLowerCase()));
      
      if (cleanedWords.length > 0) {
        const candidateProjectName = cleanedWords.join(' ');
        
        // Filter out question words that are not project names
        if (!QUESTION_WORDS.includes(candidateProjectName.toLowerCase())) {
          projectNameFromQuery = candidateProjectName;
          
          // Extract item type if available
          if (itemIndex && match[itemIndex]) {
            const itemType = match[itemIndex].toLowerCase();
            if (itemType.includes('task')) requestedItemType = 'tasks';
            else if (itemType.includes('event')) requestedItemType = 'events';
            else if (itemType.includes('note')) requestedItemType = 'notes';
            else if (itemType.includes('file')) requestedItemType = 'files';
            else if (itemType.includes('item')) requestedItemType = null; // all items
          }
          break;
        }
      }
    }
  }
  
  // Additional validation: if we extracted a very common word, it's probably not a project name
  if (projectNameFromQuery) {
    const commonWords = ['tasks', 'task', 'items', 'item', 'events', 'event', 'notes', 'note', 'files', 'file', 'work', 'working', 'do', 'have', 'get', 'show', 'list'];
    if (commonWords.includes(projectNameFromQuery.toLowerCase())) {
      projectNameFromQuery = null;
      requestedItemType = null;
    }
  }

  return { projectName: projectNameFromQuery, itemType: requestedItemType };
}

/**
 * Parse date information from query
 */
export function parseDateFromQuery(query: string): {
  targetDate: string | null;
  startDate: string | null;
  endDate: string | null;
  dateFilters: string[];
  monthMatch: RegExpMatchArray | null;
} {
  let targetDate: string | null = null;
  let startDate: string | null = null;
  let endDate: string | null = null;
  let dateFilters: string[] = [];
  
  const lowercaseQuery = query.toLowerCase();
  let monthMatch: RegExpMatchArray | null = null;
  
  // Check for relative date ranges
  if (lowercaseQuery.includes('this week')) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday of this week
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    startDate = monday.toISOString().split('T')[0];
    endDate = sunday.toISOString().split('T')[0];
    dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
  } else if (lowercaseQuery.includes('next week')) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const nextMondayOffset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Get Monday of next week
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + nextMondayOffset);
    nextMonday.setHours(0, 0, 0, 0);
    
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);
    
    startDate = nextMonday.toISOString().split('T')[0];
    endDate = nextSunday.toISOString().split('T')[0];
    dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
  } else if (lowercaseQuery.includes('today')) {
    targetDate = new Date().toISOString().split('T')[0];
  } else if (lowercaseQuery.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetDate = tomorrow.toISOString().split('T')[0];
  } else if (lowercaseQuery.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    targetDate = yesterday.toISOString().split('T')[0];
  } else {
    // Check for month names first (for month range queries like "events in August")
    const monthOnlyPattern = /(?:in|during|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s|$|\?|\.)/i;
    monthMatch = lowercaseQuery.match(monthOnlyPattern);
    
    if (monthMatch && monthMatch[1]) {
      const monthName = monthMatch[1].toLowerCase();
      const monthIndex = MONTH_NAMES[monthName as keyof typeof MONTH_NAMES];
      
      if (monthIndex !== undefined) {
        const currentYear = new Date().getFullYear();
        
        // Create start of month
        const monthStart = new Date(currentYear, monthIndex, 1);
        
        // Create end of month (first day of next month minus 1 day)
        const monthEnd = new Date(currentYear, monthIndex + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
        dateFilters.push(`due_after:${startDate}`, `due_before:${endDate}`);
        console.log(`Month query detected: ${monthName} -> Date range: ${startDate} to ${endDate}`);
      }
    } else {
      // Try to detect specific dates and other date formats
      const dateRegex = /(?:on|for|due|in)?\s*(?:the\s*)?(\d{1,2}(?:st|nd|rd|th)?\s*(?:of\s*)?(?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|(?:\d{1,2}[-/\.]\d{1,2}(?:[-/\.]\d{2,4})?)|(?:january|february|march|april|may|june|july|august|september|october|november|december))/i;
      const dateMatch = query.match(dateRegex);
      
      if (dateMatch && dateMatch[1]) {
        const dateText = dateMatch[1].toLowerCase();
        try {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) {
            targetDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log("Failed to parse date:", dateText);
        }
      }
    }
  }

  return { targetDate, startDate, endDate, dateFilters, monthMatch };
}

/**
 * Check if query has time references
 */
export function hasTimeReference(query: string, targetDate: string | null, startDate: string | null, endDate: string | null, dateFilters: string[]): boolean {
  const lowercaseQuery = query.toLowerCase();
  
  return !!(targetDate || startDate || endDate || dateFilters.length > 0 || 
    lowercaseQuery.includes('this week') || lowercaseQuery.includes('next week') || 
    lowercaseQuery.includes('today') || lowercaseQuery.includes('tomorrow') || 
    lowercaseQuery.includes('yesterday') || lowercaseQuery.includes('due') ||
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)/.test(lowercaseQuery));
}



/**
 * Check if query is a suggestion request
 */
export function isSuggestionRequest(query: string): boolean {
  return SUGGESTION_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Check if a query contains command words that should not be treated as project queries
 */
export function isCommandQuery(query: string): boolean {
  const commandPatterns = [
    /^(create|add|make|schedule|set up|delete|remove|update|change|suggest|generate|give me|show me|list|tell me)/i,
    /(create|add|make|schedule|set up|delete|remove|update|change) (a |an |the )?(task|event|project|reminder)/i,
    /(suggest|generate|give me|show me) (tasks?|events?|suggestions?)/i
  ];
  
  return commandPatterns.some(pattern => pattern.test(query.trim()));
} 