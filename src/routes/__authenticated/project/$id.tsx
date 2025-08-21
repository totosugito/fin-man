import {createFileRoute} from '@tanstack/react-router';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {useQueryClient} from '@tanstack/react-query';
import {useProjectDetail} from '@/service/project';
import {SkeTable} from '@/components/custom/skeleton';
import {DataTableView, FormProject, FormProjectEvent} from '@/components/pages/project/detail';
import {CurrencyCard} from '@/components/pages/project/detail/CurrencyCard';
import {useProjectEventCreate, useProjectEventDelete, useProjectEventPut} from '@/service/project-event';
import {showNotifError, showNotifSuccess} from '@/lib/show-notif';
import {DialogModal, DialogModalForm} from '@/components/custom/components';
import {ModalFormProps, ModalProps} from '@/types/dialog';
import {z} from 'zod';
import {EnumProjectEventType} from 'backend/src/db/schema';
import {ObjToOptionListValue} from '@/lib/my-utils';
import {CurrencyList} from '@/constants/app-enum';
import {PageTitle} from '@/components/app';
import {useEffect, useState} from "react";

export const Route = createFileRoute('/__authenticated/project/$id')({
  component: RouteComponent,
})


function RouteComponent() {
  const {t} = useTranslation()
  const queryClient = useQueryClient();
  const {id} = Route.useParams();

  const [confirmationCreate, setConfirmationCreate] = useState<ModalFormProps | null>(null);
  const [confirmationPut, setConfirmationPut] = useState<ModalFormProps | null>(null);
  const [confirmationDelete, setConfirmationDelete] = useState<ModalProps | null>(null);

  const projectDetailQuery = useProjectDetail(id);
  const dataCreateMutation = useProjectEventCreate();
  const dataPutMutation = useProjectEventPut();
  const dataDeleteMutation = useProjectEventDelete();

  const [data, setData] = React.useState<any>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const toggleExpand = () => setIsExpanded(prev => !prev);

  const formProject = {
    form: {
      name: {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "",
      },
      description: {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "",
      },
    },
    schema: {
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
    },
    defaultValue: {
      name: "",
      description: "",
    }
  };

  const optionsCurrency = ObjToOptionListValue(CurrencyList);
  const formProjectEvent = {
    form: {
      name: {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "",
      },
      description: {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "",
      },
      budgetIncomeCurrency: {
        type: "select",
        name: "budgetIncomeCurrency",
        label: "",
        options: optionsCurrency,
      },
      budgetIncome: {
        type: "number",
        name: "budgetIncome",
        label: "Budget Income",
        placeholder: "",
      },
      budgetExpenseCurrency: {
        type: "select",
        name: "budgetExpenseCurrency",
        label: "",
        options: optionsCurrency,
      },
      budgetExpense: {
        type: "number",
        name: "budgetExpense",
        label: "Budget Expense",
        placeholder: "",
      },
      realIncomeCurrency: {
        type: "select",
        name: "realIncomeCurrency",
        label: "",
        options: optionsCurrency,
      },
      realIncome: {
        type: "number",
        name: "realIncome",
        label: "Real Income",
        placeholder: "",
      },
      realExpenseCurrency: {
        type: "select",
        name: "realExpenseCurrency",
        label: "",
        options: optionsCurrency,
      },
      realExpense: {
        type: "number",
        name: "realExpense",
        label: "Real Expense",
        placeholder: "",
      },
    },
    schema: {
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      budgetIncomeCurrency: z.string().min(1, "Budget Income Currency is required"),
      budgetIncome: z.number().min(0, "Budget Income is required"),
      budgetExpenseCurrency: z.string().min(1, "Budget Income Currency is required"),
      budgetExpense: z.number().min(0, "Budget Income is required"),
      realIncomeCurrency: z.string().min(1, "Real Income Currency is required"),
      realIncome: z.number().min(0, "Real Income is required"),
      realExpenseCurrency: z.string().min(1, "Real Income Currency is required"),
      realExpense: z.number().min(0, "Real Income is required"),
    },
    defaultValue: {
      name: "",
      description: "",
      budgetIncomeCurrency: CurrencyList.IDR.value,
      budgetIncome: 0,
      budgetExpenseCurrency: CurrencyList.IDR.value,
      budgetExpense: 0,
      realIncomeCurrency: CurrencyList.IDR.value,
      realIncome: 0,
      realExpenseCurrency: CurrencyList.IDR.value,
      realExpense: 0,
    }
  };

  const isLoading = () => {
    return (projectDetailQuery.isPending || dataCreateMutation.isPending || dataDeleteMutation.isPending);
  }

  useEffect(() => {
    if (projectDetailQuery.data?.events) {
      setData(projectDetailQuery.data);
    }
  }, [projectDetailQuery.data]);

  const onCreateGroup = (item: any) => {
    setConfirmationCreate({
      title: "Create Group",
      desc: "Please fill the form below to create new group.",
      defaultValue: formProject.defaultValue,
      child: formProject.form,
      schema: formProject.schema,
      content: <FormProject/>,
      onCancelClick: () => setConfirmationCreate(null),
      onConfirmClick: (body: Record<string, any>) => {
        const newBody = {
          projectId: id,
          parentId: item.id,
          eventType: EnumProjectEventType.folder,
          sortOrder: 0,
          ...body
        }
        dataCreateMutation.mutate({body: newBody}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['project-detail', id]});
            showNotifSuccess({message: "Project Event created successfully"});
            setConfirmationCreate(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  }

  const onCreateEvent = (item: any) => {
    setConfirmationCreate({
      title: "Create Event",
      desc: "Please fill the form below to create new event.",
      defaultValue: formProjectEvent.defaultValue,
      child: formProjectEvent.form,
      schema: formProjectEvent.schema,
      content: <FormProjectEvent/>,
      onCancelClick: () => setConfirmationCreate(null),
      onConfirmClick: (body: Record<string, any>) => {
        const newBody = {
          projectId: id,
          parentId: item.id,
          eventType: EnumProjectEventType.file,
          name: body?.name ?? "",
          description: body?.description ?? "",
          sortOrder: 0,
          eventCost: {
            budgetIncomeCurrency: body?.budgetIncomeCurrency ?? CurrencyList.IDR.value,
            budgetIncome: String(body?.budgetIncome) ?? "0",
            budgetExpenseCurrency: body?.budgetExpenseCurrency ?? CurrencyList.IDR.value,
            budgetExpense: String(body?.budgetExpense) ?? "0",
            realIncomeCurrency: body?.realIncomeCurrency ?? CurrencyList.IDR.value,
            realIncome: String(body?.realIncome) ?? "0",
            realExpenseCurrency: body?.realExpenseCurrency ?? CurrencyList.IDR.value,
            realExpense: String(body?.realExpense) ?? "0",
          }
        }
        dataCreateMutation.mutate({body: newBody}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['project-detail', id]});
            showNotifSuccess({message: "Project Event created successfully"});
            setConfirmationCreate(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  }

  const onDataPut = (item: any) => {
    const isFolder = item?.eventType === EnumProjectEventType.folder;
    const child = isFolder ? formProject.form : formProjectEvent.form;
    const schema = isFolder ? formProject.schema : formProjectEvent.schema;
    const formHtml = isFolder ? <FormProject/> : <FormProjectEvent/>;
    const defaultValue = isFolder ? item :
      {
        ...item,
        eventType: item?.eventType,
        budgetIncomeCurrency: item?.cost?.budgetIncomeCurrency ?? CurrencyList.IDR.value,
        budgetIncome: Number(item?.cost?.budgetIncome) ?? 0,
        budgetExpenseCurrency: item?.cost?.budgetExpenseCurrency ?? CurrencyList.IDR.value,
        budgetExpense: Number(item?.cost?.budgetExpense) ?? 0,
        realIncomeCurrency: item?.cost?.realIncomeCurrency ?? CurrencyList.IDR.value,
        realIncome: Number(item?.cost?.realIncome) ?? 0,
        realExpenseCurrency: item?.cost?.realExpenseCurrency ?? CurrencyList.IDR.value,
        realExpense: Number(item?.cost?.realExpense) ?? 0
      };
    setConfirmationPut({
      title: "Update Project Event",
      desc: "Please fill the form below to update project event.",
      defaultValue: defaultValue,
      child: child,
      schema: schema,
      content: formHtml,
      textConfirm: "Update",
      onCancelClick: () => setConfirmationPut(null),
      onConfirmClick: (body: Record<string, any>) => {
        const newBody = isFolder ? body :
          {
            name: body?.name ?? "",
            description: body?.description ?? "",
            eventType: body?.eventType,
            eventCost: {
              budgetIncomeCurrency: body?.budgetIncomeCurrency ?? CurrencyList.IDR.value,
              budgetIncome: String(body?.budgetIncome) ?? "0",
              budgetExpenseCurrency: body?.budgetExpenseCurrency ?? CurrencyList.IDR.value,
              budgetExpense: String(body?.budgetExpense) ?? "0",
              realIncomeCurrency: body?.realIncomeCurrency ?? CurrencyList.IDR.value,
              realIncome: String(body?.realIncome) ?? "0",
              realExpenseCurrency: body?.realExpenseCurrency ?? CurrencyList.IDR.value,
              realExpense: String(body?.realExpense) ?? "0",
            },
          };
        dataPutMutation.mutate({id: item?.id, body: newBody}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['project-detail', id]});
            showNotifSuccess({message: "Project event updated successfully"});
            setConfirmationPut(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  }

  const onDeleteData = (item: any) => {
    setConfirmationDelete({
      title: "Delete Project Event",
      desc: "Permanently remove project and all of its data. This action is not reversible. So, please confirm with caution.",
      content: <div>Are you sure you want to delete project event <span
        className={"font-bold text-primary"}>{item?.name ?? ""}</span> ?</div>,
      textConfirm: "Delete",
      textCancel: "Cancel",
      onConfirmClick: () => {
        dataDeleteMutation.mutate(
          {id: item?.id},
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({queryKey: ['project-detail', id]});
              showNotifSuccess({message: "Project event deleted successfully"});
            },
            onError: (error: any) => showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message}),
          }
        );
        setConfirmationDelete(null);
      },
      onCancelClick: () => setConfirmationDelete(null),
    })
  }

  return (
    <div className={"divContent"}>
      {data &&
        <PageTitle title={<div>{data?.name ?? ""}</div>} description={<div>{projectDetailQuery.data?.description}</div>}
                   showSeparator={false}/>}
      {(projectDetailQuery.isPending) && <div className={"h-full w-full flex"}>
        <SkeTable/>
      </div>}

      {projectDetailQuery.isError &&
        <div className={"text-lg text-destructive"}>Error: {projectDetailQuery?.error?.message}</div>}

      {(!isLoading() && data) &&
        <div className={"p-2 flex flex-col gap-2"}>
          <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"}>
            {data?.events?.[0]?.cost && Object.entries(data.events[0].cost).map(([currency, values]: any) => (
              <CurrencyCard
                key={currency}
                currency={currency}
                isExpanded={isExpanded}
                onToggleExpand={toggleExpand}
                values={{
                  budgetIncome: values.budgetIncome,
                  budgetExpense: values.budgetExpense,
                  realIncome: values.realIncome,
                  realExpense: values.realExpense
                }}
              />
            ))}
          </div>
          <DataTableView defaultCurrency={""} data={data} onCreateGroup={onCreateGroup}
                         onCreateEvent={onCreateEvent}
                         onDeleteData={onDeleteData} onUpdateData={onDataPut}/>
        </div>
      }

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
