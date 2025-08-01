import { z } from "zod";

// Define the form schema
export const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  color: z.string().default("#3b82f6"),
  project: z.string().optional(),
  reminderAt: z.string().nullable().optional(),
  // Recurrence fields
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurrenceDays: z.array(z.string()).optional(),
  recurrenceEndType: z.enum(["never", "on_date", "after_occurrences"]).default("never"),
  recurrenceEndDate: z.date().optional(),
  recurrenceCount: z.number().positive().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

// Define a Project interface for typing
export interface Project {
  id: string;
  name: string;
  color?: string;
}
