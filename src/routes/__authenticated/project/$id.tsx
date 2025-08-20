import {createFileRoute} from '@tanstack/react-router'
import {PageTitle} from "@/components/app";
import * as React from "react";
import {useTranslation} from "react-i18next";
import {useQueryClient} from "@tanstack/react-query";
import {useProjectDetail} from "@/service/project";
import {SkeTable} from "@/components/custom/skeleton";
import {useEffect, useState} from "react";
import {DataTableView, FormProject, FormProjectEvent} from "@/components/pages/project/detail";
import {useProjectEventCreate, useProjectEventDelete, useProjectEventPut} from "@/service/project-event";
import {showNotifError, showNotifSuccess} from "@/lib/show-notif";
import {DialogModal, DialogModalForm} from "@/components/custom/components";
import {ModalFormProps, ModalProps} from "@/types/dialog";
import {z} from "zod";
import {EnumProjectEventType} from "backend/src/db/schema";

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
      budgetIncome: {
        type: "number",
        name: "budgetIncome",
        label: "Budget Income",
        placeholder: "",
      },
      budgetExpense: {
        type: "number",
        name: "budgetExpense",
        label: "Budget Expense",
        placeholder: "",
      },
      realIncome: {
        type: "number",
        name: "realIncome",
        label: "Real Income",
        placeholder: "",
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
      budgetIncome: z.number().min(0, "Budget Income is required"),
      budgetExpense: z.number().min(0, "Budget Income is required"),
      realIncome: z.number().min(0, "Real Income is required"),
      realExpense: z.number().min(0, "Real Income is required"),
    },
    defaultValue: {
      name: "",
      description: "",
      budgetIncome: 0,
      budgetExpense: 0,
      realIncome: 0,
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
      title: "Create Project",
      desc: "Please fill the form below to create new project.",
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

  const onDataPut = (item: any) => {
    const isFolder = item?.eventType === EnumProjectEventType.folder;
    const child = isFolder ? formProject.form : formProjectEvent.form;
    const schema = isFolder ? formProject.schema : formProjectEvent.schema;
    const formHtml = isFolder ? <FormProject/> : <FormProjectEvent/>;
    const defaultValue = isFolder ? item :
      {
        ...item,
        eventType: item?.eventType,
        budgetIncome: Number(item?.cost?.budgetIncome) ?? 0,
        budgetExpense: Number(item?.cost?.budgetExpense) ?? 0,
        realIncome: Number(item?.cost?.realIncome) ?? 0,
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
              budgetIncome: String(body?.budgetIncome) ?? "0",
              budgetExpense: String(body?.budgetExpense) ?? "0",
              realIncome: String(body?.realIncome) ?? "0",
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
        <div className={"bg-card p-2 flex flex-col gap-2"}>
          <DataTableView defaultCurrency={""} data={data} onCreateGroup={onCreateGroup} onDeleteData={onDeleteData} onUpdateData={onDataPut}/>
        </div>
      }

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
