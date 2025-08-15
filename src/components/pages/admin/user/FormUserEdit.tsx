import React from "react";
import {ControlForm} from "@/components/custom/forms";

type Props = {
  values: any; // or better: Record<string, any>
  form: any;   // ideally typed from useForm<...>
  showPassword?: boolean;
  readOnly?: boolean
};

const FormUserEdit = ({values, form, showPassword=true, ...props} : any) => {

  return (
    <div className={"flex flex-col gap-4 w-full"}>
      {/* name */}
      <ControlForm form={form} item={values?.name} disabled={props.readOnly ?? false}/>

      {/* email */}
      <ControlForm form={form} item={values?.email} disabled={true}/>

      {/* role */}
      <ControlForm form={form} item={values?.role}/>
    </div>
  );
}
export default FormUserEdit
