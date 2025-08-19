import {createFileRoute} from '@tanstack/react-router'
import {PageTitle} from "@/components/app";
import * as React from "react";
import {useTranslation} from "react-i18next";
import {useQueryClient} from "@tanstack/react-query";
import {useProjectDetail} from "@/service/project";
import {SkeTable} from "@/components/custom/skeleton";
import {useEffect, useState} from "react";
import {convertToTableData} from "@/lib/project-utils";
import {DataTableView, FormDataCreate} from "@/components/pages/project/detail";
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

  const [tableData, setTableData] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
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
      description: z.string().min(1, "description is required"),
    },
    defaultValue: {
      name: "",
      description: "",
    }
  });

  const isLoading = () => {
    return (projectDetailQuery.isPending || dataCreateMutation.isPending || dataDeleteMutation.isPending);
  }

  useEffect(() => {
    if (projectDetailQuery.data?.events) {
      setTableData(convertToTableData(projectDetailQuery.data.events));
    }
  }, [projectDetailQuery.data]);

  const onCreateGroup = (item: any) => {
    setConfirmationCreate({
      title: "Create Project",
      desc: "Please fill the form below to create new project.",
      defaultValue: formData.defaultValue,
      child: formData.form,
      schema: formData.schema,
      content: <FormDataCreate/>,
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
    setConfirmationPut({
      title: "Update Project Event",
      desc: "Please fill the form below to update project event.",
      defaultValue: item,
      child: formData.form,
      schema: formData.schema,
      content: <FormDataCreate/>,
      textConfirm: "Update",
      onCancelClick: () => setConfirmationPut(null),
      onConfirmClick: (body: Record<string, any>) => {
        dataPutMutation.mutate({id: item?.id, body: body}, {
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
      {projectDetailQuery.data && <PageTitle title={<div>{projectDetailQuery.data?.name}</div>} description={<div>{projectDetailQuery.data?.description}</div>} showSeparator={false}/>}
      {(projectDetailQuery.isPending) && <div className={"h-full w-full flex"}>
        <SkeTable/>
      </div>}

      {projectDetailQuery.isError &&
        <div className={"text-lg text-destructive"}>Error: {projectDetailQuery?.error?.message}</div>}

      {projectDetailQuery.data &&
        <div className={"bg-card p-2 flex flex-col gap-2"}>
          <DataTableView data={tableData} onCreateGroup={onCreateGroup} onDeleteData={onDeleteData} onUpdateData={onDataPut}/>
        </div>
      }

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
