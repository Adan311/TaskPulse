# Recurring Tasks and Events Documentation

This document explains the recurring tasks and events functionality in MotionMingle, including database schema, services, UI components, and user interactions.

## Overview

MotionMingle supports recurring tasks and events to help users create repeating items without manual recreation. This feature includes:

- Four recurrence patterns: daily, weekly, monthly, and yearly
- Multiple recurrence end conditions: never, on a specific date, after a number of occurrences
- Weekly recurrence with day-of-week selection
- Visual indicators for recurring items in the UI
- Two modes for tasks: "refresh" (reset existing task) or "clone" (create new instances)
- Propagation of changes from parent events/tasks to all future instances

## Database Schema

### Tasks Table

The `tasks` table includes these recurrence-related fields:

- `is_recurring` (boolean): Identifies a recurring task
- `recurrence_pattern` (enum: 'daily', 'weekly', 'monthly', 'yearly'): How often the task repeats
- `recurrence_days` (string[]): For weekly recurrence, specifies which days (e.g., ["Monday", "Wednesday", "Friday"])
- `recurrence_end_date` (date): Optional end date for the recurrence
- `recurrence_count` (number): Optional limit on number of occurrences
- `parent_id` (string): References the original recurring task, null for parent tasks
- `recurrence_mode` (enum: 'refresh', 'clone'): How recurring tasks behave when completed
  - 'refresh': Resets the status of the original task and updates due date
  - 'clone': Creates multiple instances of the task

### Events Table

The `events` table includes similar fields:

- `is_recurring` (boolean): Identifies a recurring event
- `recurrence_pattern` (enum: 'daily', 'weekly', 'monthly', 'yearly'): How often the event repeats
- `recurrence_days` (string[]): For weekly recurrence, specifies which days
- `recurrence_end_date` (date): Optional end date for the recurrence
- `recurrence_count` (number): Optional limit on number of occurrences
- `parent_id` (string): References the original recurring event, null for parent events

## Backend Implementation

### Recurrence Services

The system includes several key services for handling recurring items:

1. **Recurrence Processing System** (`recurrence.service.ts`)
   - Initializes on application startup
   - Runs every 60 minutes to check for updates
   - Processes both tasks and events
   - Ensures singleton initialization with proper cleanup

2. **Task Recurrence** (`task.service.ts`)
   - `createRecurringTask`: Creates a parent recurring task
   - `getNextOccurrenceDate`: Calculates the next occurrence based on pattern
   - `generateFutureRecurringTaskInstances`: Creates instances for 'clone' mode tasks
   - `refreshRecurringTaskStatus`: Updates due date and resets status for 'refresh' mode
   - `processAllRecurringTasks`: Processes all recurring tasks
   - `updateRecurringTaskInstances`: Updates all instances when parent is modified

3. **Event Recurrence** (`eventService.ts`)
   - `createRecurringEvent`: Creates a parent recurring event
   - `getNextEventOccurrenceDate`: Calculates the next occurrence
   - `generateFutureRecurringEventInstances`: Creates future instances
   - `processAllRecurringEvents`: Processes all recurring events
   - `updateRecurringEventInstances`: Updates all instances when parent is modified

## Frontend Components

### Task Recurrence UI

The recurrence settings UI for tasks is implemented in `TaskDialog.tsx` with these elements:

- Toggle switch to enable/disable recurrence
- Dropdown for recurrence pattern (daily, weekly, monthly, yearly)
- Day selection for weekly recurrence (Mon-Sun checkboxes)
- End condition options:
  - Never end
  - End on date (with date picker)
  - End after occurrences (with number input)
- Mode selection (refresh or clone)
- Visual indicators for recurring tasks

### Event Recurrence UI

The event recurrence UI is implemented in `RecurrenceField.tsx` and integrated into `EventForm.tsx` with:

- Toggle switch to enable/disable recurrence
- Dropdown for pattern selection
- Day selection for weekly pattern
- End condition options
- Visual badges and information alerts when viewing/editing recurring events

## How Recurrence Processing Works

1. **Creation**: When a user creates a recurring task/event, the system:
   - Stores the parent item with recurrence settings
   - Generates future instances (if clone mode for tasks, always for events)
   - Sets the parent_id on all generated instances

2. **Periodic Processing**: The system regularly checks:
   - For tasks in 'refresh' mode: If they're past due, resets status and updates due date
   - For tasks in 'clone' mode: Generates additional instances as needed
   - For events: Generates future instances as needed

3. **Updating**: When a parent is updated:
   - Core attributes (title, description, etc.) propagate to all instances
   - When recurrence pattern changes, new future instances are generated
   - Existing instances maintain their schedule

## User Experience

### Visual Indicators

- Recurring events show a repeat icon (⟳) in calendar views
- Event dialog shows a "Recurring Event Series" or "Part of Recurring Series" badge
- Info alert explains the implications of editing a recurring item
- Task board shows recurring indicators on tasks

### Editing Behavior

- Editing a parent recurring item propagates changes to all instances
- Editing an instance only affects that single occurrence
- Deleting a parent recurring item does not automatically delete instances

## Best Practices and Limitations

1. **Performance**: The system generates instances 30 days in advance to balance between completeness and performance

2. **Time Handling**: For events, the system preserves the time duration when creating new instances

3. **Timezones**: All dates are stored in ISO format and handled using date-fns library

4. **Maximum Instances**: There's a practical limit to the number of instances that can be created (using recurrence_count)

## Error Handling

- Failed recurrence processing is logged but doesn't crash the application
- The system will retry on next processing cycle
- Clear error messages guide users when issues occur

## Future Improvements

Potential enhancements for the recurrence system:

1. **More Complex Patterns**: Support for "every X days/weeks/months" or "Nth day of month"
2. **Exception Dates**: Allow skipping specific occurrences
3. **Batch Updates**: Allow updating all instances at once (not just future ones)
4. **Migration Tool**: For converting regular tasks/events to recurring ones 