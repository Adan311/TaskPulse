
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Button } from "@/frontend/components/ui/button";
import { Calendar } from "@/frontend/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { cn } from "@/frontend/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../EventFormSchema";

interface DatePickerFieldProps {
  form: UseFormReturn<FormValues>;
}

export function DatePickerField({ form }: DatePickerFieldProps) {
  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={{
                  head_cell: "text-muted-foreground rounded-md w-8 h-8 font-medium text-xs tracking-wide text-center",
                  cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 transition-all",
                  day: "h-8 w-8 p-0 font-normal rounded-full transition-all aria-selected:opacity-100 focus:ring-2 focus:ring-primary flex items-center justify-center mx-auto text-sm",
                  row: "flex w-full mt-1"
                }}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
