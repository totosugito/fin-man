import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import React from "react";
import {FormSelectProps} from "@/types/form";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select";
import {cn} from "@/lib/utils";

const FormSelect = ({form, item, ...props}: FormSelectProps) => {
  return (
    <FormField
      control={form.control}
      name={item.name}
      render={({field}) => (
        <FormItem>
          <FormLabel>{item.label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            {...props}
          >
            <FormControl>
              <SelectTrigger className={cn("w-full", props?.className)}>
                <SelectValue placeholder={item.placeholder}/>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {item?.selectLabel && <SelectLabel>{item?.selectLabel ?? "Choose a filter"}</SelectLabel>}
                {item.options?.map((it: any) => (
                  <SelectItem key={it?.value} value={it?.value}>{it?.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {item?.description && <FormDescription>{item.description}</FormDescription>}
          <FormMessage/>
        </FormItem>
      )}
    />
  )
}
export default FormSelect;