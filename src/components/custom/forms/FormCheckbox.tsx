import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Checkbox} from "@/components/ui/checkbox";
import React from "react";
import {FormCheckboxProps} from "@/types/form";

const FormCheckbox = ({
                       form,
                       item,
                       ...props
                     }: FormCheckboxProps) => {
  return (
    <FormField
      control={form.control}
      name={item.name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              {...props}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="">{item.label}</FormLabel>
            {item.description && <FormDescription>{item.description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormCheckbox;