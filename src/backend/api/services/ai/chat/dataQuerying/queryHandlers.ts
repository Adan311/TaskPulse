import { getUserEvents, getUserTasks, formatDateForUser, formatTimeForUser, getUserProjects, getProjectItems, getProjectProgress, getProjectTimeline, getUserFiles, getUserNotes } from "../../core/userDataService";
import { 
  QUERY_KEYWORDS, 
  STATUS_KEYWORDS,
  MONTH_DISPLAY_NAMES,
  extractProjectInfo, 
  parseDateFromQuery,
  hasTimeReference
} from "./queryParser";
import { formatFileSize } from "@/shared/utils/fileUtils";

/**
 * Handle queries about user data like "What events do I have on June 5th?"
 */
export const handleUserDataQuery = async (
  userId: string,
  query: string
): Promise<string | null> => {
  try {
    const lowercaseQuery = query.toLowerCase();
    
    // Extract project information and dates
    const { projectName: projectNameFromQuery, itemType: requestedItemType } = extractProjectInfo(query);
    const { targetDate, startDate, endDate, dateFilters, monthMatch } = parseDateFromQuery(query);
    
    // PRIORITY 1: Time-based queries (highest priority to prevent misclassification)
    const hasTimeRef = hasTimeReference(query, targetDate, startDate, endDate, dateFilters);
    
    if (hasTimeRef && (QUERY_KEYWORDS.taskQuery.some(keyword => lowercaseQuery.includes(keyword)) || QUERY_KEYWORDS.event.some(keyword => lowercaseQuery.includes(keyword)))) {
      // This is a time-based query about tasks or events
      if (QUERY_KEYWORDS.taskQuery.some(keyword => lowercaseQuery.includes(keyword))) {
        try {
          // Determine which task status to filter by
          let statusFilter: string | undefined = undefined;
          let statusLabel = "pending";
          
          if (STATUS_KEYWORDS.todo.some(keyword => lowercaseQuery.includes(keyword))) {
            statusFilter = 'todo';
            statusLabel = "to do";
          } else if (STATUS_KEYWORDS.inProgress.some(keyword => lowercaseQuery.includes(keyword))) {
            statusFilter = 'in_progress';
            statusLabel = "in progress";
          } else if (STATUS_KEYWORDS.done.some(keyword => lowercaseQuery.includes(keyword))) {
            statusFilter = 'done';
            statusLabel = "completed";
          }
          
          // Use enhanced date filtering with range support
          const tasks = await getUserTasks(userId, statusFilter, targetDate, undefined, dateFilters);
          
          if (tasks.length === 0) {
            if (targetDate || dateFilters.length > 0) {
              const timeRef = targetDate ? formatDateForUser(targetDate) : "this week";
              return statusFilter 
                ? `You don't have any ${statusLabel} tasks due ${timeRef}.`
                : `You don't have any tasks due ${timeRef}.`;
            } else {
              return statusFilter 
                ? `You don't have any ${statusLabel} tasks.`
                : "You don't have any pending tasks.";
            }
          }
          
          const formattedTasks = tasks.map(task => {
            let statusDisplay = "";
            if (task.status && !statusFilter) {
              statusDisplay = ` (${task.status === 'in_progress' ? 'in progress' : task.status})`;
            }
            return `- ${task.title}${statusDisplay}`;
          }).join('\n');
          
          let responsePrefix = "Here are your ";
          if (statusFilter) {
            responsePrefix += `${statusLabel} tasks`;
          } else {
            responsePrefix += "tasks";
          }
          
          if (targetDate || dateFilters.length > 0) {
            const timeRef = targetDate ? formatDateForUser(targetDate) : "this week";
            return `${responsePrefix} due ${timeRef}:\n${formattedTasks}`;
          } else {
            return `${responsePrefix}:\n${formattedTasks}`;
          }
        } catch (error) {
          console.error("Error handling time-based task query:", error);
          return "I couldn't retrieve your task information. Please try again later.";
        }
      } else if (QUERY_KEYWORDS.event.some(keyword => lowercaseQuery.includes(keyword))) {
        try {
          // Determine the date range for the query
          let queryStartDate = targetDate || startDate;
          let queryEndDate = targetDate || endDate;
          
          // For month queries, don't filter by upcoming/past - show all events in that month
          let filters: string[] = [];
          if (startDate && endDate) {
            // This is a month range query, don't apply upcoming/past filters
            filters = [];
          } else {
            // For other date queries, apply upcoming/past logic
            filters = lowercaseQuery.includes('past') ? ['past'] : ['upcoming'];
          }
          
          const events = await getUserEvents(userId, queryStartDate, queryEndDate, undefined, filters);
          
          if (events.length === 0) {
            let timeRef = "";
            if (targetDate) {
              timeRef = formatDateForUser(targetDate);
            } else if (startDate && endDate) {
              // Use the detected month name for consistency
              const detectedMonth = monthMatch && monthMatch[1] ? monthMatch[1] : null;
              if (detectedMonth) {
                const fullMonthName = MONTH_DISPLAY_NAMES[detectedMonth.toLowerCase() as keyof typeof MONTH_DISPLAY_NAMES] || detectedMonth;
                const year = new Date().getFullYear();
                timeRef = `${fullMonthName} ${year}`;
              } else {
                // Fallback to parsing startDate
                const startMonth = new Date(startDate + 'T00:00:00').toLocaleString('default', { month: 'long' });
                const startYear = new Date(startDate + 'T00:00:00').getFullYear();
                timeRef = `${startMonth} ${startYear}`;
              }
            } else {
              timeRef = "upcoming";
            }
            
            if (filters.includes('past')) {
              return `You don't have any past events ${timeRef ? `for ${timeRef}` : ''}.`;
            } else {
              return `You don't have any events scheduled ${timeRef ? `for ${timeRef}` : ''}.`;
            }
          }
          
          const formattedEvents = events.map(event => {
            const startDate = formatDateForUser(event.startTime);
            const endDate = event.endTime ? formatDateForUser(event.endTime) : null;
            const startTime = formatTimeForUser(event.startTime);
            const endTime = event.endTime ? formatTimeForUser(event.endTime) : null;
            
            if (endDate && endDate !== startDate) {
              // Multi-day event
              return `- ${event.title} (${startDate} to ${endDate})`;
            } else {
              // Single day event
              return `- ${event.title} at ${startTime}${endTime && endTime !== startTime ? ` - ${endTime}` : ''}`;
            }
          }).join('\n');
          
          let timeRef = "";
          if (targetDate) {
            timeRef = formatDateForUser(targetDate);
          } else if (startDate && endDate) {
            // Use the detected month name instead of parsing startDate
            const detectedMonth = monthMatch && monthMatch[1] ? monthMatch[1] : null;
            if (detectedMonth) {
              const fullMonthName = MONTH_DISPLAY_NAMES[detectedMonth.toLowerCase() as keyof typeof MONTH_DISPLAY_NAMES] || detectedMonth;
              const year = new Date().getFullYear();
              timeRef = `${fullMonthName} ${year}`;
            } else {
              // Fallback to parsing startDate
              const startMonth = new Date(startDate + 'T00:00:00').toLocaleString('default', { month: 'long' });
              const startYear = new Date(startDate + 'T00:00:00').getFullYear();
              timeRef = `${startMonth} ${startYear}`;
            }
          }
          
          if (filters.includes('past')) {
            return timeRef
              ? `Here are your past events for ${timeRef}:\n${formattedEvents}`
              : `Here are your past events:\n${formattedEvents}`;
          } else {
            return timeRef
              ? `Here are your events for ${timeRef}:\n${formattedEvents}`
              : `Here are your upcoming events:\n${formattedEvents}`;
          }
        } catch (error) {
          console.error("Error handling time-based event query:", error);
          return "I couldn't retrieve your calendar information. Please try again later.";
        }
      }
    }
    
    // PRIORITY 2: Project-specific item queries (e.g., "tasks in AUTO project")
    if (projectNameFromQuery) {
      try {
        const projectItems = await getProjectItems(userId, projectNameFromQuery);
        
        // Check if no items found
        if (!projectItems.tasks.length && !projectItems.events.length && !projectItems.notes.length && !projectItems.files.length) {
          return `I couldn't find any items linked to project "${projectNameFromQuery}".`;
        }
        
        // Filter by requested item type if specified
        let response = "";
        let hasResults = false;
        
        if (!requestedItemType) {
          // Return all items (user asked for "everything" or general query)
          const hasMultipleTypes = 
            (projectItems.tasks.length > 0 ? 1 : 0) + 
            (projectItems.events.length > 0 ? 1 : 0) + 
            (projectItems.notes.length > 0 ? 1 : 0) + 
            (projectItems.files.length > 0 ? 1 : 0) > 1;
          
          response = `Here are the items linked to project "${projectNameFromQuery}":\n\n`;
          
          if (projectItems.tasks.length > 0) {
            if (hasMultipleTypes) response += `Tasks:\n`;
            projectItems.tasks.forEach(task => {
              response += `- ${task.title} (${task.status})\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.events.length > 0) {
            if (hasMultipleTypes) response += `Events:\n`;
            projectItems.events.forEach(event => {
              response += `- ${event.title} (${formatDateForUser(event.start_time)} at ${formatTimeForUser(event.start_time)})\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.notes.length > 0) {
            if (hasMultipleTypes) response += `Notes:\n`;
            projectItems.notes.forEach(note => {
              const notePreview = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'No content';
              response += `- Note: ${notePreview}\n`;
            });
            if (hasMultipleTypes) response += '\n';
            hasResults = true;
          }
          
          if (projectItems.files.length > 0) {
            if (hasMultipleTypes) response += `Files:\n`;
            projectItems.files.forEach(file => {
              response += `- File: ${file.name} (${formatFileSize(file.size)})\n`;
            });
            hasResults = true;
          }
        } else {
          // Return only the requested item type
          switch (requestedItemType) {
            case 'tasks':
              if (projectItems.tasks.length > 0) {
                response = `Here are the tasks in project "${projectNameFromQuery}":\n\n`;
                projectItems.tasks.forEach(task => {
                  response += `- ${task.title} (${task.status})\n`;
                });
                hasResults = true;
              } else {
                return `No tasks found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'events':
              if (projectItems.events.length > 0) {
                response = `Here are the events in project "${projectNameFromQuery}":\n\n`;
                projectItems.events.forEach(event => {
                  response += `- ${event.title} (${formatDateForUser(event.start_time)} at ${formatTimeForUser(event.start_time)})\n`;
                });
                hasResults = true;
              } else {
                return `No events found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'notes':
              if (projectItems.notes.length > 0) {
                response = `Here are the notes in project "${projectNameFromQuery}":\n\n`;
                projectItems.notes.forEach(note => {
                  const notePreview = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'No content';
                  response += `- Note: ${notePreview}\n`;
                });
                hasResults = true;
              } else {
                return `No notes found in project "${projectNameFromQuery}".`;
              }
              break;
              
            case 'files':
              if (projectItems.files.length > 0) {
                response = `Here are the files in project "${projectNameFromQuery}":\n\n`;
                projectItems.files.forEach(file => {
                  response += `- File: ${file.name} (${formatFileSize(file.size)})\n`;
                });
                hasResults = true;
              } else {
                return `No files found in project "${projectNameFromQuery}".`;
              }
              break;
          }
        }
        
        return hasResults ? response : `I couldn't find any items linked to project "${projectNameFromQuery}".`;
      } catch (error) {
        console.error("Error handling project items query:", error);
        return "I couldn't retrieve the items linked to that project. Please try again later.";
      }
    }

    // PRIORITY 3: General project queries (e.g., "what projects am I working on")
    if (QUERY_KEYWORDS.project.some(keyword => query.toLowerCase().includes(keyword.toLowerCase())) &&
        !projectNameFromQuery) {
      try {
        // Determine which project status to filter by
        let statusFilter: string | undefined = undefined;
        
        if (lowercaseQuery.includes('active') || lowercaseQuery.includes('current')) {
          statusFilter = 'active';
        } else if (lowercaseQuery.includes('completed') || lowercaseQuery.includes('finished')) {
          statusFilter = 'completed';
        } else if (lowercaseQuery.includes('on hold') || lowercaseQuery.includes('paused')) {
          statusFilter = 'on-hold';
        }
        
        const projects = await getUserProjects(userId, statusFilter);
        
        if (projects.length === 0) {
          return statusFilter
            ? `You don't have any ${statusFilter} projects.`
            : "You don't have any projects yet.";
        }
        
        const formattedProjects = projects.map(project => {
          let dueInfo = '';
          if (project.due_date) {
            dueInfo = ` (due ${formatDateForUser(project.due_date)})`;
          }
          
          let progressInfo = '';
          if (typeof project.progress === 'number') {
            progressInfo = ` - ${project.progress}% complete`;
          }
          
          return `- ${project.name}${dueInfo}${progressInfo}`;
        }).join('\n');
        
        let responsePrefix = "Here are your ";
        if (statusFilter) {
          responsePrefix += `${statusFilter} projects:`;
        } else {
          responsePrefix += "projects:";
        }
        
        return `${responsePrefix}\n${formattedProjects}`;
      } catch (error) {
        console.error("Error handling project query:", error);
        return "I couldn't retrieve your project information. Please try again later.";
      }
    }

    // PRIORITY 4: Calendar/Event queries
    if (QUERY_KEYWORDS.calendarEvent.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // If not explicitly asking for past events, default to upcoming
        const filters = query.toLowerCase().includes('past') ? ['past'] : ['upcoming'];
        const events = await getUserEvents(userId, targetDate, targetDate || endDate, undefined, filters);
        
        if (events.length === 0) {
          if (filters.includes('past')) {
            return targetDate 
              ? `You don't have any past events on ${formatDateForUser(targetDate)}.` 
              : "You don't have any past events.";
          } else {
            return targetDate 
              ? `You don't have any events scheduled on ${formatDateForUser(targetDate)}.` 
              : "You don't have any upcoming events scheduled.";
          }
        }
        
        const formattedEvents = events.map(event => (
          `- ${event.title}${event.startTime ? ` at ${formatTimeForUser(event.startTime)}` : ''}`
        )).join('\n');
        
        if (filters.includes('past')) {
          return targetDate
            ? `Here are your past events for ${formatDateForUser(targetDate)}:\n${formattedEvents}`
            : `Here are your past events:\n${formattedEvents}`;
        } else {
          return targetDate
            ? `Here are your events for ${formatDateForUser(targetDate)}:\n${formattedEvents}`
            : `Here are your upcoming events:\n${formattedEvents}`;
        }
      } catch (error) {
        console.error("Error handling calendar query:", error);
        return "I couldn't retrieve your calendar information. Please try again later.";
      }
    }
    
    // Check if query is about notes
    if (QUERY_KEYWORDS.note.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse search parameters from query
        let contentSearch: string | undefined = undefined;
        let projectNameForNotes: string | undefined = undefined;
        let pinnedOnly = false;
        
        // Check for pinned notes
        if (lowercaseQuery.includes('pinned') || lowercaseQuery.includes('important')) {
          pinnedOnly = true;
        }
        
        // Extract search terms
        const searchMatch = lowercaseQuery.match(/about\s+(.+?)(?:\s+in\s+|$)/);
        if (searchMatch) {
          contentSearch = searchMatch[1];
        }
        
        // Check for project mentions
        const projectMatch = lowercaseQuery.match(/(?:in|for|from)\s+(?:project\s+)?(.+?)(?:\s|$)/);
        if (projectMatch) {
          projectNameForNotes = projectMatch[1];
        }
        
        const notes = await getUserNotes(userId, contentSearch, projectNameForNotes, pinnedOnly);
        
        if (notes.length === 0) {
          let noResultsMessage = "I couldn't find any notes";
          if (contentSearch) noResultsMessage += ` about "${contentSearch}"`;
          if (projectNameForNotes) noResultsMessage += ` in project "${projectNameForNotes}"`;
          if (pinnedOnly) noResultsMessage += " that are pinned";
          return noResultsMessage + ".";
        }
        
        // Format notes response with markdown
        let response = `## 📝 Notes Found (${notes.length} notes)\n\n`;
        
        notes.forEach((note, index) => {
          const lastUpdated = formatDateForUser(note.last_updated);
          
          response += `### ${index + 1}. Note ${note.pinned ? '📌' : ''}\n`;
          
          // Truncate content if too long
          let content = note.content || '';
          if (content.length > 200) {
            content = content.substring(0, 200) + '...';
          }
          
          response += `**Content:** ${content}\n`;
          response += `**📅 Last Updated:** ${lastUpdated}\n`;
          
          if (note.project && note.project.name) {
            response += `**Project:** ${note.project.name}\n`;
          }
          
          if (note.pinned) {
            response += `**📌 Status:** Pinned\n`;
          }
          
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying notes:', error);
        return "I encountered an error while searching for notes. Please try again.";
      }
    }
    
    // Check if query is about project progress/analytics with a specific project
    if (projectNameFromQuery && QUERY_KEYWORDS.progress.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        const progressData = await getProjectProgress(userId, projectNameFromQuery);
        
        if (!progressData) {
          return `I couldn't find a project named "${projectNameFromQuery}".`;
        }
        
        const { project, progress, totalTasks, completedTasks, pendingTasks, overdueTasks, upcomingEvents, notes, files } = progressData;
        
        let response = `**${project.name} Project Progress:**\n\n`;
        response += `📊 **Overall Progress:** ${progress}% complete\n\n`;
        
        if (totalTasks > 0) {
          response += `**Tasks Summary:**\n`;
          response += `• Total: ${totalTasks}\n`;
          response += `• Completed: ${completedTasks}\n`;
          response += `• Pending: ${pendingTasks}\n`;
          if (overdueTasks > 0) {
            response += `• ⚠️ Overdue: ${overdueTasks}\n`;
          }
          response += '\n';
        }
        
        if (upcomingEvents > 0) {
          response += `📅 **Upcoming Events:** ${upcomingEvents} in the next 30 days\n\n`;
        }
        
        if (notes > 0 || files > 0) {
          response += `**Additional Resources:**\n`;
          if (notes > 0) response += `• Notes: ${notes}\n`;
          if (files > 0) response += `• Files: ${files}\n`;
          response += '\n';
        }
        
        if (project.due_date) {
          const dueDate = new Date(project.due_date);
          const isOverdue = dueDate < new Date() && project.status !== 'completed';
          response += `**Project Deadline:** ${formatDateForUser(project.due_date)}`;
          if (isOverdue) {
            response += ` ⚠️ (Overdue)`;
          }
          response += '\n';
        }
        
        return response;
      } catch (error) {
        console.error("Error handling project progress query:", error);
        return "I couldn't retrieve the project progress information. Please try again later.";
      }
    }
    
    // Check if query is about project timeline with a specific project
    if (projectNameFromQuery && QUERY_KEYWORDS.timeline.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        const timelineData = await getProjectTimeline(userId, projectNameFromQuery);
        
        if (!timelineData) {
          return `I couldn't find a project named "${projectNameFromQuery}".`;
        }
        
        const { projectName, timeline } = timelineData;
        
        if (timeline.length === 0) {
          return `No upcoming deadlines or events found for project "${projectName}".`;
        }
        
        let response = `**${projectName} Project Timeline:**\n\n`;
        
        timeline.forEach(item => {
          const date = formatDateForUser(item.date);
          const isOverdue = item.isOverdue ? ' ⚠️ (Overdue)' : '';
          
          switch (item.type) {
            case 'task':
              response += `📋 **Task:** ${item.title} - Due ${date}${isOverdue}\n`;
              if (item.status) {
                response += `   Status: ${item.status === 'in_progress' ? 'In Progress' : item.status}\n`;
              }
              break;
            case 'event':
              response += `📅 **Event:** ${item.title} - ${date}\n`;
              break;
            case 'project_deadline':
              response += `🎯 **Project Deadline:** ${date}${isOverdue}\n`;
              break;
          }
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error("Error handling project timeline query:", error);
        return "I couldn't retrieve the project timeline information. Please try again later.";
      }
    }
    
    // Check if query is about files
    if (QUERY_KEYWORDS.file.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Extract search parameters from the query
        let nameSearch: string | undefined = undefined;
        let fileType: string | undefined = undefined;
        let projectNameForFiles: string | undefined = undefined;
        
        // Check for file type mentions
        if (lowercaseQuery.includes('pdf')) fileType = 'pdf';
        else if (lowercaseQuery.includes('image') || lowercaseQuery.includes('photo')) fileType = 'image';
        else if (lowercaseQuery.includes('video')) fileType = 'video';
        else if (lowercaseQuery.includes('document') || lowercaseQuery.includes('doc')) fileType = 'application';
        
        // Check for project-specific file queries
        const projectFilePattern = /(?:files?|documents?|uploads?)\s+(?:(?:in|from|for|of|linked to|attached to|related to)\s+)?(?:(?:project|the project)\s+)?([\w\s'-]+?)(?:\s+project|$|\?|\.)/i;
        const projectFileMatch = query.match(projectFilePattern);
        if (projectFileMatch) {
          projectNameForFiles = projectFileMatch[1].trim();
        }
        
        // Check for name-based searches
        const namePattern = /(?:file|document|upload|attachment)\s+(?:named|called|titled)\s+["']?([^"']+?)["']?(?:\?|$|\.)/i;
        const nameMatch = query.match(namePattern);
        if (nameMatch) {
          nameSearch = nameMatch[1].trim();
        }
        
        const files = await getUserFiles(userId, nameSearch, fileType, projectNameForFiles);
        
        if (files.length === 0) {
          let responseMessage = "You don't have any files";
          if (fileType) responseMessage += ` of type ${fileType}`;
          if (projectNameForFiles) responseMessage += ` in project "${projectNameForFiles}"`;
          if (nameSearch) responseMessage += ` named "${nameSearch}"`;
          responseMessage += ".";
          
          return responseMessage;
        }
        
        let response = "Here are your files";
        if (fileType) response += ` (${fileType} files)`;
        if (projectNameForFiles) response += ` from project "${projectNameForFiles}"`;
        response += ":\n\n";
        
        files.forEach(file => {
          const uploadDate = formatDateForUser(file.uploaded_at);
          const fileSize = formatFileSize(file.size);
          let fileInfo = `📄 **${file.name}** (${fileSize})`;
          
          if (file.project && typeof file.project === 'object' && 'name' in file.project) {
            fileInfo += `\n   📁 Project: ${file.project.name}`;
          }
          
          if (file.task && typeof file.task === 'object' && 'title' in file.task) {
            fileInfo += `\n   📋 Task: ${file.task.title}`;
          }
          
          if (file.event && typeof file.event === 'object' && 'title' in file.event) {
            fileInfo += `\n   📅 Event: ${file.event.title}`;
          }
          
          fileInfo += `\n   📅 Uploaded: ${uploadDate}\n`;
          
          response += fileInfo + '\n';
        });
        
        return response;
      } catch (error) {
        console.error("Error handling file query:", error);
        return "I couldn't retrieve your file information. Please try again later.";
      }
    }
    
    // Check if query is about events
    if (QUERY_KEYWORDS.event.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse date range from query
        let eventStartDate: string | undefined = undefined;
        let eventEndDate: string | undefined = undefined;
        let eventQuery: string | undefined = undefined;
        
        // Extract search terms and dates
        if (lowercaseQuery.includes('today')) {
          const today = new Date();
          eventStartDate = today.toISOString().split('T')[0];
          eventEndDate = eventStartDate;
        } else if (lowercaseQuery.includes('tomorrow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          eventStartDate = tomorrow.toISOString().split('T')[0];
          eventEndDate = eventStartDate;
        } else if (lowercaseQuery.includes('this week')) {
          const today = new Date();
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          eventStartDate = startOfWeek.toISOString().split('T')[0];
          eventEndDate = endOfWeek.toISOString().split('T')[0];
        } else if (lowercaseQuery.includes('next week')) {
          const today = new Date();
          const startOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
          const endOfNextWeek = new Date(today.setDate(today.getDate() - today.getDay() + 13));
          eventStartDate = startOfNextWeek.toISOString().split('T')[0];
          eventEndDate = endOfNextWeek.toISOString().split('T')[0];
        }
        
        // If no specific date is mentioned, default to upcoming events (next 30 days)
        if (!eventStartDate) {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          eventStartDate = today.toISOString().split('T')[0];
          eventEndDate = thirtyDaysFromNow.toISOString().split('T')[0];
        }
        
        // Check for meeting/event type or title search
        const meetingTypes = ['meeting', 'call', 'standup', 'review', 'planning'];
        for (const type of meetingTypes) {
          if (lowercaseQuery.includes(type)) {
            eventQuery = type;
            break;
          }
        }
        
        const events = await getUserEvents(userId, eventStartDate, eventEndDate, eventQuery);
        
        if (events.length === 0) {
          return "I couldn't find any events matching your criteria.";
        }
        
        // Format events response with markdown
        let response = `## 📅 Events Found (${events.length} events)\n\n`;
        
        events.forEach((event, index) => {
          const startTime = formatTimeForUser(event.start_time);
          const endTime = formatTimeForUser(event.end_time);
          const eventDate = formatDateForUser(event.start_time);
          
          response += `### ${index + 1}. ${event.title}\n`;
          response += `**📅 Date:** ${eventDate}\n`;
          response += `**⏰ Time:** ${startTime} - ${endTime}\n`;
          
          if (event.description) {
            response += `**📝 Description:** ${event.description}\n`;
          }
          
          if (event.project && event.project.name) {
            response += `**📁 Project:** ${event.project.name}\n`;
          }
          
          if (event.google_event_id) {
            response += `**🔗 Source:** Google Calendar\n`;
          }
          
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying events:', error);
        return "I encountered an error while searching for events. Please try again.";
      }
    }
    
    // Check if query is about tasks (fallback for general task queries)
    if (QUERY_KEYWORDS.taskQuery.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      try {
        // Parse search parameters from query
        let status: string | undefined = undefined;
        let dueDate: string | undefined = undefined;
        let taskQuery: string | undefined = undefined;
        let projectNameForTasks: string | undefined = undefined;
        
        // Check for status filters
        if (lowercaseQuery.includes('completed') || lowercaseQuery.includes('done')) {
          status = 'done';
        } else if (lowercaseQuery.includes('pending') || lowercaseQuery.includes('todo') || lowercaseQuery.includes('in progress')) {
          status = 'todo';
        } else if (lowercaseQuery.includes('overdue')) {
          // We'll handle overdue in the service function
          const today = new Date().toISOString().split('T')[0];
          dueDate = `<${today}`;
        }
        
        // Check for due date filters
        if (lowercaseQuery.includes('today')) {
          const today = new Date().toISOString().split('T')[0];
          dueDate = today;
        } else if (lowercaseQuery.includes('tomorrow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueDate = tomorrow.toISOString().split('T')[0];
        } else if (lowercaseQuery.includes('this week')) {
          // Set due date to end of week
          const today = new Date();
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          dueDate = `<=${endOfWeek.toISOString().split('T')[0]}`;
        }
        
        // Extract search terms
        const searchMatch = lowercaseQuery.match(/(?:about|for|titled)\s+(.+?)(?:\s+(?:in|due|overdue)|$)/);
        if (searchMatch) {
          taskQuery = searchMatch[1];
        }
        
        // Check for project mentions
        const projectMatch = lowercaseQuery.match(/(?:in|for|from)\s+(?:project\s+)?(.+?)(?:\s|$)/);
        if (projectMatch) {
          projectNameForTasks = projectMatch[1];
        }
        
        const tasks = await getUserTasks(userId, status, dueDate, taskQuery);
        
        // Filter by project if specified
        let filteredTasks = tasks;
        if (projectNameForTasks && tasks.length > 0) {
          filteredTasks = tasks.filter(task => {
            const project = task.project as unknown as { name: string } | null;
            return project && 
                   project.name && 
                   project.name.toLowerCase().includes(projectNameForTasks.toLowerCase());
          });
        }
        
        if (filteredTasks.length === 0) {
          let noResultsMessage = "I couldn't find any tasks";
          if (status) noResultsMessage += ` with status "${status}"`;
          if (taskQuery) noResultsMessage += ` about "${taskQuery}"`;
          if (projectNameForTasks) noResultsMessage += ` in project "${projectNameForTasks}"`;
          return noResultsMessage + ".";
        }
        
        // Format tasks response with markdown
        let response = `## ✅ Tasks Found (${filteredTasks.length} tasks)\n\n`;
        
        filteredTasks.forEach((task, index) => {
          response += `### ${index + 1}. ${task.title}\n`;
          
          // Status with emoji
          let statusEmoji = '';
          switch (task.status) {
            case 'done': statusEmoji = '✅'; break;
            case 'in-progress': statusEmoji = '🔄'; break;
            case 'todo': statusEmoji = '📋'; break;
            default: statusEmoji = '❓'; break;
          }
          
          response += `**Status:** ${statusEmoji} ${task.status || 'Unknown'}\n`;
          
          if (task.description) {
            response += `**📝 Description:** ${task.description}\n`;
          }
          
          if (task.due_date) {
            const dueDate = formatDateForUser(task.due_date);
            const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';
            response += `**📅 Due Date:** ${dueDate}${isOverdue ? ' ⚠️ OVERDUE' : ''}\n`;
          }
          
          if (task.priority) {
            let priorityEmoji = '';
            switch (task.priority) {
              case 'high': priorityEmoji = '🔴'; break;
              case 'medium': priorityEmoji = '🟡'; break;
              case 'low': priorityEmoji = '🟢'; break;
            }
            response += `**Priority:** ${priorityEmoji} ${task.priority}\n`;
          }
          
          if (task.project && task.project.name) {
            response += `**📁 Project:** ${task.project.name}\n`;
          }
          
          if (task.labels && task.labels.length > 0) {
            response += `**🏷️ Labels:** ${task.labels.join(', ')}\n`;
          }
          
          response += '\n';
        });
        
        return response;
      } catch (error) {
        console.error('Error querying tasks:', error);
        return "I encountered an error while searching for tasks. Please try again.";
      }
    }
    
    return null; // Not a user data query
  } catch (error) {
    console.error("Error handling user data query:", error);
    return null;
  }
}; 