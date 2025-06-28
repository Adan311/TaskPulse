# Diagrams and Visuals Manifest

This document is a manifest of all diagrams and figures for the taskpulse Project Review Report. Use this to understand what each figure represents and where to reference it in the report. When writing, refer to these figures by their number, for example: "(see Figure 1)".

---

## **Figure 1: C4 System Context Diagram**

* **File Name:** `c4_system_context_diagram.png`
* **Target Report Section:** Technical Solution, Section 2.1.1 - High-Level Architecture
* **Description for AI:** This diagram shows the high-level ecosystem view of the MotionMingle productivity platform.
    * The central system is the **MotionMingle** application - described as a comprehensive productivity platform with AI-powered assistance, task management, calendar integration, and time tracking.
    * A **User** (representing students, professionals, and individuals managing productivity) interacts with MotionMingle via a web browser interface.
    * MotionMingle integrates with three critical external systems:
        1. **Google Gemini API** - Provides AI service for intelligent suggestions, chat assistance, and data analysis through HTTPS/REST communication.
        2. **Google Calendar API** - Enables calendar service for event synchronization and management via OAuth2/HTTPS.
        3. **Supabase** - Serves as Backend-as-a-Service providing authentication, database, storage, and real-time features through HTTPS/WebSocket.
* **AI Writing Instructions:** When describing the system's external dependencies and high-level context, refer to this as "Figure 1". Emphasize how MotionMingle acts as the central hub integrating multiple external services to deliver a comprehensive productivity solution.

---

## **Figure 2: C4 Container Diagram**

* **File Name:** `c4_container_diagram.png`
* **Target Report Section:** Technical Solution, Section 2.1.2 - Container Architecture
* **Description for AI:** This diagram provides an internal view of the MotionMingle system showing its main containers and the Supabase platform components.
    * The **Web Application** container is a React/TypeScript/Vite single-page application providing the productivity management interface.
    * The **Backend Services** container represents the TypeScript service layer handling business logic, data validation, and API orchestration.
    * The **Supabase Platform** is detailed as multiple specialized containers:
        1. **PostgreSQL Database** - Stores users, projects, tasks, events, notes, files metadata, and AI conversations.
        2. **GoTrue Auth** - Handles user authentication and authorization.
        3. **File Storage** - Object storage for user-uploaded files and documents.
        4. **Edge Functions** - Serverless functions for secure operations and API integrations.
        5. **Realtime Engine** - WebSocket service for real-time updates and notifications.
* **AI Writing Instructions:** Refer to this as "Figure 2" when explaining the separation of concerns between frontend, backend services, and the comprehensive Supabase backend platform. Highlight the clean architecture with distinct responsibilities.

---

## **Figure 3: C4 Component Diagram**

* **File Name:** `c4_component_diagram.png`
* **Target Report Section:** Technical Solution, Section 2.1.3 - Component-Level Design
* **Description for AI:** This diagram shows the internal structure of the MotionMingle Web Application container, detailing key React components and their relationships.
    * **Core Application Components:**
        - `App.tsx` - Main application entry point with routing
        - `AppLayout.tsx` - Layout wrapper with sidebar navigation
    * **Authentication Components:**
        - `useAuthCheck.tsx` - Authentication state management hook
        - `SignIn/SignUp.tsx` - User authentication interfaces
    * **Feature Components:**
        - `DashboardLayout.tsx` - Main dashboard container
        - `TaskBoard.tsx` - Kanban-style task management
        - `CalendarView.tsx` - Calendar interface with multiple views
        - `ChatWindow.tsx` - AI chat interface
        - `ActiveTimeTracker.tsx` - Pomodoro timer and time tracking
        - `Projects.tsx` - Project management interface
    * **Service Layer:**
        - Business logic services (`task.service.ts`, `event.service.ts`, `chatService.ts`, etc.)
    * **State Management:**
        - React Context (`TimerContext.tsx`, `user-context.tsx`) and custom hooks
* **AI Writing Instructions:** Reference this as "Figure 3" when discussing the modular, component-based frontend architecture. Emphasize the clean separation between UI components, business logic services, and state management layers.

---

## **Figure 4: Data Schema Diagram (ERD)**

* **File Name:** `data_schema_erd.png`
* **Target Report Section:** Technical Solution, Section 2.4.1 - Database Design
* **Description for AI:** This comprehensive Entity-Relationship Diagram shows the complete database schema for MotionMingle with all tables and relationships.
    * **Core Entities:**
        - `users` - Central user management (Supabase auth integration)
        - `projects` - Project containers with progress tracking and time estimation
        - `tasks` - Task management with recurrence, hierarchical structure, and time tracking
        - `events` - Calendar events with Google Calendar integration and recurrence support
        - `notes` - Project-associated note-taking with pinning capability
    * **File Management:**
        - `files` - Legacy file attachments to tasks/events/projects
        - `project_files` - Modern project-specific file storage system
    * **AI Integration:**
        - `ai_conversations` - Chat conversation management
        - `ai_messages` - Individual messages with metadata for command processing
        - `task_suggestions` & `event_suggestions` - AI-generated recommendations
        - `suggestion_feedback` - User feedback loop for AI improvement
    * **Supporting Systems:**
        - `time_logs` - Comprehensive time tracking across all activities
        - `google_calendar_tokens` - OAuth token storage for calendar sync
        - `user_settings` - AI preferences and feature configurations
        - `user_consent` - GDPR compliance tracking
        - `support_contacts` - User support ticket system
* **AI Writing Instructions:** Refer to this as "Figure 4" when explaining the database design. Highlight the user-centric approach where all data is owned by users, the support for complex features like recurrence and time tracking, and the comprehensive AI integration with feedback loops.

---

## **Usage Guidelines for Report Writing**

When incorporating these diagrams into the Project Review Report:

1. **Always reference by figure number** - e.g., "As shown in Figure 1..." or "(see Figure 2)"
2. **Use the Target Report Section** to place diagrams in appropriate sections
3. **Follow the AI Writing Instructions** for consistent terminology and focus
4. **Maintain technical accuracy** by referencing the actual component and service names shown
5. **Emphasize architectural decisions** such as the separation of concerns, modular design, and integration patterns

---

## **Figure 5: AI-Driven Task Creation User Flow**

* **File Name:** `ai_task_creation_flow.png`
* **Target Report Section:** Technical Solution, Section 2.3.1 - AI Integration & Testing/Verification/Validation, Section 4.2 - E2E Testing
* **Description for AI:** This comprehensive user flow diagram illustrates the complete process of AI-powered task creation, MotionMingle's most innovative feature.
    * **User Interaction Flow:**
        - User opens dashboard and accesses AI chat window
        - User types natural language command (e.g., "Create a task to finish the final report by tomorrow with high priority")
        - Frontend validates and processes the input through `chatService.ts`
    * **AI Processing Pipeline:**
        - Backend sends structured prompt to Google Gemini API via `geminiService.ts`
        - AI analyzes the request and returns structured JSON with task parameters
        - System parses the response through `commandService.ts`
    * **Task Creation & Feedback:**
        - Backend calls `task.service.ts` to create the task in Supabase database
        - Real-time updates sent to frontend via WebSocket
        - TaskBoard component automatically displays the new task
        - User receives confirmation and sees immediate visual feedback
    * **Error Handling Paths:**
        - AI parsing failures with user-friendly error messages
        - Database errors with appropriate user notifications
        - Alternative success paths including project assignment suggestions
* **AI Writing Instructions:** Reference this as "Figure 5" when describing the AI integration workflow and E2E testing scenarios. Emphasize the seamless natural language processing, real-time updates, and comprehensive error handling that makes this feature robust and user-friendly.

---

## **Figure 6: Google Calendar Integration User Flow**

* **File Name:** `google_calendar_sync_flow.png`
* **Target Report Section:** Technical Solution, Section 2.3.2 - External Integrations & Testing/Verification/Validation, Section 4.3 - Integration Testing
* **Description for AI:** This detailed user flow demonstrates the complete Google Calendar OAuth integration and synchronization process.
    * **OAuth Authentication Flow:**
        - User initiates connection from Calendar page
        - System redirects to Google OAuth consent screen via `googleCalendarAuth.ts`
        - User grants permissions and returns with authorization code
        - Backend exchanges code for access/refresh tokens through `googleCalendarService.ts`
    * **Token Management:**
        - Secure token storage in `google_calendar_tokens` table
        - Automatic token refresh handling for expired access tokens
        - Error handling for invalid or expired authorization sessions
    * **Calendar Synchronization:**
        - User-initiated sync process through `googleCalendarSync.ts`
        - Backend fetches events from Google Calendar API
        - Event data processing and mapping to MotionMingle format
        - Database insertion with `google_event_id` for future sync tracking
    * **Real-time Integration:**
        - WebSocket updates to frontend calendar component
        - Immediate visual integration of Google events in MotionMingle calendar
        - Comprehensive error scenarios including API failures and partial sync handling
* **AI Writing Instructions:** Reference this as "Figure 6" when discussing external API integration, OAuth security implementation, and integration testing scenarios. Highlight the robust token management, error handling, and seamless user experience that demonstrates professional-level external service integration.

---

## **Figure 7: Project Gantt Chart**

* **File Name:** `gantt_chart.png`
* **Target Report Section:** Evolution, Planning & Monitoring
* **Description for AI:** This is the complete Gantt chart for the TaskPulse project, created at the start of development. It outlines the 8 key sprints, their planned start and end dates, and the major deliverables within each sprint, such as "AI Integration" and "Testing". The chart also visualizes buffer periods allocated for handling unexpected issues.
* **AI Writing Instructions:** Refer to this as "Figure 5" when discussing the initial project plan. Use it as the baseline against which the actual project progress is evaluated. For example, "My initial plan, as detailed in the Gantt Chart (Figure 5), allocated three weeks for AI integration..."


These diagrams collectively demonstrate the comprehensive architecture of Taskpulse from high-level system context down to detailed user workflows, showcasing a well-structured productivity platform with modern development practices, innovative AI integration, and robust external service connectivity. 