import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/frontend/components/ui/label";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { Calendar } from "@/frontend/components/ui/calendar";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";
import { Repeat } from "lucide-react";

// Days of the week for weekly recurrence
const DAYS_OF_WEEK = [
  { value: "Sunday", label: "S" },
  { value: "Monday", label: "M" },
  { value: "Tuesday", label: "T" },
  { value: "Wednesday", label: "W" },
  { value: "Thursday", label: "T" },
  { value: "Friday", label: "F" },
  { value: "Saturday", label: "S" }
];

// Recurrence patterns
const RECURRENCE_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

interface RecurrenceFieldProps {
  form: UseFormReturn<any>;
}

export function RecurrenceField({ form }: RecurrenceFieldProps) {
  const isRecurring = form.watch("isRecurring") || false;
  const recurrencePattern = form.watch("recurrencePattern") || "daily";
  const recurrenceEndType = form.watch("recurrenceEndType") || "never";
  const recurrenceDays = form.watch("recurrenceDays") || [];

  useEffect(() => {
    // Initialize recurrence days to current day if none selected
    if (recurrencePattern === "weekly" && (!recurrenceDays || recurrenceDays.length === 0)) {
      const today = new Date().getDay();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      form.setValue("recurrenceDays", [dayNames[today]]);
    }
  }, [recurrencePattern, recurrenceDays, form]);

  const toggleDay = (day: string) => {
    const currentDays = form.getValues("recurrenceDays") || [];
    if (currentDays.includes(day)) {
      const newDays = currentDays.filter(d => d !== day);
      if (newDays.length === 0) {
        // Don't allow removing all days
        return;
      }
      form.setValue("recurrenceDays", newDays, { shouldDirty: true });
    } else {
      form.setValue("recurrenceDays", [...currentDays, day], { shouldDirty: true });
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="recurrence">
        <AccordionTrigger className="py-2">
          <div className="flex items-center">
            <Repeat className="w-4 h-4 mr-2" />
            <span>Recurrence</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this event recurring</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurrencePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Pattern</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence pattern" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RECURRENCE_PATTERNS.map(pattern => (
                            <SelectItem key={pattern.value} value={pattern.value}>
                              {pattern.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recurrencePattern === "weekly" && (
                  <FormField
                    control={form.control}
                    name="recurrenceDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat on</FormLabel>
                        <FormControl>
                          <div className="flex justify-between items-center mt-2">
                            {DAYS_OF_WEEK.map(day => (
                              <div key={day.value} className="flex flex-col items-center">
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={() => toggleDay(day.value)}
                                  id={`day-${day.value}`}
                                  className="mb-1"
                                />
                                <Label htmlFor={`day-${day.value}`} className="text-xs">
                                  {day.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recurrenceEndType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="never" id="recurrence-end-never" />
                            <Label htmlFor="recurrence-end-never">Never</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="on_date" id="recurrence-end-date" />
                            <Label htmlFor="recurrence-end-date">On date</Label>
                            {recurrenceEndType === 'on_date' && (
                              <FormField
                                control={form.control}
                                name="recurrenceEndDate"
                                render={({ field }) => (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="ml-2 h-8"
                                      >
                                        {field.value ? format(field.value, "PP") : "Pick a date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="after_occurrences" id="recurrence-end-occurrences" />
                            <Label htmlFor="recurrence-end-occurrences">After</Label>
                            {recurrenceEndType === 'after_occurrences' && (
                              <FormField
                                control={form.control}
                                name="recurrenceCount"
                                render={({ field }) => (
                                  <div className="flex items-center ml-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      className="w-16 h-8"
                                      value={field.value || ""}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                    <span className="ml-2">occurrences</span>
                                  </div>
                                )}
                              />
                            )}
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 