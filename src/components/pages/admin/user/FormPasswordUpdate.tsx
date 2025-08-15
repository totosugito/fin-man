import React from "react";
import {ControlForm} from "@/components/custom/forms";

const FormPasswordUpdate = ({values, form, showPassword=true, ...props}: any) => {
  return(
    <div className={"flex flex-col gap-y-2 w-full"}>
      <ControlForm form={form} item={values?.password}/>
      <ControlForm form={form} item={values?.confirmPassword}/>
    </div>
  );
}
export default FormPasswordUpdate
