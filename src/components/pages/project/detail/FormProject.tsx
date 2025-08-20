import React from "react";
import {ControlForm} from "@/components/custom/forms";

export const FormProject = ({values, form}: any) => {

  return (
    <div className={"flex flex-col gap-4 w-full"}>
      {/* name */}
      <ControlForm form={form} item={values?.name}/>

      {/* description */}
      <ControlForm form={form} item={values?.description}/>
    </div>
  );
}

