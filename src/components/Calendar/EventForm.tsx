
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Event, createEvent, updateEvent } from "@/services/eventService";
import { formSchema, FormValues } from "./EventFormSchema";
import { DatePickerField } from "./FormFields/DatePickerField";
import { TimePickerField } from "./FormFields/TimePickerField";
import { ColorPickerField } from "./FormFields/ColorPickerField";
import { ProjectSelectField } from "./FormFields/ProjectSelectField";

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  event?: Event;
}

export function EventForm({ onSuccess, onCancel, event }: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isGoogleEvent = event?.source === "google" && event?.google_event_id;

  const defaultValues: Partial<FormValues> = event
    ? {
        title: event.title,
        description: event.description || "",
        date: new Date(event.start_time.split("T")[0]),
        startTime: event.start_time.split("T")[1].substring(0, 5),
        endTime: event.end_time.split("T")[1].substring(0, 5),
        color: event.color || "#3b82f6",
        project: event.project || "none",
      }
    : {
        title: "",
        description: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        color: "#3b82f6",
        project: "none",
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
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        color: values.color,
        project: values.project === "none" ? null : values.project,
      };

      if (event) {
        await updateEvent(event.id, eventData);
        toast({
          title: "Event updated",
          description: "Your event has been updated successfully.",
        });
      } else {
        await createEvent(eventData);
        toast({
          title: "Event created",
          description: "Your event has been created successfully.",
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
          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm text-muted-foreground">
              This event is synchronized from Google Calendar. Changes made here will not affect the original Google Calendar event.
            </p>
          </div>
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
