# Project Progress & TODOs

This file tracks the status of all major features in your project, including what's done, what's left, and suggestions for improvement. Use ✅ for completed and ❌ for pending/incomplete items.

**Last Updated: May  10, 2025**

---

## 🗂️ Features Overview

### 1. Tasks
- [✅] Task board UI (columns, drag & drop)
- [✅] Task CRUD operations (frontend/backend)
- [✅] Task service (backend)
- [✅] Task filtering/search (by status, priority, date, text)
- [✅] Task archiving (move to archive, auto-archive after 30 days)
- [✅] Archived tasks view (show, restore, delete permanently)
- [✅] Task restore from archive
- [✅] Task permanent delete from archive
- [✅] Task due date (date picker in dialog)
- [✅] Task labels/tags (add/remove in dialog)
- [✅] Task file attachments (upload, list, delete)
- [✅] Error boundary for task board
- [✅] Error handling for all task actions
- [✅] Table/schema updates: created_at, archived, last_updated_at, labels, due_date, activity log
- [✅] Task notifications/reminders
- [❌] Bulk actions (multi-select, delete/restore/archive in archive view)
- [❌] Task activity log/history (UI)
- [❌] Unit/integration tests

### 2. Calendar
- [✅] Calendar page & UI
- [✅] Event CRUD (frontend/backend)
- [✅] Event service (backend)
- [✅] Calendar sync (Google)
- [❌] Recurring events
- [✅] Event notifications
- [❌] Error handling for invalid dates
- [❌] Tests for event logic

### 3. Notes
- [✅] Notes feature folder with components
- [✅] Dedicated Notes page in /pages
- [✅] Notes CRUD (including sidebar copy/delete actions)
- [❌] Rich text editing
- [✅] Notes search/filter
- [❌] Error handling for save/load
- [❌] Tests

### 4. Files
- [✅] File feature folder with components
- [✅] File upload/download
- [✅] File preview (inline)
- [✅] File sharing/permissions
- [✅] Error handling for upload/download
- [✅] File size and upload date (uploadedAt) visible in all views (list, grid, preview)
- [✅] Modern, proportional, and visually appealing file UI
- [✅] Sorting and filtering by size, date, type, and project
- [✅] All must-have file requirements from MoSCoW complete
- [❌] Tests

**Note:** The file page is now fully complete and polished. All must-have file features are implemented. No further file features are required unless specified by new requirements.

### 5. Timer
- [✅] Timer page & controls
- [❌] Timer analytics/history
- [❌] Pomodoro mode
- [❌] Error handling for timer state
- [❌] Tests

### 6. Projects
- [✅] Projects page with proper layout containers
- [✅] Project details view with consistent layout
- [✅] Project progress tracking:
  - [✅] Auto-updating progress based on task completion
  - [✅] Toggle between auto/manual progress modes
  - [✅] Manual progress slider with save functionality
- [✅] Project view modes:
  - [✅] Dashboard view with collapsible sections
  - [✅] Tabbed view for different content types
  - [✅] Toggle between views with state persistence
- [✅] Project-item associations:
  - [✅] Linking notes, tasks, events, and files to projects
  - [✅] Unlinking functionality for all item types
  - [✅] Automatic linking of items created in project context
- [✅] Project UI improvements:
  - [✅] Unified form fields component for create/edit
  - [✅] Consistent modal implementations
  - [✅] Proper layout containers matching other pages
  - [✅] Removed duplicate upload buttons
  - [✅] Improved event filtering (hide/show past events)
  - [✅] Enhanced title/description layout
  - [✅] Removed unnecessary share button
  - [✅] Consistent tab styling across project views
  - [✅] Simplified sidebar with only upcoming events
  - [✅] Consistent card styles across content types
  - [✅] Standardized task dialog implementation across app
- [✅] Global ↔ Project synchronization:
  - [✅] Changes reflect in both global and project views
  - [✅] Task status changes propagate correctly
  - [✅] Notes, files and events appear in all relevant views
- [✅] Error handling for project actions
- [❌] Tests

### 7. Auth
- [✅] Auth feature scaffolded
- [✅] Login/signup pages
- [✅] Password reset
- [⏳] Route protection (most have we will do later after all musts are done)
- [✅] User profile/settings page
- [✅] Error handling for auth (settings page)
- [❌] Tests

### 8. Reminders
- [✅] Reminders for tasks and events
- [✅] Multiple timing options (at event time, 5 min before, 15 min before, etc.)
- [✅] User-configurable reminder settings
- [✅] Visual notification system 
- [✅] Theme-aware notifications (light/dark mode support)
- [✅] Deduplication of notification alerts
- [✅] Database schema with reminder_at and reminder_sent fields
- [✅] Background checking for pending reminders

---

## 🛠️ General Improvements
- [✅] Navigation bar (all main features linked)
- [❌] Dashboard/landing page
- [✅] Notifications system (in-app)
- [❌] Global search
- [✅] Dark mode
- [❌] Accessibility (ARIA, color contrast)
- [❌] Mobile responsiveness
- [❌] API documentation (OpenAPI/Swagger)
- [❌] Unit/integration tests (all features)

---

## ⚠️ Error Handling
- [✅] Basic error handling in services
- [✅] User-friendly error messages in UI (settings page)
- [✅] Error boundaries in React
- [✅] Logging for backend errors

---

## 🧪 Testing
- [❌] Unit tests for backend services
- [❌] Unit tests for frontend components
- [❌] Integration tests (end-to-end)

---

## ✅ Must-Have Functional Requirements (Done)
[✅] FR-1: Create Account  
[✅] FR-2: Log In and Log Out  
[✅] FR-3: Reset Password  
[✅] FR-4: Update Profile  
[✅] FR-5: Delete Account  
[✅] FR-7: Upload & Attach Files  
[✅] FR-8: Preview Files  
[✅] FR-9: Remove Files  
[✅] FR-10: Secure Storage  
[✅] FR-11: Display Tasks  
[✅] FR-12: Display Events  
[✅] FR-13: Edit Tasks/Events  
[✅] FR-14: Delete Tasks/Events  
[✅] FR-15: Link Google Calendar  
[✅] FR-18: Set Task Priority  
[✅] FR-19: Sort by Priority  
[✅] FR-22: Task Timers  
[✅] FR-24: Create Projects  
[✅] FR-25: Assign to Projects (Project details view)  
[✅] FR-27: Display Project Contents  

## ❌ Must-Have Requirements Left to Do
[❌] FR-6: AI Chat Feature 🔴 (High Effort/Dependencies)  
[❌] FR-17: Real-Time Sync 🔴 (High Effort)  
[❌] FR-28: AI Suggest Tasks/Events 🔴 (Depends on FR-6)  
[❌] NFR-4: GDPR Compliance 🟠 (Medium Effort)  

## 🟡 Should-Have Functional Requirements
[❌] FR-16: Auto-Generate Events 🟠 (Medium Effort)  
[✅] FR-20: Task Reminders  (Completed)  
[✅] FR-21: Event Reminders (Completed)  
[❌] FR-23: Log Time Spent 🟢 (Low Effort)  
[✅] FR-31: Track Task Completion  
[❌] FR-29: Accept/Reject Suggestions 🔴 (Depends on FR-6)  
[❌] FR-30: Natural Language Creation 🔴 (Depends on FR-6)  

## 🟡 Should-Have Non-Functional Requirements
[❌] NFR-1: Real-Time Sync 🔴 (High Effort)  
[❌] NFR-5: Fast Load 🟠 (Medium Effort)  
[❌] NFR-6: Help & Support 🟢 (Low Effort/High Impact)  
[❌] NFR-7: Cross-Platform 🟠 (Medium Effort)  
[❌] NFR-9: Testability 🟠 (Medium Effort)  
[❌] NFR-13: Accessibility 🟢 (Low Effort)  

## 🔵 Could-Have Functional Requirements
[❌] FR-32: Recurring Tasks 🟢 (Low Effort)  

## 🔵 Could-Have Non-Functional Requirements
[❌] NFR-10: Multi-Language 🟠 (Medium Effort)  
[✅]] NFR-12: Performance Monitoring 🟠 (Medium Effort)  

---

