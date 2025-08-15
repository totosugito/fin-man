import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import React from "react";
import {FormDatePickerProps} from "@/types/form";
import DatePicker from "@/components/custom/components/DatePicker";

const FormDatePicker = ({form, item, ...props} : FormDatePickerProps) => {
  return(
    <FormField
      control={form.control}
      name={item.name}
      render={({field}) => (
        <FormItem>
          <FormLabel>{item.label}</FormLabel>
          <FormControl>
            <DatePicker {...props} value={field.value} onChange={field.onChange}/>
          </FormControl>
          {item?.description && <FormDescription>{item.description}</FormDescription>}
          <FormMessage/>
        </FormItem>
      )}
    />
  )
}
export default FormDatePicker;