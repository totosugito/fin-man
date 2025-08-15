import React, {forwardRef} from "react";
import {Controller} from "react-hook-form";
import FormInput from "./FormInput";
import FormPassword from "./FormPassword";
import FormNumber from "./FormNumber";
import FormCombobox from "./FormCombobox";
import FormSelect from "./FormSelect";
import FormMultiSelect from "./FormMultiSelect";
import FormDatePicker from "./FormDatePicker";
import FormTextArea from "./FormTextArea";
import FormUpload from "./FormUpload";

const ControlForm = forwardRef(({form, item, ...props}: { form: any, item: any, disabled?: boolean }, ref) => {
  const className = "bg-background";
  return (
    <div className={"flex flex-col gap-y-1"}>
      <Controller
        name={item.name}
        control={form.control}
        render={({field}) => {
          const itemType = item.type;
          if (itemType === "password") {
            return (<FormPassword {...field} form={form} className={className} item={item} {...props}/>);
          } else if (item.type === "number") {
            return (<FormNumber {...field} form={form} item={item} className={className} {...props}/>);
          } else if (itemType === "select") {
            return (<FormSelect {...field} form={form} item={item} {...props} className={className}/>);
          } else if (itemType === "combobox") {
            return (<FormCombobox {...field} form={form} item={item} className={className} {...props}/>);
          } else if (itemType === "multiselect") {
            return (<FormMultiSelect {...field} form={form} item={item} className={className} {...props}/>);
          } else if (itemType === "date") {
            return (<FormDatePicker {...field} form={form} item={item} className={className} {...props}/>);
          } else if (itemType === "textarea") {
            return (<FormTextArea {...field} form={form} item={item} className={className} {...props}/>);
          } else if (itemType === "upload") {
            return (<FormUpload {...field} {...props} form={form} item={item} className={className}/>);
          } else {
            return (<FormInput {...field} form={form} item={item} className={className} {...props}/>);
          }
        }}
      />
    </div>
  );
})
export default ControlForm
