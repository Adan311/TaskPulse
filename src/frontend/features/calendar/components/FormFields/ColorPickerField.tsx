
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../EventFormSchema";

interface ColorPickerFieldProps {
  form: UseFormReturn<FormValues>;
}

export function ColorPickerField({ form }: ColorPickerFieldProps) {
  return (
    <FormField
      control={form.control}
      name="color"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Color</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full border border-gray-300" 
                style={{ backgroundColor: field.value }}
              />
              <Input type="color" {...field} className="w-16 h-8" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
