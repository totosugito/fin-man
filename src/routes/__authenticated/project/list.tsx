import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {useTranslation} from "react-i18next";
import {useQueryClient} from "@tanstack/react-query";
import {useProjectCreate, useProjectDelete, useProjectList, useProjectPut, useProjectGanttView} from "@/service/project";
import {PageTitle} from "@/components/app";
import * as React from "react";
import {SkeTable} from "@/components/custom/skeleton";
import {DataTableView, ProjectCardView, FormDataCreate, ProjectGanttView, ProjectGanttViewDetails} from "@/components/pages/project/list";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "lucide-react";
import {showNotifError, showNotifSuccess} from "@/lib/show-notif";
import {DialogModal, DialogModalForm} from "@/components/custom/components";
import {useState} from "react";
import {ModalFormProps, ModalProps} from "@/types/dialog";
import {ObjToOptionList} from "@/lib/my-utils";
import {EnumProjectStatus, EnumProjectType} from "backend/src/db/schema";
import {z} from "zod";
import {AppRoute} from "@/constants/api";

export const Route = createFileRoute('/__authenticated/project/list')({
  component: RouteComponent,
})

function RouteComponent() {
  const {t} = useTranslation()
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {sort, order} = Route.useSearch();
  const [viewMode, setViewMode] = React.useState<'table' | 'card' | 'gantt' | 'details'>('card');

  const dataListQuery = useProjectList({sort, order});
  const dataGanttQuery = useProjectGanttView({sort, order, details: true});
  const dataCreateMutation = useProjectCreate();
  const dataDeleteMutation = useProjectDelete();
  const dataPutMutation = useProjectPut();

  const [confirmationCreate, setConfirmationCreate] = useState<ModalFormProps | null>(null);
  const [confirmationPut, setConfirmationPut] = useState<ModalFormProps | null>(null);
  const [confirmationDelete, setConfirmationDelete] = useState<ModalProps | null>(null);

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
      type: {
        type: "select",
        name: "type",
        label: "Type",
        options: ObjToOptionList(EnumProjectType)
      },
      status: {
        type: "select",
        name: "status",
        label: "Status",
        options: ObjToOptionList(EnumProjectStatus)
      },
    },
    schema: {
      name: z.string().min(1, "Name is required"),
      description: z.string().min(1, "description is required"),
      type: z.string().min(1, "Project type is required"),
      status: z.string().min(1, "Project status is required"),
    },
    defaultValue: {
      name: "",
      description: "",
      type: "",
      status: "",
    }
  });

  const isLoading = () => {
    return (dataListQuery.isPending || dataGanttQuery.isPending || dataCreateMutation.isPending || dataDeleteMutation.isPending || dataPutMutation.isPending);
  }

  const onDataCreated = () => {
    setConfirmationCreate({
      title: "Create Project",
      desc: "Please fill the form below to create new project.",
      defaultValue: formData.defaultValue,
      child: formData.form,
      schema: formData.schema,
      content: <FormDataCreate/>,
      onCancelClick: () => setConfirmationCreate(null),
      onConfirmClick: (body: Record<string, any>) => {
        dataCreateMutation.mutate({body}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['project-list', sort, order]});
            await queryClient.invalidateQueries({queryKey: ['project-gantt-view']});
            showNotifSuccess({message: "Project created successfully"});
            setConfirmationCreate(null);
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
      title: "Delete Project",
      desc: "Permanently remove project and all of its data. This action is not reversible. So, please confirm with caution.",
      content: <div>Are you sure you want to delete project <span
        className={"font-bold text-primary"}>{item?.name ?? ""}</span> ?</div>,
      textConfirm: "Delete",
      textCancel: "Cancel",
      onConfirmClick: () => {
        dataDeleteMutation.mutate(
          {id: item?.id},
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({queryKey: ['project-list', sort, order]});
              await queryClient.invalidateQueries({queryKey: ['project-gantt-view']});
              showNotifSuccess({message: "Project deleted successfully"});
            },
            onError: (error: any) => showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message}),
          }
        );
        setConfirmationDelete(null);
      },
      onCancelClick: () => setConfirmationDelete(null),
    })
  }

  const onDataPut = (item: any) => {
    setConfirmationPut({
      title: "Update Project",
      desc: "Please fill the form below to update project.",
      defaultValue: item,
      child: formData.form,
      schema: formData.schema,
      content: <FormDataCreate/>,
      textConfirm: "Update",
      onCancelClick: () => setConfirmationPut(null),
      onConfirmClick: (body: Record<string, any>) => {
        dataPutMutation.mutate({id: item?.id, body: body}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['project-list', sort, order]});
            await queryClient.invalidateQueries({queryKey: ['project-gantt-view']});
            showNotifSuccess({message: "Project updated successfully"});
            setConfirmationPut(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  }

  const onShowDetail = (id: string) => {
    navigate({to: AppRoute.project.detail, params: {id: id}}).then(() => {});
  }

  const ViewAddItem = () => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md p-0.5 bg-muted/20">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setViewMode('card')}
          >
            Card
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setViewMode('gantt')}
          >
            Gantt
          </Button>
          <Button
            variant={viewMode === 'details' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setViewMode('details')}
          >
            Details
          </Button>
        </div>
        <Button variant={"outline"} size={"sm"} onClick={onDataCreated} disabled={isLoading()}>
          {isLoading() ? <span className={"animate-spin rounded-full h-3 w-3 border-b-2 border-current"}/> :
            <PlusIcon className="h-3.5 w-3.5 mr-1"/>} {t("shared.projectCreate")}
        </Button>
      </div>
    )
  }

  return (
    <div className={"divContent"}>
      <PageTitle title={<div>Project List</div>} showSeparator={false}/>

      {(dataListQuery.isPending || ((viewMode === 'gantt' || viewMode === 'details') && dataGanttQuery.isPending)) && <div className={"h-full w-full flex"}>
        <SkeTable/>
      </div>}

      {(dataListQuery.isError || ((viewMode === 'gantt' || viewMode === 'details') && dataGanttQuery.isError)) &&
        <div className={"text-lg text-destructive"}>Error: {dataListQuery?.error?.message || dataGanttQuery?.error?.message}</div>}

      {(((viewMode === 'table' || viewMode === 'card') && dataListQuery.isSuccess) || ((viewMode === 'gantt' || viewMode === 'details') && dataGanttQuery.isSuccess)) && (
        <div className="bg-card p-2 flex flex-col gap-2">
          {viewMode === 'table' && (
            <DataTableView
              data={dataListQuery?.data}
              onEditClicked={onDataPut}
              onDeleteClicked={onDeleteData}
              onShowDetail={onShowDetail}
              loading={isLoading()}
              toolbarContent={<ViewAddItem/>}
            />
          )}
          
          {viewMode === 'gantt' && (
            <ProjectGanttView
              data={dataGanttQuery?.data}
              onEditClicked={onDataPut}
              onDeleteClicked={onDeleteData}
              onShowDetail={onShowDetail}
              loading={isLoading()}
              toolbarContent={<ViewAddItem/>}
            />
          )}
          
          {viewMode === 'details' && (
            <ProjectGanttViewDetails
              data={dataGanttQuery?.data}
              onEditClicked={onDataPut}
              onDeleteClicked={onDeleteData}
              onShowDetail={onShowDetail}
              loading={isLoading()}
              toolbarContent={<ViewAddItem/>}
            />
          )}
          
          {viewMode === 'card' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <ViewAddItem/>
              </div>
              <ProjectCardView
                data={dataListQuery?.data?.data || []}
                onEditClicked={onDataPut}
                onDeleteClicked={onDeleteData}
                onShowDetail={onShowDetail}
                loading={isLoading()}
                t={t}
              />
            </div>
          )}
        </div>
      )}

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  );
}
