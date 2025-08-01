
import { Clock } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../EventFormSchema";

interface TimePickerFieldProps {
  form: UseFormReturn<FormValues>;
  name: "startTime" | "endTime";
  label: string;
}

export function TimePickerField({ form, name, label }: TimePickerFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input type="time" {...field} className="flex-1 min-w-0" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
