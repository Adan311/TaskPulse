import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { useToast } from "@/frontend/hooks/use-toast";
import { Button } from "@/frontend/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Event, createEvent, updateEvent, createRecurringEvent, deleteEvent } from "@/backend/api/services/event.service";
import { formSchema, FormValues } from "../EventFormSchema";
import { DatePickerField } from "./FormFields/DatePickerField";
import { TimePickerField } from "./FormFields/TimePickerField";
import { ColorPickerField } from "./FormFields/ColorPickerField";
import { ProjectSelectField } from "./FormFields/ProjectSelectField";
import { ReminderDateTimeField } from "./FormFields/ReminderDateTimeField";
import { RecurrenceField } from "./FormFields/RecurrenceField";
import { hasGoogleCalendarConnected } from "@/backend/api/services/googleCalendar/googleCalendarService";
import { CalendarClock, AlertCircle, Repeat, InfoIcon, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { Badge } from "@/frontend/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group";

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  event?: Event;
  initialProjectId?: string;
  onDelete?: () => void;
}

export function EventForm({ onSuccess, onCancel, event, initialProjectId, onDelete }: EventFormProps) {
  const { toast } = useToast();
  const [canSyncToGoogle, setCanSyncToGoogle] = useState(false);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recurrenceUpdateMode, setRecurrenceUpdateMode] = useState<'this' | 'all'>('all');
  const isGoogleEvent = event?.source === 'google';
  const isRecurringEvent = event?.isRecurring || event?.parentId;
  const isRecurringParent = event?.isRecurring;
  const isRecurringChild = event?.parentId;

  useEffect(() => {
    const checkGoogleCalendar = async () => {
      try {
        const connected = await hasGoogleCalendarConnected();
        setHasGoogleCalendar(connected);
        setCanSyncToGoogle(connected && !isGoogleEvent);
      } catch (error) {
        console.error("Failed to check Google Calendar status:", error);
        setHasGoogleCalendar(false);
        setCanSyncToGoogle(false);
      }
    };

    checkGoogleCalendar();
  }, [isGoogleEvent]);

  // Convert event dates for the form
  const getDefaultValues = (): FormValues => {
    if (event) {
      return {
        title: event.title,
        description: event.description || "",
        date: new Date(event.startTime.split("T")[0]),
        startTime: event.startTime.split("T")[1].substring(0, 5),
        endTime: event.endTime.split("T")[1].substring(0, 5),
        color: event.color || "#3b82f6",
        project: event.project || "none",
        reminderAt: event.reminderAt || undefined,
        isRecurring: event.isRecurring || false,
        recurrencePattern: event.recurrencePattern || "daily",
        recurrenceDays: event.recurrenceDays || [],
        recurrenceEndType: event.recurrenceEndDate ? "on_date" : (event.recurrenceCount ? "after_occurrences" : "never"),
        recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined,
        recurrenceCount: event.recurrenceCount || 5,
      };
    } else {
      return {
        title: "",
        description: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        color: "#3b82f6",
        project: initialProjectId || "none",
        reminderAt: undefined,
        isRecurring: false,
        recurrencePattern: "daily",
        recurrenceDays: [],
        recurrenceEndType: "never",
        recurrenceEndDate: undefined,
        recurrenceCount: undefined,
      };
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const formattedStartTime = `${format(values.date, "yyyy-MM-dd")}T${values.startTime}:00`;
      const formattedEndTime = `${format(values.date, "yyyy-MM-dd")}T${values.endTime}:00`;
      
      let recurrenceData = {};
      
      if (values.isRecurring) {
        recurrenceData = {
          isRecurring: true,
          recurrencePattern: values.recurrencePattern,
          recurrenceDays: values.recurrencePattern === "weekly" ? values.recurrenceDays : undefined,
          recurrenceEndDate: values.recurrenceEndType === "on_date" && values.recurrenceEndDate 
            ? format(values.recurrenceEndDate, "yyyy-MM-dd") 
            : undefined,
          recurrenceCount: values.recurrenceEndType === "after_occurrences" ? values.recurrenceCount : undefined,
        };
      }
      
      const eventData = {
        title: values.title,
        description: values.description,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        color: values.color,
        project: values.project === "none" ? undefined : values.project,
        reminderAt: values.reminderAt,
        participants: [],
        ...recurrenceData
      };

      console.log("Submitting event:", eventData);

      let successMessage: string;

      if (event) {
        // When updating an event
        if (isRecurringEvent) {
          // If it's a recurring event, we need to handle the update mode
          if (isRecurringParent) {
            // For parent events, respect the update mode choice
            await updateEvent(event.id, {
              ...eventData,
              updateMode: recurrenceUpdateMode
            } as any);
            successMessage = `Your recurring event has been updated${recurrenceUpdateMode === 'all' ? ' along with all future instances' : ''}.`;
          } else if (isRecurringChild && recurrenceUpdateMode === 'all' && event.parentId) {
            // If updating all from a child, update the parent instead
            await updateEvent(event.parentId, {
              ...eventData,
              updateMode: 'all'
            } as any);
            successMessage = "This and all future instances of the recurring event have been updated.";
          } else {
            // Just update this single instance
            await updateEvent(event.id, eventData);
            successMessage = "Only this instance of the recurring event has been updated.";
          }
        } else {
          // Regular non-recurring event update
          await updateEvent(event.id, eventData);
          successMessage = "Your event has been updated successfully.";
        }
      } else if (values.isRecurring) {
        // Creating a new recurring event
        await createRecurringEvent(eventData);
        successMessage = "Your recurring event has been created successfully.";
      } else {
        // Creating a regular event
        await createEvent(eventData);
        successMessage = "Your event has been created successfully.";
      }

      toast({
        title: event ? "Event updated" : "Event created",
        description: successMessage,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem saving your event.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    try {
      setIsDeleting(true);
      
      if (isRecurringEvent) {
        // Handle recurring event deletion based on selected mode
        if (isRecurringParent) {
          // For parent events, respect the update mode choice
          await deleteEvent(event.id, { deleteMode: recurrenceUpdateMode });
          
          const message = recurrenceUpdateMode === 'all' 
            ? "This and all future instances of the recurring event have been deleted."
            : "Only this instance of the recurring event has been deleted.";
            
          toast({
            title: "Event deleted",
            description: message,
          });
        } else if (isRecurringChild) {
          if (recurrenceUpdateMode === 'all' && event.parentId) {
            // Delete the parent and all future instances
            await deleteEvent(event.parentId, { deleteMode: 'all' });
            toast({
              title: "Events deleted",
              description: "This and all future instances of the recurring event have been deleted.",
            });
          } else {
            // Just delete this instance
            await deleteEvent(event.id);
            toast({
              title: "Event deleted",
              description: "This instance of the recurring event has been deleted.",
            });
          }
        }
      } else {
        // Regular event deletion
        await deleteEvent(event.id);
        toast({
          title: "Event deleted",
          description: "The event has been deleted successfully.",
        });
      }
      
      if (onDelete) onDelete();
      else onSuccess();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem deleting the event.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {isGoogleEvent && (
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertDescription>
              This event is synchronized from Google Calendar. Changes made here will not affect the original Google Calendar event.
            </AlertDescription>
          </Alert>
        )}
        
        {isRecurringEvent && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 py-1.5 px-3 border-blue-400 text-blue-600 dark:text-blue-400 text-sm">
                <Repeat className="h-4 w-4 mr-1" />
                <span className="font-medium">{isRecurringParent ? "Recurring Event Series" : "Part of Recurring Series"}</span>
              </Badge>
            </div>
            
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-600 dark:text-blue-400 font-medium">
                {isRecurringParent ? "Series Master Event" : "Recurring Instance"}
              </AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
                {isRecurringParent 
                  ? "This is the main recurring event. Changes can affect this and future instances."
                  : "This is an instance of a recurring event. You can choose to modify just this occurrence or all future occurrences."}
              </AlertDescription>
            </Alert>

            {/* Only show update mode selection when editing, not creating */}
            {event && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md border">
                <FormLabel className="text-sm font-medium block mb-2">Update mode:</FormLabel>
                <RadioGroup 
                  defaultValue="all" 
                  value={recurrenceUpdateMode}
                  onValueChange={(value) => setRecurrenceUpdateMode(value as 'this' | 'all')}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="this" id="this-event" />
                    <label htmlFor="this-event" className="text-sm cursor-pointer">
                      This event only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all-events" />
                    <label htmlFor="all-events" className="text-sm cursor-pointer">
                      This and all future events
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        )}
        
        {canSyncToGoogle && (
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CalendarClock className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              This event will be synced to your Google Calendar automatically.
            </AlertDescription>
          </Alert>
        )}

        {!hasGoogleCalendar && !isGoogleEvent && (
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              Connect Google Calendar to sync your events automatically.
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Meeting with team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add details about this event"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePickerField form={form} />

          <div className="grid grid-cols-2 gap-4">
            <TimePickerField form={form} name="startTime" label="Start Time" />
            <TimePickerField form={form} name="endTime" label="End Time" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPickerField form={form} />
          <ProjectSelectField form={form} />
        </div>

        <ReminderDateTimeField 
          form={form} 
          fieldName="reminderAt"
          entityDate={form.watch('date')}
          entityTime={form.watch('startTime')}
        />
        
        <RecurrenceField form={form} />

        <div className="flex justify-between space-x-4 pt-2">
          <div>
            {event && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Event"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : event ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
