# Reminder System for Tasks and Events

This document explains how the reminder system works in MotionMingle.

## Overview

The reminder system allows users to set notifications for both tasks and events. When a reminder becomes due, the system will show a toast notification to the user.

## Components

1. **Database Schema**
   - `reminder_at`: Timestamp field in both tasks and events tables
   - `reminder_sent`: Boolean field to track if a reminder has been sent

2. **Backend Services**
   - `reminder.service.ts`: Central service that handles checking for and marking reminders
   - Integration with task and event services

3. **Frontend Components**
   - `ReminderDateTimeField.tsx`: Reusable form component for setting reminders
   - `Notification.tsx`: Component for displaying toast notifications
   - Integration with task and event forms

4. **Background Checking**
   - `useReminders.ts`: Hook that periodically checks for pending reminders
   - `ReminderProvider.tsx`: Provider component that initializes the reminder system

## How It Works

1. **Setting Reminders**
   - When creating or editing a task or event, users can set a reminder time
   - The reminder time is stored in the database with the `reminder_sent` flag set to false

2. **Checking for Reminders**
   - The `useReminders` hook runs at regular intervals (default: every minute)
   - It calls the `checkPendingReminders` function to get any due reminders

3. **Showing Notifications**
   - When due reminders are found, they are displayed as toast notifications
   - The reminder is then marked as sent to prevent duplicate notifications

## Implementation Details

1. **Database Indexes**
   - Indexes are created on the `reminder_at` field to optimize reminder queries
   - WHERE clauses filter for non-sent reminders

2. **Reminder Options**
   - Users can set reminders at various intervals (5 minutes before, 1 hour before, etc.)
   - Custom reminder times are also supported

3. **Notification Display**
   - Different icons are used for task vs. event reminders
   - Notifications include the title and description of the task/event

## Technical Flow

1. User sets a reminder when creating/editing a task or event
2. When the application loads, the ReminderProvider initializes reminder checking
3. The useReminders hook periodically calls the backend to check for pending reminders
4. When reminders are found, they are displayed and marked as sent

## Future Improvements

- Push notifications for mobile devices
- Email notifications for important reminders
- More granular reminder options
- Recurring reminders 