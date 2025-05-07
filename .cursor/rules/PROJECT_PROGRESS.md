# Project Progress & TODOs

This file tracks the status of all major features in your project, including what's done, what's left, and suggestions for improvement. Use ✅ for completed and ❌ for pending/incomplete items.

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
- [❌] Task notifications/reminders
- [❌] Bulk actions (multi-select, delete/restore/archive in archive view)
- [❌] Task activity log/history (UI)
- [❌] Unit/integration tests

### 2. Calendar
- [✅] Calendar page & UI
- [✅] Event CRUD (frontend/backend)
- [✅] Event service (backend)
- [✅] Calendar sync (Google)
- [❌] Recurring events
- [❌] Event notifications
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
- [✅] Projects page
- [❌] Project details view
- [❌] Project progress tracking
- [❌] Error handling for project actions
- [❌] Tests

### 7. Auth
- [✅] Auth feature scaffolded
- [✅] Login/signup pages
- [✅] Password reset
- [⏳] Route protection (most have we will do later after all musts are done)
- [✅] User profile/settings page
- [✅] Error handling for auth (settings page)
- [❌] Tests

---

## 🛠️ General Improvements
- [✅] Navigation bar (all main features linked)
- [❌] Dashboard/landing page
- [❌] Notifications system (in-app/email)
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

## Table/Schema Updates
- [✅] Added created_at, archived, last_updated_at, labels, due_date columns to tasks table
- [✅] Added task_activity_log table
- [✅] Added indexes for filtering/sorting

---

_Last updated: 2025-05-01_


