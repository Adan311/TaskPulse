# Appendix: Code Manifest

This appendix provides a comprehensive table of all source code and documentation files I created or contributed to for the MotionMingle project.  
For each file, I indicate the file name, its path within the project, the nature of my contribution, and its purpose within the software product.

**Contribution Terms:**
- **Created and Implemented**: I wrote this file from scratch, including its logic, structure, and integration.
- **Modified**: I made significant changes or improvements to an existing file.
- **Adapted from Library/Tutorial**: I started from a third-party or tutorial source and customized it for this project.
- **Configured and Integrated**: I set up, configured, or integrated this file as part of the project’s infrastructure or tooling.
- **Generated**: This file was created by an automated tool or process.

---

| File Name | File Path | Nature of Contribution | Purpose of File |
|---|---|---|---|
| **Root & Project Files** ||||
| App.tsx | src/App.tsx | Created and Implemented | Initializes the React app, sets up global providers (theme, auth, reminders), and defines the main routing structure for all pages. |
| index.css | src/index.css | Created and Implemented | Contains global CSS and Tailwind styles, ensuring consistent theming and responsive design across the application. |
| main.tsx | src/main.tsx | Created and Implemented | Entry point that renders the App component and bootstraps the frontend application. |
| vite-env.d.ts | src/vite-env.d.ts | Created and Implemented | Declares Vite-specific TypeScript environment variables for type safety in the project. |
| README.md | README.md | Created and Implemented | Comprehensive project overview, setup instructions, and developer documentation for MotionMingle. |
| package.json | package.json | Configured and Integrated | Defines project dependencies, scripts, and metadata for building, testing, and running the application. |
| vite.config.ts | vite.config.ts | Configured and Integrated | Configures Vite for fast development builds, hot module replacement, and optimized production output. |
| tailwind.config.ts | tailwind.config.ts | Configured and Integrated | Customizes Tailwind CSS settings, theme extensions, and utility classes for the project’s design system. |
| postcss.config.js | postcss.config.js | Configured and Integrated | Sets up PostCSS plugins for processing and optimizing CSS, including Tailwind and autoprefixer. |
| eslint.config.js | eslint.config.js | Configured and Integrated | Specifies linting rules and plugins to enforce code quality and style consistency. |
| tsconfig.json | tsconfig.json | Configured and Integrated | TypeScript configuration for compiler options, path aliases, and project structure. |
| tsconfig.app.json | tsconfig.app.json | Configured and Integrated | TypeScript configuration specifically for the application source code compilation. |
| tsconfig.node.json | tsconfig.node.json | Configured and Integrated | TypeScript configuration for Node.js-specific code like Vite configuration files. |
| vitest.config.ts | vitest.config.ts | Configured and Integrated | Sets up Vitest for fast, reliable unit and integration testing with custom options. |
| vitest.integration.config.ts | vitest.integration.config.ts | Configured and Integrated | Vitest configuration specifically for integration tests with database and service interactions. |
| components.json | components.json | Configured and Integrated | Configuration file for shadcn/ui component library setup and customization. |
| index.html | index.html | Created and Implemented | Loads the React app, injects root-level metadata, and provides the mounting point for the frontend. |
|  |  |  |  |
| **Plan & Documentation** ||||
| AI_IMPLEMENTATION_CHECKLIST.md | Plan&DOC/AI_IMPLEMENTATION_CHECKLIST.md | Created and Implemented | Step-by-step checklist outlining the design, development, and integration of AI features in the project. |
| PROJECT_PROGRESS.md | Plan&DOC/PROJECT_PROGRESS.md | Created and Implemented | Tracks project milestones, deliverables, and progress with detailed status updates and timelines. |
| TESTING_SUMMARY.md | Plan&DOC/TESTING_SUMMARY.md | Created and Implemented | Summarizes the project's testing strategy, coverage, methodologies, and key results. |
|  |  |  |  | 
| **Backend** ||||
| env.d.ts | src/backend/env.d.ts | Created and Implemented | TypeScript declarations for backend environment variables. |
| types.ts | src/backend/database/types.ts | Created and Implemented | Shared database type definitions for backend logic. |
| schema.ts | src/backend/database/schema.ts | Created and Implemented | Database schema definitions for Supabase/Postgres. |
| utils.ts | src/backend/database/utils.ts | Created and Implemented | Utility functions for backend database operations. |
| client.ts | src/backend/database/client.ts | Adapted from Supabase documentation | Supabase client setup for database operations. |
| task.service.ts | src/backend/api/services/task.service.ts | Created and Implemented | Implements backend logic for task management, including creation, updating, deletion, recurrence, and integration with the database. Ensures data validation and consistency for all task operations. |
| event.service.ts | src/backend/api/services/event.service.ts | Created and Implemented | Handles all backend logic for calendar event management, including CRUD operations, recurrence, and Google Calendar integration. |
| notes.service.ts | src/backend/api/services/notes.service.ts | Created and Implemented | Manages backend logic for note creation, editing, deletion, and linking notes to projects. |
| recurrence.service.ts | src/backend/api/services/recurrence.service.ts | Created and Implemented | Provides shared logic for handling recurrence patterns in tasks and events, supporting scheduling and automation. |
| auth.service.ts | src/backend/api/services/auth.service.ts | Created and Implemented | Manages user authentication, including signup, login, logout, and session management, with secure integration to the database. |
| project.service.ts | src/backend/api/services/project.service.ts | Created and Implemented | Implements backend logic for project CRUD operations, progress tracking, and association with tasks, files, and notes. |
| support.service.ts | src/backend/api/services/support.service.ts | Created and Implemented | Handles user support tickets, inquiries, and related backend workflows. |
| reminder.service.ts | src/backend/api/services/reminder.service.ts | Created and Implemented | Manages creation, scheduling, and triggering of reminders for tasks and events. |
| file.service.ts | src/backend/api/services/file.service.ts | Created and Implemented | Handles secure file uploads, validation, storage, and association with projects, tasks, and notes. |
| timeTrackingService.ts | src/backend/api/services/timeTracking/timeTrackingService.ts | Created and Implemented | Implements backend logic for Pomodoro timer sessions, time tracking, and analytics for productivity features. |
| timerIntegrationService.ts | src/backend/api/services/timeTracking/timerIntegrationService.ts | Created and Implemented | Integrates timer sessions with tasks and projects. |
| googleCalendarAuth.ts | src/backend/api/services/googleCalendar/googleCalendarAuth.ts | Created and Implemented | Manages OAuth 2.0 flow for Google Calendar integration. |
| googleCalendarService.ts | src/backend/api/services/googleCalendar/googleCalendarService.ts | Created and Implemented | Integrates with Google Calendar API to sync events, manage OAuth, and handle two-way event synchronization. |
| googleCalendarSync.ts | src/backend/api/services/googleCalendar/googleCalendarSync.ts | Created and Implemented | Handles two-way synchronization of events with Google Calendar. |
| dataExportService.ts | src/backend/api/services/gdpr/dataExportService.ts | Created and Implemented | Service for exporting user data in a GDPR-compliant format. |
| gdprService.ts | src/backend/api/services/gdpr/gdprService.ts | Created and Implemented | Orchestrates GDPR compliance features like data export and deletion. |
| projectOperations.ts | src/backend/api/services/ai/core/projectOperations.ts | Created and Implemented | Defines AI-driven backend operations for project analysis, progress calculation, and intelligent suggestions. |
| dataQueries.ts | src/backend/api/services/ai/core/dataQueries.ts | Created and Implemented | Defines the structure of data queries the AI can perform. |
| errorService.ts | src/backend/api/services/ai/core/errorService.ts | Created and Implemented | Handles errors and provides user-friendly feedback from the AI service. |
| geminiService.ts | src/backend/api/services/ai/core/geminiService.ts | Adapted from Gemini API documentation | Service for interacting with Google's Gemini AI API. |
| contextService.ts | src/backend/api/services/ai/core/contextService.ts | Created and Implemented | Dynamically builds the context prompt for the AI based on user data. |
| userDataService.ts | src/backend/api/services/ai/core/userDataService.ts | Created and Implemented | Fetches and formats user data to be included in the AI context. |
| commandService.ts | src/backend/api/services/ai/commands/commandService.ts | Created and Implemented | Executes structured AI commands, translating natural language into backend actions for tasks, events, and projects. |
| suggestionService.ts | src/backend/api/services/ai/suggestions/suggestionService.ts | Created and Implemented | Generates and manages proactive AI suggestions based on user activity and project data. |
| conversationLifecycle.ts | src/backend/api/services/ai/chat/conversationLifecycle.ts | Created and Implemented | Manages the state, history, and flow of AI chat conversations, including context and session handling. |
| messageHandling.ts | src/backend/api/services/ai/chat/messageHandling.ts | Created and Implemented | Processes and validates incoming chat messages, routing them to the appropriate AI or backend service. |
| chatService.ts | src/backend/api/services/ai/chat/chatService.ts | Created and Implemented | Orchestrates the entire AI chat workflow from message to command. |
| queryHandlers.ts | src/backend/api/services/ai/chat/dataQuerying/queryHandlers.ts | Created and Implemented | Contains the logic for handling specific data queries from the AI. |
| queryParser.ts | src/backend/api/services/ai/chat/dataQuerying/queryParser.ts | Created and Implemented | Parses natural language to identify data queries for the AI. |
|  |  |  |  | 
| **Frontend** ||||
| Home.tsx | src/frontend/pages/Home.tsx | Created and Implemented | Landing page that welcomes users and provides quick access to main features and navigation. |
| ProjectDetail.tsx | src/frontend/pages/ProjectDetail.tsx | Created and Implemented | Displays detailed information, tasks, files, and progress for a selected project. |
| LandingPage.tsx | src/frontend/pages/LandingPage.tsx | Created and Implemented | Public-facing marketing page introducing the app and its core value proposition. |
| Tasks.tsx | src/frontend/pages/Tasks.tsx | Created and Implemented | Main board for managing, viewing, and interacting with all user tasks. |
| Timer.tsx | src/frontend/pages/Timer.tsx | Created and Implemented | Dedicated Pomodoro timer page for focused work sessions and productivity tracking. |
| Calendar.tsx | src/frontend/pages/Calendar.tsx | Created and Implemented | Main calendar page integrating event, project, and reminder features. |
| Files.tsx | src/frontend/pages/Files.tsx | Created and Implemented | Centralized page for uploading, viewing, and managing user files. |
| Suggestions.tsx | src/frontend/pages/Suggestions.tsx | Created and Implemented | Displays AI-generated suggestions to help users optimize productivity and workflow. |
| Notes.tsx | src/frontend/pages/Notes.tsx | Created and Implemented | Page for creating, editing, and organizing notes, with project linking support. |
| NotFound.tsx | src/frontend/pages/NotFound.tsx | Created and Implemented | 404 error page shown for invalid or non-existent routes. |
| Chat.tsx | src/frontend/pages/Chat.tsx | Created and Implemented | Stand-alone page for interacting with the AI assistant in a chat interface. |
| Projects.tsx | src/frontend/pages/Projects.tsx | Created and Implemented | Overview page listing all user projects with quick access to details. |
| Settings.tsx | src/frontend/pages/Settings.tsx | Created and Implemented | User settings page for managing account, preferences, and integrations. |
| ErrorBoundary.tsx | src/frontend/components/ErrorBoundary.tsx | Created and Implemented | Catches and displays errors in the React component tree, improving app stability. |
| ReminderProvider.tsx | src/frontend/components/ReminderProvider.tsx | Created and Implemented | Provides global context and logic for managing reminders throughout the app. |
| AppLayout.tsx | src/frontend/components/layout/AppLayout.tsx | Created and Implemented | Defines the main application layout, including sidebar, topbar, and content area. |
| app-sidebar.tsx | src/frontend/components/layout/app-sidebar.tsx | Created and Implemented | Implements the main navigation sidebar with links to all major app sections. |
| CookieConsentBanner.tsx | src/frontend/components/legal/CookieConsentBanner.tsx | Created and Implemented | GDPR cookie consent banner. |
| mode-toggle.tsx | src/frontend/components/theme/mode-toggle.tsx | Created and Implemented | Light/dark mode toggle button. |
| theme-provider.tsx | src/frontend/components/theme/theme-provider.tsx | Created and Implemented | Provides theme context and Tailwind classes. |
| GlobalTimerStatusBadge.tsx | src/frontend/components/timer/GlobalTimerStatusBadge.tsx | Created and Implemented | Displays the current status of the global timer, visible across the app. |
| calendar.tsx | src/frontend/components/ui/calendar.tsx | Adapted from react-day-picker | Reusable calendar UI component. |
| Notification.tsx | src/frontend/components/ui/Notification.tsx | Created and Implemented | In-app notifications renderer. |
| sonner.tsx | src/frontend/components/ui/sonner.tsx | Adapted from shadcn/ui | Animated toast stack (Sonner). |
| dropdown-menu.tsx | src/frontend/components/ui/dropdown-menu.tsx | Adapted from shadcn/ui | Reusable dropdown menu component. |
| label.tsx | src/frontend/components/ui/label.tsx | Adapted from shadcn/ui | Reusable label component. |
| tooltip.tsx | src/frontend/components/ui/tooltip.tsx | Adapted from shadcn/ui | Tooltip wrapper component. |
| alert.tsx | src/frontend/components/ui/alert.tsx | Adapted from shadcn/ui | Alert banner component. |
| avatar.tsx | src/frontend/components/ui/avatar.tsx | Adapted from shadcn/ui | User/avatar display. |
| card.tsx | src/frontend/components/ui/card.tsx | Adapted from shadcn/ui | Container card component adapted from shadcn/ui with project-specific styling. |
| form.tsx | src/frontend/components/ui/form.tsx | Adapted from shadcn/ui | Form provider and field components for consistent form handling. |
| input.tsx | src/frontend/components/ui/input.tsx | Adapted from shadcn/ui | Input field component adapted from shadcn/ui. |
| popover.tsx | src/frontend/components/ui/popover.tsx | Adapted from shadcn/ui | Popover/tooltip wrapper. |
| scroll-area.tsx | src/frontend/components/ui/scroll-area.tsx | Adapted from shadcn/ui | Scrollable area with custom bars. |
| table.tsx | src/frontend/components/ui/table.tsx | Adapted from shadcn/ui | Accessible table wrapper. |
| textarea.tsx | src/frontend/components/ui/textarea.tsx | Adapted from shadcn/ui | Multi-line text input. |
| toast.tsx | src/frontend/components/ui/toast.tsx | Adapted from shadcn/ui | Individual toast component. |
| badge.tsx | src/frontend/components/ui/badge.tsx | Adapted from shadcn/ui | Status/label badge. |
| button.tsx | src/frontend/components/ui/button.tsx | Adapted from shadcn/ui | Base button component adapted from shadcn/ui component library. |
| skeleton.tsx | src/frontend/components/ui/skeleton.tsx | Adapted from shadcn/ui | Skeleton placeholder loader. |
| select.tsx | src/frontend/components/ui/select.tsx | Adapted from shadcn/ui | Select (listbox) control. |
| checkbox.tsx | src/frontend/components/ui/checkbox.tsx | Adapted from shadcn/ui | Checkbox input. |
| collapsible.tsx | src/frontend/components/ui/collapsible.tsx | Adapted from shadcn/ui | Disclosure/collapse component. |
| user-context.tsx | src/frontend/components/ui/user-context.tsx | Created and Implemented | Context for user object in UI library. |
| separator.tsx | src/frontend/components/ui/separator.tsx | Adapted from shadcn/ui | Horizontal/vertical separator. |
| sidebar.tsx | src/frontend/components/ui/sidebar/sidebar.tsx | Adapted from shadcn/ui | Advanced sidebar component with collapsible sections and navigation state management. |
| dialog.tsx | src/frontend/components/ui/dialog.tsx | Adapted from shadcn/ui | Modal dialog component adapted from shadcn/ui built on Radix UI primitives. |
| loading.tsx | src/frontend/components/ui/loading.tsx | Created and Implemented | Spinner/loading indicator. |
| command.tsx | src/frontend/components/ui/command.tsx | Adapted from shadcn/ui | Command palette component. |
| radio-group.tsx | src/frontend/components/ui/radio-group.tsx | Adapted from shadcn/ui | Accessible radio group. |
| switch.tsx | src/frontend/components/ui/switch.tsx | Adapted from shadcn/ui | Toggle switch input. |
| accordion.tsx | src/frontend/components/ui/accordion.tsx | Adapted from shadcn/ui | Accordion disclosure component. |
| progress.tsx | src/frontend/components/ui/progress.tsx | Adapted from shadcn/ui | Progress bar component. |
| sheet.tsx | src/frontend/components/ui/sheet.tsx | Adapted from shadcn/ui | Sliding panel (bottom drawer). |
| toaster.tsx | src/frontend/components/ui/toaster.tsx | Adapted from shadcn/ui | Toast provider for app-wide messages. |
| slider.tsx | src/frontend/components/ui/slider.tsx | Adapted from shadcn/ui | Accessible range slider. |
| alert-dialog.tsx | src/frontend/components/ui/alert-dialog.tsx | Adapted from shadcn/ui | Generic alert dialog component. |
| tabs.tsx | src/frontend/components/ui/tabs.tsx | Adapted from shadcn/ui | Tabbed navigation component. |
|  |  |  |  | 
| AIChatPanel.tsx | src/frontend/features/dashboard/AIChatPanel.tsx | Created and Implemented | Embeds the AI chat interface directly within the dashboard for quick access. |
| DashboardHeader.tsx | src/frontend/features/dashboard/DashboardHeader.tsx | Created and Implemented | Header bar for the dashboard, showing date, actions, and navigation. |
| QuickInfoPanel.tsx | src/frontend/features/dashboard/QuickInfoPanel.tsx | Created and Implemented | Panel displaying upcoming deadlines and important project info. |
| DashboardLayout.tsx | src/frontend/features/dashboard/DashboardLayout.tsx | Created and Implemented | Grid layout component that organizes dashboard widgets and panels. |
| MainContentArea.tsx | src/frontend/features/dashboard/MainContentArea.tsx | Created and Implemented | Layout wrapper for the main content area of the dashboard. |
| QuickStatsWidget.tsx | src/frontend/features/dashboard/widgets/QuickStatsWidget.tsx | Created and Implemented | Displays key project and user statistics in a compact dashboard widget. |
| TimeTrackerWidget.tsx | src/frontend/features/dashboard/widgets/TimeTrackerWidget.tsx | Created and Implemented | Shows active timers and time tracking stats across tasks and projects. |
| OverviewDashboard.tsx | src/frontend/features/dashboard/views/OverviewDashboard.tsx | Created and Implemented | Combines multiple dashboard panels into a single overview page for user productivity. |
| useDashboardData.tsx | src/frontend/features/dashboard/hooks/useDashboardData.tsx | Created and Implemented | Aggregates and provides dashboard data to widgets and panels. |
| useDashboardLayout.tsx | src/frontend/features/dashboard/hooks/useDashboardLayout.tsx | Created and Implemented | Manages responsive layout and arrangement of dashboard components. |
| ChatWindow.tsx | src/frontend/features/ai/components/ChatWindow.tsx | Created and Implemented | Main UI container for AI chat, handling conversation flow and user input. |
| SuggestionList.tsx | src/frontend/features/ai/components/SuggestionList.tsx | Created and Implemented | Renders a list of AI-generated suggestions for user actions. |
| SuggestionItem.tsx | src/frontend/features/ai/components/SuggestionItem.tsx | Created and Implemented | Displays an individual suggestion chip with action details. |
| MarkdownRenderer.tsx | src/frontend/features/ai/components/MarkdownRenderer.tsx | Created and Implemented | Safely renders markdown content from AI responses in the chat UI. |
| SuggestionBadge.tsx | src/frontend/features/ai/components/SuggestionBadge.tsx | Created and Implemented | Shows a badge with the count of new or unread AI suggestions. |
| EventForm.tsx | src/frontend/features/calendar/components/EventForm.tsx | Created and Implemented | Form UI for creating and updating calendar events with validation. |
| EventItem.tsx | src/frontend/features/calendar/components/EventItem.tsx | Created and Implemented | Displays a single calendar event in the calendar or list view. |
| TimelineView.tsx | src/frontend/features/calendar/components/TimelineView.tsx | Created and Implemented | Visualizes events on a horizontal timeline for easy navigation. |
| CalendarSidebar.tsx | src/frontend/features/calendar/components/CalendarSidebar.tsx | Created and Implemented | Sidebar with mini-month picker, filters, and quick event access. |
| ListView.tsx | src/frontend/features/calendar/components/ListView.tsx | Created and Implemented | Agenda-style list of upcoming events for mobile and desktop. |
| EventDialog.tsx | src/frontend/features/calendar/components/EventDialog.tsx | Created and Implemented | Dialog wrapper for creating or editing events in the calendar. |
| EventList.tsx | src/frontend/features/calendar/components/EventList.tsx | Created and Implemented | Renders a list of events for a selected date or range. |
| EventTimeTracker.tsx | src/frontend/features/calendar/components/EventTimeTracker.tsx | Created and Implemented | Tracks and displays time spent within a calendar event. |
| SyncGoogleCalendarButton.tsx | src/frontend/features/calendar/components/SyncGoogleCalendarButton.tsx | Created and Implemented | Button to manually trigger a full two-way sync with Google Calendar. |
| WeekView.tsx | src/frontend/features/calendar/components/WeekView.tsx | Created and Implemented | Displays a week grid view of calendar events. |
| CalendarHeader.tsx | src/frontend/features/calendar/components/CalendarHeader.tsx | Created and Implemented | Navigation and week selector for the calendar view. |
| DayView.tsx | src/frontend/features/calendar/components/DayView.tsx | Created and Implemented | One-day grid view for detailed event scheduling. |
| MonthView.tsx | src/frontend/features/calendar/components/MonthView.tsx | Created and Implemented | Month grid view for high-level event planning. |
| DisconnectGoogleCalendarButton.tsx | src/frontend/features/calendar/components/DisconnectGoogleCalendarButton.tsx | Created and Implemented | Button to revoke Google Calendar linkage and remove tokens. |
| GoogleCalendarButton.tsx | src/frontend/features/calendar/components/GoogleCalendarButton.tsx | Adapted from Google Calendar API documentation | Initiates OAuth flow for Google Calendar integration. |
| DatePickerField.tsx | src/frontend/features/calendar/components/FormFields/DatePickerField.tsx | Adapted from react-day-picker | Date picker form field for selecting event dates. |
| TimePickerField.tsx | src/frontend/features/calendar/components/FormFields/TimePickerField.tsx | Created and Implemented | Time picker field for selecting event times. |
| ReminderDateTimeField.tsx | src/frontend/features/calendar/components/FormFields/ReminderDateTimeField.tsx | Created and Implemented | Field for specifying reminder date and time for events or tasks. |
| ProjectSelectField.tsx | src/frontend/features/calendar/components/FormFields/ProjectSelectField.tsx | Created and Implemented | Dropdown to link an event to a specific project. |
| RecurrenceField.tsx | src/frontend/features/calendar/components/FormFields/RecurrenceField.tsx | Created and Implemented | Field for specifying recurrence rules for events. |
| ColorPickerField.tsx | src/frontend/features/calendar/components/FormFields/ColorPickerField.tsx | Adapted from shadcn/ui | Color selection field for event labels. |
| EventFormSchema.ts | src/frontend/features/calendar/EventFormSchema.ts | Created and Implemented | Zod schema for validating calendar event form data. |
| ProjectEvents.tsx | src/frontend/features/project/components/ProjectEvents.tsx | Created and Implemented | Displays all calendar events linked to a project. |
| ProjectDetail.tsx | src/frontend/features/project/components/ProjectDetail.tsx | Created and Implemented | Shows a comprehensive view of a single project, including tasks, files, and progress. |
| ProjectTasks.tsx | src/frontend/features/project/components/ProjectTasks.tsx | Created and Implemented | Lists and manages all tasks linked to a project. |
| ProjectFiles.tsx | src/frontend/features/project/components/ProjectFiles.tsx | Created and Implemented | Displays and manages files associated with a specific project. |
| ViewModeToggle.tsx | src/frontend/features/project/components/ViewModeToggle.tsx | Created and Implemented | Toggle switch for changing between board and list views. |
| ProjectNotes.tsx | src/frontend/features/project/components/ProjectNotes.tsx | Created and Implemented | Shows and manages notes linked to a project. |
| ProjectFormFields.tsx | src/frontend/features/project/components/ProjectFormFields.tsx | Created and Implemented | Reusable form fields for project creation and editing. |
| ProjectCard.tsx | src/frontend/features/project/components/ProjectCard.tsx | Created and Implemented | Card component for displaying project summary in lists or grids. |
| Projects.tsx | src/frontend/features/project/components/Projects.tsx | Created and Implemented | Lists all user projects with filtering and quick actions. |
| ProjectTabbedView.tsx | src/frontend/features/project/components/ProjectTabbedView.tsx | Created and Implemented | Provides tab navigation within a project detail page. |
| CreateProjectModal.tsx | src/frontend/features/project/components/CreateProjectModal.tsx | Created and Implemented | Modal dialog for creating a new project. |
| EditProjectModal.tsx | src/frontend/features/project/components/EditProjectModal.tsx | Created and Implemented | Modal dialog for editing project metadata and settings. |
| ProjectProgressControl.tsx | src/frontend/features/project/components/ProjectProgressControl.tsx | Created and Implemented | Slider control for adjusting project completion percentage. |
| ProjectOverview.tsx | src/frontend/features/project/components/ProjectOverview.tsx | Created and Implemented | Comprehensive overview component displaying project key information and metrics. |
| ProjectDashboardView.tsx | src/frontend/features/project/components/ProjectDashboardView.tsx | Created and Implemented | Dashboard view combining project tasks, files, and performance metrics. |
| ProjectTimeTracker.tsx | src/frontend/features/project/components/ProjectTimeTracker.tsx | Created and Implemented | Time tracking component for monitoring work hours across project tasks. |
| useProjectProgress.ts | src/frontend/features/project/hooks/useProjectProgress.ts | Created and Implemented | Calculates and provides project completion percentage and progress updates. |
| useViewMode.ts | src/frontend/features/project/hooks/useViewMode.ts | Created and Implemented | Persists and manages the user's preferred project view mode. |
| useProjects.ts | src/frontend/features/project/hooks/useProjects.ts | Created and Implemented | Custom React hook for fetching and mutating project data. |
| FileList.tsx | src/frontend/features/files/components/FileList.tsx | Created and Implemented | Lists uploaded files with actions for preview, download, and delete. |
| FilePreview.tsx | src/frontend/features/files/components/FilePreview.tsx | Created and Implemented | Displays a preview of the selected file, including metadata. |
| FileUploadSection.tsx | src/frontend/features/files/components/FileUploadSection.tsx | Created and Implemented | Section wrapper combining file upload and file list components. |
| EntityFileSelector.tsx | src/frontend/features/files/components/EntityFileSelector.tsx | Created and Implemented | Allows selection of files by related entity (task, note, project). |
| FileUpload.tsx | src/frontend/features/files/components/FileUpload.tsx | Created and Implemented | Handles drag-and-drop file uploads and validation. |
| useFiles.ts | src/frontend/features/files/hooks/useFiles.ts | Created and Implemented | Custom React hook for file CRUD operations and presigned URLs. |
| AiSettings.tsx | src/frontend/features/settings/components/AiSettings.tsx | Created and Implemented | UI for configuring AI assistant preferences and settings. |
| HelpSupport.tsx | src/frontend/features/settings/components/HelpSupport.tsx | Created and Implemented | Provides links to FAQs and a form for submitting support tickets. |
| PasswordSettings.tsx | src/frontend/features/settings/components/PasswordSettings.tsx | Created and Implemented | UI for changing user password and triggering email reset flow. |
| DataExport.tsx | src/frontend/features/settings/components/DataExport.tsx | Created and Implemented | Triggers GDPR-compliant data export for user accounts. |
| DeleteAccount.tsx | src/frontend/features/settings/components/DeleteAccount.tsx | Created and Implemented | UI and logic for irreversible account deletion. |
| ProfileSettings.tsx | src/frontend/features/settings/components/ProfileSettings.tsx | Created and Implemented | UI for editing user profile information and preferences. |
| NotesSection.tsx | src/frontend/features/notes/components/NotesSection.tsx | Created and Implemented | Main section rendering a list of notes with actions. |
| NoteViewer.tsx | src/frontend/features/notes/components/NoteViewer.tsx | Created and Implemented | Markdown viewer and editor for a single note. |
| ProjectSelectionModal.tsx | src/frontend/features/notes/components/ProjectSelectionModal.tsx | Created and Implemented | Modal dialog for selecting a project when creating a note. |
| NewNoteInput.tsx | src/frontend/features/notes/components/NewNoteInput.tsx | Created and Implemented | Quick input field for creating a new note. |
| NotesSidebar.tsx | src/frontend/features/notes/components/NotesSidebar.tsx | Created and Implemented | Sidebar listing notebooks, tags, and pinned notes. |
| ProjectSelect.tsx | src/frontend/features/notes/components/ProjectSelect.tsx | Created and Implemented | Dropdown for linking a note to a project. |
| useNotes.ts | src/frontend/features/notes/hooks/useNotes.ts | Created and Implemented | Custom React hook for managing notes list state and actions. |
| TaskBoard.tsx | src/frontend/features/tasks/components/TaskBoard.tsx | Adapted from react-beautiful-dnd | Main Kanban board interface with drag-and-drop functionality for task management. |
| TaskCard.tsx | src/frontend/features/tasks/components/TaskCard.tsx | Created and Implemented | Individual task card component displaying task details, actions, and time tracking. |
| TaskColumn.tsx | src/frontend/features/tasks/components/TaskColumn.tsx | Adapted from react-beautiful-dnd | Kanban column component that holds tasks and handles drop zones for task organization. |
| TaskColumnsContainer.tsx | src/frontend/features/tasks/components/TaskColumnsContainer.tsx | Adapted from react-beautiful-dnd | Container component that manages the drag-and-drop context for all task columns. |
| TaskDialog.tsx | src/frontend/features/tasks/components/TaskDialog.tsx | Created and Implemented | Modal dialog for creating and editing tasks with advanced features like recurrence and reminders. |
| TaskFilterBar.tsx | src/frontend/features/tasks/components/TaskFilterBar.tsx | Created and Implemented | Provides filtering and search capabilities for the task board. |
| TaskList.tsx | src/frontend/features/tasks/components/TaskList.tsx | Adapted from react-beautiful-dnd | Renders a list of draggable task cards within a column with animation support. |
| TaskTimeTracker.tsx | src/frontend/features/tasks/components/TaskTimeTracker.tsx | Created and Implemented | Tracks and displays time spent on individual tasks with start/stop functionality. |
| TaskBoardHeader.tsx | src/frontend/features/tasks/components/TaskBoardHeader.tsx | Created and Implemented | Header controls for the Kanban task board, including selection mode and add task functionality. |
| TaskBoardLoader.tsx | src/frontend/features/tasks/components/TaskBoardLoader.tsx | Created and Implemented | Skeleton loader displayed while board data is loading. |
| useTaskBoard.ts | src/frontend/features/tasks/hooks/useTaskBoard.ts | Created and Implemented | Custom React hook providing board data, mutations, and drag-and-drop logic. |
| TimerContextSelector.tsx | src/frontend/features/timer/components/TimerContextSelector.tsx | Created and Implemented | Optimizes timer context selection and re-renders for performance. |
| TimerSettings.tsx | src/frontend/features/timer/components/TimerSettings.tsx | Created and Implemented | UI for configuring Pomodoro timer lengths, goals, and preferences. |
| ActiveTimeTracker.tsx | src/frontend/features/timer/components/ActiveTimeTracker.tsx | Created and Implemented | Tracks and displays the user's current focus session in real time. |
| CircularProgress.tsx | src/frontend/features/timer/components/CircularProgress.tsx | Created and Implemented | Circular progress indicator used by the timer and stats dashboard. |
| TimeStatsDashboard.tsx | src/frontend/features/timer/components/TimeStatsDashboard.tsx | Created and Implemented | Dashboard summarizing user focus and productivity statistics. |
| performance.ts | src/frontend/utils/performance.ts | Created and Implemented | Provides helper functions for measuring and analyzing render performance. |
| accessibility.ts | src/frontend/utils/accessibility.ts | Created and Implemented | Common ARIA helpers and focus traps for improving accessibility. |
| auth.ts | src/frontend/utils/auth.ts | Created and Implemented | Client-side authentication helpers and role checks. |
| useAuthCheck.tsx | src/frontend/hooks/useAuthCheck.tsx | Created and Implemented | Ensures user authentication state before rendering protected pages. |
| use-toast.ts | src/frontend/hooks/use-toast.ts | Created and Implemented | Custom React hook for triggering toast notifications. |
| usePomodoroTimer.ts | src/frontend/hooks/usePomodoroTimer.ts | Adapted from Pomodoro Timer Tutorial (freeCodeCamp, GitHub) | Core timer state and logic for Pomodoro sessions. |
| useReminders.ts | src/frontend/hooks/useReminders.ts | Created and Implemented | Manages reminder notifications and scheduling logic. |
| use-mobile.tsx | src/frontend/hooks/use-mobile.tsx | Created and Implemented | Detects mobile breakpoints and device type for responsive UI. |
| useTimeTracking.ts | src/frontend/hooks/useTimeTracking.ts | Created and Implemented | Aggregates and provides tracked time data for the user. |
| utils.ts | src/frontend/lib/utils.ts | Created and Implemented | Miscellaneous utility helpers for the frontend. |
| TimerContext.tsx | src/frontend/context/TimerContext.tsx | Created and Implemented | Provides React context for Pomodoro timer state and actions. |
| calendar.ts | src/frontend/types/calendar.ts | Created and Implemented | Shared TypeScript interfaces and types for calendar data. |
| TermsOfService.tsx | src/frontend/pages/legal/TermsOfService.tsx | Created and Implemented | Displays the application's terms of service, outlining user rights and responsibilities. |
| PrivacyPolicy.tsx | src/frontend/pages/legal/PrivacyPolicy.tsx | Created and Implemented | Presents the privacy policy, explaining how user data is collected, stored, and used. |
| SignIn.tsx | src/frontend/pages/auth/SignIn.tsx | Created and Implemented | Provides the user login form and handles authentication logic. |
| SignUp.tsx | src/frontend/pages/auth/SignUp.tsx | Created and Implemented | Registration form for new users, including validation and account creation logic. |
| authUtils.ts | src/shared/utils/authUtils.ts | Created and Implemented | Provides reusable authentication helpers for validating users and managing sessions across backend and frontend. |
| fileUtils.ts | src/shared/utils/fileUtils.ts | Created and Implemented | Utility functions for formatting file sizes and handling file-related logic in the app. |
| test-users.json | src/tests/integration/fixtures/test-users.json | Created and Implemented | Contains sample user data for integration and E2E test scenarios. |
| sample-tasks.json | src/tests/integration/fixtures/sample-tasks.json | Created and Implemented | Provides sample tasks for testing task-related features and workflows. |
| test-data.ts | src/tests/e2e/fixtures/test-data.ts | Created and Implemented | Defines reusable test data objects for E2E test cases and workflows. |
| browser-recovery.ts | src/tests/e2e/utils/browser-recovery.ts | Created and Implemented | Handles browser crash recovery and session restoration during E2E tests. |
| test-helpers.ts | src/tests/e2e/utils/test-helpers.ts | Created and Implemented | Provides utility functions and helpers for E2E test assertions and workflows. |
| test-helpers.ts | src/tests/utils/test-helpers.ts | Created and Implemented | Shared utility helpers for all test types, improving test maintainability. |
| test-setup.ts | src/tests/config/test-setup.ts | Created and Implemented | Global setup file for initializing test environments and seeding data. |
| junit.xml | src/tests/config/test-results/junit.xml | Generated | Stores JUnit-formatted test results for CI/CD and reporting. |
| results.json | src/tests/config/test-results/results.json | Generated | Aggregated JSON test results for analysis and reporting. |
| index.html | src/tests/config/test-results/html-report/index.html | Generated | HTML report summarizing test coverage and results for the project. |
| supabase-mock.ts | src/tests/mocks/supabase-mock.ts | Created and Implemented | Provides a mock Supabase client for isolated backend and integration testing. |
| ai-workflow-integration.test.ts | src/tests/integration/ai-workflow-integration.test.ts | Created and Implemented | Tests the integration between the AI service, command service, and database, ensuring end-to-end AI workflow correctness. |
| auth-data-integration.test.ts | src/tests/integration/auth-data-integration.test.ts | Created and Implemented | Verifies that authentication logic correctly interacts with the database and user data flows. |
| calendar-task-integration.test.ts | src/tests/integration/calendar-task-integration.test.ts | Created and Implemented | Ensures that calendar events created from tasks are correctly linked and synchronized. |
| task-project-integration.test.ts | src/tests/integration/task-project-integration.test.ts | Created and Implemented | Verifies that tasks are correctly associated with projects and updates propagate as expected. |
| notification-system-integration.test.ts | src/tests/integration/notification-system-integration.test.ts | Created and Implemented | Tests the integration of the notification system with user actions and backend triggers. |
| file-project-integration.test.ts | src/tests/integration/file-project-integration.test.ts | Created and Implemented | Verifies that uploaded files are correctly associated with projects and accessible in the UI. |
| integration-helpers.ts | src/tests/integration/fixtures/integration-helpers.ts | Created and Implemented | Shared helper functions for integration test fixtures and setup. |
| xss-protection.test.ts | src/tests/security/xss-protection.test.ts | Created and Implemented | Probes for XSS vulnerabilities by attempting to inject scripts and verifying input sanitization. |
| auth-bypass.test.ts | src/tests/security/auth-bypass.test.ts | Created and Implemented | Tests for authorization bypass scenarios, ensuring RLS and access controls are enforced. |
| injection.test.ts | src/tests/security/injection.test.ts | Created and Implemented | Attempts SQL and command injection attacks to validate backend input sanitization. |
| file-upload.test.ts | src/tests/security/file-upload.test.ts | Created and Implemented | Attempts to upload malicious or oversized files to test file validation and security. |
| wcag-compliance.test.ts | src/tests/accessibility/wcag-compliance.test.ts | Created and Implemented | Audits key pages against WCAG 2.1 AA standards using automated tools. |
| keyboard-navigation.test.ts | src/tests/accessibility/keyboard-navigation.test.ts | Created and Implemented | Tests that all interactive elements are accessible via keyboard navigation. |
| screen-reader.test.ts | src/tests/accessibility/screen-reader.test.ts | Created and Implemented | Verifies that UI elements have correct ARIA attributes for screen readers. |
| ai.service.test.ts | src/tests/unit/services/ai.service.test.ts | Created and Implemented | Unit tests for the AI service, mocking external API calls and validating logic. |
| calendar.service.test.ts | src/tests/unit/services/calendar.service.test.ts | Created and Implemented | Unit tests for the calendar service's business logic and edge cases. |
| task.service.test.ts | src/tests/unit/services/task.service.test.ts | Created and Implemented | Unit tests for the task service, covering CRUD and recurrence logic. |
| project.service.test.ts | src/tests/unit/services/project.service.test.ts | Created and Implemented | Unit tests for the project service, ensuring correct project management logic. |
| timeTracking.service.test.ts | src/tests/unit/services/timeTracking.service.test.ts | Created and Implemented | Unit tests for the timer and time tracking service's state and analytics logic. |
| auth.service.test.ts | src/tests/unit/services/auth.service.test.ts | Created and Implemented | Unit tests for the authentication service's business logic and security. |
| file.service.test.ts | src/tests/unit/services/file.service.test.ts | Created and Implemented | Unit tests for the file service, testing upload, validation, and storage. |
| notes.service.test.ts | src/tests/unit/services/notes.service.test.ts | Created and Implemented | Unit tests for the notes service, covering CRUD and project linking. |
|  |  |  |  | 
| playwright.config.ts | src/tests/config/playwright.config.ts | Configured and Integrated | Playwright configuration for end-to-end browser testing. |
| ai-workflow.spec.ts | src/tests/e2e/workflows/ai-workflow.spec.ts | Adapted from Playwright documentation | Automated E2E test for AI workflow using Playwright. |
| complete-user-journey.spec.ts | src/tests/e2e/workflows/complete-user-journey.spec.ts | Adapted from Playwright documentation | Automated E2E test for full user journey using Playwright. |
| debug-login.spec.ts | src/tests/e2e/workflows/debug-login.spec.ts | Adapted from Playwright documentation | Automated E2E test for login debugging using Playwright. |
| google-calendar-sync.spec.ts | src/tests/e2e/workflows/google-calendar-sync.spec.ts | Adapted from Playwright documentation | Automated E2E test for Google Calendar sync using Playwright. |
| simple-smoke-test.spec.ts | src/tests/e2e/workflows/simple-smoke-test.spec.ts | Adapted from Playwright documentation | Basic smoke test for application using Playwright. |

---

## Referencing

- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Radix UI Primitives:** https://www.radix-ui.com/primitives
- **shadcn/ui documentation:** https://ui.shadcn.com/docs
- **react-day-picker documentation:** https://react-day-picker.js.org/
- **react-beautiful-dnd (Kanban):** https://github.com/atlassian/react-beautiful-dnd
- **Supabase documentation:** https://supabase.com/docs
- **Google Calendar API documentation:** https://developers.google.com/calendar
- **Gemini API documentation:** https://ai.google.dev/gemini-api/docs
- **Pomodoro Timer Tutorial (freeCodeCamp, GitHub):** https://github.com/willjw3/pomodoro-clock-freecodecamp-front-end-libraries-project
- **Playwright documentation:** https://playwright.dev/docs/intro
