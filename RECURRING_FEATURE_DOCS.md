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

   ```typescript
   // Example: Initialize recurrence processing
   // In your application startup file
   import { initRecurrenceProcessing } from '@/backend/api/services/recurrence.service';
   
   // Start with default 60-minute interval
   const cleanup = initRecurrenceProcessing();
   
   // To stop recurrence processing (e.g. during application shutdown)
   cleanup();
   ```

2. **Task Recurrence** (`task.service.ts`)
   - `createRecurringTask`: Creates a parent recurring task
   - `getNextOccurrenceDate`: Calculates the next occurrence based on pattern
   - `generateFutureRecurringTaskInstances`: Creates instances for 'clone' mode tasks
   - `refreshRecurringTaskStatus`: Updates due date and resets status for 'refresh' mode
   - `processAllRecurringTasks`: Processes all recurring tasks
   - `updateRecurringTaskInstances`: Updates all instances when parent is modified

   ```typescript
   // Example: Create a recurring task
   import { createRecurringTask } from '@/backend/api/services/task.service';
   
   const newRecurringTask = await createRecurringTask({
     title: "Weekly team meeting",
     description: "Discuss project progress",
     status: "todo",
     priority: "medium",
     due_date: "2023-12-15T10:00:00Z",
     is_recurring: true,
     recurrence_pattern: "weekly",
     recurrence_days: ["Monday"],
     recurrence_mode: "clone",
     recurrence_end_date: null,  // Never end
     recurrence_count: null      // No occurrence limit
   });
   ```

3. **Event Recurrence** (`eventService.ts`)
   - `createRecurringEvent`: Creates a parent recurring event
   - `getNextEventOccurrenceDate`: Calculates the next occurrence
   - `generateFutureRecurringEventInstances`: Creates future instances
   - `processAllRecurringEvents`: Processes all recurring events
   - `updateRecurringEventInstances`: Updates all instances when parent is modified

   ```typescript
   // Example: Create a recurring event
   import { createRecurringEvent } from '@/backend/api/services/eventService';
   
   const newRecurringEvent = await createRecurringEvent({
     title: "Monthly Review Meeting",
     description: "Monthly project review",
     startTime: "2023-12-01T14:00:00Z",
     endTime: "2023-12-01T15:00:00Z",
     isRecurring: true,
     recurrencePattern: "monthly",
     recurrenceDays: null,  // Not needed for monthly recurrence
     recurrenceEndType: "after_occurrences",
     recurrenceCount: 12,   // Recur for 12 months
     participants: []
   });
   ```

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

```tsx
// Key part of TaskDialog component for recurrence
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="recurrence">
    <AccordionTrigger>
      <div className="flex items-center">
        <Repeat className="w-4 h-4 mr-2" />
        <span>Recurrence</span>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(!!checked)}
            id="recurring"
          />
          <Label htmlFor="recurring">Make this task recurring</Label>
        </div>
        
        {isRecurring && (
          <>
            {/* Recurrence Pattern Selection */}
            <div className="space-y-2">
              <Label>Recurrence Pattern</Label>
              <Select
                value={recurrencePattern}
                onValueChange={setRecurrencePattern}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence pattern" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_PATTERNS.slice(1).map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Weekly day selection */}
            {recurrencePattern === "weekly" && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="flex flex-col items-center">
                      <Checkbox
                        checked={recurrenceDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                        id={`day-${day.value}`}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-xs mt-1">
                        {day.label.substring(0, 1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* End condition options */}
            <div className="space-y-2">
              <Label>End</Label>
              <RadioGroup value={recurrenceEndType} onValueChange={(value) => setRecurrenceEndType(value as any)}>
                <div className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value="never" id="recurrence-end-never" />
                  <Label htmlFor="recurrence-end-never">Never</Label>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value="on_date" id="recurrence-end-date" />
                  <Label htmlFor="recurrence-end-date">On date</Label>
                  {/* Date picker for end date */}
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value="after_occurrences" id="recurrence-end-occurrences" />
                  <Label htmlFor="recurrence-end-occurrences">After</Label>
                  {/* Number input for occurrence count */}
                </div>
              </RadioGroup>
            </div>
            
            {/* Recurrence mode selection */}
            <div className="space-y-2">
              <Label>Recurrence Mode</Label>
              <Select
                value={recurrenceMode}
                onValueChange={(value) => setRecurrenceMode(value as 'clone' | 'refresh')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clone">Create new tasks</SelectItem>
                  <SelectItem value="refresh">Refresh this task</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {recurrenceMode === 'clone' 
                  ? "New tasks will be created for each recurrence."
                  : "This task will be reset to 'To Do' for each recurrence."}
              </p>
            </div>
          </>
        )}
      </div>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Event Recurrence UI

The event recurrence UI is implemented in `RecurrenceField.tsx` and integrated into `EventForm.tsx` with:

- Toggle switch to enable/disable recurrence
- Dropdown for pattern selection
- Day selection for weekly pattern
- End condition options
- Visual badges and information alerts when viewing/editing recurring events

```tsx
// Simplified RecurrenceField component usage example
import { RecurrenceField } from '@/frontend/features/calendar/components/FormFields/RecurrenceField';

// Inside your form component
<RecurrenceField form={form} />

// The form should include these fields:
// - isRecurring (boolean)
// - recurrencePattern (string)
// - recurrenceDays (string[])
// - recurrenceEndType (string)
// - recurrenceEndDate (Date)
// - recurrenceCount (number)
```

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

## Implementation Details

### Date Calculation

The system uses `date-fns` for date manipulation. For example, calculating the next occurrence date:

```typescript
// Simplified example from getNextOccurrenceDate
export const getNextOccurrenceDate = (task: Task, fromDate: Date): Date | null => {
  // Start from the original due date or the fromDate, whichever is later
  let baseDate = task.due_date ? new Date(task.due_date) : fromDate;
  
  switch (task.recurrence_pattern) {
    case 'daily':
      // Calculate next day
      return addDays(baseDate, 1);
      
    case 'weekly':
      // Find the next matching day of week
      if (task.recurrence_days && task.recurrence_days.length > 0) {
        // Find the next matching day of the week
        // Logic to find the next occurrence based on recurrence_days
      }
      return addWeeks(baseDate, 1);
      
    case 'monthly':
      return addMonths(baseDate, 1);
      
    case 'yearly':
      return addYears(baseDate, 1);
      
    default:
      return null;
  }
};
```

### Instance Generation

For 'clone' mode tasks and all recurring events, the system generates future instances:

```typescript
// Simplified example of instance generation
export const generateFutureInstances = async (parentId: string, daysInFuture: number = 30): Promise<void> => {
  // 1. Fetch the parent item
  // 2. Get current instances to avoid duplicates
  // 3. Calculate dates for future instances
  // 4. Create new instances with parent_id reference
};
```

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

### Example Use Case: Weekly Team Meeting

1. User creates an event titled "Team Meeting"
2. Enables recurrence and selects "Weekly" pattern
3. Selects "Monday" as the recurring day
4. Selects "Never" for end date
5. The system:
   - Creates the parent event 
   - Generates instances for the next 30 days
   - Scheduled background process creates additional instances as needed

## Best Practices and Limitations

1. **Performance**: The system generates instances 30 days in advance to balance between completeness and performance

2. **Time Handling**: For events, the system preserves the time duration when creating new instances

3. **Timezones**: All dates are stored in ISO format and handled using date-fns library

4. **Maximum Instances**: There's a practical limit to the number of instances that can be created (using recurrence_count)

5. **Using the MCP Pattern**: All recurrence operations follow the Model-Controller-Persistence pattern. Example:

   ```typescript
   // In the service file
   export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("User not authenticated");
     
     // Update the task status
     const { data, error } = await supabase
       .from("tasks")
       .update({ status })
       .eq("id", taskId)
       .eq("user", user.id)
       .select()
       .single();
     
     if (error) throw error;
     if (!data) throw new Error("Task not found");
     
     // For recurring tasks, check if we need to refresh or generate instances
     if (data.is_recurring) {
       if (status === 'done' && data.recurrence_mode === 'refresh') {
         await refreshRecurringTaskStatus(data);
       }
     }
     
     return mapDbTaskToTask(data);
   };
   ```

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
5. **Enhanced Calendar Integration**: Better synchronization with external calendars
6. **Performance Optimization**: Batch processing of recurring items generation
7. **Improved UI**: More intuitive recurrence pattern selection
8. **Recurrence Templates**: Allow saving common recurrence patterns as templates 