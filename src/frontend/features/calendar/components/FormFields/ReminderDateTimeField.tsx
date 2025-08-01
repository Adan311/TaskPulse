import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { Button } from "@/frontend/components/ui/button";
import { Calendar } from "@/frontend/components/ui/calendar";
import { cn } from "@/frontend/lib/utils";
import { CalendarClock, Clock, Bell, BellOff } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";

interface ReminderDateTimeFieldProps<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  fieldName: string;
  entityDate?: Date | string;
  entityTime?: string;
  label?: string;
}

// Common reminder options that make sense for tasks and events
const REMINDER_OPTIONS = [
  { value: "none", label: "No Reminder" },
  { value: "at_time", label: "At time of event/due date" },
  { value: "5_min", label: "5 minutes before" },
  { value: "15_min", label: "15 minutes before" },
  { value: "30_min", label: "30 minutes before" },
  { value: "1_hour", label: "1 hour before" },
  { value: "2_hour", label: "2 hours before" },
  { value: "1_day", label: "1 day before" },
  { value: "2_day", label: "2 days before" },
  { value: "1_week", label: "1 week before" },
  { value: "custom", label: "Custom time" }
];

export function ReminderDateTimeField<T extends Record<string, any>>({
  form,
  fieldName,
  entityDate,
  entityTime,
  label = "Reminder"
}: ReminderDateTimeFieldProps<T>) {
  const [reminderType, setReminderType] = useState<string>("none");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState<string>("09:00");

  // Calculate the reference date (event start or task due date)
  const getReferenceDate = () => {
    if (!entityDate) return new Date();
    
    const baseDate = typeof entityDate === 'string' 
      ? parseISO(entityDate)
      : new Date(entityDate);
      
    // If we have a time, add it to the date
    if (entityTime) {
      const [hours, minutes] = entityTime.split(':').map(Number);
      return setHours(setMinutes(baseDate, minutes || 0), hours || 0);
    }
    
    return baseDate;
  };
  
  // Calculate the reminder date based on the selected option
  const calculateReminderDate = (type: string): string | null => {
    if (type === 'none') return null;
    
    const referenceDate = getReferenceDate();
    
    if (type === 'at_time') {
      return referenceDate.toISOString();
    }
    
    if (type === 'custom' && customDate) {
      const [hours, minutes] = customTime.split(':').map(Number);
      const date = setHours(setMinutes(customDate, minutes), hours);
      return date.toISOString();
    }
    
    // Handle relative times
    let date = new Date(referenceDate);
    
    switch (type) {
      case '5_min':
        date = addMinutes(date, -5);
        break;
      case '15_min':
        date = addMinutes(date, -15);
        break;
      case '30_min':
        date = addMinutes(date, -30);
        break;
      case '1_hour':
        date = addMinutes(date, -60);
        break;
      case '2_hour':
        date = addMinutes(date, -120);
        break;
      case '1_day':
        date.setDate(date.getDate() - 1);
        break;
      case '2_day':
        date.setDate(date.getDate() - 2);
        break;
      case '1_week':
        date.setDate(date.getDate() - 7);
        break;
      default:
        return null;
    }
    
    return date.toISOString();
  };

  return (
    <FormField
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex flex-col gap-2">
            <Select
              value={field.value ? (reminderType || "custom") : "none"}
              onValueChange={(value) => {
                setReminderType(value);
                const reminderDate = calculateReminderDate(value);
                field.onChange(reminderDate);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reminder" />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reminderType === "custom" && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        setCustomDate(date);
                        if (date) {
                          const reminderDate = calculateReminderDate("custom");
                          field.onChange(reminderDate);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select
                  value={customTime}
                  onValueChange={(value) => {
                    setCustomTime(value);
                    if (customDate) {
                      const reminderDate = calculateReminderDate("custom");
                      field.onChange(reminderDate);
                    }
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <Clock className="mr-2 h-4 w-4" />
                    {customTime}
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <React.Fragment key={hour}>
                        <SelectItem value={`${hour.toString().padStart(2, '0')}:00`}>
                          {`${hour.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                        <SelectItem value={`${hour.toString().padStart(2, '0')}:30`}>
                          {`${hour.toString().padStart(2, '0')}:30`}
                        </SelectItem>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {field.value && (
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Bell className="h-3 w-3 mr-1" />
              <span>
                Reminder set for: {format(new Date(field.value), "PPP 'at' p")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 ml-2 px-1"
                onClick={() => {
                  setReminderType("none");
                  field.onChange(null);
                }}
              >
                <BellOff className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <FormControl>
            <input
              type="hidden"
              value={field.value || ""}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 