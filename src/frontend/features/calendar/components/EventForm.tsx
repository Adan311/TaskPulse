import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useToast } from "@/frontend/hooks/use-toast";
import { Button } from "@/frontend/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Event, createEvent, updateEvent } from "@/backend/api/services/eventService";
import { formSchema, FormValues } from "../EventFormSchema";
import { DatePickerField } from "./FormFields/DatePickerField";
import { TimePickerField } from "./FormFields/TimePickerField";
import { ColorPickerField } from "./FormFields/ColorPickerField";
import { ProjectSelectField } from "./FormFields/ProjectSelectField";
import { ReminderDateTimeField } from "./FormFields/ReminderDateTimeField";
import { hasGoogleCalendarConnected } from "@/backend/api/services/googleCalendarService";
import { CalendarClock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  event?: Event;
  initialProjectId?: string;
}

export function EventForm({ onSuccess, onCancel, event, initialProjectId }: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
  const isGoogleEvent = event?.source === "google" && event?.googleEventId;
  const canSyncToGoogle = hasGoogleCalendar && !isGoogleEvent;

  useEffect(() => {
    const checkGoogleCalendar = async () => {
      try {
        const connected = await hasGoogleCalendarConnected();
        console.log("Google Calendar connection status:", connected);
        setHasGoogleCalendar(connected);
      } catch (error) {
        console.error("Error checking Google Calendar connection:", error);
      }
    };

    checkGoogleCalendar();
  }, []);

  const defaultValues: Partial<FormValues> = event
    ? {
        title: event.title,
        description: event.description || "",
        date: new Date(event.startTime.split("T")[0]),
        startTime: event.startTime.split("T")[1].substring(0, 5),
        endTime: event.endTime.split("T")[1].substring(0, 5),
        color: event.color || "#3b82f6",
        project: event.project || "none",
        reminderAt: event.reminderAt || undefined,
      }
    : {
        title: "",
        description: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        color: "#3b82f6",
        project: initialProjectId || "none",
        reminderAt: undefined,
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const formattedStartTime = `${format(values.date, "yyyy-MM-dd")}T${values.startTime}:00`;
      const formattedEndTime = `${format(values.date, "yyyy-MM-dd")}T${values.endTime}:00`;
      
      const eventData = {
        title: values.title,
        description: values.description,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        color: values.color,
        project: values.project === "none" ? undefined : values.project,
        reminderAt: values.reminderAt,
        participants: []
      };

      console.log("Submitting event:", eventData);

      if (event) {
        await updateEvent(event.id, eventData);
        toast({
          title: "Event updated",
          description: canSyncToGoogle 
            ? "Your event has been updated and synced to Google Calendar." 
            : "Your event has been updated successfully.",
        });
      } else {
        await createEvent(eventData);
        toast({
          title: "Event created",
          description: canSyncToGoogle 
            ? "Your event has been created and synced to Google Calendar." 
            : "Your event has been created successfully.",
        });
      }
      
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

          <div className="flex space-x-2">
            <TimePickerField form={form} name="startTime" label="Start Time" />
            <TimePickerField form={form} name="endTime" label="End Time" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPickerField form={form} />
          <ProjectSelectField form={form} />
        </div>

        <FormField
          control={form.control}
          name="reminderAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder</FormLabel>
              <FormControl>
                <ReminderDateTimeField
                  form={form}
                  fieldName="reminderAt"
                  entityDate={form.watch('date')}
                  entityTime={form.watch('startTime')}
                  label="Reminder"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
