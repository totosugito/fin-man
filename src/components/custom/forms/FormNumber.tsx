import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import React from "react";
import {FormNumberProps} from "@/types/form";
import InputNumber from "rc-input-number";
import '@/assets/rc-input.css';
import {cn} from "@/lib/utils";

const FormNumber = ({
                      form,
                      item,
                      ...props
                    }: FormNumberProps) => {
  return (
    <FormField
      control={form.control}
      name={item.name}
      render={({field}) => (
        <FormItem>
          <FormLabel className={""}>{item.label}</FormLabel>
          <FormControl>
            <InputNumber className={cn(
              "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              props?.disabled ? "opacity-50" : "hover:border-ring hover:ring-ring/50 hover:ring-[3px]",
              props?.className
            )}
                         precision={item?.precision ?? undefined}
                         formatter={(value) => {
                           if (item?.prefix) {
                             return (`${item?.prefix} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','))
                           } else if (item?.suffix) {
                             return (`${value} ${item?.suffix}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","))
                           } else {
                             // if (item?.isInt) {
                             //   return (value);
                             // } else {
                               return (`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','))
                             // }
                           }
                         }}
                         {...field}
            />
          </FormControl>
          {item.description && <FormDescription>{item.description}</FormDescription>}
          <FormMessage/>
        </FormItem>
      )}
    />
  );
};

export default FormNumber;