# Recurring Tasks and Events Documentation

This document explains how the recurring tasks and events functionality works in MotionMingle, including all components, services, data structures, and UI elements involved.

## Overview

MotionMingle supports recurring tasks and events to help users create repeating activities without having to manually recreate them. This feature includes:

- Daily, weekly, monthly, and yearly recurrence patterns
- Multiple recurrence end options (never, on date, after occurrences)
- For weekly recurrence, users can select specific days of the week
- Visual indicators for recurring items in the UI
- Two modes for tasks: "refresh" (reset existing task) or "clone" (create new instances)

## Database Schema

Recurring functionality is implemented with the following fields in the `tasks` and `events` tables:

### Common Fields (in both tables)
- `is_recurring`: Boolean indicating whether the item is recurring
- `recurrence_pattern`: String ('daily', 'weekly', 'monthly', 'yearly')
- `recurrence_days`: JSON array of strings (days of week for weekly recurrence)
- `recurrence_end_date`: Date when recurrence ends (if applicable)
- `recurrence_count`: Number of occurrences (if applicable)
- `parent_id`: Reference to parent recurring item (for instances)

### Task-specific Fields
- `recurrence_mode`: String ('clone', 'refresh')
  - 'clone': Creates new task instances for future occurrences
  - 'refresh': Resets the existing task status when due date passes

## Core Services

### Recurrence Service (`recurrence.service.ts`)
Acts as the main coordinator for recurring functionality:
- `initRecurrenceProcessing()`: Sets up automatic background processing
- `processAllRecurringItems()`: Processes all recurring tasks and events

### Task Service (`task.service.ts`)
Implements task-specific recurring functionality:
- `createRecurringTask()`: Creates a new recurring task
- `getNextOccurrenceDate()`: Calculates the next occurrence based on pattern
- `generateFutureRecurringTaskInstances()`: Creates task instances ahead of time
- `refreshRecurringTaskStatus()`: Resets task status for "refresh" mode
- `processAllRecurringTasks()`: Processes all recurring tasks

### Event Service (`eventService.ts`)
Implements event-specific recurring functionality:
- `createRecurringEvent()`: Creates a new recurring event
- `getNextEventOccurrenceDate()`: Calculates the next occurrence based on pattern
- `generateFutureRecurringEventInstances()`: Creates event instances ahead of time
- `processAllRecurringEvents()`: Processes all recurring events

## UI Components

### Tasks
- `TaskDialog.tsx`: Dialog for creating/editing tasks with recurrence options
  - Includes recurrence pattern selection
  - Day of week selection for weekly pattern
  - End condition selection (never, date, count)
  - Recurrence mode selection (clone vs refresh)

### Events
- `EventForm.tsx`: Form for creating/editing events with recurrence options
- `RecurrenceField.tsx`: Dedicated component for recurrence settings
  - Pattern selection
  - Day of week selection
  - End condition options

### Visual Indicators
All recurring items show visual indicators in the UI:
- Calendar views show a repeat icon next to recurring events
- When viewing/editing a recurring item, a badge appears showing "Recurring Event" or "Part of Recurring Series"
- Tooltips include information about recurring status

## How It Works

### Creating Recurring Items
1. User creates a task/event and enables recurrence
2. User selects pattern, options, and end conditions
3. System creates the parent recurring item
4. For tasks with "clone" mode or events, future instances are generated automatically

### Background Processing
1. On application startup, the recurrence processing system is initialized
2. Hourly checks scan for recurring tasks/events that need processing
3. For tasks in "refresh" mode, the status is reset when due date passes
4. For tasks in "clone" mode and events, new instances are generated as needed

### End Conditions
- **Never**: Item recurs indefinitely
- **On Date**: Recurrence stops after specified date
- **After Occurrences**: Recurrence stops after a specified number of instances

### Weekly Recurrence
For weekly recurrence, users can select specific days of the week:
1. Select "Weekly" as the recurrence pattern
2. Check one or more days when the item should recur
3. System will create instances on those specific days of the week

## Technical Implementation Notes

- Background processing uses `setInterval` for regular checks
- Recurring instances maintain reference to parent through `parent_id`
- Event and task processing is separated but coordinated through `recurrence.service.ts`
- UI components dynamically show/hide options based on selected pattern

## Diagrams

### Recurrence Processing Flow
```
App Initialization
      |
      v
Initialize Recurrence System
      |
      v
   setInterval
      |
      v
Process All Recurring Items
      |
      +-----------------+
      |                 |
      v                 v
Process Tasks    Process Events
      |                 |
      v                 v
  Update UI        Update UI
```

### Task Recurrence Modes
```
Clone Mode                 Refresh Mode
    |                         |
    v                         v
Create New Instances    Reset Status of
for Future Dates       Existing Task when
                        Due Date Passes
```

## Usage Example

1. **Creating a Daily Recurring Task**:
   - Create a new task
   - Enable recurrence
   - Select "Daily" pattern
   - Choose end condition (if needed)
   - Save task

2. **Creating a Weekly Recurring Event on Specific Days**:
   - Create a new event
   - Enable recurrence
   - Select "Weekly" pattern
   - Check "Monday", "Wednesday", and "Friday"
   - Choose end date or occurrence count
   - Save event

3. **Viewing & Editing**:
   - Recurring items show a repeat icon
   - When opened, a badge indicates recurring status
   - Edit to modify recurrence settings or content 