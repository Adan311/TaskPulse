# Recurring Tasks Feature

MotionMingle supports recurring tasks to help you manage repeating work items effectively. This document describes how the recurring task feature works and how to use it.

## Overview

Recurring tasks allow you to create tasks that repeat at regular intervals (daily, weekly, monthly, or yearly). The system will automatically handle the creation of future task instances or refresh existing tasks.

## Recurrence Patterns

MotionMingle supports these recurrence patterns:

- **Daily**: The task repeats every day
- **Weekly**: The task repeats on specific days of the week
- **Monthly**: The task repeats on the same day of each month
- **Yearly**: The task repeats on the same date each year

## Recurrence Modes

There are two ways recurring tasks can be managed:

1. **Clone Mode**: New task instances are created for each occurrence. This is useful when you want to track the history of each task separately.
2. **Refresh Mode**: The same task is updated for each occurrence. This is useful when you want a single task to be reset once completed.

## Setting Up a Recurring Task

1. When creating or editing a task, click on the **Recurrence** accordion section
2. Check the "Make this task recurring" checkbox
3. Select a recurrence pattern (daily, weekly, monthly, yearly)
4. If you select "Weekly", you can specify which days of the week the task should repeat
5. Choose when the recurrence should end:
   - Never (continues indefinitely)
   - On a specific date
   - After a specific number of occurrences
6. Select a recurrence mode:
   - Create new tasks (Clone mode)
   - Refresh this task (Refresh mode)
7. Save the task

## How It Works

### Clone Mode

- When a recurring task is created with "Clone" mode, the system automatically generates instances for the next 30 days
- Each instance is a separate task linked to the parent recurring task
- When the parent task is updated, certain fields (title, description, priority, project, labels) are propagated to all instances
- Fields specific to each instance (status, due date) remain independent

### Refresh Mode

- When a recurring task is created with "Refresh" mode, only one task exists in the system
- When the due date passes, the task is automatically reset to "To Do" status, and the due date is updated to the next occurrence
- Any reminders are also reset

## Technical Implementation

The recurring task functionality is implemented in:
- `src/backend/api/services/task.service.ts`: Backend service functions for handling recurring tasks
- `src/frontend/features/tasks/components/TaskDialog.tsx`: UI components for creating and editing recurring tasks

Key functions:
- `createRecurringTask`: Creates a new recurring task
- `getNextOccurrenceDate`: Calculates the next occurrence based on the recurrence pattern
- `generateFutureRecurringTaskInstances`: Creates instances for a recurring task (Clone mode)
- `refreshRecurringTaskStatus`: Updates a task for its next occurrence (Refresh mode)
- `processAllRecurringTasks`: Background process that checks and updates all recurring tasks
- `updateRecurringTaskInstances`: Updates instances when the parent task is modified

## Best Practices

- Use "Clone" mode when each instance of the task needs to be tracked separately
- Use "Refresh" mode for simple to-do items that just need to be reset
- Set due dates for recurring tasks, as they are required for the recurrence to function properly
- For weekly recurring tasks, select at least one day of the week

## Limitations

- Recurring tasks require a due date to work properly
- In "Clone" mode, instances are only generated for the next 30 days by default
- Tasks with sub-tasks do not automatically create sub-tasks in recurring instances 