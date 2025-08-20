import React from "react";
import {ControlForm} from "@/components/custom/forms";

export const FormProjectEvent = ({values, form}: any) => {

  return (
    <div className={"flex flex-col gap-4 w-full"}>
      {/* name */}
      <ControlForm form={form} item={values?.name}/>

      {/* description */}
      <ControlForm form={form} item={values?.description}/>

      {/*  budget */}
      <div className={"flex flex-row gap-4"}>
        <ControlForm form={form} item={values?.budgetIncome}/>
        <ControlForm form={form} item={values?.budgetExpense}/>
      </div>

      {/*  real */}
      <div className={"flex flex-row gap-4"}>
        <ControlForm form={form} item={values?.realIncome}/>
        <ControlForm form={form} item={values?.realExpense}/>
      </div>
    </div>
  );
}

