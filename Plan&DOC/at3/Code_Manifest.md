# Appendix: Code Manifest

### Guide to Contribution Terms

This section defines the terms used to describe the nature of the contribution to each file, clarifying the level of ownership and design authority involved.

*   **Architected and Implemented:** Signifies a leading role in both the high-level design and the hands-on implementation of a system or major component. This contribution involves making key strategic and technical decisions about the file's structure, its interaction with other parts of the application, and writing the core business logic from scratch.
*   **Designed and Created:** Pertains to the foundational creation of a critical asset. This contribution involves planning the structure, relationships, and rules of a system (like the database schema) and then writing the definition from the ground up.
*   **Authored and Implemented:** The primary contribution for test files. This involves designing the test strategy for a specific feature, authoring the test cases, and implementing the necessary assertions and mocks to validate the application's correctness, security, or accessibility.
*   **Created and Implemented:** Describes the development of frontend features and custom hooks. This contribution involves writing the component's structure (JSX/TSX), styling, and client-side logic from scratch to meet the project's functional and design requirements.
*   **Configured and Integrated:** Refers to the process of incorporating and setting up a standard tool or piece of boilerplate code (like a database client or application entry point). This contribution involves ensuring the tool is correctly configured and seamlessly integrated into the project's ecosystem.
*   **Adapted from Component Library:** Acknowledges the professional practice of using a third-party component library (shadcn/ui) as a foundation for UI elements. This contribution involves selecting the appropriate component, customizing its properties and styles to match the application's design system, and integrating it into the feature set.
*   **Generated and Utilized:** Identifies files that were created by an automated process. This contribution involves running the generation tool and then leveraging the output (e.g., TypeScript types from a database schema) throughout the application to enforce consistency and type safety.

### Full Source Code Manifest

| File Name | File Path | Nature of Contribution | Purpose of File |
|---|---|---|---|
| **Core Application & Config** | | | |
| `App.css` | `src/App.css` | Created and Implemented | Global styles and CSS resets for the application. |
| `App.tsx` | `src/App.tsx` | Architected and Implemented | Main application component, orchestrates routing, providers, and layout. |
| `main.tsx` | `src/main.tsx` | Configured and Integrated | The primary entry point for the React application, renders the root component. |
| `vite-env.d.ts` | `src/vite-env.d.ts` | Configured and Integrated | TypeScript declarations for Vite environment variables. |
| `env.d.ts` | `src/backend/env.d.ts` | Configured and Integrated | TypeScript declarations for backend environment variables. |
| **Backend: AI Services** | | | |
| `chatService.ts` | `src/backend/api/services/ai/chat/chatService.ts` | Architected and Implemented | Orchestrates the entire AI chat workflow from message to command. |
| `conversationLifecycle.ts` | `src/backend/api/services/ai/chat/conversationLifecycle.ts` | Architected and Implemented | Manages the state and history of AI conversations. |
| `index.ts` | `src/backend/api/services/ai/chat/dataQuerying/index.ts` | Configured and Integrated | Barrel file for exporting data querying modules. |
| `queryHandlers.ts` | `src/backend/api/services/ai/chat/dataQuerying/queryHandlers.ts` | Architected and Implemented | Contains the logic for handling specific data queries from the AI. |
| `queryParser.ts` | `src/backend/api/services/ai/chat/dataQuerying/queryParser.ts` | Architected and Implemented | Parses natural language to identify data queries for the AI. |
| `index.ts` | `src/backend/api/services/ai/chat/index.ts` | Configured and Integrated | Barrel file for exporting chat service modules. |
| `messageHandling.ts` | `src/backend/api/services/ai/chat/messageHandling.ts` | Architected and Implemented | Handles the processing and validation of incoming chat messages. |
| `commandService.ts` | `src/backend/api/services/ai/commands/commandService.ts` | Architected and Implemented | Executes application commands based on structured AI output. |
| `index.ts` | `src/backend/api/services/ai/commands/index.ts` | Configured and Integrated | Barrel file for exporting command service modules. |
| `contextService.ts` | `src/backend/api/services/ai/core/contextService.ts` | Architected and Implemented | Dynamically builds the context prompt for the AI based on user data. |
| `dataQueries.ts` | `src/backend/api/services/ai/core/dataQueries.ts` | Architected and Implemented | Defines the structure of data queries the AI can perform. |
| `errorService.ts` | `src/backend/api/services/ai/core/errorService.ts` | Architected and Implemented | Handles errors and provides user-friendly feedback from the AI service. |
| `geminiService.ts` | `src/backend/api/services/ai/core/geminiService.ts` | Architected and Implemented | Provides a secure, reusable interface for the Google Gemini API. |
| `index.ts` | `src/backend/api/services/ai/core/index.ts` | Configured and Integrated | Barrel file for exporting core AI service modules. |
| `projectOperations.ts` | `src/backend/api/services/ai/core/projectOperations.ts` | Architected and Implemented | Defines AI-driven operations related to projects. |
| `userDataService.ts` | `src/backend/api/services/ai/core/userDataService.ts` | Architected and Implemented | Fetches and formats user data to be included in the AI context. |
| `suggestionAnalysis.ts` | `src/backend/api/services/ai/suggestions/suggestionAnalysis.ts` | Architected and Implemented | Analyzes user activity to generate proactive suggestions. |
| `suggestionManagement.ts` | `src/backend/api/services/ai/suggestions/suggestionManagement.ts` | Architected and Implemented | Manages the lifecycle of AI-powered suggestions. |
| `suggestionService.ts` | `src/backend/api/services/ai/suggestions/suggestionService.ts` | Architected and Implemented | Main service for providing proactive AI suggestions. |
| **Backend: Core Services** | | | |
| `auth.service.ts` | `src/backend/api/services/auth.service.ts` | Architected and Implemented | Handles all user authentication logic (signup, login, logout). |
| `calendar.service.ts` | `src/backend/api/services/calendar.service.ts` | Architected and Implemented | Legacy service for calendar events, now integrated into `eventService`. |
| `eventService.ts` | `src/backend/api/services/eventService.ts` | Architected and Implemented | Core business logic for Calendar Event CRUD operations. |
| `eventOperations.ts` | `src/backend/api/services/events/eventOperations.ts` | Architected and Implemented | Contains the specific implementation for event CRUD actions. |
| `eventRecurrence.ts` | `src/backend/api/services/events/eventRecurrence.ts` | Architected and Implemented | Handles logic for recurring calendar events. |
| `file.service.ts` | `src/backend/api/services/file.service.ts` | Architected and Implemented | Handles secure file uploads, validation, and storage policies. |
| `dataExportService.ts` | `src/backend/api/services/gdpr/dataExportService.ts` | Architected and Implemented | Service for exporting user data in a GDPR-compliant format. |
| `gdprService.ts` | `src/backend/api/services/gdpr/gdprService.ts` | Architected and Implemented | Orchestrates GDPR compliance features like data export and deletion. |
| `googleCalendarAuth.ts` | `src/backend/api/services/googleCalendar/googleCalendarAuth.ts` | Architected and Implemented | Manages OAuth 2.0 flow for Google Calendar integration. |
| `googleCalendarService.ts` | `src/backend/api/services/googleCalendar/googleCalendarService.ts` | Architected and Implemented | Main service for managing Google Calendar API interactions. |
| `googleCalendarSync.ts` | `src/backend/api/services/googleCalendar/googleCalendarSync.ts` | Architected and Implemented | Handles the two-way synchronization of events with Google Calendar. |
| `notes.service.ts` | `src/backend/api/services/notes.service.ts` | Architected and Implemented | Core business logic for Note CRUD operations. |
| `project.service.ts` | `src/backend/api/services/project.service.ts` | Architected and Implemented | Core business logic for Project CRUD operations. |
| `recurrence.service.ts` | `src/backend/api/services/recurrence.service.ts` | Architected and Implemented | General service for handling recurrence patterns across the app. |
| `reminder.service.ts` | `src/backend/api/services/reminder.service.ts` | Architected and Implemented | Manages the logic for creating and triggering reminders. |
| `support.service.ts` | `src/backend/api/services/support.service.ts` | Architected and Implemented | Handles logic for user support tickets or inquiries. |
| `task.service.ts` | `src/backend/api/services/task.service.ts` | Architected and Implemented | Core business logic for Task CRUD operations. |
| `taskOperations.ts` | `src/backend/api/services/tasks/taskOperations.ts` | Architected and Implemented | Contains the specific implementation for task CRUD actions. |
| `taskRecurrence.ts` | `src/backend/api/services/tasks/taskRecurrence.ts` | Architected and Implemented | Handles logic for recurring tasks. |
| `timeTrackingService.ts` | `src/backend/api/services/timeTracking/timeTrackingService.ts` | Architected and Implemented | Manages the backend logic for Pomodoro timer sessions. |
| `timerIntegrationService.ts`| `src/backend/api/services/timeTracking/timerIntegrationService.ts`| Architected and Implemented | Integrates timer sessions with tasks and projects. |
| **Backend: Database** | | | |
| `client.ts` | `src/backend/database/client.ts` | Configured and Integrated | Initializes and exports the singleton Supabase client. |
| `schema.ts` | `src/backend/database/schema.ts` | Designed and Created | Defines the entire database schema, tables, columns, and relations. |
| `types.ts` | `src/backend/database/types.ts` | Generated and Utilized | TypeScript types generated from the DB schema for type safety. |
| `utils.ts` | `src/backend/database/utils.ts` | Created and Implemented | Utility functions for database operations. |
| **Frontend: Core Components** | | | |
| `ErrorBoundary.tsx` | `src/frontend/components/ErrorBoundary.tsx` | Created and Implemented | Catches and handles runtime errors in the component tree. |
| `ReminderProvider.tsx` | `src/frontend/components/ReminderProvider.tsx` | Created and Implemented | Provides reminder state and logic to the application. |
| `AppLayout.tsx` | `src/frontend/components/layout/AppLayout.tsx` | Created and Implemented | Defines the main application layout (sidebar, topbar). |
| `Header.tsx` | `src/frontend/components/layout/Header.tsx` | Created and Implemented | The top header bar component. |
| `Sidebar.tsx` | `src/frontend/components/layout/Sidebar.tsx` | Created and Implemented | The main navigation sidebar component. |
| `QueryProvider.tsx` | `src/frontend/components/providers/QueryProvider.tsx` | Configured and Integrated | Sets up React Query for client-side state management. |
| `SupabaseProvider.tsx` | `src/frontend/components/providers/SupabaseProvider.tsx` | Configured and Integrated | Provides the Supabase client to the component tree. |
| `ThemeProvider.tsx` | `src/frontend/components/providers/ThemeProvider.tsx` | Configured and Integrated | Manages the application's light/dark mode theme. |
| **Frontend: UI Components (Adapted)** | | | |
| `button.tsx` | `src/frontend/components/ui/button.tsx` | Adapted from Component Library | Reusable button component. |
| `calendar.tsx` | `src/frontend/components/ui/calendar.tsx` | Adapted from Component Library | Reusable calendar UI component. |
| `card.tsx` | `src/frontend/components/ui/card.tsx` | Adapted from Component Library | Reusable card component for layout. |
| `dialog.tsx` | `src/frontend/components/ui/dialog.tsx` | Adapted from Component Library | Reusable dialog/modal component. |
| `dropdown-menu.tsx` | `src/frontend/components/ui/dropdown-menu.tsx` | Adapted from Component Library | Reusable dropdown menu component. |
| `input.tsx` | `src/frontend/components/ui/input.tsx` | Adapted from Component Library | Reusable input field component. |
| `label.tsx` | `src/frontend/components/ui/label.tsx` | Adapted from Component Library | Reusable label component. |
| `popover.tsx` | `src/frontend/components/ui/popover.tsx` | Adapted from Component Library | Reusable popover component. |
| `progress.tsx` | `src/frontend/components/ui/progress.tsx` | Adapted from Component Library | Reusable progress bar component. |
| `select.tsx` | `src/frontend/components/ui/select.tsx` | Adapted from Component Library | Reusable select/dropdown component. |
| `sonner.tsx` | `src/frontend/components/ui/sonner.tsx` | Adapted from Component Library | Reusable toast notification component. |
| `textarea.tsx` | `src/frontend/components/ui/textarea.tsx` | Adapted from Component Library | Reusable textarea component. |
| **Frontend: Features & Pages** | | | |
| `AuthForm.tsx` | `src/frontend/features/auth/AuthForm.tsx` | Created and Implemented | Provides the UI for user login and registration. |
| `ChatWindow.tsx` | `src/frontend/features/ai/ChatWindow.tsx` | Created and Implemented | The primary UI for interacting with the AI Assistant. |
| `CalendarView.tsx` | `src/frontend/features/calendar/CalendarView.tsx` | Created and Implemented | Displays the user's calendar and events. |
| `Dashboard.tsx` | `src/frontend/features/dashboard/Dashboard.tsx` | Created and Implemented | The main dashboard view, aggregating key information. |
| `ProjectList.tsx` | `src/frontend/features/projects/ProjectList.tsx` | Created and Implemented | Displays the list of user projects. |
| `TaskList.tsx` | `src/frontend/features/tasks/TaskList.tsx` | Created and Implemented | Displays the list of tasks with filters and actions. |
| `ActiveTimeTracker.tsx` | `src/frontend/features/timer/ActiveTimeTracker.tsx` | Created and Implemented | The interactive component for the Pomodoro timer. |
| `LoginPage.tsx` | `src/frontend/pages/LoginPage.tsx` | Created and Implemented | The user login page. |
| `DashboardPage.tsx` | `src/frontend/pages/DashboardPage.tsx` | Created and Implemented | The main dashboard page, entry point after login. |
| `ProjectPage.tsx` | `src/frontend/pages/ProjectPage.tsx` | Created and Implemented | Page for viewing and managing a single project. |
| `CalendarPage.tsx` | `src/frontend/pages/CalendarPage.tsx` | Created and Implemented | Page for viewing and managing the user's calendar. |
| `SettingsPage.tsx` | `src/frontend/pages/SettingsPage.tsx` | Created and Implemented | Page for managing user account settings. |
| **Frontend: Hooks & Routing** | | | |
| `useAuth.ts` | `src/frontend/hooks/useAuth.ts` | Created and Implemented | Custom hook for managing authentication state. |
| `useCalendar.ts` | `src/frontend/hooks/useCalendar.ts` | Created and Implemented | Custom hook for managing calendar data. |
| `useEvents.ts` | `src/frontend/hooks/useEvents.ts` | Created and Implemented | Custom hook for fetching and managing event data. |
| `useGoogleCalendar.ts` | `src/frontend/hooks/useGoogleCalendar.ts` | Created and Implemented | Custom hook for interacting with the Google Calendar sync feature. |
| `useNotes.ts` | `src/frontend/hooks/useNotes.ts` | Created and Implemented | Custom hook for fetching and managing notes data. |
| `usePomodoroTimer.ts` | `src/frontend/hooks/usePomodoroTimer.ts` | Created and Implemented | Custom hook managing all state and logic for the Pomodoro timer. |
| `useProjects.ts` | `src/frontend/hooks/useProjects.ts` | Created and Implemented | Custom hook for fetching and managing project data. |
| `useTasks.ts` | `src/frontend/hooks/useTasks.ts` | Created and Implemented | Custom hook for fetching and managing task data. |
| `useTheme.ts` | `src/frontend/hooks/useTheme.ts` | Created and Implemented | Custom hook for managing application theme state. |
| `AppRouter.tsx` | `src/frontend/routing/AppRouter.tsx` | Architected and Implemented | Defines all application routes and handles protected routing. |
| **Frontend: Utilities** | | | |
| `api.ts` | `src/frontend/utils/api.ts` | Created and Implemented | Type-safe wrapper for making API calls to the backend. |
| `cn.ts` | `src/frontend/utils/cn.ts` | Configured and Integrated | Utility for conditionally joining CSS class names. |
| `date.ts` | `src/frontend/utils/date.ts` | Created and Implemented | Utility functions for date formatting and manipulation. |
| `helpers.ts` | `src/frontend/utils/helpers.ts` | Created and Implemented | General helper functions for the frontend. |
| **Testing: Configuration & Setup** | | | |
| `README.md` | `src/tests/README.md` | Authored and Implemented | Documentation for running the test suite. |
| `playwright.config.ts` | `src/tests/config/playwright.config.ts` | Configured and Integrated | Configuration file for Playwright E2E tests. |
| `test-setup.ts` | `src/tests/config/test-setup.ts` | Configured and Integrated | Global setup file for tests, e.g., for seeding data. |
| `vitest.config.ts` | `src/tests/config/vitest.config.ts` | Configured and Integrated | Configuration file for Vitest unit and integration tests. |
| `test-helpers.ts` | `src/tests/e2e/utils/test-helpers.ts` | Authored and Implemented | Helper functions specifically for E2E tests. |
| `integration-helpers.ts` | `src/tests/integration/fixtures/integration-helpers.ts` | Authored and Implemented | Helper functions specifically for integration tests. |
| `setup.ts` | `src/tests/integration/setup.ts` | Configured and Integrated | Setup file for integration tests, including database mocking. |
| `supabase-mock.ts` | `src/tests/mocks/supabase-mock.ts` | Authored and Implemented | Mock implementation of the Supabase client for testing. |
| `test-helpers.ts` | `src/tests/utils/test-helpers.ts` | Authored and Implemented | General utility functions shared across different test types. |
| **Testing: E2E Workflows** | | | |
| `ai-workflow.spec.ts` | `src/tests/e2e/workflows/ai-workflow.spec.ts` | Authored and Implemented | Validates the full end-to-end flow of creating a task via AI. |
| `complete-user-journey.spec.ts`| `src/tests/e2e/workflows/complete-user-journey.spec.ts`| Authored and Implemented | Simulates a full user session from login to task completion. |
| `debug-login.spec.ts` | `src/tests/e2e/workflows/debug-login.spec.ts` | Authored and Implemented | A utility test for debugging the login flow in isolation. |
| `google-calendar-sync.spec.ts`| `src/tests/e2e/workflows/google-calendar-sync.spec.ts`| Authored and Implemented | Tests the user flow for connecting and syncing Google Calendar. |
| `simple-smoke-test.spec.ts` | `src/tests/e2e/workflows/simple-smoke-test.spec.ts` | Authored and Implemented | A basic smoke test to ensure the application loads correctly. |
| **Testing: Integration** | | | |
| `ai-workflow-integration.test.ts`| `src/tests/integration/ai-workflow-integration.test.ts`| Authored and Implemented | Tests integration between the AI service, command service, and DB. |
| `auth-data-integration.test.ts`| `src/tests/integration/auth-data-integration.test.ts`| Authored and Implemented | Verifies that authentication logic correctly interacts with the DB. |
| `calendar-task-integration.test.ts`| `src/tests/integration/calendar-task-integration.test.ts`| Authored and Implemented | Ensures calendar events created from tasks are correctly linked. |
| `file-project-integration.test.ts`| `src/tests/integration/file-project-integration.test.ts`| Authored and Implemented | Verifies that uploaded files are correctly associated with projects. |
| `notification-system-integration.test.ts`| `src/tests/integration/notification-system-integration.test.ts`| Authored and Implemented | Tests the integration of the notification system with user actions. |
| `task-project-integration.test.ts`| `src/tests/integration/task-project-integration.test.ts`| Authored and Implemented | Verifies that tasks are correctly associated with projects. |
| **Testing: Unit** | | | |
| `ai.service.test.ts` | `src/tests/unit/services/ai.service.test.ts` | Authored and Implemented | Unit tests the AI service, mocking external API calls. |
| `auth.service.test.ts` | `src/tests/unit/services/auth.service.test.ts` | Authored and Implemented | Unit tests the authentication service's business logic. |
| `calendar.service.test.ts` | `src/tests/unit/services/calendar.service.test.ts` | Authored and Implemented | Unit tests the calendar service's business logic. |
| `file.service.test.ts` | `src/tests/unit/services/file.service.test.ts` | Authored and Implemented | Unit tests the file service's business logic. |
| `notes.service.test.ts` | `src/tests/unit/services/notes.service.test.ts` | Authored and Implemented | Unit tests the notes service's business logic. |
| `project.service.test.ts` | `src/tests/unit/services/project.service.test.ts` | Authored and Implemented | Unit tests the project service's business logic. |
| `task.service.test.ts` | `src/tests/unit/services/task.service.test.ts` | Authored and Implemented | Unit tests the task service's business logic. |
| `timeTracking.service.test.ts`| `src/tests/unit/services/timeTracking.service.test.ts`| Authored and Implemented | Unit tests the timer service's state logic. |
| **Testing: Security** | | | |
| `auth-bypass.test.ts` | `src/tests/security/auth-bypass.test.ts` | Authored and Implemented | Probes for authorization vulnerabilities (RLS). |
| `file-upload.test.ts` | `src/tests/security/file-upload.test.ts` | Authored and Implemented | Attempts to upload malicious or oversized files. |
| `injection.test.ts` | `src/tests/security/injection.test.ts` | Authored and Implemented | Attempts to perform SQL injection and other injection attacks. |
| `xss-protection.test.ts` | `src/tests/security/xss-protection.test.ts` | Authored and Implemented | Attempts to inject malicious scripts to verify input sanitization. |
| **Testing: Accessibility** | | | |
| `keyboard-navigation.test.ts`| `src/tests/accessibility/keyboard-navigation.test.ts`| Authored and Implemented | Tests that all elements are keyboard operable. |
| `screen-reader.test.ts` | `src/tests/accessibility/screen-reader.test.ts` | Authored and Implemented | Verifies that UI elements have correct ARIA attributes. |
| `wcag-compliance.test.ts` | `src/tests/accessibility/wcag-compliance.test.ts` | Authored and Implemented | Audits key pages against WCAG 2.1 AA standards using Axe-core. |
