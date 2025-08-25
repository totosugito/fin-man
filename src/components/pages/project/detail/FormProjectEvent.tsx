import React from "react";
import { ControlForm } from "@/components/custom/forms";
import { FormLabel } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, DollarSign, BarChart3 } from "lucide-react";

export const FormProjectEvent = ({ values, form }: any) => {
  // Watch hasActual field value to conditionally disable actual data fields
  const hasRealValue = form.watch(values?.hasActual?.name);

  return (
    <div className={"flex flex-col gap-4 w-full"}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="actual" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Actual Data
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="mt-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Enter the basic details for this transaction event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* name */}
              <ControlForm form={form} item={values?.name} />

              {/* description */}
              <ControlForm form={form} item={values?.description} />

              {/* transaction type */}
              <ControlForm form={form} item={values?.transactionType} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Budget Amount
              </CardTitle>
              <CardDescription>Set the planned budget for this transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row gap-4">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium">{values?.budget?.label}</FormLabel>
                  <div className={"flex flex-row gap-2 mt-2"}>
                    <ControlForm 
                      form={form} 
                      item={{ ...values?.budgetCurrency, label: "" }} 
                      wrapperClassName="min-w-[120px]"
                    />
                    <ControlForm 
                      form={form} 
                      item={{ ...values?.budget, label: "" }} 
                      wrapperClassName={"flex-1"}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actual Data Tab */}
        <TabsContent value="actual" className="mt-6">
          <Card className={hasRealValue ? "" : "opacity-60"}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Actual Data
              </CardTitle>
              <CardDescription>Record the actual transaction data when available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Has Actual Data Checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <ControlForm form={form} item={values?.hasActual} />
              </div>

              <Separator />

              {/* Actual Created At */}
              <ControlForm 
                form={form} 
                item={values?.actualCreatedAt} 
                disabled={!hasRealValue}
              />

              {/* Actual Amount */}
              <div className={"flex flex-col w-full"}>
                <FormLabel className={`text-sm font-medium ${!hasRealValue ? 'text-muted-foreground' : ''}`}>
                  {values?.actual?.label}
                </FormLabel>
                <div className={"flex flex-row gap-2 mt-2"}>
                  <ControlForm 
                    form={form} 
                    item={{ ...values?.actualCurrency, label: "" }} 
                    disabled={!hasRealValue}
                    wrapperClassName="min-w-[120px]"
                  />
                  <ControlForm 
                    form={form} 
                    item={{ ...values?.actual, label: "" }} 
                    disabled={!hasRealValue}
                    wrapperClassName={"flex-1"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}