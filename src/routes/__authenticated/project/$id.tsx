import {createFileRoute} from '@tanstack/react-router';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {useQueryClient} from '@tanstack/react-query';
import {useProjectDetail} from '@/service/project';
import {SkeTable} from '@/components/custom/skeleton';
import {TableEventDetail, FormProject, FormProjectEvent} from '@/components/pages/project/detail';
import {CurrencyCard} from '@/components/pages/project/detail/CurrencyCard';
import {useProjectEventCreate, useProjectEventDelete, useProjectEventPut} from '@/service/project-event';
import {showNotifError, showNotifSuccess} from '@/lib/show-notif';
import {DialogModal, DialogModalForm} from '@/components/custom/components';
import {ModalFormProps, ModalProps} from '@/types/dialog';
import {z} from 'zod';
import {EnumProjectEventType} from 'backend/src/db/schema';
import {ObjToOptionListValue, ObjToOptionList, string_to_date, date_to_string} from '@/lib/my-utils';
import {CurrencyList} from '@/constants/app-enum';
import {PageTitle} from '@/components/app';
import {useEffect, useState} from "react";
import {EnumTransactionType} from "backend/src/db/schema/index";

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
      transactionType: {
        type: "select",
        name: "transactionType",
        label: "Transaction Type",
        options: ObjToOptionList(EnumTransactionType).filter(option => option.value !== 'folder'),
      },
      budgetCurrency: {
        type: "select",
        name: "budgetCurrency",
        label: "Budget Currency",
        options: optionsCurrency,
      },
      budget: {
        type: "number",
        name: "budget",
        label: "Budget Amount",
        placeholder: "",
      },
      hasActual: {
        type: "checkbox",
        name: "hasActual",
        label: "Has Actual Data",
      },
      actualCreatedAt: {
        type: "date",
        name: "actualCreatedAt",
        label: "Actual Created At",
        placeholder: "",
      },
      actualCurrency: {
        type: "select",
        name: "actualCurrency",
        label: "Actual Currency",
        options: optionsCurrency,
      },
      actual: {
        type: "number",
        name: "actual",
        label: "Actual Amount",
        placeholder: "",
      },
    },
    schema: {
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      transactionType: z.enum(["income", "expense"]),
      budgetCurrency: z.string().min(1, "Budget Currency is required"),
      budget: z.number().min(0, "Budget amount must be positive"),
      actualCurrency: z.string().min(1, "Actual Currency is required"),
      actual: z.number().min(0, "Actual amount must be positive"),
      hasActual: z.boolean().optional(),
      actualCreatedAt: z.date().optional(),
    },
    defaultValue: {
      name: "",
      description: "",
      transactionType: "expense" as const,
      budgetCurrency: CurrencyList.IDR.value,
      budget: 0,
      actualCurrency: CurrencyList.IDR.value,
      actual: 0,
      hasActual: false,
      actualCreatedAt: new Date(),
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
            transactionType: body?.transactionType ?? "expense",
            budgetCurrency: body?.budgetCurrency ?? CurrencyList.IDR.value,
            budget: String(body?.budget) ?? "0",
            actualCurrency: body?.actualCurrency ?? CurrencyList.IDR.value,
            actual: String(body?.actual) ?? "0",
            hasActual: body?.hasActual ?? false,
            actualCreatedAt: date_to_string(body?.actualCreatedAt ?? new Date()),
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
    
    let defaultValue;
    if (isFolder) {
      defaultValue = item;
    } else {
      // For files, extract data from the new cost structure
      defaultValue = {
        ...item,
        eventType: item?.eventType,
        transactionType: item?.cost?.transactionType ?? "expense",
        budgetCurrency: item?.cost?.budgetCurrency ?? CurrencyList.IDR.value,
        budget: Number(item?.cost?.budget) ?? 0,
        actualCurrency: item?.cost?.actualCurrency ?? CurrencyList.IDR.value,
        actual: Number(item?.cost?.actual) ?? 0,
        hasActual: item?.cost?.hasActual ?? false,
        actualCreatedAt: string_to_date(item?.cost?.actualCreatedAt) ?? new Date(),
      };
    }
    
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
              transactionType: body?.transactionType ?? "expense",
              budgetCurrency: body?.budgetCurrency ?? CurrencyList.IDR.value,
              budget: String(body?.budget) ?? "0",
              actualCurrency: body?.actualCurrency ?? CurrencyList.IDR.value,
              actual: String(body?.actual) ?? "0",
              hasActual: body?.hasActual ?? false,
              actualCreatedAt: date_to_string(body?.actualCreatedAt ?? new Date()),
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
            {data?.events?.[0]?.cost && Object.entries(data.events[0].cost).map(([currency, transactionTypes]: any) => (
              <CurrencyCard
                key={currency}
                currency={currency}
                isExpanded={isExpanded}
                onToggleExpand={toggleExpand}
                values={{
                  budgetIncome: transactionTypes?.income?.budget || "0",
                  budgetExpense: transactionTypes?.expense?.budget || "0",
                  actualIncome: transactionTypes?.income?.actual || "0",
                  actualExpense: transactionTypes?.expense?.actual || "0"
                }}
              />
            ))}
          </div>
          <TableEventDetail
            defaultCurrency={""}
            data={data}
            onCreateGroup={onCreateGroup}
            onCreateEvent={onCreateEvent}
            onDeleteData={onDeleteData}
            onUpdateData={onDataPut}
          />
        </div>
      }

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
