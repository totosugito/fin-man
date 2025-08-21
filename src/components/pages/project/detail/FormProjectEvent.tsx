import React from "react";
import {ControlForm} from "@/components/custom/forms";
import {FormLabel} from "@/components/ui/form";

export const FormProjectEvent = ({values, form}: any) => {

  return (
    <div className={"flex flex-col gap-4 w-full"}>
      {/* name */}
      <ControlForm form={form} item={values?.name}/>

      {/* description */}
      <ControlForm form={form} item={values?.description}/>

      {/*  budget */}
      <div className={"flex flex-row gap-4"}>
        <div>
          <FormLabel className={""}>{values?.budgetIncome.label}</FormLabel>
          <div className={"flex flex-row"}>
            <ControlForm form={form} item={values?.budgetIncomeCurrency}/>
            <ControlForm form={form} item={{...values?.budgetIncome, label: ""}}/>
          </div>
        </div>
        <div>
          <FormLabel className={""}>{values?.budgetExpense.label}</FormLabel>
          <div className={"flex flex-row"}>
            <ControlForm form={form} item={values?.budgetExpenseCurrency}/>
            <ControlForm form={form} item={{...values?.budgetExpense, label: ""}}/>
          </div>
        </div>
      </div>

      {/*  real */}
      <div className={"flex flex-row gap-4"}>
        <div>
          <FormLabel className={""}>{values?.realIncome.label}</FormLabel>
          <div className={"flex flex-row"}>
            <ControlForm form={form} item={values?.realIncomeCurrency}/>
            <ControlForm form={form} item={{...values?.realIncome, label: ""}}/>
          </div>
        </div>
        <div>
          <FormLabel className={""}>{values?.realExpense.label}</FormLabel>
          <div className={"flex flex-row"}>
            <ControlForm form={form} item={values?.realExpenseCurrency}/>
            <ControlForm form={form} item={{...values?.realExpense, label: ""}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

